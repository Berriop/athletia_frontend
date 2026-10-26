const { defineConfig } = require('cypress');
const react = require('@vitejs/plugin-react');
const { registerArgosTask } = require('@argos-ci/cypress/task');
const { promoteToAdmin, resetTokenOf } = require('./cypress/support/database.cjs');

/**
 * Las pruebas E2E y de API corren contra una pila de pruebas aislada de la de Jenkins
 * (backend con RATE_LIMIT_DISABLED=true y frontend de Vite). `scripts/run.cjs` la levanta
 * y define E2E_BASE_URL y E2E_API_URL; también se pueden apuntar a otra instalación.
 */
// Pruebas con IA de Cypress (cy.prompt y Studio): necesitan la sesión de Cypress Cloud y
// tienen límite de uso en el plan gratuito, así que solo se cargan con E2E_IA=true
// (npm run ia:open / npm run ia:record) y quedan fuera de las ejecuciones normales.
const IA_SPECS = 'cypress/e2e/ia/**/*.cy.js';
const IA_MODE = process.env.E2E_IA === 'true';

module.exports = defineConfig({
  // Proyecto de Cypress Cloud. La record key NO va aquí: se pasa con CYPRESS_RECORD_KEY.
  projectId: 'wq9m8m',

  reporter: 'mochawesome',

  reporterOptions: {
    reportDir: 'reports/mochawesome',
    overwrite: false,
    html: true,
    json: true,
  },

  video: false,
  viewportWidth: 1366,
  viewportHeight: 768,

  e2e: {
    baseUrl: process.env.E2E_BASE_URL || 'http://localhost:5174',
    specPattern: IA_MODE ? IA_SPECS : 'cypress/e2e/**/*.cy.js',
    excludeSpecPattern: IA_MODE ? [] : [IA_SPECS],
    setupNodeEvents(on, config) {
      on('task', {
        log: (message) => {
          console.log(message);
          return null;
        },
        // Acciones "tras bambalinas" que la aplicación no permite hacer por la interfaz.
        promoteToAdmin: (email) => promoteToAdmin(email).then(() => null),
        resetTokenOf: (email) => resetTokenOf(email),
      });
      // Pruebas visuales (Argos): se suben a Argos solo si hay un ARGOS_TOKEN; si no, las capturas quedan en ./screenshots.
      registerArgosTask(on, config, { uploadToArgos: Boolean(process.env.ARGOS_TOKEN) });
      config.expose = { ...config.expose, apiUrl: process.env.E2E_API_URL || 'http://localhost:4001/api/v1' };
      return config;
    },
  },

  component: {
    specPattern: 'cypress/component/**/*.cy.jsx',
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        plugins: [react()],
        resolve: { dedupe: ['react', 'react-dom'] },
        server: { fs: { strict: false } },
      },
    },
  },
});
