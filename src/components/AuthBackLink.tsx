import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AuthBackLink: React.FC<{ to?: string; children: React.ReactNode }> = ({
  to = '/login',
  children,
}) => (
  <div
    style={{
      marginTop: '1.5rem',
      textAlign: 'center',
      borderTop: '1px solid var(--border)',
      paddingTop: '1.25rem',
    }}
  >
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        textDecoration: 'none',
        fontWeight: 500,
        transition: 'color 0.2s',
      }}
    >
      <ArrowLeft size={16} /> {children}
    </Link>
  </div>
);
