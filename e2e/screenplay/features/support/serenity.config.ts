import { AfterAll, Before, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber';
import { Cast, configure, Duration } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import { Browser, chromium } from 'playwright';

import { resetScenarioState } from '../../src/support/scenarioState';
import { startStack, stopStack } from '../../src/support/stack';

let browser: Browser;

setDefaultTimeout(120_000);

BeforeAll(async () => {
  const baseURL = await startStack();
  browser = await chromium.launch({
    channel: 'chrome',
    headless: process.env.HEADLESS !== 'false',
  });

  configure({
    actors: Cast.where(actor => actor.whoCan(
      BrowseTheWebWithPlaywright.using(browser, {
        baseURL,
        viewport: { width: 1366, height: 768 },
        locale: 'es-CO',
        geolocation: { latitude: 6.21, longitude: -75.57 },
        permissions: ['geolocation'],
      }),
    )),
    interactionTimeout: Duration.ofSeconds(20),
    crew: [
      '@serenity-js/console-reporter',
      ['@serenity-js/html-reporter', { specDirectory: './features' }],
    ],
  });
});

Before(() => {
  resetScenarioState();
});

AfterAll(async () => {
  await browser?.close();
  stopStack();
});
