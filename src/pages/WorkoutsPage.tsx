import React, { useState, useEffect } from 'react';
import type { Workout } from '../types';
import { workoutService } from '../services/workout.service';
import type { CreateWorkoutDTO } from '../services/workout.service';

export const WorkoutsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [duration, setDuration] = useState(30);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [fatigueLevel, setFatigueLevel] = useState(5);
  const [painLevel, setPainLevel] = useState(1);

  const fetchWorkouts = async () => {
    try {
      const response = await workoutService.getAll(1, 50);
      setWorkouts(response.data);
    } catch (err) {
      setError('Error al cargar entrenamientos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data: CreateWorkoutDTO = {
        title,
        bodyPart,
        durationMinutes: duration,
        energyLevel,
        fatigueLevel,
        painLevel,
        date: new Date().toISOString()
      };
      await workoutService.create(data);
      // Reset form
      setTitle('');
      setBodyPart('');
      await fetchWorkouts();
    } catch (err) {
      setError('Error al crear entrenamiento');
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Entrenamientos</h1>
      <p className="page-subtitle">Registra y visualiza tus rutinas</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
        <h3>Nuevo Entrenamiento</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <input required type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          <input required type="text" placeholder="Parte del cuerpo" value={bodyPart} onChange={e => setBodyPart(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          <label>Duración (min): <input type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', width: '100px' }} /></label>
          <label>Energía (1-10): <input type="number" min="1" max="10" value={energyLevel} onChange={e => setEnergyLevel(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', width: '100px' }} /></label>
          <label>Fatiga (1-10): <input type="number" min="1" max="10" value={fatigueLevel} onChange={e => setFatigueLevel(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', width: '100px' }} /></label>
          <label>Dolor (1-10): <input type="number" min="1" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px', width: '100px' }} /></label>
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ gridColumn: 'span 2' }}>{isLoading ? 'Guardando...' : 'Guardar Entrenamiento'}</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading && workouts.length === 0 ? <p>Cargando...</p> : null}
        {!isLoading && workouts.length === 0 ? <p>No hay entrenamientos registrados.</p> : null}
        {workouts.map(w => (
          <div key={w.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent)' }}>{w.title}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{w.bodyPart} - {w.durationMinutes} min</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>Energía: {w.energyLevel}/10</p>
              <p style={{ margin: 0 }}>{new Date(w.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
