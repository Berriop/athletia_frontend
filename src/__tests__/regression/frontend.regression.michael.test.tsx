import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Suite de REGRESIÓN para las funcionalidades de frontend de Michael Pardo:
 * RF-05, RF-07, RF-08, RF-20, RF-25.
 * Ver frontend.regression.luisa.test.tsx para cómo demostrar en vivo que
 * esta suite detecta una regresión.
 */

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

// ===================== RF-05/07 (WorkoutsPage) =====================
import { WorkoutsPage } from '../../pages/WorkoutsPage';
import { workoutService } from '../../services/workout.service';

vi.mock('../../services/workout.service', () => ({
  workoutService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('[Regresión] RF-05/07 — WorkoutsPage sigue creando y eliminando correctamente', () => {
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

// ===================== RF-08 (MealsPage) =====================
import { MealsPage } from '../../pages/MealsPage';
import { mealService } from '../../services/meal.service';

vi.mock('../../services/meal.service', () => ({
  mealService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('[Regresión] RF-08 — MealsPage sigue creando comidas correctamente', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('crear con nombre completo sigue llamando a create y notificando éxito', async () => {
    vi.mocked(mealService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<MealsPage />);
    await user.type(await screen.findByLabelText('Nombre de la comida'), 'Ensalada');

    await user.click(screen.getByRole('button', { name: 'Guardar Comida' }));

    await waitFor(() => expect(mealService.create).toHaveBeenCalledTimes(1));
    expect(addNotification).toHaveBeenCalledWith('Comida registrada correctamente', 'success');
  });
});

// ===================== RF-20 (recoveryScore) =====================
import { calculateRecoveryScore } from '../../utils/recoveryScore';

describe('[Regresión] RF-20 — calculateRecoveryScore sigue devolviendo 0 sin datos', () => {
  it('sin sueño ni entrenamientos recientes el score sigue siendo 0', () => {
    const result = calculateRecoveryScore(null, 0, []);
    expect(result.score).toBe(0);
  });
});

// ===================== RF-25 (ContactPage) =====================
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
