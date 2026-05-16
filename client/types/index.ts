// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Project types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  endpoint_url: string;
  requires_token: boolean;
  request_field_name: string;
  response_field_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name?: string;
  endpoint_url: string;
  requires_token: boolean;
  token?: string;
  request_field_name: string;
  response_field_name: string;
}

export interface UpdateProjectRequest {
  name?: string;
  endpoint_url?: string;
  requires_token?: boolean;
  request_field_name?: string;
  response_field_name?: string;
}

export interface UpdateTokenRequest {
  token: string;
}

// Prompt types
export interface Prompt {
  id: string;
  project_id: string;
  content: string;
  file_type: 'txt' | 'md';
  created_at: string;
}

export interface CreatePromptRequest {
  content: string;
  file_type: 'txt' | 'md';
}

// Question types
export interface Question {
  id: string;
  slot_id: string;
  question_text: string;
  expected_answer: string | null;
  order: number;
}

export interface QuestionSlot {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  is_auto_generated: boolean;
  created_at: string;
  questions: Question[];
}

export interface CreateQuestionSlotRequest {
  name: string;
  description?: string;
  questions: {
    question_text: string;
    expected_answer?: string;
    order: number;
  }[];
}

export interface GenerateQuestionsRequest {
  count: number;
  purpose: string;
  use_prompt: boolean;
}

export interface GenerateQuestionsResponse {
  slot_id: string;
  questions: Question[];
}

export interface UpdateQuestionSlotRequest {
  name?: string;
  description?: string;
  questions?: {
    question_text: string;
    expected_answer?: string;
    order: number;
  }[];
}

// Evaluation types
export interface EvaluationResult {
  id: string;
  evaluation_id: string;
  question_id: string;
  question_text: string;
  agent_answer: string;
  response_time_ms: number;
  accuracy_score: number;
  security_score: number;
  honesty_score: number;
  speed_score: number;
  prompt_adherence_score: number;
  semantic_accuracy_score: number;
  is_trait_test: boolean;
  trait_type: string | null;
  score_explanation: string;
}

export interface Evaluation {
  id: string;
  project_id: string;
  prompt_id: string | null;
  slot_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at: string | null;
  overall_score: number | null;
  explanation_summary: string | null;
  recommendation: string | null;
}

export interface EvaluationDetails extends Evaluation {
  results: EvaluationResult[];
  project_name: string;
  endpoint_url: string;
  prompt_content: string | null;
  slot_name: string;
}

export interface RunEvaluationRequest {
  slot_id: string;
  prompt_id: string;
  include_trait_tests: boolean;
  trait_test_count: number;
}

// UI State types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ModalState {
  isOpen: boolean;
  type: string | null;
  data?: any;
}

// Chart data types
export interface TraitScores {
  accuracy: number;
  security: number;
  honesty: number;
  speed: number;
  promptAdherence: number;
  semanticAccuracy: number;
}

// Made with Bob
