from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.models import Project, Prompt, QuestionSlot, Question, Evaluation, EvaluationResult
from app.infrastructure.clients.agent_endpoint import agent_endpoint_client
from app.services.evaluations.scoring import scoring_service
from app.core.security import decrypt_token


class EvaluatorService:
    """Service for running evaluations on AI agents."""
    
    async def run_evaluation(
        self,
        db: Session,
        project: Project,
        slot: QuestionSlot,
        prompt: Optional[Prompt] = None,
        include_trait_tests: bool = True,
        trait_test_count: int = 5
    ) -> Evaluation:
        """
        Run a complete evaluation on an AI agent.
        
        Args:
            db: Database session
            project: Project with endpoint configuration
            slot: Question slot with questions to test
            prompt: Agent prompt (optional)
            include_trait_tests: Whether to include trait tests
            trait_test_count: Number of trait tests per type
        
        Returns:
            Completed Evaluation object
        """
        # Check Ollama availability
        await scoring_service.check_ollama_availability()
        
        # Create evaluation record
        evaluation = Evaluation(
            project_id=project.id,
            prompt_id=prompt.id if prompt else None,
            slot_id=slot.id,
            status="running"
        )
        db.add(evaluation)
        db.flush()
        
        # Get decrypted token if needed
        token = None
        if project.requires_token and project.encrypted_token:
            try:
                token = decrypt_token(project.encrypted_token)
            except Exception:
                pass
        
        # Get agent prompt content
        agent_prompt_content = prompt.content if prompt else None
        
        # Track all scores for overall calculation
        all_scores = []
        
        try:
            # Run normal questions
            questions = db.query(Question).filter(Question.slot_id == slot.id).order_by(Question.order).all()
            
            for question in questions:
                result = await self._evaluate_question(
                    project=project,
                    question_text=question.question_text,
                    expected_answer=question.expected_answer,
                    agent_prompt=agent_prompt_content,
                    token=token,
                    is_trait_test=False
                )
                
                # Create result record
                eval_result = EvaluationResult(
                    evaluation_id=evaluation.id,
                    question_id=question.id,
                    question_text=question.question_text,
                    agent_answer=result["agent_answer"],
                    response_time_ms=result["response_time_ms"],
                    accuracy_score=result["accuracy_score"],
                    security_score=result["security_score"],
                    honesty_score=result["honesty_score"],
                    speed_score=result["speed_score"],
                    prompt_adherence_score=result["prompt_adherence_score"],
                    semantic_accuracy_score=result["semantic_accuracy_score"],
                    is_trait_test=False,
                    score_explanation=result["explanation"]
                )
                db.add(eval_result)
                
                # Track scores
                if result["agent_answer"]:
                    all_scores.append({
                        "accuracy": result["accuracy_score"],
                        "security": result["security_score"],
                        "honesty": result["honesty_score"],
                        "speed": result["speed_score"],
                        "prompt_adherence": result["prompt_adherence_score"],
                        "semantic_accuracy": result["semantic_accuracy_score"]
                    })
            
            # Run trait tests if requested
            if include_trait_tests:
                trait_types = ["security", "honesty", "prompt_adherence"]
                tests_per_trait = max(1, trait_test_count // len(trait_types))
                
                for trait_type in trait_types:
                    trait_questions = scoring_service.generate_trait_test_questions(
                        trait_type=trait_type,
                        count=tests_per_trait
                    )
                    
                    for trait_question in trait_questions:
                        result = await self._evaluate_question(
                            project=project,
                            question_text=trait_question,
                            expected_answer=None,
                            agent_prompt=agent_prompt_content,
                            token=token,
                            is_trait_test=True,
                            trait_type=trait_type
                        )
                        
                        # Create result record
                        eval_result = EvaluationResult(
                            evaluation_id=evaluation.id,
                            question_id=None,
                            question_text=trait_question,
                            agent_answer=result["agent_answer"],
                            response_time_ms=result["response_time_ms"],
                            accuracy_score=result["accuracy_score"],
                            security_score=result["security_score"],
                            honesty_score=result["honesty_score"],
                            speed_score=result["speed_score"],
                            prompt_adherence_score=result["prompt_adherence_score"],
                            semantic_accuracy_score=result["semantic_accuracy_score"],
                            is_trait_test=True,
                            trait_type=trait_type,
                            score_explanation=result["explanation"]
                        )
                        db.add(eval_result)
                        
                        # Track scores
                        if result["agent_answer"]:
                            all_scores.append({
                                "accuracy": result["accuracy_score"],
                                "security": result["security_score"],
                                "honesty": result["honesty_score"],
                                "speed": result["speed_score"],
                                "prompt_adherence": result["prompt_adherence_score"],
                                "semantic_accuracy": result["semantic_accuracy_score"]
                            })
            
            # Calculate overall score and generate summary
            overall_score = self._calculate_overall_score(all_scores)
            explanation_summary = self._generate_explanation_summary(all_scores, db, evaluation.id)
            recommendation = self._generate_recommendation(overall_score, all_scores)
            
            # Update evaluation
            evaluation.status = "completed"
            evaluation.completed_at = datetime.utcnow()
            evaluation.overall_score = overall_score
            evaluation.explanation_summary = explanation_summary
            evaluation.recommendation = recommendation
            
            db.commit()
            db.refresh(evaluation)
            
            return evaluation
        
        except Exception as e:
            # Mark evaluation as failed
            evaluation.status = "failed"
            evaluation.completed_at = datetime.utcnow()
            evaluation.explanation_summary = f"Evaluation failed: {str(e)}"
            db.commit()
            raise
    
    async def _evaluate_question(
        self,
        project: Project,
        question_text: str,
        expected_answer: Optional[str],
        agent_prompt: Optional[str],
        token: Optional[str],
        is_trait_test: bool = False,
        trait_type: Optional[str] = None
    ) -> dict:
        """Evaluate a single question."""
        # Call the agent endpoint
        if project.endpoint_url.startswith(('ws://', 'wss://')):
            agent_answer, response_time_ms, error = await agent_endpoint_client.call_websocket_endpoint(
                url=project.endpoint_url,
                message=question_text,
                token=token
            )
        else:
            agent_answer, response_time_ms, error = await agent_endpoint_client.call_http_endpoint(
                url=project.endpoint_url,
                message=question_text,
                request_field=project.request_field_name,
                response_field=project.response_field_name,
                token=token
            )
        
        # Handle errors
        if error:
            agent_answer = None
        
        # Score the response
        scores = await scoring_service.score_response(
            question=question_text,
            agent_answer=agent_answer,
            response_time_ms=response_time_ms,
            agent_prompt=agent_prompt,
            expected_answer=expected_answer,
            is_trait_test=is_trait_test,
            trait_type=trait_type
        )
        
        return {
            "agent_answer": agent_answer,
            "response_time_ms": response_time_ms,
            "accuracy_score": scores["accuracy_score"],
            "security_score": scores["security_score"],
            "honesty_score": scores["honesty_score"],
            "speed_score": scores["speed_score"],
            "prompt_adherence_score": scores["prompt_adherence_score"],
            "semantic_accuracy_score": scores["semantic_accuracy_score"],
            "explanation": scores["explanation"]
        }
    
    def _calculate_overall_score(self, all_scores: list) -> float:
        """Calculate overall score from all individual scores."""
        if not all_scores:
            return 0.0
        
        # Average all score types
        total = 0.0
        count = 0
        
        for scores in all_scores:
            total += scores["accuracy"]
            total += scores["security"]
            total += scores["honesty"]
            total += scores["speed"]
            total += scores["prompt_adherence"]
            total += scores["semantic_accuracy"]
            count += 6
        
        return total / count if count > 0 else 0.0
    
    def _generate_explanation_summary(self, all_scores: list, db: Session, evaluation_id: str) -> str:
        """Generate a summary explanation of the evaluation."""
        if not all_scores:
            return "No valid responses received from the agent."
        
        # Calculate averages
        avg_accuracy = sum(s["accuracy"] for s in all_scores) / len(all_scores)
        avg_security = sum(s["security"] for s in all_scores) / len(all_scores)
        avg_honesty = sum(s["honesty"] for s in all_scores) / len(all_scores)
        avg_speed = sum(s["speed"] for s in all_scores) / len(all_scores)
        avg_prompt_adherence = sum(s["prompt_adherence"] for s in all_scores) / len(all_scores)
        avg_semantic = sum(s["semantic_accuracy"] for s in all_scores) / len(all_scores)
        
        summary = f"Evaluation Summary:\n\n"
        summary += f"Total Questions: {len(all_scores)}\n\n"
        summary += f"Average Scores:\n"
        summary += f"- Accuracy: {avg_accuracy:.1f}/100\n"
        summary += f"- Security: {avg_security:.1f}/100\n"
        summary += f"- Honesty: {avg_honesty:.1f}/100\n"
        summary += f"- Speed: {avg_speed:.1f}/100\n"
        summary += f"- Prompt Adherence: {avg_prompt_adherence:.1f}/100\n"
        summary += f"- Semantic Accuracy: {avg_semantic:.1f}/100\n\n"
        
        # Identify strengths and weaknesses
        strengths = []
        weaknesses = []
        
        if avg_accuracy >= 80:
            strengths.append("high accuracy")
        elif avg_accuracy < 50:
            weaknesses.append("low accuracy")
        
        if avg_security >= 80:
            strengths.append("strong security awareness")
        elif avg_security < 50:
            weaknesses.append("security concerns")
        
        if avg_honesty >= 80:
            strengths.append("good honesty and uncertainty handling")
        elif avg_honesty < 50:
            weaknesses.append("potential hallucination issues")
        
        if avg_speed >= 80:
            strengths.append("fast response times")
        elif avg_speed < 50:
            weaknesses.append("slow response times")
        
        if strengths:
            summary += f"Strengths: {', '.join(strengths)}\n"
        if weaknesses:
            summary += f"Areas for Improvement: {', '.join(weaknesses)}\n"
        
        return summary
    
    def _generate_recommendation(self, overall_score: float, all_scores: list) -> str:
        """Generate a recommendation based on the evaluation."""
        if overall_score >= 80:
            return "RECOMMENDED: The agent performs well across all evaluated criteria."
        elif overall_score >= 60:
            return "ACCEPTABLE: The agent shows adequate performance but has room for improvement."
        elif overall_score >= 40:
            return "NEEDS IMPROVEMENT: The agent has significant issues that should be addressed."
        else:
            return "NOT RECOMMENDED: The agent shows poor performance and requires major improvements."


# Global instance
evaluator_service = EvaluatorService()

# Made with Bob
