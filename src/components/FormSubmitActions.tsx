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
}) => {
  let submitLabel = createLabel;
  if (isLoading) {
    submitLabel = savingLabel;
  } else if (isEditing) {
    submitLabel = updateLabel;
  }

  return (
  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
    <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
      {submitLabel}
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
};
