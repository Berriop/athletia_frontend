import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InjuriesPage } from '../../pages/InjuriesPage';
import { injuryService } from '../../services/injury.service';
import type { Injury } from '../../types';

// RF-18 (crear), RF-20 (modificar) y RF-21 (eliminar) lesión. handleCreate
// (RF-18) y handleUpdate (RF-20) son funciones independientes desde el
// refactor pedido por el profesor (antes eran una sola handleSubmit con un
// if/else) — ver "RF-21 Front (InjuriesPage.confirmDelete)" (Patrón D,
// V(G)=4) para el camino de eliminar. Ver la nota sobre `addNotification`/
// Header en SleepPage.test.tsx.
//
// Nota real encontrada al escribir esta prueba: en el catch de handleCreate,
// el mensaje que se muestra en pantalla (setError → "Error al reportar
// lesión") NO es el mismo texto que se envía a la notificación
// (addNotification → "Error al registrar lesión") para el camino de crear.
// Es una inconsistencia real del código, no un error de esta prueba — cada
// aserción usa el texto exacto que corresponde a cada uno.
vi.mock('../../services/injury.service', () => ({
  injuryService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

function renderPage() {
  return render(<InjuriesPage />);
}

const existingInjury: Injury = {
  id: 'injury-1',
  bodyArea: 'Rodilla derecha',
  injuryName: 'Esguince',
  severity: 6,
  isActive: true,
  notes: null,
  userId: 'user-1',
  createdAt: new Date('2026-08-01').toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Injury;

describe('InjuriesPage.handleCreate (RF-18) / handleUpdate (RF-20)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  // Camino RF-18: INICIO,1,2,4,5,6,FIN
  it('RF-18: sin edición en curso → llama a create y notifica éxito', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(injuryService.create).mockResolvedValue({} as Injury);
    renderPage();
    // Campos obligatorios
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis');

    // Act
    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    // Assert
    await waitFor(() => expect(injuryService.create).toHaveBeenCalledTimes(1));
    expect(injuryService.update).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith('Lesión registrada correctamente', 'success');
  });

  // Camino RF-20: INICIO,1,2,3,5,6,FIN
  it('RF-20: editando una lesión existente → llama a update y notifica éxito', async () => {
    // Arrange
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [existingInjury], meta: {} } as any);
    vi.mocked(injuryService.update).mockResolvedValue({} as Injury);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Lesión' }));

    // Assert
    await waitFor(() => expect(injuryService.update).toHaveBeenCalledWith('injury-1', expect.anything()));
    expect(addNotification).toHaveBeenCalledWith('Lesión actualizada correctamente', 'success');
  });

  // Camino de error (aplica a RF-18 y RF-20): INICIO,1,2,{3 ó 4},5,7,FIN
  it('la llamada al backend falla → muestra el error en pantalla y notifica el fallo', async () => {
    // Arrange
    vi.mocked(injuryService.create).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis');

    // Act
    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    // Assert (texto en pantalla vs. texto de la notificación difieren — ver nota arriba)
    expect(await screen.findByText('Error al reportar lesión')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('Error al registrar lesión', 'error');
  });

  // Hallazgo real: el backend sí manda el detalle específico de la validación
  // (Zod), pero antes el catch lo ignoraba y siempre mostraba el mismo texto
  // genérico. Estas dos pruebas cubren que ahora sí se muestra ese mensaje.
  it('el backend rechaza por validación (ej. nombre > 250 caracteres) → muestra el mensaje específico, no el genérico', async () => {
    // Arrange
    vi.mocked(injuryService.create).mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ field: 'injuryName', message: 'El nombre de la lesión no puede superar los 250 caracteres' }],
          },
        },
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis');

    // Act
    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    // Assert
    expect(await screen.findByText('El nombre de la lesión no puede superar los 250 caracteres')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith(
      'El nombre de la lesión no puede superar los 250 caracteres',
      'error',
    );
  });

  it('al editar, el backend rechaza por validación → también muestra el mensaje específico', async () => {
    // Arrange
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [existingInjury], meta: {} } as any);
    vi.mocked(injuryService.update).mockRejectedValue({
      response: {
        data: {
          error: {
            details: [{ field: 'bodyArea', message: 'El área del cuerpo solo puede contener letras y espacios' }],
          },
        },
      },
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Lesión' }));

    // Assert
    expect(await screen.findByText('El área del cuerpo solo puede contener letras y espacios')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('El área del cuerpo solo puede contener letras y espacios', 'error');
  });

  // Hallazgo real: los campos de texto aceptaban números y símbolos. Ahora
  // tienen `pattern` en el HTML, así que el navegador bloquea el envío antes
  // de que React vea el evento — igual que el patrón ya usado para `required`
  // en ForgotPasswordPage.test.tsx.
  it('nombre de la lesión con caracteres no permitidos (números/símbolos) → el navegador bloquea el envío', async () => {
    // Arrange
    vi.mocked(injuryService.create).mockClear(); // limpia llamadas de pruebas anteriores en este archivo
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Área del cuerpo'), 'Hombro');
    await user.type(screen.getByLabelText('Nombre de la lesión'), 'Tendinitis2!');

    // Act
    await user.click(screen.getByRole('button', { name: 'Registrar Lesión' }));

    // Assert
    expect(injuryService.create).not.toHaveBeenCalled();
  });
});

describe('InjuriesPage.confirmDelete (RF-21)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(injuryService.getAll).mockResolvedValue({ data: [existingInjury], meta: {} } as any);
  });

  // Camino: INICIO,1,2,3,4,FIN
  it('Camino: la eliminación falla → notifica error y la lesión sigue en la lista', async () => {
    // Arrange
    vi.mocked(injuryService.delete).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al eliminar la lesión', 'error'));
    expect(screen.getByText('Esguince')).toBeInTheDocument();
  });

  // Camino: INICIO,1,2,3,5,6,8,FIN
  it('Camino: se elimina bien y no estaba en edición → desaparece de la lista', async () => {
    // Arrange
    vi.mocked(injuryService.delete).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Lesión eliminada correctamente', 'success'));
    await waitFor(() => expect(screen.queryByText('Esguince')).not.toBeInTheDocument());
  });

  // Camino: INICIO,1,2,3,5,6,7,8,FIN
  it('Camino: se elimina bien y SÍ estaba en edición → además limpia el formulario', async () => {
    // Arrange
    vi.mocked(injuryService.delete).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));
    expect(screen.getByText('Modo Edición')).toBeInTheDocument();

    // Act
    await user.click(screen.getByTitle('Eliminar'));
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(screen.queryByText('Modo Edición')).not.toBeInTheDocument());
  });
});
