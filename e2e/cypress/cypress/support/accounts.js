/**
 * Datos de prueba. Cada prueba crea su propia cuenta con un correo único
 * para que sean independientes y repetibles.
 */
export const VALID_PASSWORD = 'E2eP@ssw0rd2026!';

let counter = 0;

export function newAccount(label, name = 'Ana Atleta') {
  counter += 1;
  return {
    name,
    email: `e2e.${label}.${Date.now()}${counter}@athletia.test`,
    password: VALID_PASSWORD,
  };
}
