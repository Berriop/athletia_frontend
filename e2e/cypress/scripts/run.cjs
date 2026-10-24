const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

/**
 * Levanta la pila de pruebas (backend + frontend de Vite), ejecuta Cypress y la cierra.
 *
 *   node scripts/run.cjs                  → E2E/API y después componentes
 *   node scripts/run.cjs e2e [integrante] → solo E2E/API (luisa | juanpablo | daniel)
 *   node scripts/run.cjs open             → abre la interfaz de Cypress con la pila levantada
 *
 * Variables opcionales: E2E_BASE_URL (frontend ya desplegado, no se levanta nada),
 * E2E_BACKEND_DIR, E2E_API_PORT y E2E_FRONTEND_PORT.
 */

const projectRoot = path.resolve(__dirname, '..');
const frontendDir = path.resolve(projectRoot, '../..');
const backendDir = path.resolve(projectRoot, process.env.E2E_BACKEND_DIR || '../../../athletia_backend');
const [mode = 'all', member] = process.argv.slice(2);

// Windows reserva rangos de puertos que cambian tras cada reinicio: se prueba cada
// candidato abriéndolo de verdad y se usa el primero libre.
function canListen(port) {
  const script = `
    const net = require('net');
    const hosts = ['127.0.0.1', '::1'];
    let index = 0;
    (function next() {
      if (index === hosts.length) process.exit(0);
      const host = hosts[index++];
      const server = net.createServer();
      server.once('error', (error) => process.exit(error.code === 'EADDRNOTAVAIL' ? next() : 1));
      server.listen(${port}, host, () => server.close(next));
    })();
  `;
  return spawnSync(process.execPath, ['-e', script], { timeout: 5000 }).status === 0;
}

function pickFreePort(candidates) {
  const port = candidates.find(canListen);
  if (!port) throw new Error(`Ninguno de los puertos ${candidates.join(', ')} está disponible.`);
  return port;
}

function databaseUrlWithFewConnections() {
  const envFile = path.join(backendDir, '.env');
  const url = process.env.E2E_DATABASE_URL || (/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m.exec(fs.readFileSync(envFile, 'utf-8')) || [])[1];
  if (!url || url.includes('connection_limit')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connection_limit=2`;
}

const children = [];

function launch(command, cwd, env) {
  children.push(spawn(command, { cwd, env: { ...process.env, ...env }, shell: true, stdio: 'ignore', windowsHide: true }));
}

function stopStack() {
  for (const child of children.splice(0)) {
    if (child.pid === undefined) continue;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
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

function cypress(args, env) {
  const result = spawnSync('npx', ['cypress', ...args], { cwd: projectRoot, env: { ...process.env, ...env }, shell: true, stdio: 'inherit' });
  return result.status ?? 1;
}

async function main() {
  let stackEnv = {};
  if (!process.env.E2E_BASE_URL && mode !== 'component') {
    const apiPort = process.env.E2E_API_PORT || String(pickFreePort([4002, 4102, 4202, 4302, 4402, 4502]));
    const frontendPort = process.env.E2E_FRONTEND_PORT || String(pickFreePort([5175, 5275, 5375, 5475, 5575, 5675]));
    const baseUrl = `http://localhost:${frontendPort}`;

    launch('npm run start:dev', backendDir, {
      PORT: apiPort,
      CORS_ORIGIN: baseUrl,
      RATE_LIMIT_DISABLED: 'true',
      DATABASE_URL: databaseUrlWithFewConnections(),
    });
    launch(`npx vite --port ${frontendPort} --strictPort`, frontendDir, {
      VITE_API_URL: `http://localhost:${apiPort}/api/v1`,
      VITE_GOOGLE_MAPS_API_KEY: 'clave-e2e-simulada',
    });
    await Promise.all([
      waitUntilReachable(`http://localhost:${apiPort}/health`, 180_000),
      waitUntilReachable(baseUrl, 120_000),
    ]);
    stackEnv = { E2E_BASE_URL: baseUrl, E2E_API_URL: `http://localhost:${apiPort}/api/v1` };
  }

  const memberSpecs = member ? ['--spec', `cypress/e2e/**/${member}.cy.js`] : [];
  let status = 0;
  if (mode === 'open') status = cypress(['open'], stackEnv);
  if (mode === 'e2e' || mode === 'all') status = cypress(['run', '--e2e', ...memberSpecs], stackEnv);
  if (mode === 'component' || (mode === 'all' && !member)) status = cypress(['run', '--component'], stackEnv) || status;
  return status;
}

main()
  .then((status) => {
    stopStack();
    process.exit(status);
  })
  .catch((error) => {
    console.error(error.message);
    stopStack();
    process.exit(1);
  });
