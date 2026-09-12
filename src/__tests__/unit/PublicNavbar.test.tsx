import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PublicNavbar } from '../../components/PublicNavbar';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PublicNavbar />
    </MemoryRouter>,
  );
}

describe('PublicNavbar', () => {
  it('en "/" → el link de Inicio queda marcado como activo', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Nosotros' })).not.toHaveClass('active');
  });

  it('en "/about" → el link de Nosotros queda marcado como activo, Inicio no', () => {
    renderAt('/about');
    expect(screen.getByRole('link', { name: 'Nosotros' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveClass('active');
  });

  it('renderiza los accesos de login y registro', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Iniciar Sesión' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Registrarse' })).toHaveAttribute('href', '/register');
  });
});
