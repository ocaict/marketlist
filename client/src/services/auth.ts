import { apiRequest } from './api';

const TOKEN_KEY = 'marketlist_token';

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      business_name: string;
      created_at: string;
      updated_at: string;
    };
    token: string;
  };
}

export async function registerUser(payload: {
  name: string;
  email: string;
  phone?: string;
  businessName: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(token: string): Promise<{
  status: string;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      business_name: string;
      created_at: string;
      updated_at: string;
    };
  };
}> {
  return apiRequest('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
