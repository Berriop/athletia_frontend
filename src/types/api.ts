export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ApiMeta;
}

export interface AuthResponse {
  user: import('./User').User;
  token: string;
}
