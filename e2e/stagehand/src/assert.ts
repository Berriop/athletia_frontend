/**
 * Aserciones determinísticas: la IA se usa para actuar, observar y extraer, pero el
 * veredicto de cada prueba lo da una comprobación exacta como estas.
 */
export function assertIncludes(actual: string, expected: string, message: string): void {
  if (!actual.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`${message}\nEsperado (contiene): ${expected}\nActual: ${actual}`);
  }
}

export function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\nEsperado: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

export function assertTrue(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function assertListIncludes(list: string[], expected: string, message: string): void {
  if (!list.some((item) => item.toLowerCase().includes(expected.toLowerCase()))) {
    throw new Error(`${message}\nEsperado (contiene): ${expected}\nActual: ${JSON.stringify(list)}`);
  }
}

export function assertListExcludes(list: string[], unexpected: string, message: string): void {
  if (list.some((item) => item.toLowerCase().includes(unexpected.toLowerCase()))) {
    throw new Error(`${message}\nNo se esperaba: ${unexpected}\nActual: ${JSON.stringify(list)}`);
  }
}
