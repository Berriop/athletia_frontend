import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../../pages/RegisterPage';
import { authService } from '../../services/auth.service';

// RF-01 — Registrar cuenta. Basado en el diagrama "RF-01 Front
// (RegisterPage.handleSubmit)" (Patrón H1, V(G)=4, 4 caminos básicos).
//
// Nota sobre las guardas internas: el botón "Crear Cuenta" está deshabilitado
// mientras `!isStrong || !passwordsMatch`
// (`disabled={isLoading || !isStrong || !passwordsMatch}`), así que las
// guardas 1 y 2 de la tabla (los `if (!isStrong) return` / `if
// (!passwordsMatch) return` DENTRO de handleSubmit) son inalcanzables por
// clic real. Lo observable se prueba como botón deshabilitado, y las ramas
// internas se ejecutan con `fireEvent.submit(form)` (el onSubmit de React
// ignora la constraint validation y el disabled del botón).
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
    vi.mocked(authService.register).mockClear();
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

  // Guarda interna 1 (contraseña débil): solo alcanzable con submit directo
  it('Guarda 1: contraseña débil, el onSubmit corta con el mensaje de seguridad', async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.type(screen.getByLabelText('Contraseña segura'), 'weak');

    // Act
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    // Assert
    expect(screen.getByText('La contraseña debe cumplir con todos los requisitos de seguridad')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  // Guarda interna 2 (contraseñas que no coinciden): ver nota arriba
  it('Guarda 2: contraseñas que no coinciden, el onSubmit corta con el mensaje de coincidencia', async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.type(screen.getByLabelText('Contraseña segura'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'OtraCosa@1234');

    // Act
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);

    // Assert
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(authService.register).not.toHaveBeenCalled();
  });

  // Fallback del catch: el backend falla sin message en error → mensaje genérico
  it('el backend falla sin un mensaje → muestra el mensaje de error por defecto', async () => {
    // Arrange
    vi.mocked(authService.register).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await fillStrongMatchingPassword(user);

    // Act
    await user.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

    // Assert
    expect(await screen.findByText('Error al registrarse')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
