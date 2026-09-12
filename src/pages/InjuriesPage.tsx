import React, { useState, useEffect } from 'react';
import type { Injury } from '../types';
import { injuryService } from '../services/injury.service';
import type { CreateInjuryDTO } from '../services/injury.service';
import { useNotification } from '../contexts/NotificationContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EditModeBadge } from '../components/EditModeBadge';
import { RowActionButtons } from '../components/RowActionButtons';
import { ListStatus } from '../components/ListStatus';
import { FormSubmitActions } from '../components/FormSubmitActions';

export const InjuriesPage: React.FC = () => {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { addNotification } = useNotification();

  // Form states
  const [injuryName, setInjuryName] = useState('');
  const [bodyArea, setBodyArea] = useState('');
  const [severity, setSeverity] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const fetchInjuries = async () => {
    try {
      const response = await injuryService.getAll(1, 50);
      setInjuries(response.data);
    } catch (err) {
      setError('Error al cargar lesiones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInjuries();
  }, []);

  const resetForm = () => {
    setInjuryName('');
    setBodyArea('');
    setSeverity(5);
    setIsActive(true);
    setNotes('');
    setEditingId(null);
  };

  // Extrae el mensaje de validación específico que manda el backend (Zod
  // details), en vez de mostrar siempre un texto genérico. Si el error no
  // trae esa forma (ej. red caída, sin response), devuelve null y quien
  // llama usa su propio mensaje de respaldo.
  const getBackendValidationMessage = (err: unknown): string | null => {
    const details = (err as { response?: { data?: { error?: { details?: { message: string }[] } } } })?.response
      ?.data?.error?.details;
    if (Array.isArray(details) && details.length > 0) {
      return details.map((d) => d.message).join(' ');
    }
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const data: CreateInjuryDTO = { injuryName, bodyArea, severity, isActive, notes };
      await injuryService.create(data);
      addNotification('Lesión registrada correctamente', 'success');
      resetForm();
      await fetchInjuries();
    } catch (err) {
      const specificMessage = getBackendValidationMessage(err);
      setError(specificMessage || 'Error al reportar lesión');
      addNotification(specificMessage || 'Error al registrar lesión', 'error');
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setIsLoading(true);
    setError('');
    try {
      const data: CreateInjuryDTO = { injuryName, bodyArea, severity, isActive, notes };
      await injuryService.update(editingId, data);
      addNotification('Lesión actualizada correctamente', 'success');
      resetForm();
      await fetchInjuries();
    } catch (err) {
      const specificMessage = getBackendValidationMessage(err);
      setError(specificMessage || 'Error al actualizar lesión');
      addNotification(specificMessage || 'Error al actualizar lesión', 'error');
      setIsLoading(false);
    }
  };

  const handleEdit = (injury: Injury) => {
    setEditingId(injury.id);
    setInjuryName(injury.injuryName);
    setBodyArea(injury.bodyArea);
    setSeverity(injury.severity);
    setIsActive(injury.isActive);
    setNotes(injury.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await injuryService.delete(deleteId);
      addNotification('Lesión eliminada correctamente', 'success');
      
      if (editingId === deleteId) {
        resetForm();
      }
      
      setInjuries(prev => prev.filter(i => i.id !== deleteId));
    } catch (err) {
      addNotification('Error al eliminar la lesión', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Lesiones</h1>
      <p className="page-subtitle">Lleva un control de tus molestias físicas</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem', position: 'relative' }}>
        {editingId && <EditModeBadge />}
        <h3>{editingId ? 'Editar Lesión' : 'Reportar Lesión'}</h3>
        <form onSubmit={editingId ? handleUpdate : handleCreate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="bodyArea" style={{ fontSize: '0.9rem' }}>Área del cuerpo</label>
            <input id="bodyArea" required type="text" maxLength={250} pattern="[A-Za-zÀ-ÖØ-öø-ÿ\s]+" title="Solo letras y espacios" placeholder="Ej. Rodilla Derecha" value={bodyArea} onChange={e => setBodyArea(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="injuryName" style={{ fontSize: '0.9rem' }}>Nombre de la lesión</label>
            <input id="injuryName" required type="text" maxLength={250} pattern="[A-Za-zÀ-ÖØ-öø-ÿ\s]+" title="Solo letras y espacios" placeholder="Ej. Esguince" value={injuryName} onChange={e => setInjuryName(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="severity" style={{ fontSize: '0.9rem' }}>Severidad (1-10)</label>
            <input id="severity" required type="number" min="1" max="10" value={severity} onChange={e => setSeverity(Number(e.target.value))} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
              ¿Está activa actualmente?
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', gridColumn: 'span 2' }}>
            <label htmlFor="notes" style={{ fontSize: '0.9rem' }}>Notas sobre la lesión</label>
            <textarea id="notes" placeholder="Notas sobre el tratamiento o dolor..." value={notes} onChange={e => setNotes(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', minHeight: '80px', backgroundColor: 'var(--bg-card)', color: 'inherit', border: '1px solid var(--border)' }} />
          </div>
          <FormSubmitActions
            isLoading={isLoading}
            isEditing={!!editingId}
            createLabel="Registrar Lesión"
            updateLabel="Actualizar Lesión"
            onCancel={resetForm}
          />
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <ListStatus isLoading={isLoading} isEmpty={injuries.length === 0} emptyText="No hay lesiones reportadas." />
        {injuries.map(i => (
          <div key={i.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: i.isActive ? '4px solid red' : '4px solid green' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent)' }}>{i.injuryName}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{i.bodyArea} - Severidad: {i.severity}/10</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <p style={{ margin: 0, color: i.isActive ? 'red' : 'green', fontWeight: 'bold' }}>{i.isActive ? 'ACTIVA' : 'RECUPERADA'}</p>
                <RowActionButtons onEdit={() => handleEdit(i)} onDelete={() => setDeleteId(i.id)} />
              </div>
              <p style={{ margin: 0 }}>{new Date(i.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Eliminar Lesión"
        message="¿Estás seguro de que deseas eliminar esta lesión? Esta acción no se puede deshacer."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
