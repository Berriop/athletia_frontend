import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SleepPage } from '../../pages/SleepPage';
import { sleepService } from '../../services/sleep.service';
import type { SleepLog } from '../../types';

// RF-14 (crear), RF-16 (modificar) y RF-17 (eliminar) registro de sueño.
// handleCreate (RF-14) y handleUpdate (RF-16) son funciones independientes
// desde el refactor pedido por el profesor (antes eran una sola handleSubmit
// con un if/else) — ver "RF-17 Front (SleepPage.confirmDelete)" (Patrón D,
// V(G)=4) para el camino de eliminar.
//
// Nota: `addNotification` solo se pinta visualmente en <Header>, que no
// forma parte de esta página. Por eso se espía el hook `useNotification` en
// vez de buscar el texto de la notificación en el DOM — así se prueba
// exactamente lo que hace la función (qué llama y con qué mensaje), no cómo
// otro componente decide mostrarlo.
vi.mock('../../services/sleep.service', () => ({
  sleepService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

function renderPage() {
  return render(<SleepPage />);
}

const existingSleep: SleepLog = {
  id: 'sleep-1',
  hoursSlept: 8,
  sleepQuality: 9,
  hadNightmares: false,
  stressLevel: 3,
  notes: null,
  // Mediodía UTC: en cualquier zona horaria realista la fecha local es 2026-08-01
  date: new Date('2026-08-01T12:00:00.000Z').toISOString(),
  userId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as SleepLog;

describe('SleepPage.handleCreate (RF-14) / handleUpdate (RF-16)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  // Camino RF-14: INICIO,1,2,4,5,6,FIN (editingId=null → crear)
  it('RF-14: sin edición en curso → llama a create y notifica éxito', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(sleepService.create).mockResolvedValue({} as SleepLog);
    renderPage();

    // Act
    await user.click(await screen.findByRole('button', { name: 'Guardar Registro' }));

    // Assert
    await waitFor(() => expect(sleepService.create).toHaveBeenCalledTimes(1));
    expect(sleepService.update).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith('Registro de sueño creado', 'success');
  });

  // Camino RF-16: INICIO,1,2,3,5,6,FIN (editingId≠null → actualizar)
  it('RF-16: editando un registro existente → llama a update, preserva la fecha original y notifica éxito', async () => {
    // Arrange
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
    vi.mocked(sleepService.update).mockResolvedValue({} as SleepLog);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));
    expect(screen.getByText('Modo Edición')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Registro' }));

    // Assert
    await waitFor(() => expect(sleepService.update).toHaveBeenCalledWith('sleep-1', expect.anything()));
    // La fecha del registro se conserva (2026-08-01) en vez de resetearse a hoy.
    // Se compara con la misma expresión local-medianoche que usa la página para
    // que el test sea determinista en cualquier zona horaria del runner.
    expect(sleepService.update).toHaveBeenCalledWith(
      'sleep-1',
      expect.objectContaining({ date: new Date('2026-08-01T00:00:00').toISOString() }),
    );
    // Regresión TZ (UTC-): el instante guardado debe renderizar al día local elegido.
    const payload = vi.mocked(sleepService.update).mock.calls[0][1] as { date: string };
    const sent = new Date(payload.date);
    const localDay = `${sent.getFullYear()}-${String(sent.getMonth() + 1).padStart(2, '0')}-${String(sent.getDate()).padStart(2, '0')}`;
    expect(localDay).toBe('2026-08-01');
    expect(addNotification).toHaveBeenCalledWith('Registro de sueño actualizado', 'success');
  });

  // Camino de error (aplica a RF-14 y RF-16): INICIO,1,2,{3 ó 4},5,7,FIN
  it('la llamada al backend falla → muestra el error en pantalla y notifica el fallo', async () => {
    // Arrange
    vi.mocked(sleepService.create).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();

    // Act
    await user.click(await screen.findByRole('button', { name: 'Guardar Registro' }));

    // Assert
    expect(await screen.findByText('Error al guardar el registro')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('Error al guardar el registro', 'error');
  });
});

describe('SleepPage.confirmDelete (RF-17)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
  });

  // Camino: INICIO,1,2,3,4,FIN
  it('Camino: la eliminación falla → notifica error y el registro sigue en la lista', async () => {
    // Arrange
    vi.mocked(sleepService.delete).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));
    expect(screen.getByText('Eliminar Registro de Sueño')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al eliminar el registro', 'error'));
    expect(screen.getByText('8 horas')).toBeInTheDocument(); // sigue en la lista
  });

  // Camino: INICIO,1,2,3,5,6,8,FIN (no era el que se estaba editando)
  it('Camino: se elimina bien y no estaba en edición → desaparece de la lista', async () => {
    // Arrange
    vi.mocked(sleepService.delete).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));
    expect(screen.getByText('Eliminar Registro de Sueño')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith('Registro eliminado correctamente', 'success'),
    );
    await waitFor(() => expect(screen.queryByText('8 horas')).not.toBeInTheDocument());
  });

  // Camino: INICIO,1,2,3,5,6,7,8,FIN (sí era el que se estaba editando)
  it('Camino: se elimina bien y SÍ estaba en edición → además limpia el formulario', async () => {
    // Arrange
    vi.mocked(sleepService.delete).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));
    expect(screen.getByText('Modo Edición')).toBeInTheDocument();
    await user.click(screen.getByTitle('Eliminar'));
    expect(screen.getByText('Eliminar Registro de Sueño')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(screen.queryByText('Modo Edición')).not.toBeInTheDocument());
  });
});

