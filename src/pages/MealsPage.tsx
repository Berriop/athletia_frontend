import React, { useState, useEffect } from 'react';
import type { Meal } from '../types';
import { mealService } from '../services/meal.service';
import type { CreateMealDTO } from '../services/meal.service';

export const MealsPage: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
      await mealService.create(data);
      setName('');
      await fetchMeals();
    } catch (err) {
      setError('Error al crear comida. Verifica los campos.');
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Alimentación</h1>
      <p className="page-subtitle">Controla tus macros y calorías</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
        <h3>Registrar Comida</h3>
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
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ gridColumn: 'span 2' }}>{isLoading ? 'Guardando...' : 'Guardar Comida'}</button>
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
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>P: {m.proteinG}g / C: {m.carbsG}g / G: {m.fatG}g</p>
              <p style={{ margin: 0 }}>{new Date(m.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
