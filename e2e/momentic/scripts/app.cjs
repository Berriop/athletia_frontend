const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

/**
 * Levanta la app para las pruebas de Momentic y la deja corriendo hasta Ctrl+C:
 *   backend  → http://localhost:4010 (sin límite de registros: cada prueba crea su cuenta)
 *   frontend → http://localhost:5180 (Vite, apuntando a ese backend)
 *
 * Los puertos son fijos porque las pruebas (*.test.yaml) usan url: http://localhost:5180.
 */

const API_PORT = '4010';
const FRONTEND_PORT = '5180';
const frontendDir = path.resolve(__dirname, '../../..');
const backendDir = path.resolve(frontendDir, process.env.E2E_BACKEND_DIR || '../athletia_backend');
const baseUrl = `http://localhost:${FRONTEND_PORT}`;
const children = [];

function launch(command, cwd, env) {
  children.push(spawn(command, { cwd, env: { ...process.env, ...env }, shell: true, stdio: 'inherit', windowsHide: true }));
}

function stop() {
  for (const child of children.splice(0)) {
    if (child.pid === undefined) continue;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  process.exit(0);
}

async function waitUntilReachable(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status < 500) return;
    } catch {
      // el servidor todavía está arrancando
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`No respondió ${url} después de ${timeoutMs / 1000} segundos.`);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

launch('npm run start:dev', backendDir, { PORT: API_PORT, CORS_ORIGIN: baseUrl, RATE_LIMIT_DISABLED: 'true' });
launch(`npx vite --port ${FRONTEND_PORT} --strictPort`, frontendDir, { VITE_API_URL: `http://localhost:${API_PORT}/api/v1` });

Promise.all([
  waitUntilReachable(`http://localhost:${API_PORT}/health`, 180_000),
  waitUntilReachable(baseUrl, 120_000),
])
  .then(() => console.log(`\nApp lista en ${baseUrl}. Deja esta terminal abierta; Ctrl+C para detenerla.\n`))
  .catch((error) => {
    console.error(error.message);
    stop();
  });
