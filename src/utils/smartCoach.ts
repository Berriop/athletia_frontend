import type { SleepLog, Workout } from '../types';

export interface CoachRecommendation {
  message: string;
  type: 'danger' | 'warning' | 'success' | 'info';
  advice: string;
}

export function getCoachRecommendation(
  lastSleep: SleepLog | null,
  activeInjuries: number,
  recentWorkouts: Workout[] // last 7 days
): CoachRecommendation {
  const workoutsCount = recentWorkouts.length;
  
  // If there's no sleep data, we default to moderate values to not trigger extreme alerts purely due to missing data.
  const hoursSlept = lastSleep ? lastSleep.hoursSlept : 7; 
  const stress = lastSleep ? lastSleep.stressLevel : 5; 

  // 1. Riesgo de sobreentrenamiento
  if (workoutsCount > 5 && (hoursSlept < 7 || stress >= 7 || activeInjuries > 0)) {
    return {
      message: 'Riesgo de sobreentrenamiento',
      type: 'danger',
      advice: 'Tu volumen de entrenamiento es alto y tu recuperación no es óptima. Considera un día de descanso total o activo.'
    };
  }

  // 2. Necesidad de descanso (por lesiones o mala recuperación general)
  if (activeInjuries > 0) {
    return {
      message: 'Atención a tus lesiones',
      type: 'warning',
      advice: 'Tienes lesiones activas. Prioriza la recuperación, consulta a un profesional y evita forzar las zonas afectadas.'
    };
  }

  if (hoursSlept < 6 || stress >= 8) {
    return {
      message: 'Necesidad de descanso',
      type: 'warning',
      advice: 'Tus niveles de estrés son altos o tu sueño es insuficiente. Intenta dormir al menos 7-8 horas esta noche.'
    };
  }

  // 3. Incrementar actividad física
  if (workoutsCount < 3 && hoursSlept >= 6 && stress <= 6) {
    return {
      message: 'Incrementar actividad física',
      type: 'info',
      advice: 'Tu cuerpo está descansado. Es un excelente momento para agregar un entrenamiento extra o aumentar la intensidad.'
    };
  }

  // 4. Buen nivel de recuperación / Mantener rutina actual
  if (workoutsCount >= 3 && workoutsCount <= 5 && hoursSlept >= 7 && stress <= 5) {
    return {
      message: 'Buen nivel de recuperación',
      type: 'success',
      advice: 'Estás en un estado físico óptimo. Sigue manteniendo tu rutina actual, estás haciendo un gran trabajo.'
    };
  }

  // Fallback / Default
  return {
    message: 'Mantener rutina actual',
    type: 'success',
    advice: 'Tus métricas están estables. Sigue escuchando a tu cuerpo y mantén la constancia.'
  };
}
