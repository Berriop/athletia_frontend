import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InjuriesPage } from '../../pages/InjuriesPage';
import { injuryService } from '../../services/injury.service';
import { fakeInjury } from '../helpers/fixtures';

/**
 * Pruebas de seguridad para las funcionalidades de frontend de Juan Pablo
 * Berrío: RF-12/13 (sueño), RF-14/15/16 (lesiones) y RF-18 (gimnasios).
 *
 * Reglas de seguridad convertidas en pruebas de regresión: los datos que llegan
 * del servidor o de Google Places se muestran como texto (nunca como HTML), el
 * contenido del InfoWindow de Google Maps escapa el HTML y el código fuente no
 * usa sumideros de HTML peligrosos.
 */

vi.mock('../../services/injury.service', () => ({
  injuryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

const XSS_IMG = '<img src=x onerror=alert(1)>';
const XSS_SCRIPT = '<script>alert(1)</script>';

describe('[Seguridad] RF-14/15/16 — InjuriesPage muestra los datos como texto', () => {
  beforeEach(() => {
    addNotification.mockClear();
  });

  it('un nombre y un área con HTML malicioso se renderizan como texto, sin crear elementos', async () => {
    vi.mocked(injuryService.getAll).mockResolvedValue({
      success: true,
      data: [fakeInjury({ injuryName: XSS_IMG, bodyArea: XSS_SCRIPT })],
    });

    const { container } = render(<InjuriesPage />);

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(screen.getByText(new RegExp('alert\\(1\\)</script>'))).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('un mensaje de validación del servidor con HTML se muestra como texto', async () => {
    const mensaje = '<b onmouseover=alert(1)>Solo letras</b>';
    vi.mocked(injuryService.getAll).mockResolvedValue({ success: true, data: [] });
    vi.mocked(injuryService.create).mockRejectedValue({
      response: { data: { error: { details: [{ message: mensaje }] } } },
    });
    const user = userEvent.setup();
    const { container } = render(<InjuriesPage />);
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis');

    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(container.querySelector('b[onmouseover]')).toBeNull();
  });
});

describe('[Seguridad] RF-18 — GymFinderPage con datos no confiables de Google Places', () => {
  class FakeMap {
    panTo = vi.fn();
    setCenter = vi.fn();
    constructor(_element: unknown, _options: unknown) {}
  }
  class FakeInfoWindow {
    static instances: FakeInfoWindow[] = [];
    setContent = vi.fn();
    open = vi.fn();
    constructor() {
      FakeInfoWindow.instances.push(this);
    }
  }
  class FakeMarker {
    static instances: FakeMarker[] = [];
    listeners: Record<string, () => void> = {};
    setMap = vi.fn();
    addListener = (event: string, handler: () => void) => {
      this.listeners[event] = handler;
    };
    constructor(_options: unknown) {
      FakeMarker.instances.push(this);
    }
  }
  class FakePlacesService {
    constructor(_map: unknown) {}
    nearbySearch(_request: unknown, callback: (...args: unknown[]) => void) {
      callback(
        [
          {
            place_id: 'place-evil',
            name: XSS_IMG,
            vicinity: XSS_SCRIPT,
            rating: 4.5,
            user_ratings_total: 10,
            opening_hours: { isOpen: () => true },
            geometry: { location: { lat: () => 6.21, lng: () => -75.57 } },
          },
        ],
        'OK',
      );
    }
    textSearch() {}
  }

  async function renderGymFinder() {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'clave-de-prueba');
    const { GymFinderPage } = await import('../../pages/GymFinderPage');
    return render(<GymFinderPage />);
  }

  beforeEach(() => {
    FakeInfoWindow.instances = [];
    FakeMarker.instances = [];
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('el nombre y la dirección de la lista se muestran como texto, sin crear elementos', async () => {
    const { container } = await renderGymFinder();

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it('el contenido del InfoWindow escapa el HTML del nombre y la dirección', async () => {
    await renderGymFinder();
    await screen.findByText(XSS_IMG);
    const marcadorDelGimnasio = FakeMarker.instances[FakeMarker.instances.length - 1];

    act(() => {
      marcadorDelGimnasio.listeners.click();
    });

    const html = FakeInfoWindow.instances[0].setContent.mock.calls[0][0] as string;
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('el escape conserva las comillas y los ampersands sin romper el atributo ni la etiqueta', async () => {
    const original = FakePlacesService.prototype.nearbySearch;
    FakePlacesService.prototype.nearbySearch = function (_request: unknown, callback: (...args: unknown[]) => void) {
      callback(
        [
          {
            place_id: 'place-quotes',
            name: `Gym "Los Pinos" & 'Co'`,
            vicinity: 'Cra 43A',
            geometry: { location: { lat: () => 6.21, lng: () => -75.57 } },
          },
        ],
        'OK',
      );
    };
    await renderGymFinder();
    await screen.findByText(`Gym "Los Pinos" & 'Co'`);

    act(() => {
      FakeMarker.instances[FakeMarker.instances.length - 1].listeners.click();
    });

    const html = FakeInfoWindow.instances[0].setContent.mock.calls[0][0] as string;
    expect(html).toContain('Gym &quot;Los Pinos&quot; &amp; &#39;Co&#39;');
    FakePlacesService.prototype.nearbySearch = original;
  });
});

describe('[Seguridad] RF-12/13/14/15/16/18 — sin sumideros de HTML peligrosos en el código fuente', () => {
  const fuentes = import.meta.glob(
    ['../../pages/InjuriesPage.tsx', '../../pages/SleepPage.tsx', '../../pages/GymFinderPage.tsx'],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  it.each(Object.entries(fuentes))('%s no usa dangerouslySetInnerHTML, innerHTML, eval ni document.write', (_ruta, codigo) => {
    expect(codigo).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\(|document\.write\(/);
  });
});
