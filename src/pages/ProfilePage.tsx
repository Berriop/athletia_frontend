import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 0',
    borderBottom: '1px solid var(--border)',
    fontSize: '0.95rem',
  };

  const labelStyle: React.CSSProperties = { color: 'var(--text-secondary)' };
  const valueStyle: React.CSSProperties = { fontWeight: 500 };

  return (
    <div className="page-container">
      <h1 className="page-title">Mi Perfil</h1>
      <p className="page-subtitle">Tu información personal</p>

      <div className="card glass-panel" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            backgroundColor: 'var(--primary)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 700, color: '#fff'
          }}>
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{user.name || 'Sin nombre'}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
        </div>

        <div style={fieldStyle}>
          <span style={labelStyle}>Email</span>
          <span style={valueStyle}>{user.email}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Nombre</span>
          <span style={valueStyle}>{user.name || '—'}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Rol</span>
          <span style={valueStyle}>{user.role}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Género</span>
          <span style={valueStyle}>{user.gender || '—'}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Fecha de nacimiento</span>
          <span style={valueStyle}>{user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '—'}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Altura</span>
          <span style={valueStyle}>{user.heightCm ? `${user.heightCm} cm` : '—'}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Peso</span>
          <span style={valueStyle}>{user.weightKg ? `${user.weightKg} kg` : '—'}</span>
        </div>
        <div style={{ ...fieldStyle, border: 'none' }}>
          <span style={labelStyle}>Nivel de experiencia</span>
          <span style={valueStyle}>{user.experienceLevel || '—'}</span>
        </div>

        <button
          onClick={handleLogout}
          className="btn-primary"
          style={{ marginTop: '2rem', backgroundColor: '#ef4444', width: '100%' }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};
