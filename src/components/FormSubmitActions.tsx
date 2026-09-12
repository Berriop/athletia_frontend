import React from 'react';

interface FormSubmitActionsProps {
  isLoading: boolean;
  isEditing: boolean;
  createLabel: string;
  updateLabel: string;
  savingLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
}

export const FormSubmitActions: React.FC<FormSubmitActionsProps> = ({
  isLoading,
  isEditing,
  createLabel,
  updateLabel,
  savingLabel = 'Guardando...',
  cancelLabel = 'Cancelar Edición',
  onCancel,
}) => (
  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
    <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
      {isLoading ? savingLabel : isEditing ? updateLabel : createLabel}
    </button>
    {isEditing && (
      <button
        type="button"
        onClick={onCancel}
        disabled={isLoading}
        className="btn-secondary"
        style={{ flex: 1, backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
      >
        {cancelLabel}
      </button>
    )}
  </div>
);
