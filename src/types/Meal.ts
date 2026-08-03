export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  mealType: MealType;
  proteinG: number;
  carbsG: number;
  fatG: number;
  date: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
