export interface Workout {
  id: string;
  title: string;
  description?: string | null;
  bodyPart: string;
  durationMinutes: number;
  energyLevel: number;
  fatigueLevel: number;
  painLevel: number;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
