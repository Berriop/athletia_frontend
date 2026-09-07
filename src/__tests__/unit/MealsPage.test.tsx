import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealsPage } from '../../pages/MealsPage';
import { mealService } from '../../services/meal.service';
import type { Meal } from '../../types';

// RF-10 (crear), RF-12 (modificar) y RF-13 (eliminar) comida. Basado en los
// diagramas "RF-12 Front (MealsPage.handleUpdate)" (Patrón C, V(G)=3,
// compartido con RF-10) y "RF-13 Front (MealsPage.confirmDelete)" (Patrón D,
// V(G)=4). Al igual que en SleepPage, handleCreate (RF-10) y handleUpdate
// (RF-12) son funciones independientes, cada una con su propio try/catch.
// Ver la nota sobre `addNotification`/Header en SleepPage.test.tsx.
vi.mock('../../services/meal.service', () => ({
  mealService: { getAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const addNotification = vi.fn();
vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ addNotification }),
}));

function renderPage() {
  return render(<MealsPage />);
}

const existingMeal: Meal = {
  id: 'meal-1',
  name: 'Pollo con arroz',
  calories: 600,
  mealType: 'LUNCH',
  proteinG: 40,
  carbsG: 60,
  fatG: 15,
  date: new Date('2026-08-01').toISOString(),
  userId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as unknown as Meal;

describe('MealsPage.handleCreate (RF-10) / handleUpdate (RF-12)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [], meta: {} } as any);
  });

  // Camino RF-10: INICIO,1,2,4,5,6,FIN
  it('RF-10: sin edición en curso → llama a create y notifica éxito', async () => {
    // Arrange
    const user = userEvent.setup();
    vi.mocked(mealService.create).mockResolvedValue({} as Meal);
    renderPage();
    await user.type(await screen.findByLabelText('Nombre de la comida'), 'Ensalada'); // campo obligatorio

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar Comida' }));

    // Assert
    await waitFor(() => expect(mealService.create).toHaveBeenCalledTimes(1));
    expect(mealService.update).not.toHaveBeenCalled();
    expect(addNotification).toHaveBeenCalledWith('Comida registrada correctamente', 'success');
  });

  // Camino RF-12: INICIO,1,2,3,5,6,FIN
  it('RF-12: editando una comida existente → llama a update, preserva la fecha original y notifica éxito', async () => {
    // Arrange
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [existingMeal], meta: {} } as any);
    vi.mocked(mealService.update).mockResolvedValue({} as Meal);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Comida' }));

    // Assert
    await waitFor(() => expect(mealService.update).toHaveBeenCalledWith('meal-1', expect.anything()));
    // La fecha del registro se conserva (2026-08-01) en vez de resetearse a hoy
    expect(mealService.update).toHaveBeenCalledWith(
      'meal-1',
      expect.objectContaining({ date: new Date('2026-08-01').toISOString() }),
    );
    expect(addNotification).toHaveBeenCalledWith('Comida actualizada correctamente', 'success');
  });

  // Camino de error de RF-10 (handleCreate): INICIO,1,2,5,7,FIN
  it('la llamada al backend falla → muestra el error y notifica el fallo', async () => {
    // Arrange
    vi.mocked(mealService.create).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Nombre de la comida'), 'Ensalada'); // campo obligatorio

    // Act
    await user.click(screen.getByRole('button', { name: 'Guardar Comida' }));

    // Assert
    expect(await screen.findByText('Error al crear comida')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('Error al crear comida', 'error');
  });
});

describe('MealsPage.confirmDelete (RF-13)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [existingMeal], meta: {} } as any);
  });

  // Camino: INICIO,1,2,3,4,FIN
  it('Camino: la eliminación falla → notifica error y la comida sigue en la lista', async () => {
    // Arrange
    vi.mocked(mealService.delete).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Error al eliminar la comida', 'error'));
    expect(screen.getByText('Pollo con arroz')).toBeInTheDocument();
  });

  // Camino: INICIO,1,2,3,5,6,8,FIN
  it('Camino: se elimina bien y no estaba en edición → desaparece de la lista', async () => {
    // Arrange
    vi.mocked(mealService.delete).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    // Assert
    await waitFor(() => expect(addNotification).toHaveBeenCalledWith('Comida eliminada correctamente', 'success'));
    await waitFor(() => expect(screen.queryByText('Pollo con arroz')).not.toBeInTheDocument());
  });

  // Camino: INICIO,1,2,3,5,6,7,8,FIN
  it('Camino: se elimina bien y SÍ estaba en edición → además limpia el formulario', async () => {
    // Arrange
    vi.mocked(mealService.delete).mockResolvedValue(undefined);
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
