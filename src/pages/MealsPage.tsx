import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Meal } from '../types';
import { mealService } from '../services/meal.service';
import type { CreateMealDTO } from '../services/meal.service';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const MealsPage: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Form states
  const [name, setName] = useState('');
  const [calories, setCalories] = useState(500);
  const [mealType, setMealType] = useState('lunch');
  const [protein, setProtein] = useState(30);
  const [carbs, setCarbs] = useState(50);
  const [fat, setFat] = useState(15);

  const fetchMeals = async () => {
    try {
      const response = await mealService.getAll(1, 50);
      setMeals(response.data);
    } catch (err) {
      setError('Error al cargar comidas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const resetForm = () => {
    setName('');
    setCalories(500);
    setMealType('lunch');
    setProtein(30);
    setCarbs(50);
    setFat(15);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data: CreateMealDTO = {
        name,
        calories,
        mealType,
        proteinG: protein,
        carbsG: carbs,
        fatG: fat,
        date: new Date().toISOString()
      };
      
      if (editingId) {
        await mealService.update(editingId, data);
        addNotification('Comida actualizada correctamente', 'success');
      } else {
        await mealService.create(data);
        addNotification('Comida registrada correctamente', 'success');
      }
      
      resetForm();
      await fetchMeals();
    } catch (err) {
      setError(editingId ? 'Error al actualizar comida. Verifica los campos.' : 'Error al crear comida. Verifica los campos.');
      addNotification(editingId ? 'Error al actualizar comida' : 'Error al registrar comida', 'error');
      setIsLoading(false);
    }
  };

  const handleEdit = (meal: Meal) => {
    setEditingId(meal.id);
    setName(meal.name);
    setCalories(meal.calories);
    setMealType(meal.mealType);
    setProtein(meal.proteinG);
    setCarbs(meal.carbsG);
    setFat(meal.fatG);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await mealService.delete(deleteId);
      addNotification('Comida eliminada correctamente', 'success');
      
      if (editingId === deleteId) {
        resetForm();
      }
      
      setMeals(prev => prev.filter(m => m.id !== deleteId));
    } catch (err) {
      addNotification('Error al eliminar la comida', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Alimentación</h1>
      <p className="page-subtitle">Controla tus macros y calorías</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem', position: 'relative' }}>
        {editingId && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--accent)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Modo Edición
          </div>
        )}
        <h3>{editingId ? 'Editar Comida' : 'Registrar Comida'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="name" style={{ fontSize: '0.9rem' }}>Nombre de la comida</label>
            <input id="name" required type="text" placeholder="Ej. Pollo con Arroz" value={name} onChange={e => setName(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="mealType" style={{ fontSize: '0.9rem' }}>Tipo</label>
            <select id="mealType" value={mealType} onChange={e => setMealType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-card)' }}>
              <option value="breakfast">Desayuno</option>
              <option value="lunch">Almuerzo</option>
              <option value="dinner">Cena</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="calories" style={{ fontSize: '0.9rem' }}>Calorías</label>
            <input id="calories" type="number" min="0" value={calories} onChange={e => setCalories(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="protein" style={{ fontSize: '0.9rem' }}>Proteína (g)</label>
            <input id="protein" type="number" min="0" value={protein} onChange={e => setProtein(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="carbs" style={{ fontSize: '0.9rem' }}>Carbohidratos (g)</label>
            <input id="carbs" type="number" min="0" value={carbs} onChange={e => setCarbs(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="fat" style={{ fontSize: '0.9rem' }}>Grasa (g)</label>
            <input id="fat" type="number" min="0" value={fat} onChange={e => setFat(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
              {isLoading ? 'Guardando...' : (editingId ? 'Actualizar Comida' : 'Guardar Comida')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} disabled={isLoading} className="btn-secondary" style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading && meals.length === 0 ? <p>Cargando...</p> : null}
        {!isLoading && meals.length === 0 ? <p>No hay comidas registradas.</p> : null}
        {meals.map(m => (
          <div key={m.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent)' }}>{m.name}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{m.mealType} - {m.calories} kcal</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ margin: 0 }}>P: {m.proteinG}g / C: {m.carbsG}g / G: {m.fatG}g</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(m)} title="Editar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteId(m.id)} title="Eliminar" style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0.25rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p style={{ margin: 0 }}>{new Date(m.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Eliminar Comida"
        message="¿Estás seguro de que deseas eliminar esta comida? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
