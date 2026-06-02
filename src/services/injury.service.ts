import { api } from './api';
import type { Injury } from '../types';
import type { ApiResponse } from '../types/api';

export interface CreateInjuryDTO {
  bodyArea: string;
  injuryName: string;
  severity: number;
  isActive: boolean;
  notes?: string;
}

export const injuryService = {
  getAll: async (page = 1, limit = 10): Promise<ApiResponse<Injury[]>> => {
    const response = await api.get<ApiResponse<Injury[]>>('/injuries', { params: { page, limit } });
    return response.data;
  },

  create: async (data: CreateInjuryDTO): Promise<Injury> => {
    const response = await api.post<ApiResponse<Injury>>('/injuries', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateInjuryDTO>): Promise<Injury> => {
    const response = await api.put<ApiResponse<Injury>>(`/injuries/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/injuries/${id}`);
  }
};
