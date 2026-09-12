import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AuthIconInputProps {
  id: string;
  label: React.ReactNode;
  labelRight?: React.ReactNode;
  icon: LucideIcon;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  borderColor?: string;
}

export const AuthIconInput: React.FC<AuthIconInputProps> = ({
  id,
  label,
  labelRight,
  icon: Icon,
  type,
  value,
  onChange,
  placeholder,
  required,
  borderColor,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
    {labelRight ? (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label htmlFor={id} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {label}
        </label>
        {labelRight}
      </div>
    ) : (
      <label htmlFor={id} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Icon
        size={18}
        style={{
          position: 'absolute',
          left: '0.85rem',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
        }}
      />
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: '100%',
          padding: '0.75rem 0.75rem 0.75rem 2.6rem',
          borderRadius: '0.5rem',
          border: `1px solid ${borderColor || 'var(--border)'}`,
          backgroundColor: 'var(--background)',
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
        }}
      />
    </div>
  </div>
);
