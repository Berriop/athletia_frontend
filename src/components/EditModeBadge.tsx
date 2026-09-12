import React from 'react';

export const EditModeBadge: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      background: 'var(--accent)',
      color: 'white',
      padding: '0.25rem 0.75rem',
      borderRadius: '1rem',
      fontSize: '0.8rem',
      fontWeight: 'bold',
    }}
  >
    Modo Edición
  </div>
);
