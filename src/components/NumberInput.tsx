import React from 'react';
import { sanitizeNumberInput } from '../utils/formValidation';

type NativeInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode'>;

interface NumberInputProps extends NativeInputProps {
  value: string;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
}

/**
 * Campo numérico sin las flechas de subir/bajar: es un campo de texto con teclado
 * numérico (decimal si `allowDecimal`) que solo deja escribir dígitos y un punto.
 * Puede quedar vacío; el rango y lo obligatorio se validan al enviar el formulario.
 */
export const NumberInput: React.FC<NumberInputProps> = ({ value, onChange, allowDecimal = false, ...rest }) => (
  <input
    {...rest}
    type="text"
    inputMode={allowDecimal ? 'decimal' : 'numeric'}
    autoComplete="off"
    value={value}
    onChange={(e) => onChange(sanitizeNumberInput(e.target.value))}
  />
);
