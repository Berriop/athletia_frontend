import React from 'react';
import { Loader2 } from 'lucide-react';

interface AuthSubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  isLoading,
  loadingText,
  disabled,
  style,
  children,
}) => (
  <button
    type="submit"
    disabled={isLoading || disabled}
    className="btn-primary"
    style={{
      marginTop: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      ...style,
    }}
  >
    {isLoading ? (
      <>
        <Loader2 size={18} className="spinner" /> {loadingText}
      </>
    ) : (
      children
    )}
  </button>
);
