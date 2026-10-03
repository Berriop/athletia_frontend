import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InjuriesPage } from '../../pages/InjuriesPage';
import { SleepPage } from '../../pages/SleepPage';
import { injuryService } from '../../services/injury.service';
import { sleepService } from '../../services/sleep.service';
import { elapsedMs, fakeInjury, fakeSleep, medianMs } from '../helpers/fixtures';

/**
 * Pruebas de rendimiento para las funcionalidades de frontend de Juan Pablo
 * Berrío: RF-12/13 (sueño), RF-14/15/16 (lesiones) y RF-18 (gimnasios).
 *
 * Son pruebas no funcionales: además de comprobar que el resultado es correcto,
 * verifican un presupuesto de tiempo. Las pantallas piden como máximo 50
 * registros por página; también se prueba con 300 como prueba de estrés. Los
 * límites son amplios a propósito para evitar falsos fallos en Jenkins.
 */

vi.mock('../../services/injury.service', () => ({
  injuryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../services/sleep.service', () => ({
  sleepService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification: vi.fn() }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('[Rendimiento] RF-14/15/16 — InjuriesPage', () => {
  it('muestra una página completa de 50 lesiones dentro del presupuesto', async () => {
    vi.mocked(injuryService.getAll).mockResolvedValue({
      success: true,
      data: Array.from({ length: 50 }, (_, i) => fakeInjury({ id: `injury-${i}`, injuryName: `Lesion ${i}` })),
    });

    const duracion = await elapsedMs(async () => {
      render(<InjuriesPage />);
      await screen.findByText('Lesion 49');
    });

    expect(duracion, `50 lesiones tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(10_000);
  });

  it('prueba de estrés: 300 lesiones se muestran dentro del presupuesto', async () => {
    vi.mocked(injuryService.getAll).mockResolvedValue({
      success: true,
      data: Array.from({ length: 300 }, (_, i) => fakeInjury({ id: `injury-${i}`, injuryName: `Lesion ${i}` })),
    });

    const duracion = await elapsedMs(async () => {
      render(<InjuriesPage />);
      await screen.findByText('Lesion 299');
    });

    expect(screen.getAllByText('ACTIVA')).toHaveLength(300);
    expect(duracion, `300 lesiones tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(15_000);
  });
});

describe('[Rendimiento] RF-12/13 — SleepPage', () => {
  it('prueba de estrés: 300 registros de sueño se muestran dentro del presupuesto', async () => {
    vi.mocked(sleepService.getAll).mockResolvedValue({
      success: true,
      data: Array.from({ length: 300 }, (_, i) => fakeSleep({ id: `sleep-${i}`, hoursSlept: 5 + (i % 5) })),
    });

    const duracion = await elapsedMs(async () => {
      render(<SleepPage />);
      await screen.findAllByText('Bien');
    });

    expect(screen.getAllByText('Bien')).toHaveLength(300);
    expect(duracion, `300 registros tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(15_000);
  });
});

describe('[Rendimiento] RF-18 — GymFinderPage', () => {
  class FakeMap {
    panTo = vi.fn();
    setCenter = vi.fn();
    constructor(_element: unknown, _options: unknown) {}
  }
  class FakeInfoWindow {
    setContent = vi.fn();
    open = vi.fn();
  }
  class FakeMarker {
    setMap = vi.fn();
    addListener = vi.fn();
    constructor(_options: unknown) {}
  }
  const lugares = Array.from({ length: 60 }, (_, i) => ({
    place_id: `place-${i}`,
    name: `Gimnasio ${i}`,
    vicinity: `Calle ${i}`,
    geometry: { location: { lat: () => 6.2 + i / 1000, lng: () => -75.5 } },
  }));
  class FakePlacesService {
    constructor(_map: unknown) {}
    nearbySearch(_request: unknown, callback: (...args: unknown[]) => void) {
      callback(lugares, 'OK');
    }
    textSearch() {}
  }

  async function montarGymFinder() {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'clave-de-prueba');
    vi.stubGlobal('google', {
      maps: {
        Map: FakeMap,
        Marker: FakeMarker,
        InfoWindow: FakeInfoWindow,
        Animation: { DROP: 'DROP' },
        places: { PlacesService: FakePlacesService, PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' } },
      },
    });
    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition: (success: (p: unknown) => void) => success({ coords: { latitude: 6.21, longitude: -75.57 } }) },
      configurable: true,
    });
    const { GymFinderPage } = await import('../../pages/GymFinderPage');
    render(<GymFinderPage />);
    await screen.findByText('Gimnasio 0');
  }

  it('Google devuelve hasta 60 lugares pero la pantalla solo muestra los primeros 20, dentro del presupuesto', async () => {
    const duracion = await elapsedMs(montarGymFinder);

    expect(screen.getByText('Gimnasio 19')).toBeInTheDocument();
    expect(screen.queryByText('Gimnasio 20')).not.toBeInTheDocument();
    expect(duracion, `El montaje tardó ${duracion.toFixed(1)} ms`).toBeLessThan(12_000);
  });

  it('el costo de montar InjuriesPage vacía es estable (mediana de 5 montajes, margen amplio)', async () => {
    vi.mocked(injuryService.getAll).mockResolvedValue({ success: true, data: [] });

    const mediana = await medianMs(5, async () => {
      const { unmount } = render(<InjuriesPage />);
      await screen.findByText('No hay lesiones reportadas.');
      unmount();
    });

    expect(mediana, `La mediana fue ${mediana.toFixed(1)} ms`).toBeLessThan(8_000);
  });
});
