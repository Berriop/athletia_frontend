import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GymFinderPage } from '../../pages/GymFinderPage';

// RF-17 (Buscar gimnasios cercanos, ya existente) y RF nuevo (Buscar
// gimnasios por texto). searchNearbyGyms (V(G)=3: OK/ZERO_RESULTS/error) y
// handleTextSearch (V(G)=3: query vacío/OK/sin resultados) son las dos
// funciones con decisiones reales de esta página.
//
// El SDK de Google Maps no existe en jsdom, así que se reemplaza por clases
// falsas mínimas (FakeMap/FakeMarker/FakeInfoWindow/FakePlacesService) que
// implementan solo lo que el componente realmente llama. Como
// loadGoogleMapsScript() resuelve de inmediato si `window.google` ya existe,
// definir `window.google` antes de renderizar evita que el componente
// intente insertar el <script> real (que jsdom no ejecuta).

function fakePlace(overrides: Record<string, unknown> = {}) {
  return {
    place_id: 'place-1',
    name: 'Smart Fit Poblado',
    vicinity: 'Cra 43A',
    formatted_address: 'Cra 43A, Medellín',
    rating: 4.5,
    user_ratings_total: 200,
    opening_hours: { isOpen: () => true },
    geometry: { location: { lat: () => 6.21, lng: () => -75.57 } },
    photos: [{ getUrl: () => 'http://photo.example/gym.jpg' }],
    ...overrides,
  };
}

class FakeMap {
  panTo = vi.fn();
  setCenter = vi.fn();
  el: unknown;
  opts: unknown;
  constructor(el: unknown, opts: unknown) {
    this.el = el;
    this.opts = opts;
  }
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
  listeners: Record<string, (...args: unknown[]) => void> = {};
  setMap = vi.fn();
  addListener = vi.fn((event: string, cb: (...args: unknown[]) => void) => {
    this.listeners[event] = cb;
  });
  opts: Record<string, unknown>;
  constructor(opts: Record<string, unknown>) {
    this.opts = opts;
    FakeMarker.instances.push(this);
  }
}

const nearbySearchMock = vi.fn();
const textSearchMock = vi.fn();
class FakePlacesService {
  map: unknown;
  constructor(map: unknown) {
    this.map = map;
  }
  nearbySearch(req: unknown, cb: (...args: unknown[]) => void) {
    nearbySearchMock(req, cb);
  }
  textSearch(req: unknown, cb: (...args: unknown[]) => void) {
    textSearchMock(req, cb);
  }
}

const getCurrentPositionMock = vi.fn();

beforeEach(() => {
  FakeMarker.instances = [];
  FakeInfoWindow.instances = [];
  nearbySearchMock.mockReset();
  textSearchMock.mockReset();
  getCurrentPositionMock.mockReset();

  vi.stubGlobal('google', {
    maps: {
      Map: FakeMap,
      Marker: FakeMarker,
      InfoWindow: FakeInfoWindow,
      Animation: { DROP: 'DROP' },
      places: {
        PlacesService: FakePlacesService,
        PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
      },
    },
  });

  Object.defineProperty(window.navigator, 'geolocation', {
    value: { getCurrentPosition: getCurrentPositionMock },
    configurable: true,
  });

  // Por defecto: geolocalización exitosa en Medellín y una búsqueda cercana
  // con un solo gimnasio — cada test ajusta lo que necesite.
  getCurrentPositionMock.mockImplementation((success: (pos: unknown) => void) => {
    success({ coords: { latitude: 6.21, longitude: -75.57 } });
  });
  nearbySearchMock.mockImplementation((_req, cb) => cb([fakePlace()], 'OK'));
});

function renderPage() {
  return render(<GymFinderPage />);
}

