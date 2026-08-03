export type Role = 'USER' | 'ADMIN';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  birthDate?: string | null;
  gender?: Gender | null;
  heightCm?: number | null;
  weightKg?: number | null;
  experienceLevel?: ExperienceLevel | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}
