import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter } from '../../routes/AppRouter';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';

function renderAt(path: string) {
  return render(
    <NotificationProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRouter />
        </MemoryRouter>
      </AuthProvider>
    </NotificationProvider>,
  );
}

describe('AppRouter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('"/" sin sesión → renderiza la Landing Page dentro del PublicLayout', async () => {
    renderAt('/');
    expect(await screen.findByRole('link', { name: /Comenzar/ })).toBeInTheDocument();
    expect(screen.getByText('Athletia © 2026')).toBeInTheDocument(); // Footer del PublicLayout
  });

  it('ruta protegida ("/dashboard") sin sesión → redirige a /login', async () => {
    renderAt('/dashboard');
    expect(await screen.findByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('ruta inexistente → muestra la página 404', async () => {
    renderAt('/esto-no-existe');
    expect(await screen.findByText('404')).toBeInTheDocument();
  });
});
