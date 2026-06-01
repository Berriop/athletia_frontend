import React from 'react';

export const SleepPage: React.FC = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Sueño y Descanso</h1>
      <p className="page-subtitle">Monitorea tu recuperación</p>
      
      <div className="card glass-panel" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de sueño en construcción...</p>
      </div>
    </div>
  );
};
