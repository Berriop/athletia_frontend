import { describe, it, vi, beforeEach } from 'vitest';
import { expect as chaiExpect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Pruebas con Fluent Assertions (chai) para las funcionalidades de frontend
 * asignadas a Michael Pardo: RF-05, RF-07, RF-08, RF-20, RF-25.
 */

// ===================== RF-05/07 (WorkoutsPage) =====================
import { WorkoutsPage } from '../../pages/WorkoutsPage';
import { workoutService } from '../../services/workout.service';

vi.mock('../../services/workout.service', () => ({
  workoutService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

const existingWorkout: any = {
  id: 'workout-1', title: 'Pierna', bodyPart: 'LEGS', durationMinutes: 45,
  date: new Date('2026-08-01').toISOString(), userId: 'user-1',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

describe('RF-05 — WorkoutsPage.handleSubmit (crear) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('sin edición en curso → crea el entrenamiento y notifica éxito', async () => {
    const user = userEvent.setup();
    vi.mocked(workoutService.create).mockResolvedValue({} as any);
    render(<WorkoutsPage />);
    await user.type(await screen.findByLabelText('Título'), 'Pierna');

    await user.click(screen.getByRole('button', { name: 'Guardar Entrenamiento' }));

    await waitFor(() => chaiExpect(vi.mocked(workoutService.create).mock.calls).to.have.lengthOf(1));
    chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Entrenamiento creado correctamente', 'success']);
  });
});

describe('RF-07 — WorkoutsPage.confirmDelete (eliminar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [existingWorkout], meta: {} } as any);
  });

  it('eliminación exitosa → notifica éxito', async () => {
    vi.mocked(workoutService.delete).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    render(<WorkoutsPage />);
    await user.click(await screen.findByTitle('Eliminar'));

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => chaiExpect(addNotification.mock.calls).to.have.lengthOf(1));
    chaiExpect(addNotification.mock.calls[0][1]).to.equal('success');
  });
});

// ===================== RF-08 (MealsPage) =====================
import { MealsPage } from '../../pages/MealsPage';
import { mealService } from '../../services/meal.service';

vi.mock('../../services/meal.service', () => ({
  mealService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('RF-08 — MealsPage.handleCreate (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('crea la comida y notifica éxito', async () => {
    vi.mocked(mealService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<MealsPage />);
    await user.type(await screen.findByLabelText('Nombre de la comida'), 'Ensalada');

    await user.click(screen.getByRole('button', { name: 'Guardar Comida' }));

    await waitFor(() => chaiExpect(vi.mocked(mealService.create).mock.calls).to.have.lengthOf(1));
    chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Comida registrada correctamente', 'success']);
  });
});

// ===================== RF-20 (recoveryScore) =====================
import { calculateRecoveryScore } from '../../utils/recoveryScore';

describe('RF-20 — calculateRecoveryScore (Fluent Assertions)', () => {
  it('sin sueño ni entrenamientos recientes → score 0 y estado "Sin registros"', () => {
    const result = calculateRecoveryScore(null, 0, []);

    chaiExpect(result).to.be.an('object').that.includes({ score: 0 });
    chaiExpect(result.status).to.match(/sin registros/i);
  });

  it('condiciones excelentes (8h sueño, bajo estrés, sin lesiones, buena carga) → score alto', () => {
    const goodSleep = { hoursSlept: 8, stressLevel: 2, date: new Date().toISOString() } as any;
    const result = calculateRecoveryScore(goodSleep, 0, [{} as any, {} as any, {} as any, {} as any]);

    chaiExpect(result.score).to.be.at.least(80);
    chaiExpect(result.status).to.be.a('string').and.to.match(/excelente/i);
  });
});

// ===================== RF-25 (ContactPage) =====================
import { ContactPage } from '../../pages/ContactPage';

describe('RF-25 — ContactPage.handleSubmit (Fluent Assertions)', () => {
  it('formulario completo → muestra la pantalla de confirmación', async () => {
    const user = userEvent.setup();
    render(<ContactPage />);
    await user.type(screen.getByLabelText('Nombre'), 'Michael Pardo');
    await user.type(screen.getByLabelText('Correo Electrónico'), 'mp@example.com');
    await user.type(screen.getByLabelText('Asunto'), 'Consulta');
    await user.type(screen.getByLabelText('Mensaje'), 'Mensaje de prueba');

    await user.click(screen.getByRole('button', { name: 'Enviar Mensaje' }));

    const confirmation = screen.getByText('Gracias por contactar a Athletia.');
    chaiExpect(confirmation).to.exist;
    chaiExpect(screen.queryByLabelText('Nombre')).to.be.null;
  });
});
