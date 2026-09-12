import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from '../../pages/NotFoundPage';

describe('NotFoundPage', () => {
  it('renderiza el mensaje 404 y el link de vuelta al dashboard', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al Dashboard' })).toHaveAttribute('href', '/dashboard');
  });
});
