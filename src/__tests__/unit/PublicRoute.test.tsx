import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicRoute } from '../../routes/PublicRoute';

// PublicRoute: V(G)=3 (loading / autenticado → fuera / no autenticado → dentro).
let mockAuth = { isAuthenticated: false, isLoading: false };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}));

function renderWithRoute() {
  return render(
    <MemoryRouter initialEntries={['/public']}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/public" element={<div>Contenido Público</div>} />
        </Route>
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PublicRoute', () => {
  // Camino 1: isLoading=true → muestra el spinner
  it('Camino 1: mientras carga la sesión → muestra el spinner', () => {
    mockAuth = { isAuthenticated: false, isLoading: true };
    const { container } = renderWithRoute();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  // Camino 2: ya autenticado → redirige a /dashboard (no debe ver la landing de nuevo)
  it('Camino 2: ya autenticado → redirige a /dashboard', () => {
    mockAuth = { isAuthenticated: true, isLoading: false };
    renderWithRoute();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Público')).not.toBeInTheDocument();
  });

  // Camino 3: no autenticado → renderiza el contenido público normalmente
  it('Camino 3: no autenticado → renderiza el contenido público', () => {
    mockAuth = { isAuthenticated: false, isLoading: false };
    renderWithRoute();
    expect(screen.getByText('Contenido Público')).toBeInTheDocument();
  });
});
