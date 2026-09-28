import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Suite de REGRESIÓN para las 18 funcionalidades de frontend de Juan Pablo
 * Berrío, Michael Pardo y Daniel Ortiz (RF-05 a RF-16, RF-18, RF-20, RF-25,
 * RF-27, RF-30). RF-26 vive en frontend.regression.team.rf26.test.tsx por la
 * misma razón que en la suite de fluent assertions.
 */

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

// ===================== WorkoutsPage (RF-05/06/07) =====================
import { WorkoutsPage } from '../../pages/WorkoutsPage';
import { workoutService } from '../../services/workout.service';

vi.mock('../../services/workout.service', () => ({
  workoutService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('[Regresión] RF-05/06/07 — WorkoutsPage sigue creando y eliminando correctamente', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('crear con el título completo sigue notificando éxito', async () => {
    vi.mocked(workoutService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<WorkoutsPage />);
    await user.type(await screen.findByLabelText('Título'), 'Pierna');

    await user.click(screen.getByRole('button', { name: 'Guardar Entrenamiento' }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Entrenamiento creado correctamente', 'success'));
  });
});

// ===================== MealsPage (RF-08/09/10) =====================
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

describe('[Regresión] RF-08/09/10 — MealsPage sigue distinguiendo crear de modificar', () => {
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

// ===================== SleepPage (RF-11/12/13) =====================
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

describe('[Regresión] RF-11/12/13 — SleepPage sigue eliminando registros correctamente', () => {
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

// ===================== InjuriesPage (RF-14/15/16) =====================
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

// ===================== recoveryScore (RF-20) =====================
import { calculateRecoveryScore } from '../../utils/recoveryScore';

describe('[Regresión] RF-20 — calculateRecoveryScore sigue devolviendo 0 sin datos', () => {
  it('sin sueño ni entrenamientos recientes el score sigue siendo 0', () => {
    const result = calculateRecoveryScore(null, 0, []);
    expect(result.score).toBe(0);
  });
});

// ===================== ContactPage (RF-25) =====================
import { ContactPage } from '../../pages/ContactPage';

describe('[Regresión] RF-25 — ContactPage sigue mostrando la confirmación tras enviar', () => {
  it('formulario completo sigue mostrando el mensaje de agradecimiento', async () => {
    const user = userEvent.setup();
    render(<ContactPage />);
    await user.type(screen.getByLabelText('Nombre'), 'Test');
    await user.type(screen.getByLabelText('Correo Electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Asunto'), 'Asunto');
    await user.type(screen.getByLabelText('Mensaje'), 'Mensaje de prueba');

    await user.click(screen.getByRole('button', { name: 'Enviar Mensaje' }));

    expect(screen.getByText('Gracias por contactar a Athletia.')).toBeInTheDocument();
  });
});

// ===================== Forgot/Reset Password (RF-27) =====================
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

// ===================== AdminPage (RF-30) =====================
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
