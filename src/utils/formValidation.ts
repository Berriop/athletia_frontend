import { toLocalDateInput } from './date';

/** Error de validación del formulario: su mensaje se muestra tal cual a la persona. */
export class FormValidationError extends Error {}

export interface NumberRule {
  /** Nombre del campo en minúscula, p. ej. "calorías". */
  label: string;
  min: number;
  max: number;
  integer?: boolean;
  /** Exige un valor mayor que 0 (el mínimo pasa a ser exclusivo). */
  positive?: boolean;
}

/**
 * Deja en el texto solo dígitos y un único punto (la coma se convierte en punto).
 * Así no se pueden escribir letras ni el signo menos. El punto se conserva también
 * en los campos de enteros para que "650.5" no se convierta en "6505": esos campos
 * avisan al guardar que el valor debe ser entero.
 */
export function sanitizeNumberInput(raw: string): string {
  const onlyValid = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const firstDot = onlyValid.indexOf('.');
  if (firstDot === -1) return onlyValid;
  return onlyValid.slice(0, firstDot + 1) + onlyValid.slice(firstDot + 1).replace(/\./g, '');
}

function checkNumber(raw: string, rule: NumberRule): number {
  const value = Number(raw);
  if (raw === '.' || Number.isNaN(value)) {
    throw new FormValidationError(`El campo ${rule.label} debe ser un número`);
  }
  if (rule.integer && !Number.isInteger(value)) {
    throw new FormValidationError(`El campo ${rule.label} debe ser un número entero`);
  }
  if (rule.positive && value <= 0) {
    throw new FormValidationError(`El campo ${rule.label} debe ser mayor que 0`);
  }
  if (value < rule.min || value > rule.max) {
    throw new FormValidationError(`El campo ${rule.label} debe estar entre ${rule.min} y ${rule.max}`);
  }
  return value;
}

/** Número obligatorio: un campo vacío es un error. */
export function parseNumberField(raw: string, rule: NumberRule): number {
  const trimmed = raw.trim();
  if (trimmed === '') throw new FormValidationError(`El campo ${rule.label} es obligatorio`);
  return checkNumber(trimmed, rule);
}

/** Número opcional: un campo vacío devuelve null (borra el valor). */
export function parseOptionalNumberField(raw: string, rule: NumberRule): number | null {
  const trimmed = raw.trim();
  return trimmed === '' ? null : checkNumber(trimmed, rule);
}

/** Texto obligatorio: "   " cuenta como vacío. Devuelve el texto sin espacios sobrantes. */
export function requireText(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed === '') throw new FormValidationError(`El campo ${label} es obligatorio`);
  return trimmed;
}

/** Fecha del campo (yyyy-mm-dd) que no puede ser posterior a hoy. */
export function requirePastOrToday(date: string, label = 'fecha'): string {
  if (!date) throw new FormValidationError(`El campo ${label} es obligatorio`);
  if (date > toLocalDateInput(new Date())) {
    throw new FormValidationError(`El campo ${label} no puede estar en el futuro`);
  }
  return date;
}

type ApiErrorShape = {
  message?: string;
  response?: { data?: { message?: string; error?: { message?: string; details?: { message: string }[] } } };
};

/**
 * Mensaje para mostrar a partir de un error del formulario o de la API: primero el
 * detalle de validación del backend, luego su mensaje y, si no hay ninguno, el de respaldo.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof FormValidationError) return err.message;
  const data = (err as ApiErrorShape | undefined)?.response?.data;
  const details = data?.error?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details.map((d) => d.message).join(' ');
  }
  return data?.error?.message || data?.message || fallback;
}
