import React from 'react';
import { AlertCircle } from 'lucide-react';

export const AuthErrorBanner: React.FC<{ message: string }> = ({ message }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      color: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      padding: '0.85rem 1rem',
      borderRadius: '0.5rem',
      marginBottom: '1.25rem',
      fontSize: '0.9rem',
      lineHeight: '1.4',
    }}
  >
    <AlertCircle size={20} style={{ flexShrink: 0 }} />
    <span>{message}</span>
  </div>
);
