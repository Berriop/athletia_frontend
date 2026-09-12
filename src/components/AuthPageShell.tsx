import React from 'react';
import { Link } from 'react-router-dom';

interface AuthPageShellProps {
  maxWidth?: string;
  children: React.ReactNode;
}

export const AuthPageShell: React.FC<AuthPageShellProps> = ({ maxWidth = '420px', children }) => (
  <div
    className="page-container"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem 1rem',
      flexDirection: 'column',
    }}
  >
    <h1 className="logo" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
      <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
        Athletia
      </Link>
    </h1>

    <div className="card glass-panel" style={{ width: '100%', maxWidth }}>
      {children}
    </div>
  </div>
);
