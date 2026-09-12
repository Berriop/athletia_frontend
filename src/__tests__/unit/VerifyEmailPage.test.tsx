import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { VerifyEmailPage } from '../../pages/VerifyEmailPage';
import { authService } from '../../services/auth.service';

// V(G)=3: sin token / verificación exitosa / verificación fallida (con y sin
// mensaje del backend).
vi.mock('../../services/auth.service', () => ({
  authService: { verifyEmail: vi.fn() },
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <VerifyEmailPage />
    </MemoryRouter>,
  );
}

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.mocked(authService.verifyEmail).mockReset();
  });

  // Camino 1: sin token en la URL → error inmediato, sin llamar al backend
  it('Camino 1: sin token en la URL → muestra error sin llamar al backend', () => {
    renderAt('/verify-email');
    expect(screen.getByText('Enlace de verificación inválido o ausente.')).toBeInTheDocument();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
  });

  // Camino 2: con token, verificación exitosa
  it('Camino 2: con token válido → verifica y muestra el mensaje de éxito', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue(undefined);
    renderAt('/verify-email?token=tok123');
    expect(
      await screen.findByText(/Tu correo electrónico ha sido verificado con éxito/),
    ).toBeInTheDocument();
    expect(authService.verifyEmail).toHaveBeenCalledWith('tok123');
    expect(screen.getByRole('link', { name: 'Iniciar Sesión' })).toHaveAttribute('href', '/login');
  });

  // Camino 3: con token, el backend falla con mensaje específico
  it('Camino 3: la verificación falla con mensaje del backend → lo muestra', async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue({
      response: { data: { error: { message: 'El token ha expirado' } } },
    });
    renderAt('/verify-email?token=expirado');
    expect(await screen.findByText('El token ha expirado')).toBeInTheDocument();
  });

  // Variante del camino 3: sin mensaje del backend → usa el mensaje genérico
  it('la verificación falla sin mensaje del backend → usa el mensaje genérico', async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue(new Error('network error'));
    renderAt('/verify-email?token=malo');
    expect(
      await screen.findByText('No se pudo verificar el correo. Es posible que el token haya expirado.'),
    ).toBeInTheDocument();
  });
});
