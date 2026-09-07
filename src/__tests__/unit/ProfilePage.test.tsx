import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../../pages/ProfilePage';
import { authService } from '../../services/auth.service';
import type { User } from '../../types';

// RF-05 — Actualizar perfil propio. Basado en el diagrama "RF-05 Front
// (ProfilePage.handleSave)" (Patrón E, V(G)=2, 2 caminos básicos).
// RF-34 — Exportar historial. Basado en el diagrama "RF-34 Front
// (ProfilePage.handleExportCSV)" (V(G)=2, 2 caminos básicos).
vi.mock('../../services/auth.service', () => ({
  authService: { register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

const logout = vi.fn();
const updateUser = vi.fn();
const fakeUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  gender: null,
  birthDate: null,
  heightCm: null,
  weightKg: null,
  experienceLevel: null,
} as unknown as User;
let mockUser: User | null = fakeUser;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout, updateUser }),
}));

beforeEach(() => {
  // Restaura el usuario base y no deja que un test "ensucie" a los demás.
  fakeUser.name = 'Test User';
  fakeUser.gender = null;
  fakeUser.birthDate = null;
  fakeUser.heightCm = null;
  fakeUser.weightKg = null;
  fakeUser.experienceLevel = null;
  mockUser = fakeUser;
});

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );
}

describe('ProfilePage.handleSave (RF-05)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    updateUser.mockClear();
  });

  // Camino 1: INICIO,1,2,3,4,FIN
  it('Camino 1: la llamada falla → notifica error y permanece en modo edición', async () => {
    // Arrange
    vi.mocked(authService.updateProfile).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));

    // Act
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al actualizar el perfil', 'error'));
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument(); // sigue en edición
  });

  // Camino 2: INICIO,1,2,3,5,FIN
  it('Camino 2: la llamada tiene éxito → actualiza el contexto, notifica y sale de edición', async () => {
    // Arrange
    vi.mocked(authService.updateProfile).mockResolvedValue({ ...fakeUser, name: 'Nuevo Nombre' } as User);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));

    // Act
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // Assert
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nuevo Nombre' })));
    expect(addNotification).toHaveBeenCalledWith('Perfil actualizado correctamente', 'success');
    expect(screen.getByRole('button', { name: /Editar perfil/i })).toBeInTheDocument(); // salió de edición
  });
});

describe('ProfilePage.handleExportCSV (RF-34)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    localStorage.setItem('token', 'fake-token');
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:fake'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  // Camino 1: INICIO,1,2,3,FIN
  it('Camino 1: la petición falla → notifica "Error al exportar los datos"', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(screen.getByRole('button', { name: /Exportar mis datos/i }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al exportar los datos', 'error'));
  });

  // Camino 2: INICIO,1,2,4,FIN
  it('Camino 2: la petición responde con éxito → descarga el CSV y notifica éxito', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['csv-content'])) }),
    );
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(screen.getByRole('button', { name: /Exportar mis datos/i }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Datos exportados correctamente', 'success'));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/user/export'),
      expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } }),
    );
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});

