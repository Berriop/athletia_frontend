import { test } from '@playwright/test';

export type Integrante = 'Luisa Espinal' | 'Juan Pablo Berrío' | 'Daniel Ortiz' | 'Michael Pardo';

/**
 * Deja el integrante, el requisito, el objetivo y el resultado esperado de cada
 * escenario como anotaciones de Playwright. El script `npm run reporte` las
 * combina con el resultado obtenido y la evidencia (capturas) para generar el
 * reporte de pruebas.
 */
export function documenta(escenario: { integrante: Integrante; requisito: string; objetivo: string; esperado: string }): void {
  test.info().annotations.push(
    { type: 'integrante', description: escenario.integrante },
    { type: 'requisito', description: escenario.requisito },
    { type: 'objetivo', description: escenario.objetivo },
    { type: 'esperado', description: escenario.esperado },
  );
}
