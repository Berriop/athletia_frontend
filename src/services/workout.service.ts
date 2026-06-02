import { api } from './api';
import type { Workout } from '../types';
import type { ApiResponse } from '../types/api';

export interface CreateWorkoutDTO {
  title: string;
  description?: string;
  bodyPart: string;
  durationMinutes: number;
  energyLevel: number;
  fatigueLevel: number;
  painLevel: number;
  date: string;
}

export const workoutService = {
  getAll: async (page = 1, limit = 10): Promise<ApiResponse<Workout[]>> => {
    const response = await api.get<ApiResponse<Workout[]>>('/workouts', { params: { page, limit } });
    return response.data;
  },
  
  getById: async (id: string): Promise<Workout> => {
    const response = await api.get<ApiResponse<Workout>>(`/workouts/${id}`);
    return response.data.data;
  },

  create: async (data: CreateWorkoutDTO): Promise<Workout> => {
    const response = await api.post<ApiResponse<Workout>>('/workouts', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateWorkoutDTO>): Promise<Workout> => {
    const response = await api.put<ApiResponse<Workout>>(`/workouts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/workouts/${id}`);
  }
};
