export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const ROUTES = {
  AUTH: '/auth',
  HOME: '/home',
  PROJECT: '/project',
  HISTORY: '/history',
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'aprep_access_token',
  USER: 'aprep_user',
} as const;

export const TOAST_DURATION = 5000;

export const SCORE_COLORS = {
  LOW: 'text-red-600 bg-red-50',
  MEDIUM: 'text-yellow-600 bg-yellow-50',
  HIGH: 'text-green-600 bg-green-50',
} as const;

export const STATUS_COLORS = {
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
} as const;

export const getScoreColor = (score: number): string => {
  if (score >= 71) return SCORE_COLORS.HIGH;
  if (score >= 41) return SCORE_COLORS.MEDIUM;
  return SCORE_COLORS.LOW;
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 71) return 'bg-green-500';
  if (score >= 41) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Made with Bob
