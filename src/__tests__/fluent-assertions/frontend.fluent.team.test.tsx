import { describe, it, vi, beforeEach } from 'vitest';
import { expect as chaiExpect } from 'chai';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * Pruebas con Fluent Assertions (chai) para las 18 funcionalidades de
 * frontend asignadas a Juan Pablo Berrío, Michael Pardo y Daniel Ortiz
 * (RF-05 a RF-16, RF-18, RF-20, RF-25, RF-26, RF-27, RF-30).
 */

// ===================== Michael Pardo: RF-05/06/07 (WorkoutsPage) =====================
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

// ===================== Michael Pardo: RF-08 (MealsPage) =====================
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

// ===================== Juan Pablo Berrío: RF-18 (GymFinderPage texto) =====================
import { GymFinderPage } from '../../pages/GymFinderPage';

class FakeMap {
  panTo = vi.fn();
  setCenter = vi.fn();
  constructor(_el: unknown, _opts: unknown) {}
}
class FakeInfoWindow {
  setContent = vi.fn();
  open = vi.fn();
}
class FakeMarker {
  setMap = vi.fn();
  addListener = vi.fn();
  constructor(_opts: unknown) {}
}
function fakePlace(overrides: Record<string, unknown> = {}) {
  return {
    place_id: 'place-1', name: 'Smart Fit Poblado', vicinity: 'Cra 43A',
    formatted_address: 'Cra 43A, Medellín', rating: 4.5, user_ratings_total: 200,
    opening_hours: { isOpen: () => true },
    geometry: { location: { lat: () => 6.21, lng: () => -75.57 } },
    photos: [{ getUrl: () => 'http://photo.example/gym.jpg' }],
    ...overrides,
  };
}
const textSearchMock = vi.fn();
const nearbySearchMock = vi.fn();
class FakePlacesService {
  constructor(_map: unknown) {}
  nearbySearch(req: unknown, cb: (...a: unknown[]) => void) { nearbySearchMock(req, cb); }
  textSearch(req: unknown, cb: (...a: unknown[]) => void) { textSearchMock(req, cb); }
}

describe('RF-18 — GymFinderPage.handleTextSearch (Fluent Assertions)', () => {
  beforeEach(() => {
    textSearchMock.mockReset();
    nearbySearchMock.mockReset();
    vi.stubGlobal('google', {
      maps: {
        Map: FakeMap, Marker: FakeMarker, InfoWindow: FakeInfoWindow, Animation: { DROP: 'DROP' },
        places: { PlacesService: FakePlacesService, PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' } },
      },
    });
    Object.defineProperty(window.navigator, 'geolocation', {
      value: { getCurrentPosition: (success: (p: unknown) => void) => success({ coords: { latitude: 6.21, longitude: -75.57 } }) },
      configurable: true,
    });
    nearbySearchMock.mockImplementation((_req, cb) => cb([fakePlace()], 'OK'));
  });

  it('texto válido con resultados → reemplaza la lista de gimnasios mostrada', async () => {
    textSearchMock.mockImplementation((_req, cb) => cb([fakePlace({ place_id: 'place-2', name: 'Bodytech Envigado' })], 'OK'));
    const user = userEvent.setup();
    render(<GymFinderPage />);
    await screen.findByText('Smart Fit Poblado');

    await user.type(screen.getByPlaceholderText('Buscar ciudad o zona...'), 'envigado');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    const found = await screen.findByText('Bodytech Envigado');
    chaiExpect(found).to.exist;
    chaiExpect(textSearchMock.mock.calls[0][0]).to.include({ query: 'gimnasio envigado', type: 'gym' });
  });
});

// ===================== Michael Pardo: RF-20 (recoveryScore) =====================
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

// ===================== Michael Pardo: RF-25 (ContactPage) =====================
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

// ===================== Juan Pablo Berrío: RF-12/13 (SleepPage) =====================
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

describe('RF-12 — SleepPage.handleUpdate (modificar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
  });

  it('editando un registro existente → llama a update y notifica éxito', async () => {
    vi.mocked(sleepService.update).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<SleepPage />);
    await user.click(await screen.findByTitle('Editar'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Registro' }));

    await waitFor(() => chaiExpect(vi.mocked(sleepService.update).mock.calls).to.have.lengthOf(1));
    chaiExpect(vi.mocked(sleepService.update).mock.calls[0][0]).to.equal('sleep-1');
    chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Registro de sueño actualizado', 'success']);
  });
});

