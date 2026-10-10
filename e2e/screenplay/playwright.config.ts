import { defineConfig } from '@playwright/test';
import type { SerenityFixtures, SerenityWorkerFixtures } from '@serenity-js/playwright-test';
import path from 'node:path';
import { databaseUrl, toTransactionPooler } from './src/support/database';

/**
 * Configuración de las pruebas E2E con el patrón Screenplay (Serenity/JS + Playwright).
 *
 * Por defecto Playwright levanta por sí mismo una pila de pruebas aislada de la
 * que despliega Jenkins:
 *   - Backend  → http://localhost:4001  (con RATE_LIMIT_DISABLED=true, para que
 *                los límites de login/registro no bloqueen la suite)
 *   - Frontend → http://localhost:5174  (Vite apuntando al backend de pruebas)
 *
 * Variables opcionales:
 *   E2E_BASE_URL     URL de un frontend ya desplegado. Si se define, no se levanta nada.
 *   E2E_BACKEND_DIR  Carpeta del repo athletia_backend (por defecto, la hermana de este repo).
 *   E2E_API_PORT     Puerto del backend de pruebas (por defecto 4001).
 */

const apiPort = process.env.E2E_API_PORT ?? '4001';
const frontendPort = '5174';
const externalBaseUrl = process.env.E2E_BASE_URL;
const baseURL = externalBaseUrl ?? `http://localhost:${frontendPort}`;

// El backend de pruebas usa pocas conexiones del pooler de Supabase (modo sesión).
const backendDatabaseUrl = (() => {
  try {
    const url = databaseUrl();
    if (url.includes('connection_limit')) return url;
    return `${url}${url.includes('?') ? '&' : '?'}connection_limit=2`;
  } catch {
    return undefined;
  }
})();

const frontendDir = path.resolve(__dirname, '../..');
const backendDir = path.resolve(__dirname, process.env.E2E_BACKEND_DIR ?? '../../../athletia_backend');

export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [
    ['@serenity-js/playwright-test', { crew: ['@serenity-js/console-reporter'] }],
    ['html', { open: 'never', outputFolder: 'reports/html' }],
  ],

  use: {
    baseURL,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1366, height: 768 },
    screenshot: 'only-on-failure',
    locale: 'es-CO',
    geolocation: { latitude: 6.21, longitude: -75.57 },
    permissions: ['geolocation'],
    defaultActorName: 'Ana',
    interactionTimeout: 20_000,
    crew: [],
  },

  webServer: externalBaseUrl
    ? undefined
    : [
        {
          command: 'npm run start:dev',
          cwd: backendDir,
          url: `http://localhost:${apiPort}/health`,
          env: {
            PORT: apiPort,
            CORS_ORIGIN: baseURL,
            RATE_LIMIT_DISABLED: 'true',
            ...(backendDatabaseUrl ? { DATABASE_URL: backendDatabaseUrl } : {}),
          },
          reuseExistingServer: true,
          timeout: 180_000,
        },
        {
          command: `npx vite --port ${frontendPort} --strictPort`,
          cwd: frontendDir,
          url: baseURL,
          env: {
            VITE_API_URL: `http://localhost:${apiPort}/api/v1`,
            VITE_GOOGLE_MAPS_API_KEY: 'clave-e2e-simulada',
          },
          reuseExistingServer: true,
          timeout: 120_000,
        },
      ],
});
