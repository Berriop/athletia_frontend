import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  // Mediodía UTC: en cualquier zona horaria realista la fecha local es 2026-08-01
  date: new Date('2026-08-01T12:00:00.000Z').toISOString(),
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
    // La fecha del registro se conserva (2026-08-01) en vez de resetearse a hoy.
    // Se compara con la misma expresión local-medianoche que usa la página para
    // que el test sea determinista en cualquier zona horaria del runner.
    expect(mealService.update).toHaveBeenCalledWith(
      'meal-1',
      expect.objectContaining({ date: new Date('2026-08-01T00:00:00').toISOString() }),
    );
    // Regresión TZ (UTC-): el instante guardado debe renderizar al día local elegido.
    const payload = vi.mocked(mealService.update).mock.calls[0][1] as { date: string };
    const sent = new Date(payload.date);
    const localDay = `${sent.getFullYear()}-${String(sent.getMonth() + 1).padStart(2, '0')}-${String(sent.getDate()).padStart(2, '0')}`;
    expect(localDay).toBe('2026-08-01');
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

  /// Camino: INICIO,1,2,3,5,6,7,8,FIN
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

describe('MealsPage casos extra (carga, campos, tipo desconocido, cancelar diálogo)', () => {
  beforeEach(() => {
    addNotification.mockClear();
    vi.mocked(mealService.create).mockClear();
    vi.mocked(mealService.delete).mockClear();
  });

  // fetchMeals en error (catch)
  it('la carga inicial falla → muestra "Error al cargar comidas"', async () => {
    // Arrange
    vi.mocked(mealService.getAll).mockRejectedValue(new Error('network error'));

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText('Error al cargar comidas')).toBeInTheDocument();
  });

  // HandleUpdate en error (catch: líneas 112-115)
  it('al actualizar, el backend falla → "Error al actualizar comida"', async () => {
    // Arrange
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [existingMeal], meta: {} } as any);
    vi.mocked(mealService.update).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Editar'));

    // Act
    await user.click(screen.getByRole('button', { name: 'Actualizar Comida' }));

    // Assert
    expect(await screen.findByText('Error al actualizar comida')).toBeInTheDocument();
    expect(addNotification).toHaveBeenCalledWith('Error al actualizar comida', 'error');
  });

  // Inputs onChange (101,105,109,113,117,122 según el diagrama):
  // select de tipo, calorías, proteína, carbohidratos, grasa y fecha
  it('modifica todos los campos → el DTO refleja los nuevos valores y la fecha local', async () => {
    // Arrange
    vi.mocked(mealService.create).mockResolvedValue({} as Meal);
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Nombre de la comida'), 'Ensalada');

    // Act
    await user.selectOptions(screen.getByLabelText('Tipo de comida'), 'DINNER');
    const calories = screen.getByLabelText('Calorías');
    await user.clear(calories);
    await user.type(calories, '300');
    const protein = screen.getByLabelText('Proteína (g)');
    await user.clear(protein);
    await user.type(protein, '25');
    const carbs = screen.getByLabelText('Carbohidratos (g)');
    await user.clear(carbs);
    await user.type(carbs, '40');
    const fat = screen.getByLabelText('Grasa (g)');
    await user.clear(fat);
    await user.type(fat, '10');
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-08-02' } });
    await user.click(screen.getByRole('button', { name: 'Guardar Comida' }));

    // Assert
    await waitFor(() =>
      expect(mealService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ensalada',
          mealType: 'DINNER',
          calories: 300,
          proteinG: 25,
          carbsG: 40,
          fatG: 10,
          date: new Date('2026-08-02T00:00:00').toISOString(),
        }),
      ),
    );
  });

  // Fallback del label para mealType desconocido (?? m.mealType)
  it('un mealType fuera del mapa de etiquetas → se muestra el valor tal cual', async () => {
    // Arrange
    const weirdMeal: Meal = {
      ...existingMeal,
      mealType: 'SMOOTHIE',
    } as unknown as Meal;
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [weirdMeal], meta: {} } as any);

    // Act
    renderPage();

    // Assert
    expect(await screen.findByText(/SMOOTHIE · 600 kcal/)).toBeInTheDocument();
  });

  // Botón Cancelar del ConfirmDialog (onCancel)
  it('al confirmar la eliminación, "Cancelar" cierra el diálogo sin eliminar', async () => {
    // Arrange
    vi.mocked(mealService.getAll).mockResolvedValue({ data: [existingMeal], meta: {} } as any);
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByTitle('Eliminar'));
    expect(screen.getByText('Eliminar Comida')).toBeInTheDocument();

    // Act
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Assert
    await waitFor(() => expect(screen.queryByText('Eliminar Comida')).not.toBeInTheDocument());
    expect(mealService.delete).not.toHaveBeenCalled();
    expect(screen.getByText('Pollo con arroz')).toBeInTheDocument();
  });
});
