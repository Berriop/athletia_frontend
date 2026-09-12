import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface AuthSuccessPanelProps {
  title: string;
  children: React.ReactNode;
}

export const AuthSuccessPanel: React.FC<AuthSuccessPanelProps> = ({ title, children }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '1.5rem 1rem',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      borderRadius: '0.75rem',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      marginBottom: '1rem',
    }}
  >
    <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 1rem auto', display: 'block' }} />
    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>{children}</p>
  </div>
);
