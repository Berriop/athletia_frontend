import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ResetPasswordPage } from '../../pages/ResetPasswordPage';
import { authService } from '../../services/auth.service';

// RF-32 (parte 2) — Restablecer con el token. Basado en el diagrama "RF-32
// Front Parte 2 (ResetPasswordPage.handleSubmit)" (V(G)=5, 5 caminos
// básicos).
//
// Nota sobre los caminos: por clic real, el botón "Guardar Nueva Contraseña"
// está deshabilitado mientras `!isStrong || !passwordsMatch`, y sin token la
// pantalla ni renderiza el formulario. Por eso las guardas internas se
// disparan con `fireEvent.submit(form)`, que ejecuta el onSubmit de React
// saltándose la constraint validation del navegador.
vi.mock('../../services/auth.service', () => ({
  authService: { register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn() },
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

function renderWithToken(token: string | null) {
  const entry = token ? `/reset-password?token=${token}` : '/reset-password';
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

// Guardas internas de handleSubmit — igual que las de Register/Forgot, no
// son alcanzables por clic (botón deshabilitado o pantalla sin formulario),
// así que se ejecutan disparando el onSubmit de React directo con
// `fireEvent.submit(form)`, que omite la constraint validation del navegador.
function formOf(container: HTMLElement): HTMLFormElement {
  return container.querySelector('form') as HTMLFormElement;
}

describe('ResetPasswordPage.handleSubmit', () => {
  beforeEach(() => {
    navigate.mockClear();
    vi.mocked(authService.resetPassword).mockClear();
  });

  // Camino 1: INICIO,1,2,FIN
  it('Camino 1: sin token en la URL → muestra la pantalla "Enlace Inválido"', () => {
    // Act
    renderWithToken(null);

    // Assert
    expect(screen.getByText('Enlace Inválido')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nueva Contraseña')).not.toBeInTheDocument();
  });

  // Guarda interna 1: con token presente pero contraseña débil.
  it('Guarda 1: contraseña débil, el onSubmit corta con el mensaje de requisitos', async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = renderWithToken('valid-token');
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'weak');

    // Act
    fireEvent.submit(formOf(container));

    // Assert
    expect(screen.getByText('La nueva contraseña debe cumplir con los requisitos de seguridad')).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('Guarda 2: contraseñas que no coinciden, el onSubmit corta con el mensaje de coincidencia', async () => {
    // Arrange
    const user = userEvent.setup();
    const { container } = renderWithToken('valid-token');
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'OtraCosa@1234');

    // Act
    fireEvent.submit(formOf(container));

    // Assert
    expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  // Fallback del catch: el backend falla sin response → mensaje genérico
  // tras recorrer err.response?.data?.error?.message y err.response?.data?.message
  it('el backend falla sin un mensaje → muestra el mensaje de enlace inválido/expirado', async () => {
    // Arrange
    vi.mocked(authService.resetPassword).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderWithToken('valid-token');
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'StrongP@ss1234');

    // Act
    await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));

    // Assert
    expect(await screen.findByText('El enlace de recuperación es inválido o ha expirado.')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  // Caminos 2 y 3 (guardas internas): observables como botón deshabilitado
  it('Caminos 2/3: contraseña débil o que no coincide → el botón permanece deshabilitado', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithToken('valid-token');
    const submitButton = screen.getByRole('button', { name: /Guardar Nueva Contraseña/i });
    expect(submitButton).toBeDisabled();

    // Act (Camino 2: contraseña débil)
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'weak');

    // Assert (Camino 2)
    expect(submitButton).toBeDisabled();

    // Act (Camino 3: contraseñas que no coinciden)
    await user.clear(screen.getByLabelText('Nueva Contraseña'));
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'OtraCosa@1234');

    // Assert (Camino 3)
    expect(submitButton).toBeDisabled();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  // Camino 4: INICIO,1,3,5,7,8,9,FIN
  it('Camino 4: todo válido pero el backend rechaza (token expirado) → muestra el error', async () => {
    // Arrange
    vi.mocked(authService.resetPassword).mockRejectedValue({
      response: { data: { error: { message: 'Token inválido o expirado' } } },
    });
    const user = userEvent.setup();
    renderWithToken('expired-token');
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'StrongP@ss1234');

    // Act
    await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));

    // Assert
    expect(await screen.findByText('Token inválido o expirado')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  // Camino 5: INICIO,1,3,5,7,8,10,FIN
  it('Camino 5: todo válido y el backend acepta → confirma éxito y redirige al login', async () => {
    // Arrange
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(authService.resetPassword).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderWithToken('valid-token');
    await user.type(screen.getByLabelText('Nueva Contraseña'), 'StrongP@ss1234');
    await user.type(screen.getByLabelText('Confirmar Nueva Contraseña'), 'StrongP@ss1234');

    // Act
    await user.click(screen.getByRole('button', { name: /Guardar Nueva Contraseña/i }));

    // Assert
    expect(await screen.findByText('¡Contraseña Restablecida!')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(2500);
    expect(navigate).toHaveBeenCalledWith('/login');

    vi.useRealTimers();
  });
});
