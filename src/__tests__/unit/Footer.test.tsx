import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from '../../components/Footer';

describe('Footer', () => {
  it('renderiza la marca y los links de navegación', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByText('Athletia')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nosotros' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/faq');
    expect(screen.getByRole('link', { name: 'Contacto' })).toHaveAttribute('href', '/contact');
  });
});
