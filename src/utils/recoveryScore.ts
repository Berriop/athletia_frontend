import type { SleepLog, Workout } from '../types';

export interface RecoveryScoreResult {
  score: number;
  status: 'Excelente' | 'Bueno' | 'Moderado' | 'Riesgo' | 'Sin registros';
  color: string;
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
  if (lastSleep) {
    if (lastSleep.hoursSlept >= 8) score += 40;
    else if (lastSleep.hoursSlept >= 7) score += 30;
    else if (lastSleep.hoursSlept >= 6) score += 20;
    else score += 10;
  }

  // 2. Estrés (30%)
  if (lastSleep) {
    if (lastSleep.stressLevel <= 3) score += 30;
    else if (lastSleep.stressLevel <= 6) score += 20;
    else score += 10;
  }

  // 3. Lesiones activas (20%)
  if (activeInjuries === 0) score += 20;
  else score += 5;

  // 4. Carga de entrenamiento reciente (10%)
  const workoutsCount = recentWorkouts.length;
  if (workoutsCount >= 3 && workoutsCount <= 5) score += 10;
  else if (workoutsCount > 5) score += 5;
  else if (workoutsCount > 0) score += 8; // Menos de 3 pero al menos 1
  else score += 0;

  let status: RecoveryScoreResult['status'] = 'Riesgo';
  let color = '#ef4444'; // Red (Riesgo)

  if (score >= 80) {
    status = 'Excelente';
    color = '#10b981'; // Green
  } else if (score >= 60) {
    status = 'Bueno';
    color = '#3b82f6'; // Blue
  } else if (score >= 40) {
    status = 'Moderado';
    color = '#f59e0b'; // Orange
  }

  return { score, status, color };
}
