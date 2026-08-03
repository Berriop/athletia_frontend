export type BodyPart =
  | 'CHEST'
  | 'BACK'
  | 'SHOULDERS'
  | 'BICEPS'
  | 'TRICEPS'
  | 'LEGS'
  | 'CORE'
  | 'CARDIO'
  | 'FULL_BODY'
  | 'OTHER';

export interface Workout {
  id: string;
  title: string;
  description?: string | null;
  bodyPart: BodyPart;
  durationMinutes: number;
  energyLevel: number;
  fatigueLevel: number;
  painLevel: number;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
