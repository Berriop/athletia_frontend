import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Suite de REGRESIÓN para las funcionalidades de frontend de Juan Pablo
 * Berrío: RF-12, RF-13, RF-14, RF-15, RF-16, RF-18.
 */

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

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

describe('[Regresión] RF-12/13 — SleepPage sigue eliminando registros correctamente', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
  });

  it('eliminar un registro sigue notificando éxito', async () => {
    vi.mocked(sleepService.delete).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    render(<SleepPage />);
    await user.click(await screen.findByTitle('Eliminar'));

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Registro eliminado correctamente', 'success'));
  });
});

// ===================== RF-14/15/16 (InjuriesPage) =====================
import { InjuriesPage } from '../../pages/InjuriesPage';
import { injuryService } from '../../services/injury.service';

vi.mock('../../services/injury.service', () => ({
  injuryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('[Regresión] RF-14/15/16 — InjuriesPage sigue exigiendo área del cuerpo y nombre', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('crear con ambos campos completos sigue registrando la lesión', async () => {
    vi.mocked(injuryService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<InjuriesPage />);
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis');

    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    await waitFor(() => expect(injuryService.create).toHaveBeenCalledTimes(1));
  });
});

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

describe('[Regresión] RF-18 — GymFinderPage sigue delegando la búsqueda de texto a Places', () => {
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

  it('sigue llamando a textSearch con "gimnasio <texto>" y type "gym"', async () => {
    textSearchMock.mockImplementation((_req, cb) => cb([], 'ZERO_RESULTS'));
    const user = userEvent.setup();
    render(<GymFinderPage />);
    await screen.findByText('Smart Fit Poblado');

    await user.type(screen.getByPlaceholderText('Buscar ciudad o zona...'), 'envigado');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    await waitFor(() => expect(textSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'gimnasio envigado', type: 'gym' }),
      expect.any(Function),
    ));
  });
});
