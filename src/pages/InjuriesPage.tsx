import React, { useState, useEffect } from 'react';
import type { Injury } from '../types';
import { injuryService } from '../services/injury.service';
import type { CreateInjuryDTO } from '../services/injury.service';

export const InjuriesPage: React.FC = () => {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data: CreateInjuryDTO = {
        injuryName,
        bodyArea,
        severity,
        isActive: true,
        notes
      };
      await injuryService.create(data);
      setInjuryName('');
      setBodyArea('');
      await fetchInjuries();
    } catch (err) {
      setError('Error al reportar lesión');
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Lesiones</h1>
      <p className="page-subtitle">Lleva un control de tus molestias físicas</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
        <h3>Reportar Lesión</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="bodyArea" style={{ fontSize: '0.9rem' }}>Área del cuerpo</label>
            <input id="bodyArea" required type="text" placeholder="Ej. Rodilla Derecha" value={bodyArea} onChange={e => setBodyArea(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="injuryName" style={{ fontSize: '0.9rem' }}>Nombre de la lesión</label>
            <input id="injuryName" required type="text" placeholder="Ej. Esguince" value={injuryName} onChange={e => setInjuryName(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px' }} />
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
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ gridColumn: 'span 2' }}>{isLoading ? 'Guardando...' : 'Registrar Lesión'}</button>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading && injuries.length === 0 ? <p>Cargando...</p> : null}
        {!isLoading && injuries.length === 0 ? <p>No hay lesiones reportadas.</p> : null}
        {injuries.map(i => (
          <div key={i.id} className="card glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: i.isActive ? '4px solid red' : '4px solid green' }}>
            <div>
              <h4 style={{ margin: 0, color: 'var(--accent)' }}>{i.injuryName}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{i.bodyArea} - Severidad: {i.severity}/10</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0, color: i.isActive ? 'red' : 'green', fontWeight: 'bold' }}>{i.isActive ? 'ACTIVA' : 'RECUPERADA'}</p>
              <p style={{ margin: 0 }}>{new Date(i.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
