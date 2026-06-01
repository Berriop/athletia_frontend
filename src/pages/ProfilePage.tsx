import React from 'react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Perfil</h1>
      <p className="page-subtitle">Gestiona tu información personal</p>
      
      <div className="card glass-panel" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Módulo de perfil en construcción...</p>
      </div>
    </div>
  );
};
