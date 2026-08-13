import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from './constants';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  UpdateTokenRequest,
  Prompt,
  CreatePromptRequest,
  QuestionSlot,
  CreateQuestionSlotRequest,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  UpdateQuestionSlotRequest,
  Evaluation,
  EvaluationDetails,
  RunEvaluationRequest,
} from '@/types';

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Cannot connect to the APREP API at ${API_BASE_URL}. Check that the server is running and allows this client origin.`;
    }

    const detail = error.response?.data?.detail;

    if (typeof detail === 'string') {
      return detail;
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'msg' in item) {
            return String(item.msg);
          }
          return null;
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(', ');
      }
    }

    if (error.response?.status) {
      return `Request failed with status ${error.response.status}`;
    }

    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          const requestPath = error.config?.url?.split('?')[0].replace(/\/$/, '');
          const isLoginRequest = requestPath === '/auth/login';

          // A rejected login is an expected form error. Let the auth page
          // handle it in place so its entered values are not lost to a reload.
          this.clearAuth();
          if (
            typeof window !== 'undefined' &&
            !isLoginRequest &&
            window.location.pathname.replace(/\/$/, '') !== '/auth'
          ) {
            window.location.href = '/auth';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  private clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>('/auth/register', data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Project endpoints
  async getProjects(): Promise<Project[]> {
    const response = await this.client.get<Project[]>('/projects');
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get<Project>(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await this.client.post<Project>('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await this.client.patch<Project>(`/projects/${id}`, data);
    return response.data;
  }

  async updateProjectToken(id: string, data: UpdateTokenRequest): Promise<void> {
    await this.client.patch(`/projects/${id}/token`, data);
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  // Prompt endpoints
  async getPrompt(projectId: string): Promise<Prompt> {
    const response = await this.client.get<Prompt>(`/projects/${projectId}/prompt`);
    return response.data;
  }

  async createOrUpdatePrompt(projectId: string, data: CreatePromptRequest): Promise<Prompt> {
    const response = await this.client.post<Prompt>(`/projects/${projectId}/prompt`, data);
    return response.data;
  }

  // Question Slot endpoints
  async getQuestionSlots(projectId: string): Promise<QuestionSlot[]> {
    const response = await this.client.get<QuestionSlot[]>(`/projects/${projectId}/question-slots`);
    return response.data;
  }

  async getQuestionSlot(slotId: string): Promise<QuestionSlot> {
    const response = await this.client.get<QuestionSlot>(`/question-slots/${slotId}`);
    return response.data;
  }

  async createQuestionSlot(projectId: string, data: CreateQuestionSlotRequest): Promise<QuestionSlot> {
    const response = await this.client.post<QuestionSlot>(`/projects/${projectId}/question-slots`, data);
    return response.data;
  }

  async updateQuestionSlot(slotId: string, data: UpdateQuestionSlotRequest): Promise<QuestionSlot> {
    const response = await this.client.patch<QuestionSlot>(`/question-slots/${slotId}`, data);
    return response.data;
  }

  async deleteQuestionSlot(slotId: string): Promise<void> {
    await this.client.delete(`/question-slots/${slotId}`);
  }

  async generateQuestions(projectId: string, data: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
    const response = await this.client.post<GenerateQuestionsResponse>(`/projects/${projectId}/generate-questions`, data);
    return response.data;
  }

  // Evaluation endpoints
  async getEvaluations(projectId: string): Promise<Evaluation[]> {
    const response = await this.client.get<Evaluation[]>(`/projects/${projectId}/evaluations`);
    return response.data;
  }

  async getEvaluation(evaluationId: string): Promise<EvaluationDetails> {
    const response = await this.client.get<EvaluationDetails>(`/evaluations/${evaluationId}`);
    return response.data;
  }

  async runEvaluation(projectId: string, data: RunEvaluationRequest): Promise<Evaluation> {
    const response = await this.client.post<Evaluation>(`/projects/${projectId}/evaluate`, data);
    return response.data;
  }

  async exportEvaluationJSON(evaluationId: string): Promise<Blob> {
    const response = await this.client.get(`/evaluations/${evaluationId}/export/json`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async exportEvaluationCSV(evaluationId: string): Promise<Blob> {
    const response = await this.client.get(`/evaluations/${evaluationId}/export/csv`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();

// Made with Bob
