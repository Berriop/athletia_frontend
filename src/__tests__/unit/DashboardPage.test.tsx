import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../../pages/DashboardPage';
import { workoutService } from '../../services/workout.service';
import { mealService } from '../../services/meal.service';
import { sleepService } from '../../services/sleep.service';
import { injuryService } from '../../services/injury.service';
import type { Workout, Meal, SleepLog, Injury } from '../../types';

// loadStats: V(G)=2 (éxito/error al cargar). El resto de la complejidad es
// puramente de cómputo (activeInjuries, mealsToday, workoutsLast7Days,
// avgSleep) y de presentación condicional (recoveryScore/coachRecommendation
// nunca son null salvo mientras isLoading=true, así que ambas tarjetas
// siempre se evalúan una vez la carga termina).
vi.mock('../../services/workout.service', () => ({ workoutService: { getAll: vi.fn() } }));
vi.mock('../../services/meal.service', () => ({ mealService: { getAll: vi.fn() } }));
vi.mock('../../services/sleep.service', () => ({ sleepService: { getAll: vi.fn() } }));
vi.mock('../../services/injury.service', () => ({ injuryService: { getAll: vi.fn() } }));

let mockUser: { name?: string; email?: string } | null = { name: 'Ana' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

function emptyResponse<T>() {
  return { success: true, data: [] as T[], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } };
}

function mockAllEmpty() {
  vi.mocked(workoutService.getAll).mockResolvedValue(emptyResponse<Workout>());
  vi.mocked(mealService.getAll).mockResolvedValue(emptyResponse<Meal>());
  vi.mocked(sleepService.getAll).mockResolvedValue(emptyResponse<SleepLog>());
  vi.mocked(injuryService.getAll).mockResolvedValue(emptyResponse<Injury>());
}

