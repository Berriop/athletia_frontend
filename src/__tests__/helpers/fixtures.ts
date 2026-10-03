import type { Injury, Meal, SleepLog, User, Workout } from '../../types';

/**
 * Fábricas de datos y utilidades de medición compartidas por las suites de
 * API, seguridad y rendimiento del frontend. No contienen pruebas.
 */

const NOW = '2026-08-01T12:00:00.000Z';

export function fakeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Usuario de prueba',
    role: 'USER',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function fakeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: 'meal-1',
    name: 'Pollo con arroz',
    calories: 600,
    mealType: 'LUNCH',
    proteinG: 40,
    carbsG: 60,
    fatG: 15,
    date: NOW,
    userId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function fakeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'workout-1',
    title: 'Pierna',
    description: null,
    bodyPart: 'LEGS',
    durationMinutes: 45,
    energyLevel: 7,
    fatigueLevel: 4,
    painLevel: 1,
    date: NOW,
    userId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function fakeSleep(overrides: Partial<SleepLog> = {}): SleepLog {
  return {
    id: 'sleep-1',
    hoursSlept: 7,
    sleepQuality: 8,
    hadNightmares: false,
    stressLevel: 3,
    notes: null,
    date: NOW,
    userId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function fakeInjury(overrides: Partial<Injury> = {}): Injury {
  return {
    id: 'injury-1',
    bodyArea: 'Rodilla',
    injuryName: 'Tendinitis',
    severity: 4,
    isActive: true,
    notes: null,
    userId: 'user-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/** Mide cuántos milisegundos tarda una operación (síncrona o asíncrona). */
export async function elapsedMs(operation: () => unknown): Promise<number> {
  const start = performance.now();
  await operation();
  return performance.now() - start;
}

/** Mediana de varias mediciones: más estable que una sola ejecución. */
export async function medianMs(runs: number, operation: () => unknown): Promise<number> {
  const samples: number[] = [];
  for (let i = 0; i < runs; i++) {
    samples.push(await elapsedMs(operation));
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}
