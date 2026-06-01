import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1 className="page-title" style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <p className="page-subtitle">Parece que te has perdido en el gimnasio</p>
      <Link to="/dashboard" className="btn-primary">Volver al Dashboard</Link>
    </div>
  );
};
