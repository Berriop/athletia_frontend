/** Ejecuta la prueba y, si lanza una excepción, termina con código distinto de cero (no queda oculta). */
export function run(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    console.error('La prueba falló:', error);
    process.exitCode = 1;
  });
}
