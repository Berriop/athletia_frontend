import React from 'react';

export const WorkoutsPage: React.FC = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Entrenamientos</h1>
      <p className="page-subtitle">Registra y visualiza tus rutinas</p>
      
      <div className="card glass-panel" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de entrenamientos en construcción...</p>
      </div>
    </div>
  );
};
