import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Levanta una pila de pruebas aislada de la que despliega Jenkins:
 *   - Backend  con RATE_LIMIT_DISABLED=true, para que los límites de registro y
 *     recuperación no bloqueen la suite.
 *   - Frontend de Vite apuntando al backend de pruebas.
 *
 * Variables opcionales: E2E_BASE_URL y E2E_API_URL (instalación ya levantada, no se
 * inicia nada), E2E_BACKEND_DIR, E2E_API_PORT y E2E_FRONTEND_PORT.
 */

const projectRoot = path.resolve(import.meta.dirname, '..');
const frontendDir = path.resolve(projectRoot, '../..');
const backendDir = path.resolve(projectRoot, process.env.E2E_BACKEND_DIR ?? '../../../athletia_backend');

export type Stack = { baseUrl: string; apiUrl: string };

const children: ChildProcess[] = [];

// Windows reserva rangos de puertos que cambian tras cada reinicio: se prueba cada
// candidato abriéndolo de verdad y se usa el primero libre.
function canListen(port: number): boolean {
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

function pickFreePort(candidates: number[]): number {
  const port = candidates.find(canListen);
  if (!port) throw new Error(`Ninguno de los puertos ${candidates.join(', ')} está disponible.`);
  return port;
}

// El backend de pruebas usa pocas conexiones del pooler de Supabase (modo sesión).
function backendDatabaseUrl(): string | undefined {
  try {
    const content = fs.readFileSync(path.join(backendDir, '.env'), 'utf-8');
    const url = /^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m.exec(content)?.[1];
    if (!url || url.includes('connection_limit')) return url;
    return `${url}${url.includes('?') ? '&' : '?'}connection_limit=2`;
  } catch {
    return undefined;
  }
}

function launch(command: string, cwd: string, env: Record<string, string | undefined>): void {
  children.push(spawn(command, { cwd, env: { ...process.env, ...env }, shell: true, stdio: 'ignore', windowsHide: true }));
}

async function waitUntilReachable(url: string, timeoutMs: number): Promise<void> {
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

export async function startStack(): Promise<Stack> {
  if (process.env.E2E_BASE_URL) {
    return { baseUrl: process.env.E2E_BASE_URL, apiUrl: process.env.E2E_API_URL ?? 'http://localhost:4001/api/v1' };
  }

  const apiPort = process.env.E2E_API_PORT ?? String(pickFreePort([4003, 4103, 4203, 4303, 4403, 4503]));
  const frontendPort = process.env.E2E_FRONTEND_PORT ?? String(pickFreePort([5176, 5276, 5376, 5476, 5576, 5676]));
  const baseUrl = `http://localhost:${frontendPort}`;
  const apiUrl = `http://localhost:${apiPort}/api/v1`;

  launch('npm run start:dev', backendDir, {
    PORT: apiPort,
    CORS_ORIGIN: baseUrl,
    RATE_LIMIT_DISABLED: 'true',
    DATABASE_URL: backendDatabaseUrl(),
  });
  launch(`npx vite --port ${frontendPort} --strictPort`, frontendDir, {
    VITE_API_URL: apiUrl,
    VITE_GOOGLE_MAPS_API_KEY: 'clave-e2e-simulada',
  });

  await Promise.all([
    waitUntilReachable(`http://localhost:${apiPort}/health`, 180_000),
    waitUntilReachable(baseUrl, 120_000),
  ]);
  return { baseUrl, apiUrl };
}

export function stopStack(): void {
  for (const child of children.splice(0)) {
    if (child.pid === undefined) continue;
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
}
