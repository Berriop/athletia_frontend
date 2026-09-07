import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutsPage } from '../../pages/WorkoutsPage';
import { workoutService } from '../../services/workout.service';
import type { Workout } from '../../types';

// RF-06 (crear), RF-08 (modificar) y RF-09 (eliminar) entrenamiento. Basado
// en los diagramas "RF-06 Front (WorkoutsPage.handleSubmit)" (Patrón C,
// V(G)=3, compartido con RF-08) y "RF-09 Front (WorkoutsPage.confirmDelete)"
// (Patrón D, V(G)=4). Ver la nota sobre `addNotification`/Header en
// SleepPage.test.tsx — misma estrategia aquí.
vi.mock('../../services/workout.service', () => ({
  workoutService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

function renderPage() {
  return render(<WorkoutsPage />);
}

const existingWorkout: Workout = {
  id: 'workout-1',
  title: 'Pierna',
  description: null,
  bodyPart: 'LEGS',
  durationMinutes: 45,
  energyLevel: 7,
  fatigueLevel: 6,
  painLevel: 2,
  date: new Date('2026-08-01').toISOString(),
  userId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Workout;

describe('WorkoutsPage.handleSubmit (RF-06 crear / RF-08 modificar)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  // Camino RF-06: INICIO,1,2,4,5,6,FIN
  it('RF-06: sin edición en curso → llama a create y notifica éxito', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(workoutService.create).mockResolvedValue({} as Workout);
    renderPage();
    await user.type(await screen.findByLabelText('Título'), 'Pierna'); // campo obligatorio

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar Entrenamiento' }));

    // Assert
    await waitFor(() => expect(workoutService.create).toHaveBeenCalledTimes(1));
    expect(workoutService.update).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith('Entrenamiento creado correctamente', 'success');
  });

  // Camino RF-08: INICIO,1,2,3,5,6,FIN
  it('RF-08: editando un entrenamiento existente → llama a update y notifica éxito', async () => {
    // Arrange
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [existingWorkout], meta: {} } as any);
    vi.mocked(workoutService.update).mockResolvedValue({} as Workout);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Entrenamiento' }));

    // Assert
    await waitFor(() => expect(workoutService.update).toHaveBeenCalledWith('workout-1', expect.anything()));
    expect(addNotification).toHaveBeenCalledWith('Entrenamiento actualizado correctamente', 'success');
  });

  // Camino de error (aplica a RF-06 y RF-08): INICIO,1,2,{3 ó 4},5,7,FIN
  it('la llamada al backend falla → muestra el error y notifica el fallo', async () => {
    // Arrange
    vi.mocked(workoutService.create).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Título'), 'Pierna'); // campo obligatorio

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar Entrenamiento' }));

    // Assert
    expect(await screen.findByText('Error al crear entrenamiento')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('Error al crear entrenamiento', 'error');
  });
});

describe('WorkoutsPage.confirmDelete (RF-09)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [existingWorkout], meta: {} } as any);
  });

  // Camino: INICIO,1,2,3,4,FIN
  it('Camino: la eliminación falla → notifica error y el entrenamiento sigue en la lista', async () => {
    // Arrange
    vi.mocked(workoutService.delete).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al eliminar el entrenamiento', 'error'));
    expect(screen.getByText('Pierna')).toBeInTheDocument();
  });

  // Camino: INICIO,1,2,3,5,6,8,FIN
  it('Camino: se elimina bien y no estaba en edición → desaparece de la lista', async () => {
    // Arrange
    vi.mocked(workoutService.delete).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() =>
      expect(addNotification).toHaveBeenCalledWith('Entrenamiento eliminado correctamente', 'success'),
    );
    await waitFor(() => expect(screen.queryByText('Pierna')).not.toBeInTheDocument());
  });

  // Camino: INICIO,1,2,3,5,6,7,8,FIN
  it('Camino: se elimina bien y SÍ estaba en edición → además limpia el formulario', async () => {
    // Arrange
    vi.mocked(workoutService.delete).mockResolvedValue(undefined);
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

describe('WorkoutsPage casos extra (carga, edición de campos, cancelar diálogo)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(workoutService.create).mockClear();
    vi.mocked(workoutService.delete).mockClear();
  });

  // fetchWorkouts en error (catch)
  it('la carga inicial falla → muestra "Error al cargar entrenamientos"', async () => {
    // Arrange
    vi.mocked(workoutService.getAll).mockRejectedValue(new Error('network error'));

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('Error al cargar entrenamientos')).toBeInTheDocument();
  });

  // Fallback de error al actualizar (rama editingId=true del ternario)
  it('al actualizar, el backend falla sin mensaje → "Error al actualizar entrenamiento"', async () => {
    // Arrange
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [existingWorkout], meta: {} } as any);
    vi.mocked(workoutService.update).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Entrenamiento' }));

    // Assert
    expect(await screen.findByText('Error al actualizar entrenamiento')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('Error al actualizar entrenamiento', 'error');
  });

  // Inputs onChange (bodyPart, duration, energy, fatigue, pain)
  it('modifica todos los campos → el DTO enviado refleja los nuevos valores', async () => {
    // Arrange
    vi.mocked(workoutService.create).mockResolvedValue({} as Workout);
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Título'), 'Pierna');

    // Act
    await user.selectOptions(screen.getByLabelText('Parte del cuerpo'), 'CARDIO');
    const duration = screen.getByLabelText('Duración (min)');
    await user.clear(duration);
    await user.type(duration, '60');
    const energy = screen.getByLabelText('Energía (1-10)');
    await user.clear(energy);
    await user.type(energy, '8');
    const fatigue = screen.getByLabelText('Fatiga (1-10)');
    await user.clear(fatigue);
    await user.type(fatigue, '3');
    const pain = screen.getByLabelText('Dolor (1-10)');
    await user.clear(pain);
    await user.type(pain, '5');
    await user.click(screen.getByRole('button', { name: 'Guardar Entrenamiento' }));

    // Assert
    await waitFor(() =>
      expect(workoutService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Pierna',
          bodyPart: 'CARDIO',
          durationMinutes: 60,
          energyLevel: 8,
          fatigueLevel: 3,
          painLevel: 5,
        }),
      ),
    );
  });

  // Fallback del label para bodyPart desconocido (?? w.bodyPart)
  it('un bodyPart fuera del mapa de etiquetas → se muestra el valor tal cual', async () => {
    // Arrange
    const weirdWorkout: Workout = {
      ...existingWorkout,
      bodyPart: 'STRETCHING',
    } as unknown as Workout;
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [weirdWorkout], meta: {} } as any);

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText(/STRETCHING · 45 min/)).toBeInTheDocument();
  });

  // Botón Cancelar del ConfirmDialog (onCancel)
  it('al confirmar la eliminación, "Cancelar" cierra el diálogo sin eliminar', async () => {
    // Arrange
    vi.mocked(workoutService.getAll).mockResolvedValue({ data: [existingWorkout], meta: {} } as any);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));
    expect(screen.getByText('Eliminar Entrenamiento')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Assert
    await waitFor(() => expect(screen.queryByText('Eliminar Entrenamiento')).not.toBeInTheDocument());
    expect(workoutService.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Pierna')).toBeInTheDocument();
  });
});
