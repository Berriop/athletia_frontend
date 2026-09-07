import { describe, it, expect } from 'vitest';
import { calculateRecoveryScore } from '../../utils/recoveryScore';
import type { SleepLog, Workout } from '../../types';

// RF-25 — Calcular y mostrar puntaje de recuperación. Basado en el diagrama
// "RF-25 Front (recoveryScore.calculateRecoveryScore)" (V(G)=16). Se cubren
// los 8 caminos representativos documentados en la tabla de caminos: cada
// rama y cada frontera de los 4 bloques de puntuación, más la clasificación
// final.
function sleep(overrides: Partial<SleepLog> = {}): SleepLog {
  return {
    id: 'sleep-1',
    hoursSlept: 7,
    sleepQuality: 8,
    hadNightmares: false,
    stressLevel: 4,
    notes: null,
    date: new Date().toISOString(),
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as SleepLog;
}

function workouts(count: number): Workout[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `workout-${i}`,
    title: 'Entrenamiento',
    description: null,
    bodyPart: 'LEGS',
    durationMinutes: 30,
    energyLevel: 5,
    fatigueLevel: 5,
    painLevel: 1,
    date: new Date().toISOString(),
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })) as unknown as Workout[];
}

describe('calculateRecoveryScore', () => {
  // R1: INICIO,1,2,FIN
  it('R1: sin sueño y sin entrenamientos recientes → score=0, "Sin registros"', () => {
    // Act
    const result = calculateRecoveryScore(null, 0, []);

    // Assert
    expect(result).toEqual({ score: 0, status: 'Sin registros', color: '#9ca3af' });
  });

  // R2
  it('R2: sueño=8h, estrés=2, 0 lesiones, 4 entrenamientos → score=100, "Excelente"', () => {
    // Arrange
    const lastSleep = sleep({ hoursSlept: 8, stressLevel: 2 });

    // Act
    const result = calculateRecoveryScore(lastSleep, 0, workouts(4));

    // Assert
    expect(result.score).toBe(100); // 40 (sueño) + 30 (estrés) + 20 (lesiones) + 10 (entrenamiento)
    expect(result.status).toBe('Excelente');
  });

  // R3
  it('R3: sueño=5h, estrés=8, 2 lesiones activas, 0 entrenamientos → score=25, "Riesgo"', () => {
    // Arrange
    const lastSleep = sleep({ hoursSlept: 5, stressLevel: 8 });

    // Act
    const result = calculateRecoveryScore(lastSleep, 2, []);

    // Assert
    expect(result.score).toBe(25); // 10 (sueño) + 10 (estrés) + 5 (lesiones) + 0 (entrenamiento)
    expect(result.status).toBe('Riesgo');
  });

  // R4: fronteras de horas dormidas
  it('R4: frontera de horas dormidas — exactamente 7h suma 30, exactamente 6h suma 20', () => {
    // Arrange
    const sleepAt7h = sleep({ hoursSlept: 7, stressLevel: 0 });
    const sleepAt6h = sleep({ hoursSlept: 6, stressLevel: 0 });

    // Act
    const at7 = calculateRecoveryScore(sleepAt7h, 0, []);
    const at6 = calculateRecoveryScore(sleepAt6h, 0, []);

    // Assert
    expect(at7.score - at6.score).toBe(10); // 30 vs 20 puntos de sueño (el resto es igual en ambos)
  });

  // R5: fronteras de estrés
  it('R5: frontera de estrés — exactamente 3 suma 30, exactamente 6 suma 20', () => {
    // Arrange
    const sleepAtStress3 = sleep({ hoursSlept: 0, stressLevel: 3 });
    const sleepAtStress6 = sleep({ hoursSlept: 0, stressLevel: 6 });

    // Act
    const at3 = calculateRecoveryScore(sleepAtStress3, 0, []);
    const at6 = calculateRecoveryScore(sleepAtStress6, 0, []);

    // Assert
    expect(at3.score - at6.score).toBe(10); // 30 vs 20 puntos de estrés
  });

  // R6: sin lastSleep pero con entrenamientos → se saltan los bloques de sueño/estrés
  it('R6: sin último sueño registrado pero con entrenamientos recientes → 0 puntos de sueño y estrés', () => {
    // Act
    const result = calculateRecoveryScore(null, 0, workouts(4));

    // Assert
    expect(result.score).toBe(30); // 0 (sueño) + 0 (estrés) + 20 (lesiones) + 10 (entrenamiento)
    expect(result.status).not.toBe('Sin registros'); // porque sí hay entrenamientos recientes
  });

  // R7: fronteras de carga de entrenamiento (lastSleep=null aísla el bloque de
  // sueño/estrés, que aporta 0 en ese caso, para medir solo el efecto del
  // conteo de entrenamientos)
  it('R7: frontera de entrenamientos — 5 suma 10, 6 penaliza a 5, 2 suma 8', () => {
    // Act
    const withFive = calculateRecoveryScore(null, 0, workouts(5));
    const withSix = calculateRecoveryScore(null, 0, workouts(6));
    const withTwo = calculateRecoveryScore(null, 0, workouts(2));

    // Assert
    expect(withFive.score).toBe(30); // 20 (lesiones) + 10 (entrenamiento)
    expect(withSix.score).toBe(25); // 20 (lesiones) + 5 (sobreentrenamiento)
    expect(withTwo.score).toBe(28); // 20 (lesiones) + 8 (1-2 entrenamientos)
  });

  // R8: fronteras de clasificación final
  it('R8: frontera de clasificación — 80/79, 60/59 y 40/39 caen en el estado correcto', () => {
    // Act
    const excellent = calculateRecoveryScore(sleep({ hoursSlept: 8, stressLevel: 3 }), 0, workouts(4));
    const good = calculateRecoveryScore(sleep({ hoursSlept: 7, stressLevel: 4 }), 0, workouts(1));
    const risk = calculateRecoveryScore(sleep({ hoursSlept: 5, stressLevel: 8 }), 1, []);

    // Assert
    expect(excellent.status).toBe('Excelente'); // 40+30+20+10=100 ≥80
    expect(good.status).toBe('Bueno'); // 30+20+20+8=78, entre 60 y 79
    expect(risk).toMatchObject({ status: 'Riesgo' }); // 10+10+5+0=25 <40
  });
});
