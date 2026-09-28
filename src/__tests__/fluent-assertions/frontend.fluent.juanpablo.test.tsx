import { describe, it, vi, beforeEach } from 'vitest';
import { expect as chaiExpect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Pruebas con Fluent Assertions (chai) para las funcionalidades de frontend
 * asignadas a Juan Pablo Berrío: RF-12, RF-13, RF-14, RF-15, RF-16, RF-18.
 */

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

// ===================== RF-18 (GymFinderPage texto) =====================
import { GymFinderPage } from '../../pages/GymFinderPage';

class FakeMap {
  panTo = vi.fn();
  setCenter = vi.fn();
  constructor(_el: unknown, _opts: unknown) {}
}
class FakeInfoWindow {
  setContent = vi.fn();
  open = vi.fn();
}
class FakeMarker {
  setMap = vi.fn();
  addListener = vi.fn();
  constructor(_opts: unknown) {}
}
function fakePlace(overrides: Record<string, unknown> = {}) {
  return {
    place_id: 'place-1', name: 'Smart Fit Poblado', vicinity: 'Cra 43A',
    formatted_address: 'Cra 43A, Medellín', rating: 4.5, user_ratings_total: 200,
    opening_hours: { isOpen: () => true },
    geometry: { location: { lat: () => 6.21, lng: () => -75.57 } },
    photos: [{ getUrl: () => 'http://photo.example/gym.jpg' }],
    ...overrides,
  };
}
const textSearchMock = vi.fn();
const nearbySearchMock = vi.fn();
class FakePlacesService {
  constructor(_map: unknown) {}
  nearbySearch(req: unknown, cb: (...a: unknown[]) => void) { nearbySearchMock(req, cb); }
  textSearch(req: unknown, cb: (...a: unknown[]) => void) { textSearchMock(req, cb); }
}

describe('RF-18 — GymFinderPage.handleTextSearch (Fluent Assertions)', () => {
  beforeEach(() => {
    textSearchMock.mockReset();
    nearbySearchMock.mockReset();
    vi.stubGlobal('google', {
      maps: {
        Map: FakeMap, Marker: FakeMarker, InfoWindow: FakeInfoWindow, Animation: { DROP: 'DROP' },
        places: { PlacesService: FakePlacesService, PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' } },
      },
    });
    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition: (success: (p: unknown) => void) => success({ coords: { latitude: 6.21, longitude: -75.57 } }) },
      configurable: true,
    });
    nearbySearchMock.mockImplementation((_req, cb) => cb([fakePlace()], 'OK'));
  });

  it('texto válido con resultados → reemplaza la lista de gimnasios mostrada', async () => {
    textSearchMock.mockImplementation((_req, cb) => cb([fakePlace({ place_id: 'place-2', name: 'Bodytech Envigado' })], 'OK'));
    const user = userEvent.setup();
    render(<GymFinderPage />);
    await screen.findByText('Smart Fit Poblado');

    await user.type(screen.getByPlaceholderText('Buscar ciudad o zona...'), 'envigado');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    const found = await screen.findByText('Bodytech Envigado');
    chaiExpect(found).to.exist;
    chaiExpect(textSearchMock.mock.calls[0][0]).to.include({ query: 'gimnasio envigado', type: 'gym' });
  });
});

// ===================== RF-12/13 (SleepPage) =====================
import { SleepPage } from '../../pages/SleepPage';
import { sleepService } from '../../services/sleep.service';

vi.mock('../../services/sleep.service', () => ({
  sleepService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const existingSleep: any = {
  id: 'sleep-1', hoursSlept: 7, sleepQuality: 9, hadNightmares: false, stressLevel: 3, notes: null,
  date: new Date('2026-08-01T12:00:00.000Z').toISOString(), userId: 'user-1',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

describe('RF-12 — SleepPage.handleUpdate (modificar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
  });

  it('editando un registro existente → llama a update y notifica éxito', async () => {
    vi.mocked(sleepService.update).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<SleepPage />);
    await user.click(await screen.findByTitle('Editar'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Registro' }));

    await waitFor(() => chaiExpect(vi.mocked(sleepService.update).mock.calls).to.have.lengthOf(1));
    chaiExpect(vi.mocked(sleepService.update).mock.calls[0][0]).to.equal('sleep-1');
    chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Registro de sueño actualizado', 'success']);
  });
});

describe('RF-13 — SleepPage.confirmDelete (eliminar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
  });

  it('eliminación exitosa → notifica éxito', async () => {
    vi.mocked(sleepService.delete).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    render(<SleepPage />);
    await user.click(await screen.findByTitle('Eliminar'));

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Registro eliminado correctamente', 'success']);
    });
  });
});

// ===================== RF-14/15/16 (InjuriesPage) =====================
import { InjuriesPage } from '../../pages/InjuriesPage';
import { injuryService } from '../../services/injury.service';

vi.mock('../../services/injury.service', () => ({
  injuryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('RF-14 — InjuriesPage.handleCreate (crear) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('datos válidos → crea la lesión y notifica éxito', async () => {
    vi.mocked(injuryService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<InjuriesPage />);
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis');

    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    await waitFor(() => chaiExpect(addNotification.mock.calls).to.have.lengthOf(1));
    chaiExpect(addNotification.mock.calls[0][0]).to.contain('registrada');
  });
});

const existingInjury: any = {
  id: 'injury-1', bodyArea: 'Rodilla', injuryName: 'Tendinitis', severity: 5, isActive: true, notes: null,
  userId: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

describe('RF-15 — InjuriesPage.handleUpdate (modificar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [existingInjury], meta: {} } as any);
  });

  it('editando una lesión existente → llama a update y notifica éxito', async () => {
    vi.mocked(injuryService.update).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<InjuriesPage />);
    await user.click(await screen.findByTitle('Editar'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Lesión' }));

    await waitFor(() => {
      chaiExpect(vi.mocked(injuryService.update).mock.calls[0][0]).to.equal('injury-1');
    });
  });
});

describe('RF-16 — InjuriesPage.confirmDelete (eliminar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [existingInjury], meta: {} } as any);
  });

  it('eliminación exitosa → la lesión desaparece de la lista', async () => {
    vi.mocked(injuryService.delete).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    render(<InjuriesPage />);
    await user.click(await screen.findByTitle('Eliminar'));
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => chaiExpect(screen.queryByText('Tendinitis')).to.be.null);
  });
});
