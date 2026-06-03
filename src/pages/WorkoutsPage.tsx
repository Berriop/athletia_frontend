import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { Workout } from '../types';
import { workoutService } from '../services/workout.service';
import type { CreateWorkoutDTO } from '../services/workout.service';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const WorkoutsPage: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotification();

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

  const resetForm = () => {
    setTitle('');
    setBodyPart('');
    setDuration(30);
    setEnergyLevel(5);
    setFatigueLevel(5);
    setPainLevel(1);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data: CreateWorkoutDTO = {
        title,
        bodyPart,
        durationMinutes: duration,
        energyLevel,
        fatigueLevel,
        painLevel,
        date: new Date().toISOString() // Assuming date is kept as current on update or handled by backend
      };
      
      if (editingId) {
        await workoutService.update(editingId, data);
        addNotification('Entrenamiento actualizado correctamente', 'success');
      } else {
        await workoutService.create(data);
        addNotification('Entrenamiento creado correctamente', 'success');
      }
      
      resetForm();
      await fetchWorkouts();
    } catch (err) {
      setError(editingId ? 'Error al actualizar entrenamiento' : 'Error al crear entrenamiento');
      addNotification(editingId ? 'Error al actualizar entrenamiento' : 'Error al registrar entrenamiento', 'error');
      setIsLoading(false);
    }
  };

  const handleEdit = (workout: Workout) => {
    setEditingId(workout.id);
    setTitle(workout.title);
    setBodyPart(workout.bodyPart);
    setDuration(workout.durationMinutes);
    setEnergyLevel(workout.energyLevel);
    setFatigueLevel(workout.fatigueLevel);
    setPainLevel(workout.painLevel);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await workoutService.delete(deleteId);
      addNotification('Entrenamiento eliminado correctamente', 'success');
      
      if (editingId === deleteId) {
        resetForm();
      }
      
      setWorkouts(prev => prev.filter(w => w.id !== deleteId));
    } catch (err) {
      addNotification('Error al eliminar el entrenamiento', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Entrenamientos</h1>
      <p className="page-subtitle">Registra y visualiza tus rutinas</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem', position: 'relative' }}>
        {editingId && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--accent)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Modo Edición
          </div>
        )}
        <h3>{editingId ? 'Editar Entrenamiento' : 'Nuevo Entrenamiento'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="title" style={{ fontSize: '0.9rem' }}>Título</label>
            <input id="title" required type="text" placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="bodyPart" style={{ fontSize: '0.9rem' }}>Parte del cuerpo</label>
            <input id="bodyPart" required type="text" placeholder="Parte del cuerpo" value={bodyPart} onChange={e => setBodyPart(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="duration" style={{ fontSize: '0.9rem' }}>Duración (min)</label>
            <input id="duration" type="number" min="1" value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="energy" style={{ fontSize: '0.9rem' }}>Energía (1-10)</label>
            <input id="energy" type="number" min="1" max="10" value={energyLevel} onChange={e => setEnergyLevel(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="fatigue" style={{ fontSize: '0.9rem' }}>Fatiga (1-10)</label>
            <input id="fatigue" type="number" min="1" max="10" value={fatigueLevel} onChange={e => setFatigueLevel(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="pain" style={{ fontSize: '0.9rem' }}>Dolor (1-10)</label>
            <input id="pain" type="number" min="1" max="10" value={painLevel} onChange={e => setPainLevel(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
              {isLoading ? 'Guardando...' : (editingId ? 'Actualizar Entrenamiento' : 'Guardar Entrenamiento')}
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
        {isLoading && workouts.length === 0 ? <p>Cargando...</p> : null}
        {!isLoading && workouts.length === 0 ? <p>No hay entrenamientos registrados.</p> : null}
        {workouts.map(w => (
          <div key={w.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent)' }}>{w.title}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{w.bodyPart} - {w.durationMinutes} min</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ margin: 0 }}>Energía: {w.energyLevel}/10</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(w)} title="Editar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteId(w.id)} title="Eliminar" style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0.25rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p style={{ margin: 0 }}>{new Date(w.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Eliminar Entrenamiento"
        message="¿Estás seguro de que deseas eliminar este entrenamiento? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
