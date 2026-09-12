import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../../layouts/PublicLayout';

describe('PublicLayout', () => {
  it('renderiza el PublicNavbar, el Footer y el contenido de la ruta hija (Outlet)', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/about" element={<div>Contenido Sobre Nosotros</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Iniciar Sesión' })).toBeInTheDocument(); // PublicNavbar
    expect(screen.getByText('Contenido Sobre Nosotros')).toBeInTheDocument(); // Outlet
    expect(screen.getByText('Athletia © 2026')).toBeInTheDocument(); // Footer
  });
});
