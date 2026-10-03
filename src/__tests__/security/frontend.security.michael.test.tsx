import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutsPage } from '../../pages/WorkoutsPage';
import { MealsPage } from '../../pages/MealsPage';
import { ContactPage } from '../../pages/ContactPage';
import { workoutService } from '../../services/workout.service';
import { mealService } from '../../services/meal.service';
import { calculateRecoveryScore } from '../../utils/recoveryScore';
import { getCoachRecommendation } from '../../utils/smartCoach';
import { fakeMeal, fakeSleep, fakeWorkout } from '../helpers/fixtures';

/**
 * Pruebas de seguridad para las funcionalidades de frontend de Michael Pardo:
 * RF-05/06/07 (rutinas de entrenamiento), RF-08 (comidas), RF-20 (puntaje de
 * recuperación) y RF-25 (formulario de contacto).
 *
 * Reglas de seguridad convertidas en pruebas de regresión: datos mostrados como
 * texto (nunca como HTML), límites de los campos numéricos del formulario, el
 * cálculo de recuperación no se rompe con entradas hostiles y el código fuente
 * no usa sumideros de HTML peligrosos.
 */

vi.mock('../../services/workout.service', () => ({
  workoutService: { getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../services/meal.service', () => ({
  mealService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

const XSS_IMG = '<img src=x onerror=alert(1)>';

beforeEach(() => {
  addNotification.mockClear();
});

describe('[Seguridad] RF-05/06/07 — WorkoutsPage', () => {
  it('un título con HTML malicioso se renderiza como texto, sin crear elementos', async () => {
    vi.mocked(workoutService.getAll).mockResolvedValue({ success: true, data: [fakeWorkout({ title: XSS_IMG })] });

    const { container } = render(<WorkoutsPage />);

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
  });

  it.each([
    ['Energía (1-10)', '1', '10'],
    ['Fatiga (1-10)', '1', '10'],
    ['Dolor (1-10)', '1', '10'],
  ])('el campo "%s" limita el rango del navegador a %s–%s', async (etiqueta, min, max) => {
    vi.mocked(workoutService.getAll).mockResolvedValue({ success: true, data: [] });
    render(<WorkoutsPage />);

    const campo = await screen.findByLabelText(etiqueta);

    expect(campo).toHaveAttribute('type', 'number');
    expect(campo).toHaveAttribute('min', min);
    expect(campo).toHaveAttribute('max', max);
  });

  it('la duración no admite valores menores que 1 minuto', async () => {
    vi.mocked(workoutService.getAll).mockResolvedValue({ success: true, data: [] });
    render(<WorkoutsPage />);

    expect(await screen.findByLabelText('Duración (min)')).toHaveAttribute('min', '1');
  });

  it('si el servidor rechaza la rutina no se muestra éxito', async () => {
    vi.mocked(workoutService.getAll).mockResolvedValue({ success: true, data: [] });
    vi.mocked(workoutService.create).mockRejectedValue({ response: { status: 400 } });
    const user = userEvent.setup();
    render(<WorkoutsPage />);
    await user.type(await screen.findByLabelText('Título'), 'Pierna');

    await user.click(screen.getByRole('button', { name: 'Guardar Entrenamiento' }));

    expect(addNotification).not.toHaveBeenCalledWith('Entrenamiento creado correctamente', 'success');
  });
});

describe('[Seguridad] RF-08 — MealsPage', () => {
  it('un nombre de comida con HTML malicioso se renderiza como texto, sin crear elementos', async () => {
    vi.mocked(mealService.getAll).mockResolvedValue({ success: true, data: [fakeMeal({ name: XSS_IMG })] });

    const { container } = render(<MealsPage />);

    expect(await screen.findByText(XSS_IMG)).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
  });
});

describe('[Seguridad] RF-20 — el puntaje de recuperación tolera entradas hostiles', () => {
  const ESTADOS = ['Excelente', 'Bueno', 'Moderado', 'Riesgo', 'Sin registros'];

  it.each([
    ['horas negativas', fakeSleep({ hoursSlept: -5 })],
    ['horas infinitas', fakeSleep({ hoursSlept: Infinity })],
    ['estrés NaN', fakeSleep({ stressLevel: Number.NaN })],
    ['estrés enorme', fakeSleep({ stressLevel: 1e9 })],
    ['horas NaN', fakeSleep({ hoursSlept: Number.NaN })],
  ])('con %s el puntaje es finito, está entre 0 y 100 y el estado es válido', (_caso, sueno) => {
    const resultado = calculateRecoveryScore(sueno, 0, [fakeWorkout()]);

    expect(Number.isFinite(resultado.score)).toBe(true);
    expect(resultado.score).toBeGreaterThanOrEqual(0);
    expect(resultado.score).toBeLessThanOrEqual(100);
    expect(ESTADOS).toContain(resultado.status);
  });

  it('con un número negativo de lesiones activas sigue devolviendo un puntaje válido', () => {
    const resultado = calculateRecoveryScore(fakeSleep(), -3, []);

    expect(resultado.score).toBeGreaterThanOrEqual(0);
    expect(resultado.score).toBeLessThanOrEqual(100);
  });

  it('el entrenador inteligente siempre devuelve un mensaje con un tipo conocido, incluso con datos hostiles', () => {
    const recomendacion = getCoachRecommendation(fakeSleep({ hoursSlept: Number.NaN, stressLevel: -1 }), -1, []);

    expect(['danger', 'warning', 'success', 'info']).toContain(recomendacion.type);
    expect(recomendacion.message.length).toBeGreaterThan(0);
  });
});

describe('[Seguridad] RF-25 — ContactPage', () => {
  it('el texto con HTML escrito en el formulario no se interpreta como marcado tras enviar', async () => {
    const consola = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const user = userEvent.setup();
    const { container } = render(<ContactPage />);
    await user.type(screen.getByLabelText('Nombre'), 'Test');
    await user.type(screen.getByLabelText('Correo Electrónico'), 'test@example.com');
    await user.type(screen.getByLabelText('Asunto'), 'Asunto');
    await user.type(screen.getByLabelText('Mensaje'), XSS_IMG);

    await user.click(screen.getByRole('button', { name: 'Enviar Mensaje' }));

    expect(screen.getByText('Gracias por contactar a Athletia.')).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();
    consola.mockRestore();
  });

  it('el campo de correo usa el tipo "email" para validar el formato en el navegador', () => {
    render(<ContactPage />);

    expect(screen.getByLabelText('Correo Electrónico')).toHaveAttribute('type', 'email');
  });
});

describe('[Seguridad] RF-05/06/07/08/25 — sin sumideros de HTML peligrosos en el código fuente', () => {
  const fuentes = import.meta.glob(
    [
      '../../pages/WorkoutsPage.tsx',
      '../../pages/MealsPage.tsx',
      '../../pages/ContactPage.tsx',
      '../../utils/recoveryScore.ts',
      '../../utils/smartCoach.ts',
    ],
    { query: '?raw', import: 'default', eager: true },
  ) as Record<string, string>;

  it.each(Object.entries(fuentes))('%s no usa dangerouslySetInnerHTML, innerHTML, eval ni document.write', (_ruta, codigo) => {
    expect(codigo).not.toMatch(/dangerouslySetInnerHTML|\.innerHTML\s*=|\beval\(|document\.write\(/);
  });
});
