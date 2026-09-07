import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage';
import { authService } from '../../services/auth.service';

// RF-32 (parte 1) — Solicitar recuperación. Basado en el diagrama "RF-32
// Front Parte 1 (ForgotPasswordPage.handleSubmit)" (V(G)=3, 3 caminos
// básicos).
//
// Hallazgo: el campo de correo es `required` en el HTML, así que el Camino 1
// (`if (!email) return`) es inalcanzable dando clic con el campo vacío — el
// navegador bloquea el envío nativo antes de que React vea el evento. Se
// prueba ese comportamiento observable (no se llama al servicio) en vez de
// forzar el camino interno.
vi.mock('../../services/auth.service', () => ({
  authService: { register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn() },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe('ForgotPasswordPage.handleSubmit', () => {
  // Camino 1: campo vacío, bloqueado por el navegador (required)
  it('Camino 1: correo vacío → el navegador bloquea el envío, no se llama al servicio', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(screen.getByRole('button', { name: /Enviar Enlace de Recuperación/i }));

    // Assert
    expect(authService.forgotPassword).not.toHaveBeenCalled();
    expect(screen.queryByText('¡Correo Enviado!')).not.toBeInTheDocument();
  });

  // Camino 2: INICIO,1,3,4,5,FIN
  it('Camino 2: correo válido pero el backend falla → muestra el mensaje de error', async () => {
    // Arrange
    vi.mocked(authService.forgotPassword).mockRejectedValue({
      response: { data: { error: { message: 'Error al procesar la solicitud' } } },
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');

    // Act
    await user.click(screen.getByRole('button', { name: /Enviar Enlace de Recuperación/i }));

    // Assert
    expect(await screen.findByText('Error al procesar la solicitud')).toBeInTheDocument();
  });

  // Camino 3: INICIO,1,3,4,6,FIN
  it('Camino 3: correo enviado correctamente → muestra la pantalla de confirmación', async () => {
    // Arrange
    vi.mocked(authService.forgotPassword).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Correo electrónico'), 'test@example.com');

    // Act
    await user.click(screen.getByRole('button', { name: /Enviar Enlace de Recuperación/i }));

    // Assert
    expect(await screen.findByText('¡Correo Enviado!')).toBeInTheDocument();
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@example.com');
  });
});
