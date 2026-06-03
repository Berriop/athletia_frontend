import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { SleepLog } from '../types';
import { sleepService } from '../services/sleep.service';
import type { CreateSleepDTO } from '../services/sleep.service';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const SleepPage: React.FC = () => {
  const [sleeps, setSleeps] = useState<SleepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Form states
  const [hoursSlept, setHoursSlept] = useState(8);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [hadNightmares, setHadNightmares] = useState(false);
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');

  const fetchSleeps = async () => {
    try {
      const response = await sleepService.getAll(1, 50);
      setSleeps(response.data);
    } catch (err) {
      setError('Error al cargar registros de sueño');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSleeps();
  }, []);

  const resetForm = () => {
    setHoursSlept(8);
    setSleepQuality(7);
    setHadNightmares(false);
    setStressLevel(5);
    setNotes('');
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data: CreateSleepDTO = {
        hoursSlept,
        sleepQuality,
        hadNightmares,
        stressLevel,
        notes,
        date: new Date().toISOString()
      };
      
      if (editingId) {
        await sleepService.update(editingId, data);
        addNotification('Registro de sueño actualizado', 'success');
      } else {
        await sleepService.create(data);
        addNotification('Registro de sueño creado', 'success');
      }
      
      resetForm();
      await fetchSleeps();
    } catch (err) {
      setError(editingId ? 'Error al actualizar el registro' : 'Error al guardar el registro');
      addNotification(editingId ? 'Error al actualizar el registro' : 'Error al guardar el registro', 'error');
      setIsLoading(false);
    }
  };

  const handleEdit = (sleep: SleepLog) => {
    setEditingId(sleep.id);
    setHoursSlept(sleep.hoursSlept);
    setSleepQuality(sleep.sleepQuality);
    setHadNightmares(sleep.hadNightmares);
    setStressLevel(sleep.stressLevel);
    setNotes(sleep.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await sleepService.delete(deleteId);
      addNotification('Registro eliminado correctamente', 'success');
      
      if (editingId === deleteId) {
        resetForm();
      }
      
      setSleeps(prev => prev.filter(s => s.id !== deleteId));
    } catch (err) {
      addNotification('Error al eliminar el registro', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Sueño y Descanso</h1>
      <p className="page-subtitle">Monitorea tu recuperación</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem', position: 'relative' }}>
        {editingId && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--accent)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
            Modo Edición
          </div>
        )}
        <h3>{editingId ? 'Editar Registro' : 'Registrar Noche'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="hours" style={{ fontSize: '0.9rem' }}>Horas de sueño</label>
            <input id="hours" required type="number" step="0.5" min="0" max="24" value={hoursSlept} onChange={e => setHoursSlept(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="quality" style={{ fontSize: '0.9rem' }}>Calidad del sueño (1-10)</label>
            <input id="quality" required type="number" min="1" max="10" value={sleepQuality} onChange={e => setSleepQuality(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="stress" style={{ fontSize: '0.9rem' }}>Nivel de estrés (1-10)</label>
            <input id="stress" required type="number" min="1" max="10" value={stressLevel} onChange={e => setStressLevel(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={hadNightmares} onChange={e => setHadNightmares(e.target.checked)} />
              ¿Tuviste pesadillas?
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
            <label htmlFor="notes" style={{ fontSize: '0.9rem' }}>Notas adicionales</label>
            <textarea id="notes" placeholder="Notas adicionales..." value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', minHeight: '80px', backgroundColor: 'var(--bg-card)', color: 'inherit', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
              {isLoading ? 'Guardando...' : (editingId ? 'Actualizar Registro' : 'Guardar Registro')}
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
        {isLoading && sleeps.length === 0 ? <p>Cargando...</p> : null}
        {!isLoading && sleeps.length === 0 ? <p>No hay registros de sueño.</p> : null}
        {sleeps.map(s => (
          <div key={s.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent)' }}>{s.hoursSlept} horas</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calidad: {s.sleepQuality}/10 - Estrés: {s.stressLevel}/10</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ margin: 0 }}>{s.hadNightmares ? 'Pesadillas ⚠️' : 'Bien'}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(s)} title="Editar" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => setDeleteId(s.id)} title="Eliminar" style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0.25rem' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p style={{ margin: 0 }}>{new Date(s.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Eliminar Registro de Sueño"
        message="¿Estás seguro de que deseas eliminar este registro de sueño? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
