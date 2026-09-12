import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface RowActionButtonsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export const RowActionButtons: React.FC<RowActionButtonsProps> = ({ onEdit, onDelete }) => (
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <button
      onClick={onEdit}
      title="Editar"
      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
    >
      <Edit2 size={16} />
    </button>
    <button
      onClick={onDelete}
      title="Eliminar"
      style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', padding: '0.25rem' }}
    >
      <Trash2 size={16} />
    </button>
  </div>
);
