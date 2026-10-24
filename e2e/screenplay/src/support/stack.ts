import { spawn, spawnSync } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import path from 'node:path';
import { databaseUrl } from './database';
import { pickFreePort } from './ports';

/**
 * Levanta una pila de pruebas aislada de la que despliega Jenkins:
 *   - Backend  → http://localhost:4001  (con RATE_LIMIT_DISABLED=true, para que
 *                los límites de registro y recuperación no bloqueen la suite)
 *   - Frontend → http://localhost:5174  (Vite apuntando al backend de pruebas)
 *
 * Variables opcionales:
 *   E2E_BASE_URL        URL de un frontend ya desplegado. Si se define, no se levanta nada.
 *   E2E_BACKEND_DIR     Carpeta del repo athletia_backend (por defecto, la hermana de este repo).
 *   E2E_API_PORT        Puerto del backend de pruebas (por defecto, el primer libre desde 4001).
 *   E2E_FRONTEND_PORT   Puerto del frontend de pruebas (por defecto, el primer libre desde 5174).
 */

const projectRoot = path.resolve(__dirname, '../..');
const frontendDir = path.resolve(projectRoot, '../..');
const backendDir = path.resolve(projectRoot, process.env.E2E_BACKEND_DIR ?? '../../../athletia_backend');

const children: ChildProcess[] = [];

// El backend de pruebas usa pocas conexiones del pooler de Supabase (modo sesión).
function backendDatabaseUrl(): string | undefined {
  try {
    const url = databaseUrl();
    if (url.includes('connection_limit')) return url;
    return `${url}${url.includes('?') ? '&' : '?'}connection_limit=2`;
  } catch {
    return undefined;
  }
}

function launch(command: string, cwd: string, env: Record<string, string | undefined>): void {
  const child = spawn(command, { cwd, env: { ...process.env, ...env }, shell: true, stdio: 'ignore', windowsHide: true });
  children.push(child);
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

/** Devuelve la URL base del frontend sobre el que correrán las pruebas. */
export async function startStack(): Promise<string> {
  if (process.env.E2E_BASE_URL) return process.env.E2E_BASE_URL;

  const apiPort = process.env.E2E_API_PORT ?? String(pickFreePort([4001, 4101, 4201, 4301, 4401, 4501]));
  const frontendPort = process.env.E2E_FRONTEND_PORT ?? String(pickFreePort([5174, 5274, 5374, 5474, 5574, 5674]));
  const baseUrl = `http://localhost:${frontendPort}`;

  launch('npm run start:dev', backendDir, {
    PORT: apiPort,
    CORS_ORIGIN: baseUrl,
    RATE_LIMIT_DISABLED: 'true',
    DATABASE_URL: backendDatabaseUrl(),
  });
  launch(`npx vite --port ${frontendPort} --strictPort`, frontendDir, {
    VITE_API_URL: `http://localhost:${apiPort}/api/v1`,
    VITE_GOOGLE_MAPS_API_KEY: 'clave-e2e-simulada',
  });

  await Promise.all([
    waitUntilReachable(`http://localhost:${apiPort}/health`, 180_000),
    waitUntilReachable(baseUrl, 120_000),
  ]);
  return baseUrl;
}

export function stopStack(): void {
  for (const child of children.splice(0)) {
    if (child.pid === undefined) continue;
    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
  }
}
