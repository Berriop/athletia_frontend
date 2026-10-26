import type { ExperienceLevel, Gender, Role } from '../types';

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  BEGINNER: 'Principiante',
  INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado',
  EXPERT: 'Experto',
};

export const ROLE_LABELS: Record<Role, string> = {
  USER: 'Usuario',
  ADMIN: 'Administrador',
};

/**
 * Fecha "solo día" (como la de nacimiento) guardada como medianoche UTC. Se muestra en
 * UTC para que en zonas como Colombia (UTC-5) no aparezca el día anterior.
 */
export const formatDateOnly = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { timeZone: 'UTC' });
