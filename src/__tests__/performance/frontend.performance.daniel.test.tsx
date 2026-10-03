import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { MealsPage } from '../../pages/MealsPage';
import { AdminPage } from '../../pages/AdminPage';
import { Header } from '../../components/Header';
import { NotificationProvider, useNotification } from '../../contexts/NotificationContext';
import { mealService } from '../../services/meal.service';
import { api } from '../../services/api';
import { elapsedMs, fakeMeal, fakeUser } from '../helpers/fixtures';

/**
 * Pruebas de rendimiento para las funcionalidades de frontend de Daniel Ortiz:
 * RF-09/10 (comidas), RF-26 (notificaciones) y RF-30 (administración).
 *
 * Son pruebas no funcionales: además de comprobar que el resultado es correcto,
 * verifican un presupuesto de tiempo. Las pantallas piden como máximo 50
 * registros por página; también se prueba con 300 como prueba de estrés. Los
 * límites son amplios a propósito para evitar falsos fallos en Jenkins.
 */

vi.mock('../../services/meal.service', () => ({
  mealService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../services/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin-1', name: 'Admin', role: 'ADMIN' }, logout: vi.fn() }),
}));

function renderConNotificaciones(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <NotificationProvider>{ui}</NotificationProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(mealService.getAll).mockReset();
  vi.mocked(api.get).mockReset();
});

describe('[Rendimiento] RF-09/10 — MealsPage', () => {
  it('muestra una página completa de 50 comidas dentro del presupuesto', async () => {
    vi.mocked(mealService.getAll).mockResolvedValue({
      success: true,
      data: Array.from({ length: 50 }, (_, i) => fakeMeal({ id: `meal-${i}`, name: `Comida ${i}` })),
    });

    const duracion = await elapsedMs(async () => {
      renderConNotificaciones(<MealsPage />);
      await screen.findByText('Comida 49');
    });

    expect(duracion, `50 comidas tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(10_000);
  });

  it('prueba de estrés: 300 comidas se muestran dentro del presupuesto', async () => {
    vi.mocked(mealService.getAll).mockResolvedValue({
      success: true,
      data: Array.from({ length: 300 }, (_, i) => fakeMeal({ id: `meal-${i}`, name: `Comida ${i}` })),
    });

    const duracion = await elapsedMs(async () => {
      renderConNotificaciones(<MealsPage />);
      await screen.findByText('Comida 299');
    });

    expect(screen.getAllByText(/kcal/)).toHaveLength(300);
    expect(duracion, `300 comidas tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(15_000);
  });
});

describe('[Rendimiento] RF-30 — AdminPage', () => {
  it('prueba de estrés: 300 usuarios se muestran dentro del presupuesto', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { data: Array.from({ length: 300 }, (_, i) => fakeUser({ id: `u${i}`, email: `usuario${i}@example.com`, name: `Usuario ${i}` })) },
    });

    const duracion = await elapsedMs(async () => {
      renderConNotificaciones(<AdminPage />);
      await screen.findByText('usuario299@example.com');
    });

    expect(screen.getAllByText('Activo')).toHaveLength(300);
    expect(duracion, `300 usuarios tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(15_000);
  });
});

describe('[Rendimiento] RF-26 — notificaciones', () => {
  function GeneraNotificaciones({ cantidad }: Readonly<{ cantidad: number }>) {
    const { addNotification } = useNotification();
    useEffect(() => {
      for (let i = 0; i < cantidad; i++) addNotification(`Notificación ${i}`, 'info');
    }, []);
    return null;
  }

  it('el encabezado muestra 200 notificaciones acumuladas dentro del presupuesto', async () => {
    const user = userEvent.setup();

    const duracion = await elapsedMs(async () => {
      renderConNotificaciones(
        <>
          <Header />
          <GeneraNotificaciones cantidad={200} />
        </>,
      );
      await user.click(screen.getByTitle('Notificaciones'));
      await screen.findByText('Notificación 199');
    });

    expect(screen.getByText('9+')).toBeInTheDocument();
    expect(screen.getAllByText(/^Notificación \d+$/)).toHaveLength(200);
    expect(duracion, `200 notificaciones tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(12_000);
  });
});
