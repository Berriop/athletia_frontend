export const REGLAS = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } };

function mostrarViolaciones(violations) {
  cy.task(
    'log',
    `${violations.length} violación(es) de accesibilidad detectada(s):\n` +
      violations
        .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} elemento/s) → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
        .join('\n'),
  );
}

/** Revisa la página actual con axe (WCAG 2.1 AA) y muestra el detalle de cada violación en la terminal. */
export function comprobarAccesibilidad() {
  cy.injectAxe();
  cy.checkA11y(null, REGLAS, mostrarViolaciones);
}
