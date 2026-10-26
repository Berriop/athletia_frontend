import React, { useState, useEffect } from 'react';
import type { SleepLog } from '../types';
import { sleepService } from '../services/sleep.service';
import type { CreateSleepDTO } from '../services/sleep.service';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { toLocalDateInput } from '../utils/date';
import { EditModeBadge } from '../components/EditModeBadge';
import { RowActionButtons } from '../components/RowActionButtons';
import { ListStatus } from '../components/ListStatus';
import { FormSubmitActions } from '../components/FormSubmitActions';
import { NumberInput } from '../components/NumberInput';
import { getErrorMessage, parseNumberField, requirePastOrToday } from '../utils/formValidation';

export const SleepPage: React.FC = () => {
  const [sleeps, setSleeps] = useState<SleepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Form states
  const [hoursSlept, setHoursSlept] = useState('8');
  const [sleepQuality, setSleepQuality] = useState('7');
  const [hadNightmares, setHadNightmares] = useState(false);
  const [stressLevel, setStressLevel] = useState('5');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => toLocalDateInput(new Date()));

  const fetchSleeps = async () => {
    try {
      const response = await sleepService.getAll(1, 50);
      setSleeps(response.data);
    } catch {
      setError('Error al cargar registros de sueño');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSleeps();
  }, []);

  const resetForm = () => {
    setHoursSlept('8');
    setSleepQuality('7');
    setHadNightmares(false);
    setStressLevel('5');
    setNotes('');
    setDate(toLocalDateInput(new Date()));
    setEditingId(null);
  };

  // Valida el formulario antes de llamar a la API; lanza FormValidationError con el mensaje a mostrar.
  const buildSleepData = (): CreateSleepDTO => ({
    hoursSlept: parseNumberField(hoursSlept, { label: 'horas de sueño', min: 0, max: 24, positive: true }),
    sleepQuality: parseNumberField(sleepQuality, { label: 'calidad del sueño', min: 1, max: 10, integer: true }),
    hadNightmares,
    stressLevel: parseNumberField(stressLevel, { label: 'nivel de estrés', min: 1, max: 10, integer: true }),
    notes,
    date: new Date(`${requirePastOrToday(date)}T00:00:00`).toISOString(),
  });

  // RF-11 (crear) y RF-12 (modificar) quedan como funciones independientes,
  // cada una con su propio try/catch, en vez de una sola función con un
  // if/else por dentro.
  const handleCreate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data = buildSleepData();
      await sleepService.create(data);
      addNotification('Registro de sueño creado', 'success');
      resetForm();
      await fetchSleeps();
    } catch (err) {
      const msg = getErrorMessage(err, 'Error al guardar el registro');
      setError(msg);
      addNotification(msg, 'error');
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    setIsLoading(true);
    setError('');
    try {
      const data = buildSleepData();
      await sleepService.update(editingId, data);
      addNotification('Registro de sueño actualizado', 'success');
      resetForm();
      await fetchSleeps();
    } catch (err) {
      const msg = getErrorMessage(err, 'Error al actualizar el registro');
      setError(msg);
      addNotification(msg, 'error');
      setIsLoading(false);
    }
  };

  const handleEdit = (sleep: SleepLog) => {
    setEditingId(sleep.id);
    setHoursSlept(String(sleep.hoursSlept));
    setSleepQuality(String(sleep.sleepQuality));
    setHadNightmares(sleep.hadNightmares);
    setStressLevel(String(sleep.stressLevel));
    setNotes(sleep.notes || '');
    setDate(toLocalDateInput(new Date(sleep.date)));
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
    } catch {
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
        {editingId && <EditModeBadge />}
        <h3>{editingId ? 'Editar Registro' : 'Registrar Noche'}</h3>
        <form onSubmit={editingId ? handleUpdate : handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="hours" style={{ fontSize: '0.9rem' }}>Horas de sueño</label>
            <NumberInput id="hours" allowDecimal value={hoursSlept} onChange={setHoursSlept} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="quality" style={{ fontSize: '0.9rem' }}>Calidad del sueño (1-10)</label>
            <NumberInput id="quality" value={sleepQuality} onChange={setSleepQuality} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="stress" style={{ fontSize: '0.9rem' }}>Nivel de estrés (1-10)</label>
            <NumberInput id="stress" value={stressLevel} onChange={setStressLevel} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="date" style={{ fontSize: '0.9rem' }}>Fecha</label>
            <input id="date" required type="date" max={toLocalDateInput(new Date())} value={date} onChange={e => setDate(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', backgroundColor: 'var(--bg-card)', color: 'inherit', border: '1px solid var(--border)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={hadNightmares} onChange={e => setHadNightmares(e.target.checked)} />{' '}
              ¿Tuviste pesadillas?
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
            <label htmlFor="notes" style={{ fontSize: '0.9rem' }}>Notas adicionales</label>
            <textarea id="notes" maxLength={1000} placeholder="Notas adicionales..." value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', minHeight: '80px', backgroundColor: 'var(--bg-card)', color: 'inherit', border: '1px solid var(--border)' }} />
          </div>
          <FormSubmitActions
            isLoading={isLoading}
            isEditing={!!editingId}
            createLabel="Guardar Registro"
            updateLabel="Actualizar Registro"
            onCancel={resetForm}
          />
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ListStatus isLoading={isLoading} isEmpty={sleeps.length === 0} emptyText="No hay registros de sueño." />
        {sleeps.map(s => (
          <div key={s.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent)' }}>{s.hoursSlept} horas</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Calidad: {s.sleepQuality}/10 - Estrés: {s.stressLevel}/10</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ margin: 0 }}>{s.hadNightmares ? 'Pesadillas ⚠️' : 'Bien'}</p>
                <RowActionButtons onEdit={() => handleEdit(s)} onDelete={() => setDeleteId(s.id)} />
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