function renderPage() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe('DashboardPage.loadStats', () => {
  beforeEach(() => {
    mockUser = { name: 'Ana' };
  });

  it('mientras carga → muestra "Cargando datos..."', () => {
    // Arrange: promesas que nunca se resuelven durante este test
    vi.mocked(workoutService.getAll).mockReturnValue(new Promise(() => {}));
    vi.mocked(mealService.getAll).mockReturnValue(new Promise(() => {}));
    vi.mocked(sleepService.getAll).mockReturnValue(new Promise(() => {}));
    vi.mocked(injuryService.getAll).mockReturnValue(new Promise(() => {}));

    // Act
    renderPage();

    // Assert
    expect(screen.getByText('Cargando datos...')).toBeInTheDocument();
  });

  // Camino de error: alguno de los 4 servicios falla
  it('Camino de error: si algún servicio falla → deja de cargar sin romper la página', async () => {
    // Arrange
    vi.mocked(workoutService.getAll).mockRejectedValue(new Error('network error'));
    vi.mocked(mealService.getAll).mockResolvedValue(emptyResponse<Meal>());
    vi.mocked(sleepService.getAll).mockResolvedValue(emptyResponse<SleepLog>());
    vi.mocked(injuryService.getAll).mockResolvedValue(emptyResponse<Injury>());
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    renderPage();

    // Assert
    await waitFor(() => expect(screen.queryByText('Cargando datos...')).not.toBeInTheDocument());
    expect(consoleSpy).toHaveBeenCalledWith('Error loading dashboard stats', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('Camino de éxito, sin ningún dato → recoveryScore "Sin registros" y ambas tarjetas superiores visibles', async () => {
    // Arrange
    mockAllEmpty();

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('Recovery Score')).toBeInTheDocument();
    expect(screen.getByText('Aún no tienes registros de sueño ni entrenamientos')).toBeInTheDocument();
    expect(screen.getByText('Coach Inteligente')).toBeInTheDocument();
    expect(screen.getByText('Incrementar actividad física')).toBeInTheDocument();
    expect(screen.getByText('Sin entrenamientos registrados aún.')).toBeInTheDocument();
    expect(screen.getByText('Sin comidas registradas aún.')).toBeInTheDocument();
    expect(screen.getByText('Sin promedio')).toBeInTheDocument();
    expect(screen.getByText('Ninguna activa')).toBeInTheDocument();
  });
});

describe('DashboardPage con datos reales', () => {
  const now = new Date();

  const workout: Workout = {
    id: 'w1',
    title: 'Día de Pecho',
    description: null,
    bodyPart: 'CHEST',
    durationMinutes: 45,
    energyLevel: 8,
    fatigueLevel: 3,
    painLevel: 1,
    date: now.toISOString(),
    userId: 'u1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const meal: Meal = {
    id: 'm1',
    name: 'Pollo con Arroz',
    calories: 650,
    mealType: 'LUNCH',
    proteinG: 45,
    carbsG: 60,
    fatG: 12,
    date: now.toISOString(),
    userId: 'u1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const sleep: SleepLog = {
    id: 's1',
    hoursSlept: 8,
    sleepQuality: 8,
    hadNightmares: false,
    stressLevel: 3,
    notes: null,
    date: now.toISOString(),
    userId: 'u1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const activeInjury: Injury = {
    id: 'i1',
    bodyArea: 'Rodilla',
    injuryName: 'Esguince',
    severity: 6,
    isActive: true,
    notes: null,
    userId: 'u1',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  beforeEach(() => {
    mockUser = { name: 'Ana' };
  });

  it('con entrenamientos, comidas, sueño y lesión activa → calcula y muestra los totales correctos', async () => {
    // Arrange
    vi.mocked(workoutService.getAll).mockResolvedValue({
      success: true,
      data: [workout],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(mealService.getAll).mockResolvedValue({
      success: true,
      data: [meal],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(sleepService.getAll).mockResolvedValue({
      success: true,
      data: [sleep],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });
    vi.mocked(injuryService.getAll).mockResolvedValue({
      success: true,
      data: [activeInjury],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    });

    // Act
    renderPage();

    // Assert: tarjetas de estadísticas
    await screen.findByText('Día de Pecho'); // espera a que termine de cargar
    const workoutsCard = screen.getByText('Entrenamientos').closest('.stat-card') as HTMLElement;
    expect(within(workoutsCard).getByText('1 total')).toBeInTheDocument();
    expect(within(workoutsCard).getByText('1 en la última semana')).toBeInTheDocument();

    const mealsCard = screen.getByText('Comidas').closest('.stat-card') as HTMLElement;
    expect(within(mealsCard).getByText('1 total')).toBeInTheDocument();
    expect(within(mealsCard).getByText('1 registradas hoy')).toBeInTheDocument();

    const sleepCard = screen.getByText('Sueño').closest('.stat-card') as HTMLElement;
    expect(within(sleepCard).getByText('Promedio: 8.0h/noche')).toBeInTheDocument();

    const injuriesCard = screen.getByText('Lesiones').closest('.stat-card') as HTMLElement;
    expect(within(injuriesCard).getByText('1 activas actualmente')).toBeInTheDocument();

    // Assert: actividad reciente con las etiquetas traducidas
    expect(screen.getByText('Día de Pecho')).toBeInTheDocument();
    expect(screen.getByText(/Pecho · 45 min · Energía 8\/10/)).toBeInTheDocument();
    expect(screen.getByText('Pollo con Arroz')).toBeInTheDocument();
    expect(screen.getByText(/Almuerzo · 650 kcal/)).toBeInTheDocument();

    // Assert: con lesión activa, el coach recomienda atención (no sobreentrenamiento: solo 1 workout)
    expect(screen.getByText('Atención a tus lesiones')).toBeInTheDocument();
  });

  it('displayName: sin nombre → usa la parte local del email', async () => {
    mockUser = { email: 'atleta@correo.com' };
    mockAllEmpty();
    renderPage();
    expect(await screen.findByText('Hola, atleta 👋')).toBeInTheDocument();
  });

  it('displayName: sin nombre ni email → usa "Atleta" por defecto', async () => {
    mockUser = {};
    mockAllEmpty();
    renderPage();
    expect(await screen.findByText('Hola, Atleta 👋')).toBeInTheDocument();
  });
});
