const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiErrorResponse {
  status: string;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export class ApiRequestError extends Error {
  fieldErrors: Record<string, string>;
  statusCode: number;

  constructor(message: string, statusCode: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const error = data as ApiErrorResponse | undefined;
    const fieldErrors = Object.fromEntries(
      (error?.errors || []).map(({ field, message }) => [field, message])
    );
    throw new ApiRequestError(
      error?.message || `Request failed (${response.status})`,
      response.status,
      fieldErrors
    );
  }

  return data as T;
}

export async function checkHealth(): Promise<{
  status: string;
  message: string;
  timestamp: string;
}> {
  return apiRequest('/health');
}
