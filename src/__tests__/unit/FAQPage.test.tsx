import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FAQPage } from '../../pages/FAQPage';

// toggleFaq: el índice 0 empieza abierto por defecto; togglear la misma
// pregunta la cierra, togglear otra distinta abre esa y cierra la anterior.
describe('FAQPage.toggleFaq', () => {
  it('la primera pregunta empieza abierta por defecto', () => {
    render(<FAQPage />);
    const first = screen.getByRole('button', { name: /¿Qué es Athletia\?/ });
    expect(first).toHaveAttribute('aria-expanded', 'true');
  });

  it('Camino: click en la pregunta ya abierta → la cierra', async () => {
    const user = userEvent.setup();
    render(<FAQPage />);
    const first = screen.getByRole('button', { name: /¿Qué es Athletia\?/ });

    await user.click(first);

    expect(first).toHaveAttribute('aria-expanded', 'false');
  });

  it('Camino: click en otra pregunta → la abre y cierra la que estaba abierta', async () => {
    const user = userEvent.setup();
    render(<FAQPage />);
    const first = screen.getByRole('button', { name: /¿Qué es Athletia\?/ });
    const second = screen.getByRole('button', { name: /seguimiento de entrenamientos/ });

    await user.click(second);

    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(first).toHaveAttribute('aria-expanded', 'false');
  });
});
