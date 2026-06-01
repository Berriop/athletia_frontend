export interface Injury {
  id: string;
  bodyArea: string;
  injuryName: string;
  severity: number;
  isActive: boolean;
  notes?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
