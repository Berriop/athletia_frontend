import { describe, it, expect, afterEach } from 'vitest';
import { injuryService } from '../../services/injury.service';
import { sleepService } from '../../services/sleep.service';
import { stubApi } from '../helpers/stubApi';
import { fakeInjury, fakeSleep } from '../helpers/fixtures';

/**
 * Pruebas de API (contrato HTTP del cliente) para las funcionalidades de
 * frontend de Juan Pablo Berrío: RF-12 y RF-13 (sueño) y RF-14, RF-15 y RF-16
 * (lesiones).
 *
 * Se usa la instancia real de axios con un adaptador de prueba (helpers/stubApi)
 * que responde con códigos y cuerpos controlados y registra cada petición. Se
 * verifica método, URL, parámetros, cuerpo y el manejo de códigos 2xx/4xx.
 */

let stub: ReturnType<typeof stubApi>;

afterEach(() => {
  stub?.restore();
});

describe('[API] RF-14 — injuryService.create / getAll', () => {
  const dto = { bodyArea: 'Rodilla', injuryName: 'Tendinitis', severity: 4, isActive: true };

  it('201: envía POST /injuries con el cuerpo del formulario y devuelve la lesión creada', async () => {
    stub = stubApi(201, { success: true, data: fakeInjury({ id: 'injury-9' }) });

    const result = await injuryService.create(dto);

    expect(stub.requests[0]).toMatchObject({ method: 'post', url: '/injuries', data: dto });
    expect(result.id).toBe('injury-9');
  });

  it('400: el detalle de validación mantiene la forma que usa la pantalla (details[].message)', async () => {
    stub = stubApi(400, {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: [{ field: 'body.injuryName', message: 'Solo letras' }] },
    });

    const error = await injuryService.create({ ...dto, injuryName: 'Tendinitis2' }).catch((e) => e);

    expect(error.response.status).toBe(400);
    expect(error.response.data.error.details.map((d: { message: string }) => d.message)).toEqual(['Solo letras']);
  });

  it('GET /injuries usa page=1 y limit=10 por defecto y permite cambiarlos', async () => {
    stub = stubApi(200, { success: true, data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } });

    await injuryService.getAll();
    await injuryService.getAll(3, 50);

    expect(stub.requests[0]).toMatchObject({ method: 'get', url: '/injuries', params: { page: 1, limit: 10 } });
    expect(stub.requests[1]).toMatchObject({ params: { page: 3, limit: 50 } });
  });
});

describe('[API] RF-15 — injuryService.update', () => {
  it('200: envía PUT /injuries/:id solo con los campos modificados', async () => {
    stub = stubApi(200, { success: true, data: fakeInjury({ severity: 8 }) });

    const result = await injuryService.update('injury-1', { severity: 8 });

    expect(stub.requests[0]).toMatchObject({ method: 'put', url: '/injuries/injury-1', data: { severity: 8 } });
    expect(result.severity).toBe(8);
  });

  it('404: una lesión inexistente rechaza la promesa', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'Injury not found' } });

    const error = await injuryService.update('no-existe', { severity: 8 }).catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] RF-16 — injuryService.delete', () => {
  it('204: envía DELETE /injuries/:id y resuelve sin contenido', async () => {
    stub = stubApi(204, '');

    const result = await injuryService.delete('injury-1');

    expect(stub.requests[0]).toMatchObject({ method: 'delete', url: '/injuries/injury-1' });
    expect(result).toBeUndefined();
  });

  it('404: no se puede eliminar una lesión inexistente', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'Injury not found' } });

    const error = await injuryService.delete('no-existe').catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] RF-12 / RF-13 — sleepService.update / delete', () => {
  it('200: envía PUT /sleeps/:id y devuelve el registro actualizado', async () => {
    stub = stubApi(200, { success: true, data: fakeSleep({ hoursSlept: 9 }) });

    const result = await sleepService.update('sleep-1', { hoursSlept: 9 });

    expect(stub.requests[0]).toMatchObject({ method: 'put', url: '/sleeps/sleep-1', data: { hoursSlept: 9 } });
    expect(result.hoursSlept).toBe(9);
  });

  it('204: envía DELETE /sleeps/:id y resuelve sin contenido', async () => {
    stub = stubApi(204, '');

    const result = await sleepService.delete('sleep-1');

    expect(stub.requests[0]).toMatchObject({ method: 'delete', url: '/sleeps/sleep-1' });
    expect(result).toBeUndefined();
  });

  it('404: eliminar un registro de sueño inexistente rechaza la promesa', async () => {
    stub = stubApi(404, { success: false, error: { code: 'NOT_FOUND', message: 'Sleep log not found' } });

    const error = await sleepService.delete('no-existe').catch((e) => e);

    expect(error.response.status).toBe(404);
  });
});

describe('[API] sesión — todas las peticiones protegidas llevan el Bearer token', () => {
  it('con sesión activa, las peticiones de lesiones y sueño envían Authorization', async () => {
    localStorage.setItem('token', 'jwt-sesion');
    stub = stubApi(200, { success: true, data: [] });

    await injuryService.getAll();
    await sleepService.getAll();

    expect(stub.requests.map((r) => r.authorization)).toEqual(['Bearer jwt-sesion', 'Bearer jwt-sesion']);
  });
});
