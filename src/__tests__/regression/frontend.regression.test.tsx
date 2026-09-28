import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Suite de REGRESIÓN para las 6 funcionalidades asignadas a Luisa Espinal
 * (RF-01, RF-02, RF-03, RF-04, RF-22, RF-29).
 *
 * Fija el comportamiento correcto y ya validado como línea base. Ver
 * src/__tests__/regression/backend.regression.test.ts para la explicación
 * completa de cómo demostrar en vivo que esta suite detecta una regresión
 * (introducir un defecto controlado, ver fallar, revertir).
 *
 * Ejemplo de demo en frontend: en Sidebar.tsx, cambiar
 * `user?.role === 'ADMIN'` por `user?.role !== 'ADMIN'` invierte a quién se
 * le muestra el ítem "Admin" — la prueba de RF-22 de esta suite lo detecta.
 */

import { LoginPage } from '../../pages/LoginPage';
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
let mockAuthUser: any = { id: 'user-1', email: 'user@test.com', role: 'USER' };

vi.mock('../../contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../../contexts/AuthContext')>('../../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({ login: loginFromAuth, logout: vi.fn(), updateUser: vi.fn(), user: mockAuthUser }),
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

describe('[Regresión] RF-01 — RegisterPage sigue exigiendo contraseña fuerte y coincidente', () => {
  it('el botón de crear cuenta sigue deshabilitado con contraseña débil', async () => {
    const { RegisterPage } = await import('../../pages/RegisterPage');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@test.com');
    await user.type(screen.getByLabelText('Contraseña segura'), 'debil');

    expect(screen.getByRole('button', { name: /Crear Cuenta/i })).toBeDisabled();
  });
});

describe('[Regresión] RF-02 — LoginPage sigue navegando al dashboard tras un login válido', () => {
  beforeEach(() => {
    loginFromAuth.mockClear();
    navigate.mockClear();
  });

  it('credenciales válidas siguen redirigiendo a /dashboard', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: 'jwt-token',
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

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true }));
  });
});

describe('[Regresión] RF-04 — ProfilePage sigue permitiendo editar y guardar el nombre', () => {
  it('el botón "Guardar cambios" sigue apareciendo al entrar en modo edición', async () => {
    mockAuthUser = {
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
    const { ProfilePage } = await import('../../pages/ProfilePage');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));

    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument();
  });
});

describe('[Regresión] RF-22 — el ítem "Admin" del menú sigue apareciendo solo para ADMIN', () => {
  it('un usuario con rol USER sigue sin ver el ítem "Admin"', async () => {
    mockAuthUser = { id: 'user-1', email: 'user@test.com', role: 'USER' };
    const { Sidebar } = await import('../../components/Sidebar');
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('un usuario con rol ADMIN sigue viendo el ítem "Admin"', async () => {
    mockAuthUser = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' };
    const { Sidebar } = await import('../../components/Sidebar');
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});

describe('[Regresión] RF-29 — la exportación sigue notificando error cuando el backend falla', () => {
  beforeEach(() => {
    mockAuthUser = {
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
    addNotification.mockClear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('respuesta no-ok del backend sigue disparando la notificación de error', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: false } as Response);
    const { ProfilePage } = await import('../../pages/ProfilePage');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Exportar/i }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al exportar los datos', 'error'));
  });
});
