import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: fakeUser, logout, updateUser }),
}));

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
    vi.mocked(authService.updateProfile).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al actualizar el perfil', 'error'));
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument(); // sigue en edición
  });

  // Camino 2: INICIO,1,2,3,5,FIN
  it('Camino 2: la llamada tiene éxito → actualiza el contexto, notifica y sale de edición', async () => {
    vi.mocked(authService.updateProfile).mockResolvedValue({ ...fakeUser, name: 'Nuevo Nombre' } as User);
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Editar perfil/i }));
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }));

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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Exportar mis datos/i }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al exportar los datos', 'error'));
  });

  // Camino 2: INICIO,1,2,4,FIN
  it('Camino 2: la petición responde con éxito → descarga el CSV y notifica éxito', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(new Blob(['csv-content'])) }),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Exportar mis datos/i }));

    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Datos exportados correctamente', 'success'));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/user/export'),
      expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } }),
    );
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
  });
});
