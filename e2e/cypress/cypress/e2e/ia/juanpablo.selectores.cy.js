import { newAccount } from '../../support/accounts';
import { sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

/**
 * Grupo de control para la autorreparación de cy.prompt: el mismo flujo de RF-12 que
 * juanpablo.prompt.cy.js, pero con selectores fijos como en las pruebas tradicionales.
 * Si cambia el id del campo de horas, esta prueba falla y la de cy.prompt se repara sola.
 */
describe(`[${INTEGRANTE}] Control con selectores fijos (sin IA)`, () => {
  it('RF-12: edita las horas de un registro de sueño', () => {
    cy.apiRegister(newAccount('fijo-sueno-editar')).then(({ token }) => {
      cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 7 }));
      cy.visitWithSession('/sleep', token);
    });

    cy.contains('h4', '7 horas').closest('.card').find('button[title="Editar"]').click();
    cy.get('#hours').clear();
    cy.get('#hours').type('9');
    cy.contains('button', 'Actualizar Registro').click();

    cy.contains('h4', '9 horas').scrollIntoView().should('be.visible');
    cy.contains('h4', '7 horas').should('not.exist');
  });
});
