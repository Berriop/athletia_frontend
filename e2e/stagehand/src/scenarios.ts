import { closeTestSession, createTestSession, type TestSession } from './stagehand.js';
import { startStack, stopStack, type Stack } from './stack.js';

export type Context = TestSession & {
  stack: Stack;
  /** `act` de Stagehand que falla la prueba si el modelo no logra ejecutar la instrucción. */
  act: (instruction: string, variables?: Record<string, string>) => Promise<void>;
};

export type Scenario = {
  requisito: string;
  nombre: string;
  objetivo: string;
  esperado: string;
  run: (context: Context) => Promise<void>;
};

type Result = { scenario: Scenario; passed: boolean; seconds: number; error?: string };

function elapsed(since: number): number {
  return Math.round((Date.now() - since) / 100) / 10;
}

/**
 * Ejecuta los escenarios de un integrante, cada uno con su propio navegador y su propia
 * cuenta. Imprime objetivo, resultado esperado y resultado obtenido de cada prueba, y
 * termina con código distinto de cero si alguna falla, para que no se oculte un error.
 */
export async function runScenarios(integrante: string, scenarios: Scenario[]): Promise<void> {
  const results: Result[] = [];
  console.log(`\n=== Pruebas con Stagehand · ${integrante} ===`);
  const stack = await startStack();

  try {
    for (const scenario of scenarios) {
      console.log(`\n[${integrante}] ${scenario.requisito} · ${scenario.nombre}`);
      console.log(`  Objetivo: ${scenario.objetivo}`);
      console.log(`  Esperado: ${scenario.esperado}`);

      const started = Date.now();
      const session = await createTestSession();
      const context: Context = {
        ...session,
        stack,
        act: async (instruction, variables) => {
          const result = await session.stagehand.act(instruction, { page: session.page, ...(variables ? { variables } : {}) });
          if (!result.data.success) throw new Error(`El modelo no pudo ejecutar "${instruction}": ${result.data.message}`);
        },
      };

      try {
        await scenario.run(context);
        results.push({ scenario, passed: true, seconds: elapsed(started) });
        console.log(`  Obtenido: ✓ prueba superada (${elapsed(started)} s)`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ scenario, passed: false, seconds: elapsed(started), error: message });
        console.log(`  Obtenido: ✗ la prueba falló (${elapsed(started)} s)\n    ${message.replace(/\n/g, '\n    ')}`);
      } finally {
        const metrics = await session.stagehand.metrics().catch(() => undefined);
        if (metrics) console.log('  Métricas de inferencia:', JSON.stringify(metrics));
        await closeTestSession(session).catch(() => undefined);
      }
    }
  } finally {
    stopStack();
  }

  const failed = results.filter((result) => !result.passed);
  console.log(`\n--- Resumen · ${integrante}: ${results.length - failed.length}/${results.length} superadas ---`);
  for (const { scenario, passed, seconds } of results) {
    console.log(`  ${passed ? '✓' : '✗'} ${scenario.requisito} · ${scenario.nombre} (${seconds} s)`);
  }
  if (failed.length > 0) process.exitCode = 1;
}
