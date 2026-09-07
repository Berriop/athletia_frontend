import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { authService } from '../../services/auth.service';

// RF-02 — Iniciar sesión. Basado en el diagrama "RF-02 Front
// (LoginPage.handleSubmit)" (Patrón H2, V(G)=4, 4 caminos básicos).
vi.mock('../../services/auth.service', () => ({
  authService: { register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn() },
}));

const login = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login }),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');
  await user.type(screen.getByLabelText('Contraseña'), 'StrongP@ss1234');
  await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
}

describe('LoginPage.handleSubmit', () => {
  beforeEach(() => {
    login.mockClear();
    navigate.mockClear();
  });

  // Camino 1: INICIO,1,2,3,FIN
  it('Camino 1: credenciales válidas → inicia sesión y navega al dashboard', async () => {
    // Arrange
    vi.mocked(authService.login).mockResolvedValue({
      token: 'jwt-token',
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);
    const user = userEvent.setup();
    renderPage();

    // Act
    await fillCredentials(user);

    // Assert
    await waitFor(() => expect(login).toHaveBeenCalledWith('jwt-token', expect.objectContaining({ id: 'user-1' })));
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  // Camino 2: INICIO,1,2,4,5,FIN
  it('Camino 2: backend responde "Invalid credentials" → mensaje genérico', async () => {
    // Arrange
    vi.mocked(authService.login).mockRejectedValue({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });
    const user = userEvent.setup();
    renderPage();

    // Act
    await fillCredentials(user);

    // Assert
    expect(await screen.findByText('Correo o contraseña incorrectos. Por favor, verifica tus datos.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  // Camino 3: INICIO,1,2,4,6,7,FIN
  it('Camino 3: backend responde con otro mensaje (ej. cuenta bloqueada) → se muestra tal cual', async () => {
    // Arrange
    vi.mocked(authService.login).mockRejectedValue({
      response: { data: { error: { message: 'Tu cuenta se encuentra bloqueada. Contacta al administrador.' } } },
    });
    const user = userEvent.setup();
    renderPage();

    // Act
    await fillCredentials(user);

    // Assert
    expect(
      await screen.findByText('Tu cuenta se encuentra bloqueada. Contacta al administrador.'),
    ).toBeInTheDocument();
  });

  // Camino 4: INICIO,1,2,4,6,8,FIN
  it('Camino 4: falla sin ningún mensaje del backend (ej. red caída) → mensaje de conexión', async () => {
    // Arrange
    vi.mocked(authService.login).mockRejectedValue(new Error('Network Error'));
    const user = userEvent.setup();
    renderPage();

    // Act
    await fillCredentials(user);

    // Assert
    expect(await screen.findByText('Error al iniciar sesión. Comprueba tu conexión.')).toBeInTheDocument();
  });
});
