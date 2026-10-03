import { apiRequest } from './api';

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string;
  created_at: string;
  updated_at: string;
}

export async function getProfile(token: string): Promise<{
  status: string;
  data: { user: ProfileUser };
}> {
  return apiRequest('/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateProfile(
  token: string,
  payload: { name?: string; businessName?: string; phone?: string | null; email?: string }
): Promise<{
  status: string;
  message: string;
  data: { user: ProfileUser };
}> {
  return apiRequest('/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}
