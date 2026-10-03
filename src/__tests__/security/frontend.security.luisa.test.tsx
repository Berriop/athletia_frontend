import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { ProfilePage } from '../../pages/ProfilePage';
import { Sidebar } from '../../components/Sidebar';
import { ProtectedRoute } from '../../routes/ProtectedRoute';
import { checkPasswordStrength } from '../../components/PasswordStrengthMeter';
import { authService } from '../../services/auth.service';
import { fakeUser } from '../helpers/fixtures';

/**
 * Pruebas de seguridad para las funcionalidades de frontend de Luisa Espinal:
 * RF-01 (registro), RF-02 (login), RF-04 (perfil), RF-22 (acceso de
 * administrador) y RF-29 (exportar historial).
 *
 * Reglas de seguridad convertidas en pruebas de regresión: campos de
 * contraseña enmascarados, política de contraseñas, mensajes de error que no se
 * interpretan como HTML, rutas protegidas sin sesión, token enviado por
 * cabecera (nunca en la URL) y ausencia de sumideros de HTML peligrosos.
 */

vi.mock('../../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    updateProfile: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    verifyEmail: vi.fn(),
  },
}));

const loginFromAuth = vi.fn();
let mockAuth: { user: unknown; isAuthenticated: boolean; isLoading: boolean } = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ login: loginFromAuth, logout: vi.fn(), updateUser: vi.fn(), ...mockAuth }),
  };
});

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

const STRONG_PASSWORD = 'StrongP@ss1234';
const XSS_PAYLOAD = '<img src=x onerror=alert(1)>';

beforeEach(() => {
  loginFromAuth.mockClear();
  addNotification.mockClear();
  vi.mocked(authService.login).mockReset();
  vi.mocked(authService.register).mockReset();
  mockAuth = { user: null, isAuthenticated: false, isLoading: false };
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('[Seguridad] RF-01 / RF-02 — los campos de contraseña están enmascarados', () => {
  it('LoginPage oculta la contraseña mientras se escribe', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
  });

  it('RegisterPage oculta la contraseña y su confirmación', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);

    expect(screen.getByLabelText('Contraseña segura')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirmar contraseña')).toHaveAttribute('type', 'password');
  });
});

describe('[Seguridad] RF-01 — política de contraseñas del formulario de registro', () => {
  it('acepta una contraseña que cumple todas las reglas', () => {
    expect(checkPasswordStrength(STRONG_PASSWORD).isStrong).toBe(true);
  });

  it.each([
    ['corta (11 caracteres)', 'Ab1!abcdefg'],
    ['sin mayúscula', 'segura123456!'],
    ['sin minúscula', 'SEGURA123456!'],
    ['sin dígito', 'SeguraSegura!!'],
    ['sin carácter especial', 'Segura1234567'],
    ['vacía', ''],
  ])('rechaza una contraseña %s', (_motivo, password) => {
    expect(checkPasswordStrength(password).isStrong).toBe(false);
  });

  it('con contraseñas distintas el botón queda deshabilitado y no se llama al servicio', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);

    await user.type(screen.getByLabelText('Nombre completo'), 'Luisa');
    await user.type(screen.getByLabelText('Correo electrónico'), 'nueva@test.com');
    await user.type(screen.getByLabelText('Contraseña segura'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'OtraClave@1234');

    expect(screen.getByRole('button', { name: /Crear Cuenta/i })).toBeDisabled();
    expect(screen.getByText('✗ Las contraseñas no coinciden')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });
});

describe('[Seguridad] RF-02 — el login falla sin dejar rastros de sesión', () => {
  async function intentarLogin() {
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com');
    await user.type(screen.getByLabelText('Contraseña'), STRONG_PASSWORD);
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
  }

  it('credenciales incorrectas no guardan token ni inician sesión', async () => {
    vi.mocked(authService.login).mockRejectedValue({ response: { data: { error: { message: 'Invalid credentials' } } } });

    await intentarLogin();

    expect(await screen.findByText(/Correo o contraseña incorrectos/)).toBeInTheDocument();
    expect(loginFromAuth).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('un mensaje del servidor con HTML se muestra como texto y no crea elementos', async () => {
    vi.mocked(authService.login).mockRejectedValue({ response: { data: { error: { message: XSS_PAYLOAD } } } });

    await intentarLogin();

    expect(await screen.findByText(XSS_PAYLOAD)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });
});

describe('[Seguridad] RF-22 — rutas y menú protegidos', () => {
  function renderRutaProtegida() {
    return render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Pantalla de login</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Contenido privado</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
  }

  it('sin sesión redirige a /login y no muestra el contenido privado', () => {
    mockAuth = { user: null, isAuthenticated: false, isLoading: false };

    renderRutaProtegida();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
  });

  it('mientras se valida la sesión no se muestra el contenido privado (sin parpadeo)', () => {
    mockAuth = { user: null, isAuthenticated: false, isLoading: true };

    renderRutaProtegida();

    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument();
    expect(screen.queryByText('Pantalla de login')).not.toBeInTheDocument();
  });

  it('con sesión válida sí muestra el contenido privado', () => {
    mockAuth = { user: fakeUser(), isAuthenticated: true, isLoading: false };

    renderRutaProtegida();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });

  it('el menú no ofrece el acceso de administración a un usuario con rol USER', () => {
    mockAuth = { user: fakeUser({ role: 'USER' }), isAuthenticated: true, isLoading: false };

    render(<MemoryRouter><Sidebar /></MemoryRouter>);

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});

describe('[Seguridad] RF-29 — la exportación protege el token', () => {
  beforeEach(() => {
    mockAuth = { user: fakeUser(), isAuthenticated: true, isLoading: false };
    localStorage.setItem('token', 'jwt-secreto');
    window.URL.createObjectURL = vi.fn(() => 'blob:fake');
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  it('envía el token en la cabecera Authorization y nunca en la URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['TYPE,DATE']) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: /Exportar/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).not.toContain('jwt-secreto');
    expect(options.headers.Authorization).toBe('Bearer jwt-secreto');
  });

  it('si el servidor rechaza la exportación no se genera ninguna descarga', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const user = userEvent.setup();
    render(<MemoryRouter><ProfilePage /></MemoryRouter>);

    await user.click(screen.getByRole('button', { name: /Exportar/i }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al exportar los datos', 'error'));
    expect(window.URL.createObjectURL).not.toHaveBeenCalled();
  });
});

describe('[Seguridad] RF-01/02/04/22 — sin sumideros de HTML peligrosos en el código fuente', () => {
  const fuentes = import.meta.glob(
    [
      '../../pages/LoginPage.tsx',
      '../../pages/RegisterPage.tsx',
      '../../pages/ProfilePage.tsx',
      '../../components/Sidebar.tsx',
      '../../components/PasswordStrengthMeter.tsx',
      '../../routes/ProtectedRoute.tsx',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  it.each(Object.entries(fuentes))('%s no usa dangerouslySetInnerHTML, innerHTML, eval ni document.write', (_ruta, codigo) => {
    expect(codigo).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\(|document\.write\(/);
  });
});
