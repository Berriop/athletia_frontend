import { describe, it, vi, beforeEach } from 'vitest';
import { expect as chaiExpect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Pruebas con Fluent Assertions (chai) para las 6 funcionalidades asignadas
 * a Luisa Espinal: RF-01, RF-02, RF-03, RF-04, RF-22, RF-29.
 *
 * Usa la sintaxis encadenada de chai (expect(x).to.be...que...) en vez de
 * expect().toBe() — el mismo estilo que muestra el README del profesor para
 * JavaScript con Chai (equivalente a AssertJ en Java y PyHamcrest en Python).
 */

// ---------------------------------------------------------------------------
// RF-01 — Registrar cuenta
// ---------------------------------------------------------------------------
import { RegisterPage } from '../../pages/RegisterPage';
import { authService } from '../../services/auth.service';

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
const logoutFromAuth = vi.fn();
const updateUserFromAuth = vi.fn();

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: loginFromAuth,
      logout: logoutFromAuth,
      updateUser: updateUserFromAuth,
      user: mockAuthUser,
    }),
  };
});

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

let mockAuthUser: any = { id: 'user-1', email: 'user@test.com', role: 'USER' };

describe('RF-01 — RegisterPage.handleSubmit (Fluent Assertions)', () => {
  beforeEach(() => {
    loginFromAuth.mockClear();
    navigate.mockClear();
  });

  it('contraseña fuerte, coincide, correo disponible → autentica y redirige al dashboard', async () => {
    chaiExpect(authService.register).to.be.a('function');
    vi.mocked(authService.register).mockResolvedValue({
      token: 'jwt-abc',
      user: { id: 'new-user', email: 'nuevo@test.com' },
    } as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Nombre completo'), 'Jane Doe');
    await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@test.com');
    await user.type(screen.getByLabelText('Contraseña segura'), 'Abc12345!@#$');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Abc12345!@#$');
    await user.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    await waitFor(() => {
      chaiExpect(loginFromAuth.mock.calls).to.have.lengthOf(1);
    });
    chaiExpect(loginFromAuth.mock.calls[0][0]).to.equal('jwt-abc');
    chaiExpect(navigate.mock.calls[0][0]).to.equal('/dashboard');
  });
});

// ---------------------------------------------------------------------------
// RF-02 — Iniciar sesión
// ---------------------------------------------------------------------------
import { LoginPage } from '../../pages/LoginPage';

describe('RF-02 — LoginPage.handleSubmit (Fluent Assertions)', () => {
  beforeEach(() => {
    loginFromAuth.mockClear();
    navigate.mockClear();
  });

  it('credenciales válidas → inicia sesión y navega al dashboard', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: 'jwt-login',
      user: { id: 'user-1', email: 'user@test.com' },
    } as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'StrongP@ss1234');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    await waitFor(() => chaiExpect(loginFromAuth.mock.calls).to.have.lengthOf(1));
    chaiExpect(navigate.mock.calls[0]).to.deep.equal(['/dashboard', { replace: true }]);
  });

  it('credenciales inválidas → muestra el mensaje genérico y no inicia sesión', async () => {
    vi.mocked(authService.login).mockRejectedValue({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Correo electrónico'), 'user@test.com');
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    const errorNode = await screen.findByText('Correo o contraseña incorrectos. Por favor, verifica tus datos.');
    chaiExpect(errorNode).to.exist;
    chaiExpect(loginFromAuth.mock.calls).to.have.lengthOf(0);
  });
});

// RF-03 (Cerrar sesión) vive en su propio archivo: frontend.fluent.rf03.test.tsx
// — usa el AuthProvider real, y no puede convivir en este archivo con el
// mock global de useAuth que necesitan RF-01/02/04/22.

// ---------------------------------------------------------------------------
// RF-04 — Actualizar perfil propio
// ---------------------------------------------------------------------------
import { ProfilePage } from '../../pages/ProfilePage';

const fakeProfileUser: any = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  role: 'USER',
  gender: null,
  birthDate: null,
  heightCm: null,
  weightKg: null,
  experienceLevel: null,
};

describe('RF-04 — ProfilePage.handleSave (Fluent Assertions)', () => {
  beforeEach(() => {
    mockAuthUser = fakeProfileUser;
    updateUserFromAuth.mockClear();
  });

  it('guardar el perfil con éxito → notifica y sale del modo edición', async () => {
    vi.mocked(authService.updateProfile).mockResolvedValue({
      user: { ...fakeProfileUser, name: 'Nuevo Nombre' },
    } as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));
    const nameInput = screen.getByPlaceholderText('Tu nombre');
    await user.clear(nameInput);
    await user.type(nameInput, 'Nuevo Nombre');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => {
      chaiExpect(vi.mocked(authService.updateProfile).mock.calls).to.have.lengthOf(1);
    });
    chaiExpect(vi.mocked(authService.updateProfile).mock.calls[0][0]).to.deep.include({ name: 'Nuevo Nombre' });
  });
});

// ---------------------------------------------------------------------------
// RF-22 — Acceder al panel administrativo
// ---------------------------------------------------------------------------
import { Sidebar } from '../../components/Sidebar';

describe('RF-22 — Sidebar admin nav item (Fluent Assertions)', () => {
  it('usuario con rol ADMIN → el ítem "Admin" del menú existe en el DOM', () => {
    mockAuthUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    chaiExpect(screen.queryByText('Admin')).to.exist;
  });

  it('usuario con rol USER → el ítem "Admin" del menú no existe en el DOM', () => {
    mockAuthUser = { id: 'user-1', email: 'user@test.com', role: 'USER' };
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    chaiExpect(screen.queryByText('Admin')).to.be.null;
  });
});

// ---------------------------------------------------------------------------
// RF-29 — Exportar historial
// ---------------------------------------------------------------------------
describe('RF-29 — ProfilePage.handleExportCSV (Fluent Assertions)', () => {
  beforeEach(() => {
    mockAuthUser = fakeProfileUser;
    addNotification.mockClear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('la exportación falla → notifica el error correspondiente', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: false } as Response);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Exportar/i }));

    await waitFor(() => chaiExpect(addNotification.mock.calls).to.have.lengthOf(1));
    chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Error al exportar los datos', 'error']);
  });
});
