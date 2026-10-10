/**
 * Datos de prueba. Cada escenario crea su propia cuenta con un correo único
 * para que las pruebas sean independientes y repetibles (FIRST).
 */
export interface Account {
  name: string;
  email: string;
  password: string;
}

export const VALID_PASSWORD = 'E2eP@ssw0rd2026!';

let counter = 0;

export function newAccount(label: string, name = 'Ana Atleta'): Account {
  counter += 1;
  const unique = `${Date.now()}${counter}`;
  return {
    name,
    email: `e2e.${label}.${unique}@athletia.test`,
    password: VALID_PASSWORD,
  };
}
