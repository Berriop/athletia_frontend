import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactPage } from '../../pages/ContactPage';

// RF nuevo — Enviar formulario de contacto. Función lineal (handleSubmit no
// tiene decisiones internas: siempre marca isSubmitted=true), pero el
// renderizado sí ramifica según isSubmitted (form vs. pantalla de
// confirmación), así que se prueban ambos estados.

function renderPage() {
  return render(<ContactPage />);
}

describe('ContactPage.handleSubmit', () => {
  // Camino único: INICIO,1,FIN — formulario completo y enviado
  it('Camino 1: completa el formulario y lo envía → muestra la pantalla de confirmación', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Nombre'), 'Juan Pablo');
    await user.type(screen.getByLabelText('Correo Electrónico'), 'jp@example.com');
    await user.type(screen.getByLabelText('Asunto'), 'Pregunta sobre planes');
    await user.type(screen.getByLabelText('Mensaje'), '¿Cómo puedo cambiar mi plan de entrenamiento?');

    // Act
    await user.click(screen.getByRole('button', { name: 'Enviar Mensaje' }));

    // Assert
    expect(screen.getByText('Gracias por contactar a Athletia.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument();
  });

  it('sin llenar los campos requeridos → el navegador bloquea el envío, no se muestra la confirmación', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(screen.getByRole('button', { name: 'Enviar Mensaje' }));

    // Assert
    expect(screen.queryByText('Gracias por contactar a Athletia.')).not.toBeInTheDocument();
  });

  it('desde la confirmación, "Enviar otro mensaje" → vuelve al formulario con los campos vacíos', async () => {
    // Arrange
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Nombre'), 'Juan Pablo');
    await user.type(screen.getByLabelText('Correo Electrónico'), 'jp@example.com');
    await user.type(screen.getByLabelText('Asunto'), 'Pregunta sobre planes');
    await user.type(screen.getByLabelText('Mensaje'), '¿Cómo puedo cambiar mi plan de entrenamiento?');
    await user.click(screen.getByRole('button', { name: 'Enviar Mensaje' }));

    // Act
    await user.click(screen.getByRole('button', { name: 'Enviar otro mensaje' }));

    // Assert
    const nameInput = screen.getByLabelText('Nombre') as HTMLInputElement;
    expect(nameInput.value).toBe('');
  });
});