describe('SleepPage casos extra (carga, campos, pesadillas, cancelar diálogo)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(sleepService.create).mockClear();
    vi.mocked(sleepService.delete).mockClear();
  });

  // fetchSleeps en error (catch)
  it('la carga inicial falla → muestra "Error al cargar registros de sueño"', async () => {
    // Arrange
    vi.mocked(sleepService.getAll).mockRejectedValue(new Error('network error'));

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('Error al cargar registros de sueño')).toBeInTheDocument();
  });

  // handleUpdate en error (catch: líneas 83-85)
  it('al actualizar, el backend falla → "Error al actualizar el registro"', async () => {
    // Arrange
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
    vi.mocked(sleepService.update).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Registro' }));

    // Assert
    expect(await screen.findByText('Error al actualizar el registro')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('Error al actualizar el registro', 'error');
  });

  // Inputs onChange (horas, calidad, estrés, fecha, pesadillas, notas)
  it('modifica todos los campos → el DTO refleja los nuevos valores y la fecha local', async () => {
    // Arrange
    vi.mocked(sleepService.create).mockResolvedValue({} as SleepLog);
    const user = userEvent.setup();
    renderPage();

    // Act
    const hours = await screen.findByLabelText('Horas de sueño');
    await user.clear(hours);
    await user.type(hours, '7.5');
    const quality = screen.getByLabelText('Calidad del sueño (1-10)');
    await user.clear(quality);
    await user.type(quality, '6');
    const stress = screen.getByLabelText('Nivel de estrés (1-10)');
    await user.clear(stress);
    await user.type(stress, '8');
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-08-02' } });
    await user.click(screen.getByLabelText('¿Tuviste pesadillas?'));
    const notes = screen.getByLabelText('Notas adicionales');
    await user.type(notes, 'Me desperté a las 3am');
    await user.click(screen.getByRole('button', { name: 'Guardar Registro' }));

    // Assert
    await waitFor(() =>
      expect(sleepService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          hoursSlept: 7.5,
          sleepQuality: 6,
          stressLevel: 8,
          hadNightmares: true,
          notes: 'Me desperté a las 3am',
          date: new Date('2026-08-02T00:00:00').toISOString(),
        }),
      ),
    );
  });

  // Rama del ternario hadNightmares (s.hadNightmares truthy)
  it('un registro con pesadillas → muestra "Pesadillas ⚠️"', async () => {
    // Arrange
    const nightmareSleep: SleepLog = {
      ...existingSleep,
      hadNightmares: true,
    } as unknown as SleepLog;
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [nightmareSleep], meta: {} } as any);

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('Pesadillas ⚠️')).toBeInTheDocument();
  });

  // Botón Cancelar del ConfirmDialog (onCancel)
  it('al confirmar la eliminación, "Cancelar" cierra el diálogo sin eliminar', async () => {
    // Arrange
    vi.mocked(sleepService.getAll).mockResolvedValue({ data: [existingSleep], meta: {} } as any);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));
    expect(screen.getByText('Eliminar Registro de Sueño')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Assert
    await waitFor(() => expect(screen.queryByText('Eliminar Registro de Sueño')).not.toBeInTheDocument());
    expect(sleepService.delete).not.toHaveBeenCalled();
    expect(screen.getByText('8 horas')).toBeInTheDocument();
  });
});
