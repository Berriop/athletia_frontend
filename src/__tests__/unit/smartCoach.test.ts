import { describe, it, expect } from 'vitest';
import { getCoachRecommendation } from '../../utils/smartCoach';
import type { SleepLog, Workout } from '../../types';

// getCoachRecommendation: 5 decisiones independientes evaluadas en cascada
// (V(G)=6 caminos: sobreentrenamiento, lesiones, descanso, incrementar
// actividad, buen nivel, fallback). Cada test aísla un camino evitando que
// las condiciones de los caminos anteriores se disparen.

const sleep = (overrides: Partial<SleepLog> = {}): SleepLog =>
  ({
    id: 's1',
    hoursSlept: 8,
    sleepQuality: 8,
    hadNightmares: false,
    stressLevel: 3,
    notes: null,
    date: new Date().toISOString(),
    userId: 'u1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }) as SleepLog;

const workouts = (count: number): Workout[] =>
  Array.from({ length: count }, (_, i) => ({ id: `w${i}` }) as Workout);

describe('getCoachRecommendation', () => {
  // Camino 1: workoutsCount > 5 y (hoursSlept < 7 o stress >= 7 o lesiones > 0)
  it('Camino 1: muchos entrenamientos + poco sueño → riesgo de sobreentrenamiento', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 5, stressLevel: 2 }), 0, workouts(6));
    expect(result.message).toBe('Riesgo de sobreentrenamiento');
    expect(result.type).toBe('danger');
  });

  it('Camino 1 (variante estrés): muchos entrenamientos + estrés alto → riesgo de sobreentrenamiento', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 8, stressLevel: 7 }), 0, workouts(6));
    expect(result.message).toBe('Riesgo de sobreentrenamiento');
  });

  it('Camino 1 (variante lesión): muchos entrenamientos + lesión activa → riesgo de sobreentrenamiento', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 8, stressLevel: 2 }), 1, workouts(6));
    expect(result.message).toBe('Riesgo de sobreentrenamiento');
  });

  // Camino 2: no dispara camino 1, pero hay lesiones activas
  it('Camino 2: pocos entrenamientos + lesión activa → atención a lesiones', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 8, stressLevel: 2 }), 2, workouts(2));
    expect(result.message).toBe('Atención a tus lesiones');
    expect(result.type).toBe('warning');
  });

  // Camino 3: sin lesiones, pero mal descanso
  it('Camino 3: sin lesiones + poco sueño → necesidad de descanso', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 5, stressLevel: 3 }), 0, workouts(2));
    expect(result.message).toBe('Necesidad de descanso');
    expect(result.type).toBe('warning');
  });

  it('Camino 3 (variante estrés): sin lesiones + estrés muy alto → necesidad de descanso', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 8, stressLevel: 9 }), 0, workouts(2));
    expect(result.message).toBe('Necesidad de descanso');
  });

  // Camino 4: buen descanso pero pocos entrenamientos
  it('Camino 4: descansado + pocos entrenamientos → incrementar actividad física', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 7, stressLevel: 5 }), 0, workouts(1));
    expect(result.message).toBe('Incrementar actividad física');
    expect(result.type).toBe('info');
  });

  // Camino 5: rango óptimo de entrenamientos, buen sueño, bajo estrés
  it('Camino 5: 3-5 entrenamientos + buen sueño + bajo estrés → buen nivel de recuperación', () => {
    const result = getCoachRecommendation(sleep({ hoursSlept: 7, stressLevel: 4 }), 0, workouts(4));
    expect(result.message).toBe('Buen nivel de recuperación');
    expect(result.type).toBe('success');
  });

  // Camino 6 (fallback): no cae en ninguna de las reglas anteriores
  it('Camino 6 (fallback): métricas intermedias que no calzan en ninguna regla → mantener rutina', () => {
    // 4 entrenamientos, sueño 7h (>=7) pero estrés 7 (excluye camino 5 por estrés>5,
    // y no activa camino 3 porque stress<8 y hoursSlept>=6)
    const result = getCoachRecommendation(sleep({ hoursSlept: 7, stressLevel: 7 }), 0, workouts(4));
    expect(result.message).toBe('Mantener rutina actual');
    expect(result.type).toBe('success');
  });

  // Sin registro de sueño → usa valores por defecto (hoursSlept=7, stress=5)
  it('sin registro de sueño (lastSleep=null) → usa valores por defecto moderados', () => {
    const result = getCoachRecommendation(null, 0, workouts(4));
    // hoursSlept=7, stress=5 con 4 entrenamientos cae en "Buen nivel de recuperación"
    expect(result.message).toBe('Buen nivel de recuperación');
  });
});
