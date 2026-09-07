import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../../pages/RegisterPage';
import { authService } from '../../services/auth.service';

// RF-01 — Registrar cuenta. Basado en el diagrama "RF-01 Front
// (RegisterPage.handleSubmit)" (Patrón H1, V(G)=4, 4 caminos básicos).
//
// Hallazgo real al escribir esta prueba: el botón "Crear Cuenta" está
// deshabilitado mientras `!isStrong || !passwordsMatch`
// (`disabled={isLoading || !isStrong || !passwordsMatch}`). Eso significa
// que los caminos 1 y 2 de la tabla (los `if (!isStrong) return` / `if
// (!passwordsMatch) return` DENTRO de handleSubmit) son, en la práctica,
// inalcanzables por interacción real de un usuario: el botón nunca llega a
// activarse en esos casos. Por eso aquí se prueba el comportamiento
// realmente observable (el botón permanece deshabilitado) en vez de forzar
// un clic que un usuario real no podría dar — y se documenta como hallazgo,
// no como hueco de la prueba.
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
      <RegisterPage />
    </MemoryRouter>,
  );
}

async function fillStrongMatchingPassword(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Jane Doe'); // también obligatorio
  await user.type(screen.getByLabelText('Correo electrónico'), 'nuevo@example.com');
  await user.type(screen.getByLabelText('Contraseña segura'), 'StrongP@ss1234');
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'StrongP@ss1234');
}

describe('RegisterPage.handleSubmit', () => {
  beforeEach(() => {
    login.mockClear();
    navigate.mockClear();
  });

  // Caminos 1 y 2 (guardas internas): observables como botón deshabilitado
  it('Caminos 1/2: contraseña débil o que no coincide → el botón "Crear Cuenta" permanece deshabilitado', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    const submitButton = screen.getByRole('button', { name: /Crear Cuenta/i });
    expect(submitButton).toBeDisabled(); // sin contraseña todavía

    // Act (Camino 1: contraseña débil)
    await user.type(screen.getByLabelText('Contraseña segura'), 'weak');

    // Assert (Camino 1)
    expect(submitButton).toBeDisabled(); // no cumple requisitos

    // Act (Camino 2: contraseñas que no coinciden)
    await user.clear(screen.getByLabelText('Contraseña segura'));
    await user.type(screen.getByLabelText('Contraseña segura'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'OtraCosa@1234');

    // Assert (Camino 2)
    expect(submitButton).toBeDisabled(); // no coinciden
    expect(screen.getByText('✗ Las contraseñas no coinciden')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  // Camino 3: INICIO,1,3,5,6,7,FIN
  it('Camino 3: todo válido pero el backend falla → muestra el mensaje de error', async () => {
    // Arrange
    vi.mocked(authService.register).mockRejectedValue({
      response: { data: { error: { message: 'Email already in use' } } },
    });
    const user = userEvent.setup();
    renderPage();
    await fillStrongMatchingPassword(user);

    // Act
    await user.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    // Assert
    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  // Camino 4: INICIO,1,3,5,6(éxito),FIN
  it('Camino 4: todo válido y el backend acepta → inicia sesión y navega al dashboard', async () => {
    // Arrange
    vi.mocked(authService.register).mockResolvedValue({
      token: 'jwt-token',
      user: { id: 'user-1', email: 'nuevo@example.com' },
    } as any);
    const user = userEvent.setup();
    renderPage();
    await fillStrongMatchingPassword(user);

    // Act
    await user.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    // Assert
    await waitFor(() => expect(login).toHaveBeenCalledWith('jwt-token', expect.objectContaining({ id: 'user-1' })));
    expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });
});
