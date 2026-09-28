import { describe, it, vi, beforeEach } from 'vitest';
import { expect as chaiExpect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Pruebas con Fluent Assertions (chai) para las funcionalidades de frontend
 * asignadas a Daniel Ortiz: RF-09, RF-10, RF-11, RF-27, RF-30.
 * (RF-26 vive en frontend.fluent.daniel.rf26.test.tsx — ver ese archivo.)
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

describe('RF-09 — MealsPage.handleUpdate (modificar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [existingMeal], meta: {} } as any);
  });

  it('editando una comida existente → notifica éxito', async () => {
    vi.mocked(mealService.update).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<MealsPage />);
    await user.click(await screen.findByTitle('Editar'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Comida' }));

    await waitFor(() => chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Comida actualizada correctamente', 'success']));
  });
});

describe('RF-10 — MealsPage.confirmDelete (eliminar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [existingMeal], meta: {} } as any);
  });

  it('la eliminación falla → notifica el error correspondiente', async () => {
    vi.mocked(mealService.delete).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    render(<MealsPage />);
    await user.click(await screen.findByTitle('Eliminar'));

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Error al eliminar la comida', 'error']));
  });
});

// ===================== RF-11 (SleepPage crear) =====================
import { SleepPage } from '../../pages/SleepPage';
import { sleepService } from '../../services/sleep.service';

vi.mock('../../services/sleep.service', () => ({
  sleepService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('RF-11 — SleepPage.handleCreate (crear) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('sin edición en curso → crea el registro y notifica éxito', async () => {
    vi.mocked(sleepService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<SleepPage />);

    await user.click(await screen.findByRole('button', { name: 'Guardar Registro' }));

    await waitFor(() => chaiExpect(vi.mocked(sleepService.create).mock.calls).to.have.lengthOf(1));
    chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Registro de sueño creado', 'success']);
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

describe('RF-27 (parte 1) — ForgotPasswordPage.handleSubmit (Fluent Assertions)', () => {
  beforeEach(() => vi.mocked(authService.forgotPassword).mockClear());

  it('correo válido → llama al servicio y muestra confirmación', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/correo/i), 'user@test.com');
    await user.click(screen.getByRole('button', { name: /enviar/i }));

    await waitFor(() => chaiExpect(vi.mocked(authService.forgotPassword).mock.calls).to.have.lengthOf(1));
  });
});

describe('RF-27 (parte 2) — ResetPasswordPage.handleSubmit (Fluent Assertions)', () => {
  beforeEach(() => vi.mocked(authService.resetPassword).mockClear());

  it('contraseña fuerte y coincidente con token válido → llama al servicio', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/reset-password?token=abc123']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Nueva Contraseña'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'StrongP@ss1234');
    await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));

    await waitFor(() => chaiExpect(vi.mocked(authService.resetPassword).mock.calls).to.have.lengthOf(1));
    chaiExpect(vi.mocked(authService.resetPassword).mock.calls[0][0]).to.equal('abc123');
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

const otherUser = {
  id: 'user-2', email: 'user2@example.com', name: 'User Two', role: 'USER',
  isBlocked: false, isEmailVerified: true, createdAt: new Date().toISOString(),
};

describe('RF-30 (parte 1) — AdminPage.fetchUsers (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    mockCurrentUser = { id: 'admin-1' };
  });

  it('carga exitosa → renderiza la tabla con los usuarios obtenidos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [otherUser] } });
    render(<AdminPage />);

    const cell = await screen.findByText('user2@example.com');
    chaiExpect(cell).to.exist;
    chaiExpect(vi.mocked(api.get).mock.calls[0][0]).to.equal('/admin/users');
  });
});

describe('RF-30 (parte 2) — AdminPage.handleToggleBlock (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(api.patch).mockReset();
    mockCurrentUser = { id: 'admin-1' };
  });

  it('bloquea a un usuario activo → llama al backend con la ruta correcta', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [otherUser] } });
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { ...otherUser, isBlocked: true } } });
    const user = userEvent.setup();
    render(<AdminPage />);
    await screen.findByText('user2@example.com');

    await user.click(screen.getByTitle('Bloquear'));

    await waitFor(() => chaiExpect(vi.mocked(api.patch).mock.calls).to.have.lengthOf(1));
    chaiExpect(vi.mocked(api.patch).mock.calls[0]).to.deep.equal(['/admin/users/user-2/toggle-block', {}]);
  });
});
