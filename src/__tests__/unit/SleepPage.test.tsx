import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  date: new Date('2026-08-01').toISOString(),
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
  it('RF-16: editando un registro existente → llama a update y notifica éxito', async () => {
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
