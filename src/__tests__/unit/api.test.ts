import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '../../services/api';

// api.ts define dos interceptores (request y response) con lógica propia:
// - request: agrega el Bearer token si existe en localStorage (dos formas de
//   setear el header, según si `config.headers` trae `.set` o es un objeto plano).
// - response: en un 401 que NO sea el propio /auth/login, limpia sesión y
//   redirige a /login; en cualquier otro caso simplemente re-lanza el error.
// Se accede a los handlers internos de axios (interceptors.*.handlers) porque
// axios no expone una API pública para invocarlos directamente en tests.

function getRequestInterceptor() {
  return (api.interceptors.request as any).handlers[0];
}

function getResponseInterceptor() {
  return (api.interceptors.response as any).handlers[0];
}

describe('api request interceptor', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sin token en localStorage → no agrega Authorization', () => {
    const config = { headers: {} as Record<string, string> };
    const result = getRequestInterceptor().fulfilled(config);
    expect(result.headers['Authorization']).toBeUndefined();
  });

  it('con token y headers tipo AxiosHeaders (con .set) → usa headers.set', () => {
    localStorage.setItem('token', 'abc123');
    const set = vi.fn();
    const config = { headers: { set } };
    getRequestInterceptor().fulfilled(config);
    expect(set).toHaveBeenCalledWith('Authorization', 'Bearer abc123');
  });

  it('con token y headers como objeto plano (sin .set) → asigna la propiedad directamente', () => {
    localStorage.setItem('token', 'xyz789');
    const config = { headers: {} as Record<string, string> };
    const result = getRequestInterceptor().fulfilled(config);
    expect(result.headers['Authorization']).toBe('Bearer xyz789');
  });

  it('el handler de error del request interceptor rechaza la promesa con el mismo error', async () => {
    const error = new Error('boom');
    await expect(getRequestInterceptor().rejected(error)).rejects.toBe(error);
  });
});

describe('api response interceptor', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.setItem('token', 'abc123');
    localStorage.setItem('user', '{"id":"u1"}');
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: '' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('una respuesta exitosa pasa sin cambios', () => {
    const response = { status: 200, data: {} };
    expect(getResponseInterceptor().fulfilled(response)).toBe(response);
  });

  it('401 en un endpoint que NO es login → limpia la sesión y redirige a /login', async () => {
    const error = { response: { status: 401 }, config: { url: '/workouts' } };
    await expect(getResponseInterceptor().rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('401 en el propio /auth/login → NO limpia la sesión ni redirige', async () => {
    const error = { response: { status: 401 }, config: { url: '/auth/login' } };
    await expect(getResponseInterceptor().rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBe('abc123');
    expect(window.location.href).toBe('');
  });

  it('error sin response (red caída) → solo re-lanza, sin tocar sesión', async () => {
    const error = { message: 'Network Error' };
    await expect(getResponseInterceptor().rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBe('abc123');
  });

  it('error con status distinto de 401 → no limpia la sesión', async () => {
    const error = { response: { status: 500 }, config: { url: '/workouts' } };
    await expect(getResponseInterceptor().rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem('token')).toBe('abc123');
  });
});
