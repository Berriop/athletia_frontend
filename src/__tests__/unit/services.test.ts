import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../../services/api';
import { authService } from '../../services/auth.service';
import { sleepService } from '../../services/sleep.service';
import { mealService } from '../../services/meal.service';
import { workoutService } from '../../services/workout.service';
import { injuryService } from '../../services/injury.service';

// Los servicios son wrappers finos sobre `api` (axios): cada método arma la
// URL/params correctos y devuelve `response.data` o `response.data.data`
// según corresponda. Se mockea `api` para verificar exactamente esos dos
// aspectos sin depender de una red real.
vi.mock('../../services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
  vi.mocked(api.put).mockReset();
  vi.mocked(api.delete).mockReset();
});

describe('authService', () => {
  it('login → POST /auth/login y devuelve response.data.data', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { token: 't', user: { id: 'u1' } } } });
    const result = await authService.login('a@b.com', 'pass');
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pass' });
    expect(result).toEqual({ token: 't', user: { id: 'u1' } });
  });

  it('register sin confirmPassword → usa password como confirmación por defecto', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { token: 't', user: { id: 'u1' } } } });
    await authService.register('a@b.com', 'pass', undefined, 'Ana');
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      email: 'a@b.com',
      password: 'pass',
      confirmPassword: 'pass',
      name: 'Ana',
    });
  });

  it('register con confirmPassword explícito → lo respeta', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: {} } });
    await authService.register('a@b.com', 'pass', 'otraCosa', 'Ana');
    expect(api.post).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ confirmPassword: 'otraCosa' }),
    );
  });

  it('updateProfile → PUT /auth/profile con el DTO', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 'u1', name: 'Nuevo' } } });
    const result = await authService.updateProfile({ name: 'Nuevo' });
    expect(api.put).toHaveBeenCalledWith('/auth/profile', { name: 'Nuevo' });
    expect(result).toEqual({ id: 'u1', name: 'Nuevo' });
  });

  it('forgotPassword → POST /auth/forgot-password con el email', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    await authService.forgotPassword('a@b.com');
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.com' });
  });

  it('resetPassword → POST /auth/reset-password con token y nueva contraseña', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    await authService.resetPassword('tok123', 'nuevaPass');
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'tok123', newPassword: 'nuevaPass' });
  });

  it('verifyEmail → GET /auth/verify-email con el token en query', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {} });
    await authService.verifyEmail('tok123');
    expect(api.get).toHaveBeenCalledWith('/auth/verify-email?token=tok123');
  });
});

describe('sleepService', () => {
  it('getAll usa page/limit por defecto y devuelve response.data completo', async () => {
    const payload = { success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    vi.mocked(api.get).mockResolvedValue({ data: payload });
    const result = await sleepService.getAll();
    expect(api.get).toHaveBeenCalledWith('/sleeps', { params: { page: 1, limit: 10 } });
    expect(result).toEqual(payload);
  });

  it('getAll con page/limit explícitos → los pasa como params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    await sleepService.getAll(2, 25);
    expect(api.get).toHaveBeenCalledWith('/sleeps', { params: { page: 2, limit: 25 } });
  });

  it('create → POST /sleeps con el DTO y devuelve response.data.data', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 's1' } } });
    const dto = { hoursSlept: 8, sleepQuality: 8, hadNightmares: false, stressLevel: 3, date: '2026-01-01' };
    const result = await sleepService.create(dto);
    expect(api.post).toHaveBeenCalledWith('/sleeps', dto);
    expect(result).toEqual({ id: 's1' });
  });

  it('update → PUT /sleeps/:id con los cambios parciales', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 's1', hoursSlept: 9 } } });
    const result = await sleepService.update('s1', { hoursSlept: 9 });
    expect(api.put).toHaveBeenCalledWith('/sleeps/s1', { hoursSlept: 9 });
    expect(result).toEqual({ id: 's1', hoursSlept: 9 });
  });

  it('delete → DELETE /sleeps/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    await sleepService.delete('s1');
    expect(api.delete).toHaveBeenCalledWith('/sleeps/s1');
  });
});

describe('mealService', () => {
  it('getAll → GET /meals con params de paginación', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    await mealService.getAll(1, 10);
    expect(api.get).toHaveBeenCalledWith('/meals', { params: { page: 1, limit: 10 } });
  });

  it('create → POST /meals y devuelve la comida creada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 'm1' } } });
    const dto = { name: 'Pollo', calories: 500, mealType: 'LUNCH' as const, proteinG: 40, carbsG: 50, fatG: 10, date: '2026-01-01' };
    const result = await mealService.create(dto);
    expect(api.post).toHaveBeenCalledWith('/meals', dto);
    expect(result).toEqual({ id: 'm1' });
  });

  it('update → PUT /meals/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 'm1' } } });
    await mealService.update('m1', { calories: 600 });
    expect(api.put).toHaveBeenCalledWith('/meals/m1', { calories: 600 });
  });

  it('delete → DELETE /meals/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    await mealService.delete('m1');
    expect(api.delete).toHaveBeenCalledWith('/meals/m1');
  });
});

describe('workoutService', () => {
  it('getAll → GET /workouts con params de paginación', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    await workoutService.getAll(3, 15);
    expect(api.get).toHaveBeenCalledWith('/workouts', { params: { page: 3, limit: 15 } });
  });

  it('getById → GET /workouts/:id y devuelve el entrenamiento', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { id: 'w1' } } });
    const result = await workoutService.getById('w1');
    expect(api.get).toHaveBeenCalledWith('/workouts/w1');
    expect(result).toEqual({ id: 'w1' });
  });

  it('create → POST /workouts', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 'w1' } } });
    const dto = { title: 'Pecho', bodyPart: 'CHEST' as const, durationMinutes: 45, energyLevel: 7, fatigueLevel: 4, painLevel: 1, date: '2026-01-01' };
    const result = await workoutService.create(dto);
    expect(api.post).toHaveBeenCalledWith('/workouts', dto);
    expect(result).toEqual({ id: 'w1' });
  });

  it('update → PUT /workouts/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 'w1' } } });
    await workoutService.update('w1', { durationMinutes: 60 });
    expect(api.put).toHaveBeenCalledWith('/workouts/w1', { durationMinutes: 60 });
  });

  it('delete → DELETE /workouts/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    await workoutService.delete('w1');
    expect(api.delete).toHaveBeenCalledWith('/workouts/w1');
  });
});

describe('injuryService', () => {
  it('getAll → GET /injuries con params de paginación', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
    await injuryService.getAll(1, 10);
    expect(api.get).toHaveBeenCalledWith('/injuries', { params: { page: 1, limit: 10 } });
  });

  it('create → POST /injuries', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { id: 'i1' } } });
    const dto = { bodyArea: 'Rodilla', injuryName: 'Esguince', severity: 5, isActive: true };
    const result = await injuryService.create(dto);
    expect(api.post).toHaveBeenCalledWith('/injuries', dto);
    expect(result).toEqual({ id: 'i1' });
  });

  it('update → PUT /injuries/:id', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { data: { id: 'i1' } } });
    await injuryService.update('i1', { severity: 3 });
    expect(api.put).toHaveBeenCalledWith('/injuries/i1', { severity: 3 });
  });

  it('delete → DELETE /injuries/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: {} });
    await injuryService.delete('i1');
    expect(api.delete).toHaveBeenCalledWith('/injuries/i1');
  });
});
