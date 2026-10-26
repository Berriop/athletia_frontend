import { newAccount } from '../../support/accounts';
import { GIMNASIOS } from '../../support/googleMaps';
import { lesion, sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

/**
 * Base para grabar con Cypress Studio y sus sugerencias de aserciones con IA.
 *
 * Cada prueba solo prepara los datos por la API y abre la página. El resto se graba en
 * la interfaz de Cypress (npm run ia:open): "Edit in Studio" sobre la prueba, hacer el
 * flujo con clics y aceptar las aserciones que sugiere la IA. Studio escribe los
 * comandos grabados dentro de cada prueba, debajo de la preparación.
 */
describe(`[${INTEGRANTE}] Grabación con Cypress Studio (IA)`, () => {
  it('RF-12: editar las horas de un registro de sueño', () => {
    cy.apiRegister(newAccount('studio-sueno-editar')).then(({ token }) => {
      cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 7 }));
      cy.visitWithSession('/sleep', token);
    });
    cy.contains('h4', '7 horas').scrollIntoView().should('be.visible');

    // --- Grabado con Cypress Studio; aserciones sugeridas por la IA (AI Assertions) ---
    // Ajustes tras revisar lo generado:
    //  - La sugerencia de "Modo Edición" usaba un selector por posición
    //    ('#root div:nth-child(3) > div:nth-child(3)') que falló al volver a ejecutar;
    //    se busca por su texto.
    //  - Se quitaron las sugerencias del estado momentáneo "Guardando..." (botón
    //    deshabilitado): dura una fracción de segundo y hacía la prueba inestable.
    //  - Se agregó la verificación del resultado final (la tarjeta "9 horas").
    cy.get('#root svg.lucide-pen').click();
    // The page header changed to 'Editar Registro'.
    cy.get('#root h3').should('contain.text', 'Editar Registro');
    // The hours input field is populated with the value '7'.
    cy.get('#hours').should('have.value', '7');
    // A 'Modo Edición' badge is now visible.
    cy.contains('Modo Edición').should('be.visible');
    // The submit button text changed to 'Actualizar Registro'.
    cy.contains('button', 'Actualizar Registro').should('be.visible');

    cy.get('#hours').click();
    cy.get('#hours').clear();
    cy.get('#hours').type('9');
    // The hours input field value has been updated to '9'.
    cy.get('#hours').should('have.value', '9');

    cy.contains('button', 'Actualizar Registro').click();
    cy.contains('h4', '9 horas').scrollIntoView().should('be.visible');
    cy.contains('h4', '7 horas').should('not.exist');
  });

  it('RF-13: eliminar un registro de sueño', () => {
    cy.apiRegister(newAccount('studio-sueno-eliminar')).then(({ token }) => {
      cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 6 }));
      cy.visitWithSession('/sleep', token);
    });
    cy.contains('h4', '6 horas').scrollIntoView().should('be.visible');
  });

  it('RF-14: reportar una lesión', () => {
    cy.apiRegister(newAccount('studio-lesion')).then(({ token }) => {
      cy.visitWithSession('/injuries', token);
    });
    cy.contains('h3', 'Reportar Lesión').scrollIntoView().should('be.visible');
  });

  it('RF-15: editar una lesión', () => {
    cy.apiRegister(newAccount('studio-lesion-editar')).then(({ token }) => {
      cy.apiCreate('/injuries', token, lesion({ injuryName: 'Esguince leve' }));
      cy.visitWithSession('/injuries', token);
    });
    cy.contains('h4', 'Esguince leve').scrollIntoView().should('be.visible');
  });

  it('RF-16: eliminar una lesión', () => {
    cy.apiRegister(newAccount('studio-lesion-eliminar')).then(({ token }) => {
      cy.apiCreate('/injuries', token, lesion({ injuryName: 'Tendinitis rotuliana' }));
      cy.visitWithSession('/injuries', token);
    });
    cy.contains('h4', 'Tendinitis rotuliana').scrollIntoView().should('be.visible');
  });

  it('RF-18: buscar gimnasios por zona', () => {
    cy.stubGoogleMaps(GIMNASIOS);
    cy.apiRegister(newAccount('studio-gimnasios')).then(({ token }) => {
      cy.visitWithSession('/gyms', token);
    });
    cy.contains('h3.gym-card-name', 'Smart Fit Poblado').scrollIntoView().should('be.visible');
  });
});
