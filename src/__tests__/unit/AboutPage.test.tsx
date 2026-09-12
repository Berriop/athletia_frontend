import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutPage } from '../../pages/AboutPage';

describe('AboutPage', () => {
  it('renderiza el título y las secciones principales', () => {
    render(<AboutPage />);
    expect(screen.getByText('Sobre Nosotros')).toBeInTheDocument();
    expect(screen.getByText('Nuestra Misión')).toBeInTheDocument();
    expect(screen.getByText('Nuestra Visión')).toBeInTheDocument();
    expect(screen.getByText('Tecnologías')).toBeInTheDocument();
    expect(screen.getByText('Equipo')).toBeInTheDocument();
  });
});
