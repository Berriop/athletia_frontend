import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPage } from '../../pages/AdminPage';
import { api } from '../../services/api';

// RF nuevo — Acceder al panel administrativo / Gestión de usuarios en el
// Panel Admin. fetchUsers (V(G)=2: éxito/error al cargar) y
// handleToggleBlock (V(G)=3: auto-bloqueo prohibido, falla del backend,
// éxito) son las dos funciones con decisiones reales de esta página.
vi.mock('../../services/api', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

let mockCurrentUser: { id: string } | null = { id: 'admin-1' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockCurrentUser }),
}));

function renderPage() {
  return render(<AdminPage />);
}

const otherUser = {
  id: 'user-2',
  email: 'user2@example.com',
  name: 'User Two',
  role: 'USER',
  isBlocked: false,
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
};

describe('AdminPage.fetchUsers', () => {
  beforeEach(() => {
    addNotification.mockClear();
    mockCurrentUser = { id: 'admin-1' };
  });

  // Camino 1: INICIO,1,2,3,FIN
  it('Camino 1: carga exitosa → renderiza la tabla con los usuarios', async () => {
    // Arrange
    vi.mocked(api.get).mockResolvedValue({ data: { data: [otherUser] } });

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('user2@example.com')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/admin/users');
  });

  // Camino 2: INICIO,1,2,4,5,FIN
  it('Camino 2: la carga falla → notifica error y no rompe la página', async () => {
    // Arrange
    vi.mocked(api.get).mockRejectedValue(new Error('network error'));

    // Act
    renderPage();

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al cargar usuarios', 'error'));
    expect(screen.getByText('No hay usuarios registrados.')).toBeInTheDocument();
  });

  it('sin usuarios registrados → muestra el mensaje de lista vacía', async () => {
    // Arrange
    vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('No hay usuarios registrados.')).toBeInTheDocument();
  });
});

describe('AdminPage.handleToggleBlock', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(api.patch).mockReset();
    mockCurrentUser = { id: 'admin-1' };
  });

  // Camino 1 (guarda interna `if (userId === currentUser?.id)`): el botón de
  // la propia fila ya viene deshabilitado (`disabled={isSelf}`), así que un
  // clic real del navegador nunca llega a disparar handleToggleBlock — igual
  // que los hallazgos de botón deshabilitado ya documentados en
  // RegisterPage/ResetPasswordPage. Se prueba el comportamiento observable
  // (deshabilitado, sin llamada al backend) en vez de forzar la guarda
  // interna.
  it('Camino 1: la fila del propio admin muestra el botón deshabilitado → un clic no hace nada', async () => {
    // Arrange
    const selfUser = { ...otherUser, id: 'admin-1', email: 'admin@example.com' };
    vi.mocked(api.get).mockResolvedValue({ data: { data: [selfUser] } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('admin@example.com');
    const selfButton = screen.getByTitle('No puedes bloquearte a ti mismo');
    expect(selfButton).toBeDisabled();

    // Act
    await user.click(selfButton);

    // Assert
    expect(api.patch).not.toHaveBeenCalled();
    expect(addNotification).not.toHaveBeenCalled();
  });

  // Camino 2: INICIO,1,3,4,6,7,FIN — el backend falla
  it('Camino 2: la llamada al backend falla → notifica el mensaje de error del backend', async () => {
    // Arrange
    vi.mocked(api.get).mockResolvedValue({ data: { data: [otherUser] } });
    vi.mocked(api.patch).mockRejectedValue({ response: { data: { error: { message: 'No autorizado' } } } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user2@example.com');

    // Act
    await user.click(screen.getByTitle('Bloquear'));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('No autorizado', 'error'));
  });

  // Variante del camino 2: sin mensaje del backend → usa el mensaje genérico
  it('la llamada falla sin mensaje del backend → usa el mensaje de error genérico', async () => {
    // Arrange
    vi.mocked(api.get).mockResolvedValue({ data: { data: [otherUser] } });
    vi.mocked(api.patch).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user2@example.com');

    // Act
    await user.click(screen.getByTitle('Bloquear'));

    // Assert
    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith('Error al cambiar el estado del usuario', 'error'),
    );
  });

  // Camino 3: INICIO,1,3,4,5,7,FIN — bloquea con éxito
  it('Camino 3: bloquea a un usuario activo → actualiza la fila y notifica "Usuario bloqueado"', async () => {
    // Arrange
    vi.mocked(api.get).mockResolvedValue({ data: { data: [otherUser] } });
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { ...otherUser, isBlocked: true } } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user2@example.com');

    // Act
    await user.click(screen.getByTitle('Bloquear'));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Usuario bloqueado', 'error'));
    expect(api.patch).toHaveBeenCalledWith('/admin/users/user-2/toggle-block', {});
    expect(await screen.findByText('Bloqueado')).toBeInTheDocument();
  });

  // Mismo camino 3, sentido inverso — desbloquea con éxito
  it('desbloquea a un usuario bloqueado → actualiza la fila y notifica "Usuario desbloqueado"', async () => {
    // Arrange
    const blockedUser = { ...otherUser, isBlocked: true };
    vi.mocked(api.get).mockResolvedValue({ data: { data: [blockedUser] } });
    vi.mocked(api.patch).mockResolvedValue({ data: { data: { ...otherUser, isBlocked: false } } });
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('user2@example.com');

    // Act
    await user.click(screen.getByTitle('Desbloquear'));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Usuario desbloqueado', 'success'));
    expect(await screen.findByText('Activo')).toBeInTheDocument();
  });
});
