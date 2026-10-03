import { describe, it, expect, afterEach } from 'vitest';
import { mealService } from '../../services/meal.service';
import { sleepService } from '../../services/sleep.service';
import { authService } from '../../services/auth.service';
import { api } from '../../services/api';
import { stubApi } from '../helpers/stubApi';
import { fakeMeal, fakeSleep, fakeUser } from '../helpers/fixtures';

/**
 * Pruebas de API (contrato HTTP del cliente) para las funcionalidades de
 * frontend de Daniel Ortiz: RF-09 y RF-10 (comidas), RF-11 (sueño), RF-27
 * (recuperar contraseña) y RF-30 (administración de usuarios).
 *
 * Se usa la instancia real de axios con un adaptador de prueba (helpers/stubApi)
 * que responde con códigos y cuerpos controlados y registra cada petición.
 */

let stub: ReturnType<typeof stubApi>;

afterEach(() => {
  stub?.restore();
});

describe('[API] RF-09 — mealService.update', () => {
  it('200: envía PUT /meals/:id con los campos modificados y devuelve la comida', async () => {
    stub = stubApi(200, { success: true, data: fakeMeal({ calories: 750 }) });

    const result = await mealService.update('meal-1', { calories: 750 });

    expect(stub.requests[0]).toMatchObject({ method: 'put', url: '/meals/meal-1', data: { calories: 750 } });
    expect(result.calories).toBe(750);
  });

  it('404: una comida inexistente rechaza la promesa', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'Meal not found' } });

    const error = await mealService.update('no-existe', { calories: 750 }).catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] RF-10 — mealService.delete', () => {
  it('204: envía DELETE /meals/:id y resuelve sin contenido', async () => {
    stub = stubApi(204, '');

    const result = await mealService.delete('meal-1');

    expect(stub.requests[0]).toMatchObject({ method: 'delete', url: '/meals/meal-1' });
    expect(result).toBeUndefined();
  });

  it('404: eliminar una comida inexistente rechaza la promesa', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'Meal not found' } });

    const error = await mealService.delete('no-existe').catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] RF-11 — sleepService.create', () => {
  const dto = { hoursSlept: 7.5, sleepQuality: 8, hadNightmares: false, stressLevel: 3, date: '2026-08-01' };

  it('201: envía POST /sleeps y devuelve el registro creado', async () => {
    stub = stubApi(201, { success: true, data: fakeSleep({ hoursSlept: 7.5 }) });

    const result = await sleepService.create(dto);

    expect(stub.requests[0]).toMatchObject({ method: 'post', url: '/sleeps', data: dto });
    expect(result.hoursSlept).toBe(7.5);
  });

  it('400: datos fuera de rango rechazan la promesa con VALIDATION_ERROR', async () => {
    stub = stubApi(400, { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } });

    const error = await sleepService.create({ ...dto, sleepQuality: 11 }).catch((e) => e);

    expect(error.response.status).toBe(400);
    expect(error.response.data.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('[API] RF-27 — authService.forgotPassword / resetPassword', () => {
  it('forgot-password 200: envía POST con el correo y resuelve sin datos (no expone si existe)', async () => {
    stub = stubApi(200, { success: true, data: { message: 'If email exists, a reset link has been sent.' } });

    const result = await authService.forgotPassword('user@test.com');

    expect(stub.requests[0]).toMatchObject({ method: 'post', url: '/auth/forgot-password', data: { email: 'user@test.com' } });
    expect(result).toBeUndefined();
  });

  it('forgot-password 400: un correo con formato inválido rechaza la promesa', async () => {
    stub = stubApi(400, { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } });

    const error = await authService.forgotPassword('no-es-correo').catch((e) => e);

    expect(error.response.status).toBe(400);
  });

  it('reset-password 200: envía el token y la nueva contraseña', async () => {
    stub = stubApi(200, { success: true, data: { message: 'Password has been reset successfully.' } });

    await authService.resetPassword('token-123', 'NuevaClave@2026');

    expect(stub.requests[0]).toMatchObject({
      method: 'post',
      url: '/auth/reset-password',
      data: { token: 'token-123', newPassword: 'NuevaClave@2026' },
    });
  });

  it('reset-password 400: un token vencido rechaza con el mensaje del backend', async () => {
    stub = stubApi(400, { success: false, error: { code: 'VALIDATION_ERROR', message: 'Token inválido o expirado' } });

    const error = await authService.resetPassword('viejo', 'NuevaClave@2026').catch((e) => e);

    expect(error.response.status).toBe(400);
    expect(error.response.data.error.message).toBe('Token inválido o expirado');
  });
});

describe('[API] RF-30 — administración de usuarios (api directa, como en AdminPage)', () => {
  it('200: GET /admin/users devuelve la lista de usuarios', async () => {
    localStorage.setItem('token', 'jwt-admin');
    stub = stubApi(200, { success: true, data: [fakeUser({ id: 'u1' }), fakeUser({ id: 'u2' })] });

    const response = await api.get('/admin/users');

    expect(stub.requests[0]).toMatchObject({ method: 'get', url: '/admin/users', authorization: 'Bearer jwt-admin' });
    expect(response.data.data).toHaveLength(2);
  });

  it('403: un usuario sin rol de administrador es rechazado', async () => {
    stub = stubApi(403, { success: false, message: 'Forbidden: admin access required' });

    const error = await api.get('/admin/users').catch((e) => e);

    expect(error.response.status).toBe(403);
  });

  it('200: PATCH /admin/users/:id/toggle-block devuelve el usuario con su nuevo estado', async () => {
    stub = stubApi(200, { success: true, data: fakeUser({ id: 'u2' }) });

    const response = await api.patch('/admin/users/u2/toggle-block', {});

    expect(stub.requests[0]).toMatchObject({ method: 'patch', url: '/admin/users/u2/toggle-block', data: {} });
    expect(response.data.data.id).toBe('u2');
  });

  it('403: bloquear la propia cuenta de administrador es rechazado por el backend', async () => {
    stub = stubApi(403, { success: false, error: { code: 'FORBIDDEN', message: 'No puedes bloquear tu propia cuenta de administrador' } });

    const error = await api.patch('/admin/users/admin-1/toggle-block', {}).catch((e) => e);

    expect(error.response.status).toBe(403);
    expect(error.response.data.error.code).toBe('FORBIDDEN');
  });
});
