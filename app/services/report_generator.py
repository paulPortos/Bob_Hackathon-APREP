import csv
import json
from io import StringIO
from typing import List
from app.models import Evaluation, EvaluationResult, Project, Prompt, QuestionSlot


class ReportGenerator:
    """Service for generating evaluation reports in various formats."""
    
    def generate_json_report(
        self,
        evaluation: Evaluation,
        results: List[EvaluationResult],
        project: Project,
        prompt: Prompt,
        slot: QuestionSlot
    ) -> dict:
        """Generate a complete JSON report."""
        report = {
            "evaluation_id": evaluation.id,
            "project": {
                "id": project.id,
                "name": project.name,
                "endpoint_url": project.endpoint_url
            },
            "prompt": {
                "id": prompt.id if prompt else None,
                "content": prompt.content if prompt else None,
                "file_type": prompt.file_type if prompt else None
            },
            "question_slot": {
                "id": slot.id,
                "name": slot.name,
                "description": slot.description,
                "is_auto_generated": slot.is_auto_generated
            },
            "evaluation": {
                "status": evaluation.status,
                "started_at": evaluation.started_at.isoformat(),
                "completed_at": evaluation.completed_at.isoformat() if evaluation.completed_at else None,
                "overall_score": evaluation.overall_score,
                "explanation_summary": evaluation.explanation_summary,
                "recommendation": evaluation.recommendation
            },
            "results": []
        }
        
        for result in results:
            report["results"].append({
                "id": result.id,
                "question_text": result.question_text,
                "agent_answer": result.agent_answer,
                "response_time_ms": result.response_time_ms,
                "is_trait_test": result.is_trait_test,
                "trait_type": result.trait_type,
                "scores": {
                    "accuracy": result.accuracy_score,
                    "security": result.security_score,
                    "honesty": result.honesty_score,
                    "speed": result.speed_score,
                    "prompt_adherence": result.prompt_adherence_score,
                    "semantic_accuracy": result.semantic_accuracy_score
                },
                "explanation": result.score_explanation
            })
        
        return report
    
    def generate_csv_report(
        self,
        evaluation: Evaluation,
        results: List[EvaluationResult],
        project: Project,
        prompt: Prompt,
        slot: QuestionSlot
    ) -> str:
        """Generate a CSV report."""
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Evaluation ID",
            "Project Name",
            "Endpoint URL",
            "Question Slot",
            "Overall Score",
            "Status",
            "Started At",
            "Completed At"
        ])
        
        # Write evaluation summary
        writer.writerow([
            evaluation.id,
            project.name,
            project.endpoint_url,
            slot.name,
            f"{evaluation.overall_score:.2f}" if evaluation.overall_score else "N/A",
            evaluation.status,
            evaluation.started_at.isoformat(),
            evaluation.completed_at.isoformat() if evaluation.completed_at else "N/A"
        ])
        
        # Empty row
        writer.writerow([])
        
        # Write results header
        writer.writerow([
            "Question",
            "Agent Answer",
            "Response Time (ms)",
            "Is Trait Test",
            "Trait Type",
            "Accuracy Score",
            "Security Score",
            "Honesty Score",
            "Speed Score",
            "Prompt Adherence Score",
            "Semantic Accuracy Score",
            "Explanation"
        ])
        
        # Write results
        for result in results:
            writer.writerow([
                result.question_text,
                result.agent_answer or "N/A",
                result.response_time_ms or "N/A",
                "Yes" if result.is_trait_test else "No",
                result.trait_type or "N/A",
                f"{result.accuracy_score:.2f}" if result.accuracy_score is not None else "N/A",
                f"{result.security_score:.2f}" if result.security_score is not None else "N/A",
                f"{result.honesty_score:.2f}" if result.honesty_score is not None else "N/A",
                f"{result.speed_score:.2f}" if result.speed_score is not None else "N/A",
                f"{result.prompt_adherence_score:.2f}" if result.prompt_adherence_score is not None else "N/A",
                f"{result.semantic_accuracy_score:.2f}" if result.semantic_accuracy_score is not None else "N/A",
                result.score_explanation or "N/A"
            ])
        
        # Empty row
        writer.writerow([])
        
        # Write summary
        writer.writerow(["Summary"])
        writer.writerow([evaluation.explanation_summary or "N/A"])
        writer.writerow([])
        writer.writerow(["Recommendation"])
        writer.writerow([evaluation.recommendation or "N/A"])
        
        return output.getvalue()


# Global instance
report_generator = ReportGenerator()

# Made with Bob
