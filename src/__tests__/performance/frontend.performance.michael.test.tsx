import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutsPage } from '../../pages/WorkoutsPage';
import { ContactPage } from '../../pages/ContactPage';
import { workoutService } from '../../services/workout.service';
import { calculateRecoveryScore } from '../../utils/recoveryScore';
import { getCoachRecommendation } from '../../utils/smartCoach';
import { elapsedMs, fakeSleep, fakeWorkout, medianMs } from '../helpers/fixtures';

/**
 * Pruebas de rendimiento para las funcionalidades de frontend de Michael Pardo:
 * RF-05/06/07 (rutinas), RF-20 (puntaje de recuperación) y RF-25 (contacto).
 *
 * Son pruebas no funcionales: además de comprobar que el resultado es correcto,
 * verifican un presupuesto de tiempo. La pantalla pide como máximo 50 registros
 * por página; también se prueba con 300 como prueba de estrés. Los límites son
 * amplios a propósito para evitar falsos fallos en Jenkins.
 */

vi.mock('../../services/workout.service', () => ({
  workoutService: { getAll: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification: vi.fn() }),
}));

describe('[Rendimiento] RF-05/06/07 — WorkoutsPage', () => {
  it('muestra una página completa de 50 rutinas dentro del presupuesto', async () => {
    vi.mocked(workoutService.getAll).mockResolvedValue({
      success: true,
      data: Array.from({ length: 50 }, (_, i) => fakeWorkout({ id: `workout-${i}`, title: `Rutina ${i}` })),
    });

    const duracion = await elapsedMs(async () => {
      render(<WorkoutsPage />);
      await screen.findByText('Rutina 49');
    });

    expect(duracion, `50 rutinas tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(10_000);
  });

  it('prueba de estrés: 300 rutinas se muestran dentro del presupuesto', async () => {
    vi.mocked(workoutService.getAll).mockResolvedValue({
      success: true,
      data: Array.from({ length: 300 }, (_, i) => fakeWorkout({ id: `workout-${i}`, title: `Rutina ${i}` })),
    });

    const duracion = await elapsedMs(async () => {
      render(<WorkoutsPage />);
      await screen.findByText('Rutina 299');
    });

    expect(screen.getAllByText(/Energía: 7\/10/)).toHaveLength(300);
    expect(duracion, `300 rutinas tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(15_000);
  });
});

describe('[Rendimiento] RF-20 — puntaje de recuperación y entrenador inteligente', () => {
  it('calcula 100.000 puntajes de recuperación dentro del presupuesto', async () => {
    const sueno = fakeSleep({ hoursSlept: 7.5, stressLevel: 3 });
    const rutinas = [fakeWorkout(), fakeWorkout({ id: 'w2' }), fakeWorkout({ id: 'w3' })];
    let acumulado = 0;

    const duracion = await elapsedMs(() => {
      for (let i = 0; i < 100_000; i++) {
        acumulado += calculateRecoveryScore(sueno, i % 2, rutinas).score;
      }
    });

    // Con 0 lesiones: 30+30+20+10 = 90; con 1 lesión: 30+30+5+10 = 75.
    expect(acumulado).toBe(50_000 * 90 + 50_000 * 75);
    expect(duracion, `100.000 cálculos tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(8_000);
  });

  it('genera 100.000 recomendaciones del entrenador dentro del presupuesto', async () => {
    const sueno = fakeSleep({ hoursSlept: 8, stressLevel: 2 });
    const rutinas = [fakeWorkout(), fakeWorkout({ id: 'w2' }), fakeWorkout({ id: 'w3' })];
    let exitosas = 0;

    const duracion = await elapsedMs(() => {
      for (let i = 0; i < 100_000; i++) {
        if (getCoachRecommendation(sueno, 0, rutinas).type === 'success') exitosas++;
      }
    });

    expect(exitosas).toBe(100_000);
    expect(duracion, `100.000 recomendaciones tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(8_000);
  });

  it('el costo del cálculo no crece con el historial: con 5.000 rutinas cuesta casi lo mismo que con 5 (mediana, margen amplio)', async () => {
    const sueno = fakeSleep();
    const pocas = Array.from({ length: 5 }, (_, i) => fakeWorkout({ id: `w${i}` }));
    const muchas = Array.from({ length: 5000 }, (_, i) => fakeWorkout({ id: `w${i}` }));
    const repetir = (rutinas: typeof pocas) => () => {
      for (let i = 0; i < 5000; i++) calculateRecoveryScore(sueno, 0, rutinas);
    };

    const medianaPocas = await medianMs(5, repetir(pocas));
    const medianaMuchas = await medianMs(5, repetir(muchas));

    expect(medianaMuchas).toBeLessThan(Math.max(medianaPocas * 20, 100));
  });
});

describe('[Rendimiento] RF-25 — ContactPage', () => {
  it('se monta con una latencia mediana razonable (mediana de 5 montajes)', async () => {
    const mediana = await medianMs(5, () => {
      const { unmount } = render(<ContactPage />);
      unmount();
    });

    expect(mediana, `La mediana fue ${mediana.toFixed(1)} ms`).toBeLessThan(5_000);
  });
});
