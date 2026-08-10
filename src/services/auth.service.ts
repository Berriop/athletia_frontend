import { api } from './api';
import type { AuthResponse, ApiResponse } from '../types/api';
import type { User } from '../types';

export interface UpdateProfileDTO {
  name?: string;
  gender?: string;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  experienceLevel?: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    return response.data.data;
  },

  register: async (
    email: string,
    password: string,
    confirmPassword?: string,
    name?: string
  ): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
      confirmPassword: confirmPassword ?? password,
      name,
    });
    return response.data.data;
  },

  updateProfile: async (data: UpdateProfileDTO): Promise<User> => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', data);
    return response.data.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  verifyEmail: async (token: string): Promise<void> => {
    await api.get(`/auth/verify-email?token=${token}`);
  },
};
