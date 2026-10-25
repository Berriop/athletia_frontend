import { Stagehand, localBrowser, type Page, type StagehandBrowser } from '@browserbasehq/stagehand';
import { createOllamaClient } from './ollama-client.js';

export type TestSession = {
  browser: StagehandBrowser;
  page: Page;
  stagehand: Stagehand;
};

function envBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} debe ser true o false; se recibió: ${value}`);
}

export async function createTestSession(): Promise<TestSession> {
  const browser = await localBrowser.launch({
    headless: envBoolean('HEADLESS', false),
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
  });

  try {
    const stagehand = await Stagehand.create({
      browser,
      model: createOllamaClient(),
      logging: { level: process.env.STAGEHAND_LOG_LEVEL === 'debug' ? 'debug' : 'info' },
    });
    const [page] = await browser.context.pages();
    if (!page) throw new Error('Stagehand no creó una página de navegador.');
    return { browser, page, stagehand };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function closeTestSession(session: TestSession): Promise<void> {
  await session.stagehand.close();
  if (!session.browser.closed) await session.browser.close();
}
