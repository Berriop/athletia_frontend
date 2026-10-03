import { describe, it, expect, afterEach } from 'vitest';
import { authService } from '../../services/auth.service';
import { stubApi } from '../helpers/stubApi';
import { fakeUser } from '../helpers/fixtures';

/**
 * Pruebas de API (contrato HTTP del cliente) para las funcionalidades de
 * frontend de Luisa Espinal: RF-01 (registro), RF-02 (login) y RF-04 (perfil).
 *
 * Se usa la instancia real de axios con un adaptador de prueba (helpers/stubApi)
 * que responde con códigos y cuerpos controlados y registra cada petición. Se
 * verifica método, URL, cuerpo, cabeceras y el manejo de códigos 2xx/4xx.
 */

let stub: ReturnType<typeof stubApi>;

afterEach(() => {
  stub?.restore();
});

describe('[API] RF-02 — authService.login', () => {
  it('200: envía POST /auth/login con las credenciales y devuelve token y usuario', async () => {
    const user = fakeUser();
    stub = stubApi(200, { success: true, data: { token: 'jwt-token', user } });

    const result = await authService.login('user@test.com', 'StrongP@ss1234');

    expect(stub.requests).toHaveLength(1);
    expect(stub.requests[0]).toMatchObject({
      method: 'post',
      url: '/auth/login',
      data: { email: 'user@test.com', password: 'StrongP@ss1234' },
    });
    expect(result).toEqual({ token: 'jwt-token', user });
  });

  it('no envía cabecera Authorization cuando no hay sesión', async () => {
    stub = stubApi(200, { success: true, data: { token: 't', user: fakeUser() } });

    await authService.login('user@test.com', 'StrongP@ss1234');

    expect(stub.requests[0].authorization).toBeUndefined();
  });

  it('401: credenciales inválidas rechazan la promesa con el código y el mensaje del backend', async () => {
    stub = stubApi(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });

    const error = await authService.login('user@test.com', 'incorrecta').catch((e) => e);

    expect(error.response.status).toBe(401);
    expect(error.response.data.error.message).toBe('Invalid credentials');
  });

  it('401 en el login no borra una sesión previa (solo los endpoints protegidos lo hacen)', async () => {
    localStorage.setItem('token', 'token-previo');
    stub = stubApi(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });

    await authService.login('user@test.com', 'incorrecta').catch(() => undefined);

    expect(localStorage.getItem('token')).toBe('token-previo');
  });

  it('403: una cuenta bloqueada rechaza con FORBIDDEN', async () => {
    stub = stubApi(403, { success: false, error: { code: 'FORBIDDEN', message: 'Tu cuenta se encuentra bloqueada.' } });

    const error = await authService.login('user@test.com', 'StrongP@ss1234').catch((e) => e);

    expect(error.response.status).toBe(403);
    expect(error.response.data.error.code).toBe('FORBIDDEN');
  });
});

describe('[API] RF-01 — authService.register', () => {
  it('201: envía POST /auth/register y usa la contraseña como confirmación si no se indica otra', async () => {
    stub = stubApi(201, { success: true, data: { token: 'jwt-token', user: fakeUser() } });

    const result = await authService.register('nueva@test.com', 'StrongP@ss1234', undefined, 'Luisa');

    expect(stub.requests[0]).toMatchObject({
      method: 'post',
      url: '/auth/register',
      data: { email: 'nueva@test.com', password: 'StrongP@ss1234', confirmPassword: 'StrongP@ss1234', name: 'Luisa' },
    });
    expect(result.token).toBe('jwt-token');
  });

  it('409: un correo ya registrado rechaza con CONFLICT', async () => {
    stub = stubApi(409, { success: false, error: { code: 'CONFLICT', message: 'Email already in use' } });

    const error = await authService.register('user@test.com', 'StrongP@ss1234').catch((e) => e);

    expect(error.response.status).toBe(409);
    expect(error.response.data.error.code).toBe('CONFLICT');
  });

  it('400: los errores de validación llegan con el detalle por campo', async () => {
    stub = stubApi(400, {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: [{ field: 'body.password', message: 'Contraseña débil' }] },
    });

    const error = await authService.register('user@test.com', 'debil').catch((e) => e);

    expect(error.response.status).toBe(400);
    expect(error.response.data.error.details[0]).toEqual({ field: 'body.password', message: 'Contraseña débil' });
  });
});

describe('[API] RF-04 — authService.updateProfile', () => {
  it('200: envía PUT /auth/profile con el Bearer token y devuelve el usuario actualizado', async () => {
    localStorage.setItem('token', 'jwt-sesion');
    stub = stubApi(200, { success: true, data: fakeUser({ name: 'Luisa Espinal', heightCm: 165 }) });

    const result = await authService.updateProfile({ name: 'Luisa Espinal', heightCm: 165 });

    expect(stub.requests[0]).toMatchObject({
      method: 'put',
      url: '/auth/profile',
      data: { name: 'Luisa Espinal', heightCm: 165 },
      authorization: 'Bearer jwt-sesion',
    });
    expect(result.name).toBe('Luisa Espinal');
  });

  it('404: si el usuario ya no existe la promesa se rechaza', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });

    const error = await authService.updateProfile({ name: 'Nadie' }).catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] RF-02 — authService.verifyEmail', () => {
  it('200: consulta GET /auth/verify-email con el token en la query', async () => {
    stub = stubApi(200, { success: true, data: { message: 'Email verified successfully.' } });

    await authService.verifyEmail('token-123');

    expect(stub.requests[0]).toMatchObject({ method: 'get', url: '/auth/verify-email?token=token-123' });
  });
});
