import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MealsPage } from '../../pages/MealsPage';
import { AdminPage } from '../../pages/AdminPage';
import { ResetPasswordPage } from '../../pages/ResetPasswordPage';
import { Header } from '../../components/Header';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';
import { mealService } from '../../services/meal.service';
import { authService } from '../../services/auth.service';
import { api } from '../../services/api';
import { fakeMeal, fakeUser } from '../helpers/fixtures';

/**
 * Pruebas de seguridad para las funcionalidades de frontend de Daniel Ortiz:
 * RF-09/10 (comidas), RF-11 (sueño), RF-26 (notificaciones), RF-27 (recuperar
 * contraseña) y RF-30 (administración de usuarios).
 *
 * Reglas de seguridad convertidas en pruebas de regresión: datos mostrados como
 * texto (nunca como HTML), campos de contraseña enmascarados, restablecer sin
 * token imposible, el administrador no puede bloquearse a sí mismo y el
 * código fuente no usa sumideros de HTML peligrosos.
 */

vi.mock('../../services/meal.service', () => ({
  mealService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

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

vi.mock('../../services/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' }, logout: vi.fn() }),
}));

const XSS_IMG = '<img src=x onerror=alert(1)>';
const STRONG_PASSWORD = 'NuevaClave@2026';

function renderConNotificaciones(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <NotificationProvider>{ui}</NotificationProvider>
    </MemoryRouter>,
  );
}

describe('[Seguridad] RF-09/10 — MealsPage muestra los datos como texto', () => {
  it('un nombre de comida con HTML malicioso se renderiza como texto, sin crear elementos', async () => {
    vi.mocked(mealService.getAll).mockResolvedValue({ success: true, data: [fakeMeal({ name: XSS_IMG })] });

    const { container } = renderConNotificaciones(<MealsPage />);

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });
});

describe('[Seguridad] RF-26 — las notificaciones se muestran como texto', () => {
  function DisparaNotificacion() {
    const { addNotification } = useNotification();
    return <button onClick={() => addNotification(XSS_IMG, 'error')}>disparar</button>;
  }

  it('un mensaje con HTML malicioso aparece como texto en la campana del encabezado', async () => {
    const user = userEvent.setup();
    const { container } = renderConNotificaciones(
      <>
        <Header />
        <DisparaNotificacion />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'disparar' }));
    await user.click(screen.getByTitle('Notificaciones'));

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });
});

describe('[Seguridad] RF-27 — restablecer contraseña', () => {
  beforeEach(() => {
    vi.mocked(authService.resetPassword).mockReset();
  });

  function renderReset(url: string) {
    return render(
      <MemoryRouter initialEntries={[url]}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
  }

  it('sin token en el enlace no se muestra el formulario ni se puede llamar al servicio', () => {
    renderReset('/reset-password');

    expect(screen.getByText('Enlace Inválido')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nueva Contraseña')).not.toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('con token, los dos campos de contraseña están enmascarados', () => {
    renderReset('/reset-password?token=abc123');

    expect(screen.getByLabelText('Nueva Contraseña')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Confirmar Nueva Contraseña')).toHaveAttribute('type', 'password');
  });

  it('una contraseña débil deja el envío bloqueado y no se llama al servicio', async () => {
    const user = userEvent.setup();
    renderReset('/reset-password?token=abc123');

    await user.type(screen.getByLabelText('Nueva Contraseña'), 'debil');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'debil');
    await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('un mensaje de error del servidor con HTML se muestra como texto', async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue({ response: { data: { error: { message: XSS_IMG } } } });
    const user = userEvent.setup();
    const { container } = renderReset('/reset-password?token=abc123');
    await user.type(screen.getByLabelText('Nueva Contraseña'), STRONG_PASSWORD);
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), STRONG_PASSWORD);

    await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });
});

describe('[Seguridad] RF-30 — AdminPage', () => {
  const adminYOtro = [
    fakeUser({ id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'ADMIN' }),
    fakeUser({ id: 'u2', email: 'otro@example.com', name: XSS_IMG }),
  ];

  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it('los nombres de usuario con HTML malicioso se muestran como texto', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: adminYOtro } });

    const { container } = renderConNotificaciones(<AdminPage />);

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });

  it('el botón de la fila del propio administrador está deshabilitado y no llama al backend', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: adminYOtro } });
    const user = userEvent.setup();
    renderConNotificaciones(<AdminPage />);
    await screen.findByText('admin@example.com');

    const botonPropio = screen.getByTitle('No puedes bloquearte a ti mismo');
    await user.click(botonPropio);

    expect(botonPropio).toBeDisabled();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('si el backend rechaza con 403 (usuario sin rol ADMIN) no se muestra ningún dato de usuarios', async () => {
    vi.mocked(api.get).mockRejectedValue({ response: { status: 403 } });
    const user = userEvent.setup();
    renderConNotificaciones(
      <>
        <Header />
        <AdminPage />
      </>,
    );

    expect(await screen.findByText('No hay usuarios registrados.')).toBeInTheDocument();
    await user.click(screen.getByTitle('Notificaciones'));

    expect(await screen.findByText('Error al cargar usuarios')).toBeInTheDocument();
    expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
  });

  it('un bloqueo exitoso actualiza solo la fila afectada con el estado que devuelve el backend', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: adminYOtro } });
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { ...adminYOtro[1], isBlocked: true } } });
    const user = userEvent.setup();
    renderConNotificaciones(<AdminPage />);
    await screen.findByText('otro@example.com');

    await act(async () => {
      await user.click(screen.getByTitle('Bloquear'));
    });

    expect(api.patch).toHaveBeenCalledWith('/admin/users/u2/toggle-block', {});
    expect(await screen.findByText('Bloqueado')).toBeInTheDocument();
  });
});

describe('[Seguridad] RF-09/10/26/27/30 — sin sumideros de HTML peligrosos en el código fuente', () => {
  const fuentes = import.meta.glob(
    [
      '../../pages/MealsPage.tsx',
      '../../pages/SleepPage.tsx',
      '../../pages/AdminPage.tsx',
      '../../pages/ResetPasswordPage.tsx',
      '../../pages/ForgotPasswordPage.tsx',
      '../../contexts/NotificationContext.tsx',
      '../../components/Header.tsx',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  it.each(Object.entries(fuentes))('%s no usa dangerouslySetInnerHTML, innerHTML, eval ni document.write', (_ruta, codigo) => {
    expect(codigo).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\(|document\.write\(/);
  });
});