describe('GymFinderPage.searchNearbyGyms (RF-17)', () => {
  // Camino 1: INICIO,1,2,3,FIN — resultados OK
  it('Camino 1: geolocalización exitosa y resultados OK → renderiza la lista y agrega los marcadores', async () => {
    // Arrange & Act
    renderPage();

    // Assert
    expect(await screen.findByText('Smart Fit Poblado')).toBeInTheDocument();
    expect(nearbySearchMock).toHaveBeenCalledWith(
      expect.objectContaining({ location: { lat: 6.21, lng: -75.57 } }),
      expect.any(Function),
    );
    // marcador 0 = ubicación del usuario, marcador 1 = el gimnasio encontrado
    expect(FakeMarker.instances).toHaveLength(2);
  });

  it('la geolocalización falla o se rechaza → usa Bogotá como respaldo y busca ahí', async () => {
    // Arrange
    getCurrentPositionMock.mockImplementation((_success: unknown, error: () => void) => error());

    // Act
    renderPage();

    // Assert
    await waitFor(() =>
      expect(nearbySearchMock).toHaveBeenCalledWith(
        expect.objectContaining({ location: { lat: 4.711, lng: -74.0721 } }),
        expect.any(Function),
      ),
    );
  });

  // Camino 2: INICIO,1,2,4,FIN — sin resultados
  it('Camino 2: sin gimnasios cercanos (ZERO_RESULTS) → muestra el mensaje de "no se encontraron"', async () => {
    // Arrange
    nearbySearchMock.mockImplementation((_req, cb) => cb(null, 'ZERO_RESULTS'));

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('No se encontraron gimnasios en un radio de 3 km.')).toBeInTheDocument();
  });

  // Camino 3: INICIO,1,2,5,FIN — error de la API
  it('Camino 3: la API de Places falla → muestra el mensaje de error genérico', async () => {
    // Arrange
    nearbySearchMock.mockImplementation((_req, cb) => cb(null, 'REQUEST_DENIED'));

    // Act
    renderPage();

    // Assert
    expect(
      await screen.findByText('Error al buscar gimnasios. Verifica que las APIs de Maps y Places estén activas.'),
    ).toBeInTheDocument();
  });
});

describe('GymFinderPage.handleTextSearch (RF nuevo — Buscar gimnasios por texto)', () => {
  // Camino 1: INICIO,1,FIN — query vacío, no llama al servicio
  it('Camino 1: búsqueda vacía → no llama al servicio de texto', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Smart Fit Poblado'); // espera a que cargue la búsqueda inicial

    // Act
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    // Assert
    expect(textSearchMock).not.toHaveBeenCalled();
  });

  // Camino 2: INICIO,1,2,3,4,5,FIN — resultados OK
  it('Camino 2: texto válido con resultados → reemplaza la lista y centra el mapa en el primer resultado', async () => {
    // Arrange
    textSearchMock.mockImplementation((_req, cb) =>
      cb([fakePlace({ place_id: 'place-2', name: 'Bodytech Envigado' })], 'OK'),
    );
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Smart Fit Poblado');

    // Act
    await user.type(screen.getByPlaceholderText('Buscar ciudad o zona...'), 'envigado');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    // Assert
    expect(await screen.findByText('Bodytech Envigado')).toBeInTheDocument();
    expect(screen.queryByText('Smart Fit Poblado')).not.toBeInTheDocument();
    expect(textSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'gimnasio envigado', type: 'gym' }),
      expect.any(Function),
    );
  });

  // Camino 3: INICIO,1,2,3,6,7,FIN — sin resultados
  it('Camino 3: texto sin resultados → limpia la lista y muestra el mensaje correspondiente', async () => {
    // Arrange
    textSearchMock.mockImplementation((_req, cb) => cb(null, 'ZERO_RESULTS'));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Smart Fit Poblado');

    // Act
    await user.type(screen.getByPlaceholderText('Buscar ciudad o zona...'), 'xyz-inexistente');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    // Assert
    expect(await screen.findByText('No se encontraron resultados para esa búsqueda.')).toBeInTheDocument();
    expect(screen.queryByText('Smart Fit Poblado')).not.toBeInTheDocument();
  });

  it('el botón "X" limpia el campo de búsqueda', async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = renderPage();
    await screen.findByText('Smart Fit Poblado');
    const input = screen.getByPlaceholderText('Buscar ciudad o zona...') as HTMLInputElement;
    await user.type(input, 'medellín');
    expect(input.value).toBe('medellín');

    // Act
    await user.click(container.querySelector('.gym-search-clear') as HTMLElement);

    // Assert
    expect(input.value).toBe('');
  });
});

