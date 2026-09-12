import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../pages/LandingPage';

describe('LandingPage', () => {
  it('renderiza el hero, las 4 features y los 4 beneficios', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    // Hero
    expect(screen.getByRole('link', { name: /Comenzar/ })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('link', { name: 'Iniciar Sesión' })).toHaveAttribute('href', '/login');

    // FeatureCard x4
    expect(screen.getByText('Seguimiento de Entrenamientos')).toBeInTheDocument();
    expect(screen.getByText('Control Nutricional')).toBeInTheDocument();
    expect(screen.getByText('Análisis de Sueño')).toBeInTheDocument();
    expect(screen.getByText('Gestión de Lesiones')).toBeInTheDocument();

    // BenefitItem x4
    expect(screen.getByText('Mejores perspectivas de rendimiento')).toBeInTheDocument();
    expect(screen.getByText('Control de la recuperación')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento del progreso')).toBeInTheDocument();
    expect(screen.getByText('Datos atléticos centralizados')).toBeInTheDocument();

    // CTA final
    expect(screen.getByRole('link', { name: 'Crear una cuenta' })).toHaveAttribute('href', '/register');
  });
});