describe('RF-13 — SleepPage.confirmDelete (eliminar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
  });

  it('eliminación exitosa → notifica éxito', async () => {
    vi.mocked(sleepService.delete).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    render(<SleepPage />);
    await user.click(await screen.findByTitle('Eliminar'));

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => {
      chaiExpect(addNotification.mock.calls[0]).to.deep.equal(['Registro eliminado correctamente', 'success']);
    });
  });
});

// ===================== Juan Pablo Berrío: RF-14/15/16/18 =====================
import { InjuriesPage } from '../../pages/InjuriesPage';
import { injuryService } from '../../services/injury.service';

vi.mock('../../services/injury.service', () => ({
  injuryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

describe('RF-14 — InjuriesPage.handleCreate (crear) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  it('datos válidos → crea la lesión y notifica éxito', async () => {
    vi.mocked(injuryService.create).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<InjuriesPage />);
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis');

    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    await waitFor(() => chaiExpect(addNotification.mock.calls).to.have.lengthOf(1));
    chaiExpect(addNotification.mock.calls[0][0]).to.contain('registrada');
  });
});

const existingInjury: any = {
  id: 'injury-1', bodyArea: 'Rodilla', injuryName: 'Tendinitis', severity: 5, isActive: true, notes: null,
  userId: 'user-1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

describe('RF-15 — InjuriesPage.handleUpdate (modificar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [existingInjury], meta: {} } as any);
  });

  it('editando una lesión existente → llama a update y notifica éxito', async () => {
    vi.mocked(injuryService.update).mockResolvedValue({} as any);
    const user = userEvent.setup();
    render(<InjuriesPage />);
    await user.click(await screen.findByTitle('Editar'));

    await user.click(screen.getByRole('button', { name: 'Actualizar Lesión' }));

    await waitFor(() => {
      chaiExpect(vi.mocked(injuryService.update).mock.calls[0][0]).to.equal('injury-1');
    });
  });
});

describe('RF-16 — InjuriesPage.confirmDelete (eliminar) (Fluent Assertions)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [existingInjury], meta: {} } as any);
  });

  it('eliminación exitosa → la lesión desaparece de la lista', async () => {
    vi.mocked(injuryService.delete).mockResolvedValue(undefined as any);
    const user = userEvent.setup();
    render(<InjuriesPage />);
    await user.click(await screen.findByTitle('Eliminar'));
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    await waitFor(() => chaiExpect(screen.queryByText('Tendinitis')).to.be.null);
  });
});

// ===================== Daniel Ortiz: RF-09/10 (MealsPage) =====================
describe('RF-09 — MealsPage.handleUpdate (modificar) (Fluent Assertions)', () => {
  const existingMeal: any = {
    id: 'meal-1', name: 'Pollo con arroz', calories: 600, mealType: 'LUNCH', proteinG: 40, carbsG: 60, fatG: 15,
    date: new Date('2026-08-01T12:00:00.000Z').toISOString(), userId: 'user-1',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };

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
  const existingMeal: any = {
    id: 'meal-1', name: 'Pollo con arroz', calories: 600, mealType: 'LUNCH', proteinG: 40, carbsG: 60, fatG: 15,
    date: new Date('2026-08-01T12:00:00.000Z').toISOString(), userId: 'user-1',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };

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

// ===================== Daniel Ortiz: RF-11 (SleepPage crear) =====================
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

// RF-26 (NotificationContext) vive en su propio archivo:
// frontend.fluent.team.rf26.test.tsx — necesita el NotificationProvider
// real, que este archivo mockea globalmente para las demás páginas.

// ===================== Daniel Ortiz: RF-27 (Forgot/Reset Password) =====================
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

// ===================== Daniel Ortiz: RF-30 (AdminPage) =====================
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
    chaiExpect(api.get).to.have.property('mock');
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
