import { api } from './api';
import type { Meal } from '../types';
import type { ApiResponse } from '../types/api';

export interface CreateMealDTO {
  name: string;
  calories: number;
  mealType: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
  date: string;
}

export const mealService = {
  getAll: async (page = 1, limit = 10): Promise<ApiResponse<Meal[]>> => {
    const response = await api.get<ApiResponse<Meal[]>>('/meals', { params: { page, limit } });
    return response.data;
  },

  create: async (data: CreateMealDTO): Promise<Meal> => {
    const response = await api.post<ApiResponse<Meal>>('/meals', data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/meals/${id}`);
  }
};
