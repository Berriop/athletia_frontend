import { api } from './api';
import type { SleepLog } from '../types';
import type { ApiResponse } from '../types/api';

export interface CreateSleepDTO {
  hoursSlept: number;
  sleepQuality: number;
  hadNightmares: boolean;
  stressLevel: number;
  notes?: string;
  date: string;
}

export const sleepService = {
  getAll: async (page = 1, limit = 10): Promise<ApiResponse<SleepLog[]>> => {
    const response = await api.get<ApiResponse<SleepLog[]>>('/sleeps', { params: { page, limit } });
    return response.data;
  },

  create: async (data: CreateSleepDTO): Promise<SleepLog> => {
    const response = await api.post<ApiResponse<SleepLog>>('/sleeps', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateSleepDTO>): Promise<SleepLog> => {
    const response = await api.put<ApiResponse<SleepLog>>(`/sleeps/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sleeps/${id}`);
  }
};

