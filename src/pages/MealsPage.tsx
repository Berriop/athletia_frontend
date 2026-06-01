import React from 'react';

export const MealsPage: React.FC = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Alimentación</h1>
      <p className="page-subtitle">Controla tus macros y calorías</p>
      
      <div className="card glass-panel" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de alimentación en construcción...</p>
      </div>
    </div>
  );
};
