import type { SleepLog, Workout } from '../types';

export interface RecoveryScoreResult {
  score: number;
  status: 'Excelente' | 'Bueno' | 'Moderado' | 'Riesgo' | 'Sin registros';
  color: string;
}

function calculateSleepScore(lastSleep: SleepLog | null): number {
  if (!lastSleep) return 0;

  if (lastSleep.hoursSlept >= 8) return 40;
  if (lastSleep.hoursSlept >= 7) return 30;
  if (lastSleep.hoursSlept >= 6) return 20;

  return 10;
}

function calculateStressScore(lastSleep: SleepLog | null): number {
  if (!lastSleep) return 0;

  if (lastSleep.stressLevel <= 3) return 30;
  if (lastSleep.stressLevel <= 6) return 20;

  return 10;
}

function calculateInjuryScore(activeInjuries: number): number {
  if (activeInjuries === 0) return 20;

  return 5;
}

function calculateWorkoutScore(recentWorkouts: Workout[]): number {
  const workoutsCount = recentWorkouts.length;

  if (workoutsCount >= 3 && workoutsCount <= 5) return 10;
  if (workoutsCount > 5) return 5;
  if (workoutsCount > 0) return 8;

  return 0;
}

function getRecoveryStatus(score: number): RecoveryScoreResult['status'] {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bueno';
  if (score >= 40) return 'Moderado';

  return 'Riesgo';
}

function getRecoveryColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';

  return '#ef4444';
}

export function calculateRecoveryScore(
  lastSleep: SleepLog | null,
  activeInjuries: number,
  recentWorkouts: Workout[] // Should be filtered to last 7 days
): RecoveryScoreResult {
  // Si no hay registros de sueño ni entrenamientos registrados, devolver 0 (Sin registros)
  if (!lastSleep && recentWorkouts.length === 0) {
    return {
      score: 0,
      status: 'Sin registros',
      color: '#9ca3af', // Gray neutral
    };
  }

  let score = 0;

  // 1. Sueño (40%)
  score += calculateSleepScore(lastSleep);

  // 2. Estrés (30%)
score += calculateStressScore(lastSleep);

  // 3. Lesiones activas (20%)
  score += calculateInjuryScore(activeInjuries);

  // 4. Carga de entrenamiento reciente (10%)
  score += calculateWorkoutScore(recentWorkouts);

  const status = getRecoveryStatus(score);
  const color = getRecoveryColor(score);

  return { score, status, color };
}
