import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../routes/ProtectedRoute';

// ProtectedRoute: V(G)=3 (loading / no autenticado / autenticado).
let mockAuth = { isAuthenticated: false, isLoading: false };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Contenido Protegido</div>} />
        </Route>
        <Route path="/login" element={<div>Página de Login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  // Camino 1: isLoading=true → muestra el spinner, no decide auth todavía
  it('Camino 1: mientras carga la sesión → muestra el spinner y no navega', () => {
    mockAuth = { isAuthenticated: false, isLoading: true };
    const { container } = renderWithRoute();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
    expect(screen.queryByText('Página de Login')).not.toBeInTheDocument();
  });

  // Camino 2: no autenticado → redirige a /login
  it('Camino 2: no autenticado → redirige a /login', () => {
    mockAuth = { isAuthenticated: false, isLoading: false };
    renderWithRoute();
    expect(screen.getByText('Página de Login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
  });

  // Camino 3: autenticado → renderiza el Outlet (contenido protegido)
  it('Camino 3: autenticado → renderiza el contenido protegido', () => {
    mockAuth = { isAuthenticated: true, isLoading: false };
    renderWithRoute();
    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });
});
