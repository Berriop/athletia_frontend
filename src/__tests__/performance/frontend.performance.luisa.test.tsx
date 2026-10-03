import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../../pages/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage';
import { Sidebar } from '../../components/Sidebar';
import { PasswordStrengthMeter, checkPasswordStrength } from '../../components/PasswordStrengthMeter';
import { elapsedMs, medianMs } from '../helpers/fixtures';

/**
 * Pruebas de rendimiento para las funcionalidades de frontend de Luisa Espinal:
 * RF-01 (registro), RF-02 (login), RF-22 (menú de administración).
 *
 * Son pruebas no funcionales: además de comprobar que el resultado es correcto,
 * verifican un presupuesto de tiempo. Los límites son amplios a propósito para
 * evitar falsos fallos en equipos distintos (incluido Jenkins).
 */

vi.mock('../../services/auth.service', () => ({
  authService: { register: vi.fn(), login: vi.fn(), updateProfile: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyEmail: vi.fn() },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn(), logout: vi.fn(), updateUser: vi.fn(), user: { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN' } }),
}));

describe('[Rendimiento] RF-01 — evaluación de la fuerza de la contraseña', () => {
  it('evalúa 10.000 contraseñas dentro del presupuesto', async () => {
    const candidatas = ['debil', 'Segura123', 'StrongP@ss1234', 'SEGURA123456!', 'segura123456!', ''];
    let fuertes = 0;

    const duracion = await elapsedMs(() => {
      for (let i = 0; i < 10_000; i++) {
        if (checkPasswordStrength(candidatas[i % candidatas.length]).isStrong) fuertes++;
      }
    });

    // Solo 'StrongP@ss1234' (posición 2 de 6) cumple todas las reglas: 1.667 de 10.000 iteraciones.
    expect(fuertes).toBe(1667);
    expect(duracion, `10.000 evaluaciones tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(8_000);
  });

  it('el medidor se vuelve a renderizar 200 veces con contraseñas distintas dentro del presupuesto', async () => {
    const { rerender } = render(<PasswordStrengthMeter password="a" />);

    const duracion = await elapsedMs(() => {
      for (let i = 0; i < 200; i++) {
        rerender(<PasswordStrengthMeter password={`Clave${i}!x`.repeat(2)} />);
      }
    });

    expect(screen.getByText('Nivel de seguridad:')).toBeInTheDocument();
    expect(duracion, `200 renders tardaron ${duracion.toFixed(1)} ms`).toBeLessThan(12_000);
  });
});

describe('[Rendimiento] RF-01 — escribir una contraseña en el formulario de registro', () => {
  it('escribir 30 caracteres (con evaluación de fuerza en cada tecla) cabe en el presupuesto', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);

    const duracion = await elapsedMs(async () => {
      await user.type(screen.getByLabelText('Contraseña segura'), 'StrongP@ssword1234StrongP@ss12');
    });

    expect(screen.getByText('Fuerte y Segura ✨')).toBeInTheDocument();
    expect(duracion, `Escribir tardó ${duracion.toFixed(1)} ms`).toBeLessThan(20_000);
  });
});

describe('[Rendimiento] RF-02 / RF-22 — montaje de pantallas', () => {
  it('LoginPage se monta con una latencia mediana razonable (mediana de 5 montajes)', async () => {
    const mediana = await medianMs(5, () => {
      const { unmount } = render(<MemoryRouter><LoginPage /></MemoryRouter>);
      unmount();
    });

    expect(mediana, `La mediana fue ${mediana.toFixed(1)} ms`).toBeLessThan(5_000);
  });

  it('el menú lateral de un administrador se monta dentro del presupuesto e incluye el ítem Admin', async () => {
    const duracion = await elapsedMs(() => {
      render(<MemoryRouter><Sidebar /></MemoryRouter>);
    });

    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(duracion, `El montaje tardó ${duracion.toFixed(1)} ms`).toBeLessThan(8_000);
  });
});
