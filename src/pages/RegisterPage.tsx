import React from 'react';

export const RegisterPage: React.FC = () => {
  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1 className="logo" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Athletia</h1>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Crear Cuenta</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="text" placeholder="Nombre" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
          <input type="email" placeholder="Email" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
          <input type="password" placeholder="Contraseña" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
          <button className="btn-primary" style={{ marginTop: '1rem' }}>Registrarse</button>
        </div>
      </div>
    </div>
  );
};
