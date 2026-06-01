export interface SleepLog {
  id: string;
  hoursSlept: number;
  sleepQuality: number;
  hadNightmares: boolean;
  stressLevel: number;
  notes?: string | null;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