describe('GymFinderPage interacciones (marcador, tarjeta, mi ubicación)', () => {
  it('clic en el marcador de un gimnasio → lo selecciona y abre el InfoWindow con su información', async () => {
    // Arrange
    renderPage();
    await screen.findByText('Smart Fit Poblado');
    const gymMarker = FakeMarker.instances[FakeMarker.instances.length - 1];

    // Act — el listener del SDK de Maps corre fuera del ciclo de eventos de
    // React, así que hay que envolverlo en act() para que el re-render
    // (setSelectedGym) se refleje antes de las aserciones.
    act(() => {
      gymMarker.listeners.click();
    });

    // Assert
    const infoWindow = FakeInfoWindow.instances[0];
    expect(infoWindow.setContent).toHaveBeenCalledWith(expect.stringContaining('Smart Fit Poblado'));
    expect(infoWindow.open).toHaveBeenCalled();
    const card = screen.getByText('Smart Fit Poblado').closest('.gym-card');
    expect(card).toHaveClass('selected');
  });

  it('clic en una tarjeta de la lista (handleGymClick) → la selecciona y centra el mapa', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Smart Fit Poblado');
    const card = screen.getByText('Smart Fit Poblado').closest('.gym-card') as HTMLElement;

    // Act
    await user.click(card);

    // Assert
    expect(card).toHaveClass('selected');
  });

  it('tecla Enter sobre una tarjeta → la selecciona (accesibilidad de teclado)', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Smart Fit Poblado');
    const card = screen.getByText('Smart Fit Poblado').closest('.gym-card') as HTMLElement;
    card.focus();

    // Act
    await user.keyboard('{Enter}');

    // Assert
    expect(card).toHaveClass('selected');
  });

  it('clic en "Mi ubicación" → vuelve a buscar cerca del usuario y limpia la búsqueda de texto en curso', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Smart Fit Poblado');
    await user.type(screen.getByPlaceholderText('Buscar ciudad o zona...'), 'algo');
    nearbySearchMock.mockClear();

    // Act
    await user.click(screen.getByRole('button', { name: /Mi ubicación/i }));

    // Assert
    await waitFor(() => expect(nearbySearchMock).toHaveBeenCalledTimes(1));
    expect((screen.getByPlaceholderText('Buscar ciudad o zona...') as HTMLInputElement).value).toBe('');
  });
});

// Estos dos casos dependen de la carga real del script de Google Maps
// (loadGoogleMapsScript), así que a diferencia del resto del archivo NO se
// deja `window.google` pre-stubeado: se limpia justo antes de renderizar
// para que el componente sí intente insertar el <script> real.
describe('GymFinderPage.loadGoogleMapsScript', () => {
  afterEach(() => {
    document.getElementById('google-maps-script')?.remove();
    vi.unstubAllEnvs();
  });

  it('sin VITE_GOOGLE_MAPS_API_KEY configurada → muestra el error de configuración sin intentar cargar el script', async () => {
    // Arrange: MAPS_API_KEY se calcula a nivel de módulo, así que se necesita
    // un import fresco después de stubear la env para que tome el nuevo valor.
    vi.unstubAllGlobals();
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '');
    vi.resetModules();
    const { GymFinderPage: FreshGymFinderPage } = await import('../../pages/GymFinderPage');

    // Act
    render(<FreshGymFinderPage />);

    // Assert
    expect(
      await screen.findByText('⚠️ Falta configurar VITE_GOOGLE_MAPS_API_KEY en el archivo .env'),
    ).toBeInTheDocument();
    expect(document.getElementById('google-maps-script')).not.toBeInTheDocument();
  });

  it('el script de Google Maps falla al cargar → muestra el error de carga', async () => {
    // Arrange: sin window.google, el componente debe insertar el <script> real
    vi.unstubAllGlobals();

    // Act
    render(<GymFinderPage />);
    const script = await waitFor(() => {
      const el = document.getElementById('google-maps-script');
      expect(el).not.toBeNull();
      return el as HTMLScriptElement;
    });
    // Simula que la red/API Key falla al cargar el script
    script.onerror?.(new Event('error'));

    // Assert (el mensaje se muestra tanto en el panel de error como en el overlay del mapa)
    await waitFor(() =>
      expect(screen.getAllByText('No se pudo cargar Google Maps. Verifica tu API Key.').length).toBeGreaterThan(0),
    );
  });
});
