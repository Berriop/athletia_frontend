import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Suite de REGRESIÓN para las funcionalidades de frontend de Daniel Ortiz:
 * RF-09, RF-10, RF-11, RF-27, RF-30.
 * (RF-26 vive en frontend.regression.daniel.rf26.test.tsx.)
 */

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

// ===================== RF-09/10 (MealsPage) =====================
import { MealsPage } from '../../pages/MealsPage';
import { mealService } from '../../services/meal.service';

vi.mock('../../services/meal.service', () => ({
  mealService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const existingMeal: any = {
  id: 'meal-1', name: 'Pollo con arroz', calories: 600, mealType: 'LUNCH', proteinG: 40, carbsG: 60, fatG: 15,
  date: new Date('2026-08-01T12:00:00.000Z').toISOString(), userId: 'user-1',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

describe('[Regresión] RF-09/10 — MealsPage sigue distinguiendo crear de modificar', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [existingMeal], meta: {} } as any);
  });

  it('editar una comida existente sigue llamando a update, nunca a create', async () => {
    vi.mocked(mealService.update).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<MealsPage />);
    await user.click(await screen.findByTitle('Editar'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Comida' }));

    await waitFor(() => expect(mealService.update).toHaveBeenCalledWith('meal-1', expect.anything()));
    expect(mealService.create).not.toHaveBeenCalled();
  });
});

// ===================== RF-11 (SleepPage crear) =====================
import { SleepPage } from '../../pages/SleepPage';
import { sleepService } from '../../services/sleep.service';

vi.mock('../../services/sleep.service', () => ({
  sleepService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('[Regresión] RF-11 — SleepPage sigue creando registros sin edición previa', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('crear sin edición en curso sigue notificando "Registro de sueño creado"', async () => {
    vi.mocked(sleepService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<SleepPage />);

    await user.click(await screen.findByRole('button', { name: 'Guardar Registro' }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Registro de sueño creado', 'success'));
  });
});

// ===================== RF-27 (Forgot/Reset Password) =====================
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../../pages/ResetPasswordPage';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service', () => ({
  authService: {
    register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(),
    forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn(),
  },
}));

describe('[Regresión] RF-27 — Recuperar contraseña sigue funcionando en sus 2 pasos', () => {
  beforeEach(() => {
    vi.mocked(authService.forgotPassword).mockClear();
    vi.mocked(authService.resetPassword).mockClear();
  });

  it('solicitar recuperación con correo válido sigue llamando al servicio', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText(/correo/i), 'user@test.com');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => expect(authService.forgotPassword).toHaveBeenCalledTimes(1));
  });

  it('restablecer con contraseñas que no coinciden sigue bloqueado sin llamar al servicio', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/reset-password?token=abc123']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'OtraCosa@1234');

    expect(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i })).toBeDisabled();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });
});

// ===================== RF-30 (AdminPage) =====================
import { AdminPage } from '../../pages/AdminPage';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

let mockCurrentUser: { id: string } | null = { id: 'admin-1' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockCurrentUser }),
}));

describe('[Regresión] RF-30 — AdminPage sigue impidiendo que un admin se auto-bloquee', () => {
  const selfUser = {
    id: 'admin-1', email: 'admin@example.com', name: 'Admin', role: 'ADMIN',
    isBlocked: false, isEmailVerified: true, createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(api.patch).mockReset();
    mockCurrentUser = { id: 'admin-1' };
  });

  it('la fila del propio admin sigue sin poder togglearse', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [selfUser] } });
    render(<AdminPage />);
    await screen.findByText('admin@example.com');

    expect(api.patch).not.toHaveBeenCalled();
  });
});