describe('ProfilePage casos extra (RF-05 / RF-34)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    updateUser.mockClear();
    logout.mockClear();
  });

  // Cerrar sesión (handleLogout)
  it('al hacer clic en "Cerrar sesión" → llama logout y navega al login', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(screen.getByRole('button', { name: /Cerrar sesión/i }));

    // Assert
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  // Cancelar edición (handleCancel)
  it('al hacer clic en "Cancelar" → sale del modo edición sin guardar', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: /Cancelar/i }));

    // Assert
    expect(screen.getByRole('button', { name: /Editar perfil/i })).toBeInTheDocument();
    expect(updateUser).not.toHaveBeenCalled();
  });

  // Usuario con datos completos: prefill de edición + render de valores reales
  // (Nota: los campos del formulario van con <span> y no <label>, así que se
  // consultan por placeholder / selector en vez de getByLabelText.)
  it('usuario con datos completos → renderiza valores y precarga el formulario de edición', async () => {
    // Arrange
    fakeUser.birthDate = '2000-05-10T12:00:00.000Z';
    fakeUser.heightCm = 175;
    fakeUser.weightKg = 70;
    fakeUser.experienceLevel = 'ADVANCED';
    fakeUser.gender = 'MALE';
    const user = userEvent.setup();
    const { container } = renderPage();

    // Assert (vista)
    expect(screen.getByText(new Date('2000-05-10T12:00:00.000Z').toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText('175 cm')).toBeInTheDocument();
    expect(screen.getByText('70 kg')).toBeInTheDocument();

    // Act (editar → valores precargados)
    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));

    // Assert (formulario)
    expect((container.querySelector('input[type="date"]') as HTMLInputElement).value).toBe('2000-05-10');
    expect((screen.getByPlaceholderText('Ej. 175') as HTMLInputElement).value).toBe('175');
    expect((screen.getByPlaceholderText('Ej. 70') as HTMLInputElement).value).toBe('70');
  });

  // Guardar con campos editados: cubre los onChange (nombre, género, fecha,
  // altura, peso, nivel) y la conversión de height/weight a número
  it('edita todos los campos y guarda → manda el DTO con los valores convertidos', async () => {
    // Arrange
    vi.mocked(authService.updateProfile).mockResolvedValue({} as User);
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));
    const selects = container.querySelectorAll('select');

    // Act
    const nameInput = screen.getByPlaceholderText('Tu nombre');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');
    await user.selectOptions(selects[0], 'female');
    fireEvent.change(container.querySelector('input[type="date"]') as HTMLInputElement, {
      target: { value: '1999-01-05' },
    });
    const heightInput = screen.getByPlaceholderText('Ej. 175');
    await user.clear(heightInput);
    await user.type(heightInput, '168');
    const weightInput = screen.getByPlaceholderText('Ej. 70');
    await user.clear(weightInput);
    await user.type(weightInput, '65');
    await user.selectOptions(selects[1], 'advanced');
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // Assert
    await waitFor(() => expect(authService.updateProfile).toHaveBeenCalledWith({
      name: 'Jane Doe',
      gender: 'female',
      birthDate: '1999-01-05',
      heightCm: 168,
      weightKg: 65,
      experienceLevel: 'advanced',
    }));
  });

  // Vaciar altura y peso: rama izquierda del ternario ('' → null) al guardar
  it('al vaciar altura y peso → el DTO los manda como undefined', async () => {
    // Arrange
    fakeUser.heightCm = 180;
    fakeUser.weightKg = 90;
    vi.mocked(authService.updateProfile).mockResolvedValue({} as User);
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));
    expect((screen.getByPlaceholderText('Ej. 175') as HTMLInputElement).value).toBe('180');

    // Act
    fireEvent.change(screen.getByPlaceholderText('Ej. 175'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. 70'), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // Assert
    await waitFor(() =>
      expect(authService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ heightCm: undefined, weightKg: undefined }),
      ),
    );
  });

  // Sin nombre: fallbacks (avatar con email, "Sin nombre", "—")
  it('usuario sin nombre → renderiza fallbacks y permite guardar sin nombre', async () => {
    // Arrange
    fakeUser.name = null as unknown as string;
    vi.mocked(authService.updateProfile).mockResolvedValue({} as User);
    const user = userEvent.setup();
    renderPage();

    // Assert (vista con fallbacks)
    expect(screen.getByText('Sin nombre')).toBeInTheDocument();

    // Act (editar y guardar sin nombre → DTO con name undefined)
    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    // Assert
    await waitFor(() =>
      expect(authService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ name: undefined, birthDate: undefined }),
      ),
    );
  });
});

describe('ProfilePage sin usuario autenticado', () => {
  it('user === null → la página no renderiza nada', () => {
    // Arrange
    mockUser = null;

    // Act & Assert
    const { container } = renderPage();
    expect(container).toBeEmptyDOMElement();
  });
});
