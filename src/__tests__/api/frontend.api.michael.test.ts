import { describe, it, expect, afterEach } from 'vitest';
import { workoutService } from '../../services/workout.service';
import { mealService } from '../../services/meal.service';
import { stubApi } from '../helpers/stubApi';
import { fakeMeal, fakeWorkout } from '../helpers/fixtures';

/**
 * Pruebas de API (contrato HTTP del cliente) para las funcionalidades de
 * frontend de Michael Pardo: RF-05, RF-06 y RF-07 (rutinas de entrenamiento)
 * y RF-08 (registrar comidas).
 *
 * Se usa la instancia real de axios con un adaptador de prueba (helpers/stubApi)
 * que responde con códigos y cuerpos controlados y registra cada petición.
 */

let stub: ReturnType<typeof stubApi>;

afterEach(() => {
  stub?.restore();
});

const workoutDto = {
  title: 'Pierna',
  bodyPart: 'LEGS' as const,
  durationMinutes: 45,
  energyLevel: 7,
  fatigueLevel: 4,
  painLevel: 1,
  date: '2026-08-01',
};

describe('[API] RF-05/06/07 — workoutService.create', () => {
  it('201: envía POST /workouts y devuelve la rutina creada', async () => {
    stub = stubApi(201, { success: true, data: fakeWorkout({ id: 'workout-9' }) });

    const result = await workoutService.create(workoutDto);

    expect(stub.requests[0]).toMatchObject({ method: 'post', url: '/workouts', data: workoutDto });
    expect(result.id).toBe('workout-9');
  });

  it('400: una rutina inválida rechaza con VALIDATION_ERROR', async () => {
    stub = stubApi(400, { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } });

    const error = await workoutService.create({ ...workoutDto, energyLevel: 11 }).catch((e) => e);

    expect(error.response.status).toBe(400);
    expect(error.response.data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('[API] RF-05/06/07 — workoutService.getAll / getById', () => {
  it('GET /workouts usa page=1 y limit=10 por defecto y devuelve la respuesta con paginación', async () => {
    const meta = { page: 1, limit: 10, total: 1, totalPages: 1 };
    stub = stubApi(200, { success: true, data: [fakeWorkout()], meta });

    const result = await workoutService.getAll();

    expect(stub.requests[0]).toMatchObject({ method: 'get', url: '/workouts', params: { page: 1, limit: 10 } });
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual(meta);
  });

  it('GET /workouts/:id devuelve la rutina sin el envoltorio de la API', async () => {
    stub = stubApi(200, { success: true, data: fakeWorkout({ id: 'workout-1' }) });

    const result = await workoutService.getById('workout-1');

    expect(stub.requests[0]).toMatchObject({ method: 'get', url: '/workouts/workout-1' });
    expect(result.id).toBe('workout-1');
  });

  it('404: una rutina inexistente rechaza la promesa', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'Workout not found' } });

    const error = await workoutService.getById('no-existe').catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] RF-05/06/07 — workoutService.update / delete', () => {
  it('200: envía PUT /workouts/:id solo con los campos modificados', async () => {
    stub = stubApi(200, { success: true, data: fakeWorkout({ title: 'Pecho' }) });

    const result = await workoutService.update('workout-1', { title: 'Pecho' });

    expect(stub.requests[0]).toMatchObject({ method: 'put', url: '/workouts/workout-1', data: { title: 'Pecho' } });
    expect(result.title).toBe('Pecho');
  });

  it('204: envía DELETE /workouts/:id y resuelve sin contenido', async () => {
    stub = stubApi(204, '');

    const result = await workoutService.delete('workout-1');

    expect(stub.requests[0]).toMatchObject({ method: 'delete', url: '/workouts/workout-1' });
    expect(result).toBeUndefined();
  });

  it('404: eliminar una rutina inexistente rechaza la promesa', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'Workout not found' } });

    const error = await workoutService.delete('no-existe').catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] RF-08 — mealService.create', () => {
  const mealDto = { name: 'Ensalada', calories: 300, mealType: 'LUNCH' as const, proteinG: 20, carbsG: 30, fatG: 10, date: '2026-08-01' };

  it('201: envía POST /meals y devuelve la comida registrada', async () => {
    stub = stubApi(201, { success: true, data: fakeMeal({ name: 'Ensalada' }) });

    const result = await mealService.create(mealDto);

    expect(stub.requests[0]).toMatchObject({ method: 'post', url: '/meals', data: mealDto });
    expect(result.name).toBe('Ensalada');
  });

  it('400: calorías negativas rechazan la promesa', async () => {
    stub = stubApi(400, { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } });

    const error = await mealService.create({ ...mealDto, calories: -1 }).catch((e) => e);

    expect(error.response.status).toBe(400);
  });
});

describe('[API] sesión — las peticiones protegidas llevan el Bearer token', () => {
  it('con sesión activa, listar rutinas envía Authorization', async () => {
    localStorage.setItem('token', 'jwt-sesion');
    stub = stubApi(200, { success: true, data: [] });

    await workoutService.getAll();

    expect(stub.requests[0].authorization).toBe('Bearer jwt-sesion');
  });
});
