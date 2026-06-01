export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  experienceLevel?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
