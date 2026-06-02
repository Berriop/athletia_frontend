import React, { useState, useEffect } from 'react';
import type { SleepLog } from '../types';
import { sleepService } from '../services/sleep.service';
import type { CreateSleepDTO } from '../services/sleep.service';

export const SleepPage: React.FC = () => {
  const [sleeps, setSleeps] = useState<SleepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data: CreateSleepDTO = {
        hoursSlept,
        sleepQuality,
        hadNightmares,
        stressLevel,
        notes,
        date: new Date().toISOString()
      };
      await sleepService.create(data);
      await fetchSleeps();
    } catch (err) {
      setError('Error al guardar el registro');
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Sueño y Descanso</h1>
      <p className="page-subtitle">Monitorea tu recuperación</p>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
        <h3>Registrar Noche</h3>
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
          <button type="submit" disabled={isLoading} className="btn-primary" style={{ gridColumn: 'span 2' }}>{isLoading ? 'Guardando...' : 'Guardar Registro'}</button>
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
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <p style={{ margin: 0 }}>{s.hadNightmares ? 'Pesadillas ⚠️' : 'Bien'}</p>
              <p style={{ margin: 0 }}>{new Date(s.date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
