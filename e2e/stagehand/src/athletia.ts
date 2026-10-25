import type { Page } from '@browserbasehq/stagehand';
import type { Stack } from './stack.js';

/**
 * Apoyo "tras bambalinas": crear cuentas y registros por la API para que la IA (lenta y
 * costosa) se dedique solo a lo que se está probando, y abrir una sesión ya iniciada.
 */

export const VALID_PASSWORD = 'E2eP@ssw0rd2026!';

export type Account = { name: string; email: string; password: string };
export type RegisteredAccount = Account & { token: string; id: string };

let counter = 0;

export function newAccount(label: string, name = 'Ana'): Account {
  counter += 1;
  return { name, email: `e2e.${label}.${Date.now()}${counter}@athletia.test`, password: VALID_PASSWORD };
}

async function call(stack: Stack, method: string, route: string, body?: unknown, token?: string): Promise<{ status: number; data: any }> {
  const response = await fetch(`${stack.apiUrl}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : undefined };
}

export async function registerAccount(stack: Stack, account: Account): Promise<RegisteredAccount> {
  const { status, data } = await call(stack, 'POST', '/auth/register', {
    name: account.name,
    email: account.email,
    password: account.password,
    confirmPassword: account.password,
  });
  if (status !== 201) throw new Error(`No se pudo registrar ${account.email}: ${status} ${JSON.stringify(data)}`);
  return { ...account, token: data.data.token, id: data.data.user.id };
}

export async function createRecord(stack: Stack, route: string, token: string, body: unknown): Promise<void> {
  const { status, data } = await call(stack, 'POST', route, body, token);
  if (status !== 201) throw new Error(`No se pudo crear el registro en ${route}: ${status} ${JSON.stringify(data)}`);
}

export const sleepRecord = (hoursSlept: number) => ({
  hoursSlept,
  sleepQuality: 8,
  stressLevel: 3,
  hadNightmares: false,
  date: new Date().toISOString(),
});

export const mealRecord = (name: string) => ({
  name,
  calories: 620,
  mealType: 'LUNCH',
  proteinG: 35,
  carbsG: 70,
  fatG: 15,
  date: new Date().toISOString(),
});

export const injuryRecord = (injuryName: string, bodyArea = 'Rodilla derecha') => ({ bodyArea, injuryName, severity: 4 });

/** Abre una página privada con la sesión ya iniciada (equivale a haber entrado antes). */
export async function openAs(page: Page, stack: Stack, token: string, route: string): Promise<void> {
  await page.goto(`${stack.baseUrl}/login`);
  await page.evaluate((valor: string) => localStorage.setItem('token', valor), token);
  await page.goto(`${stack.baseUrl}${route}`);
  await page.waitForSelector('.greeting-name', { state: 'visible', timeout: 20_000 });
}

export async function currentPath(page: Page): Promise<string> {
  return new URL(await page.url()).pathname;
}

/** Espera a que la ruta actual sea la indicada (la navegación de la SPA no recarga la página). */
export async function waitForPath(page: Page, expected: string, timeoutMs = 20_000): Promise<void> {
  await page.waitForFunction((ruta: string) => window.location.pathname === ruta, expected, { timeout: timeoutMs });
}

/** Abre una página pública y espera a que la aplicación la pinte antes de entregársela a la IA. */
export async function openPublic(page: Page, stack: Stack, route: string, readySelector: string): Promise<void> {
  await page.goto(`${stack.baseUrl}${route}`);
  await page.waitForSelector(readySelector, { state: 'visible', timeout: 20_000 });
}

/** Espera a que un título de la lista (h4) contenga el texto. */
export async function waitForTitle(page: Page, text: string, timeoutMs = 20_000): Promise<void> {
  await page.waitForFunction((buscado: string) => [...document.querySelectorAll('h4')].some((h) => h.textContent?.includes(buscado)), text, { timeout: timeoutMs });
}

/** Espera a que ningún título de la lista (h4) contenga el texto. */
export async function waitForTitleGone(page: Page, text: string, timeoutMs = 20_000): Promise<void> {
  await page.waitForFunction((buscado: string) => ![...document.querySelectorAll('h4')].some((h) => h.textContent?.includes(buscado)), text, { timeout: timeoutMs });
}
