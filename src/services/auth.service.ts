import { api } from './api';
import type { AuthResponse, ApiResponse } from '../types/api';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
    return response.data.data;
  },
  
  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', { email, password, name });
    return response.data.data;
  }
};
