import { newAccount } from '../../support/accounts';
import { comprobarAccesibilidad } from '../../support/accesibilidad';
import { GIMNASIOS } from '../../support/googleMaps';
import { lesion, sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

describe(`[${INTEGRANTE}] Accesibilidad automática con axe`, () => {
  it('RF-12 y RF-13: la página de sueño con un registro cumple WCAG 2.1 AA', () => {
    cy.apiRegister(newAccount('a11y-sueno')).then(({ token }) => {
      cy.apiCreate('/sleeps', token, sueno());
      cy.visitWithSession('/sleep', token);
    });
    cy.contains('h4', '7 horas').scrollIntoView().should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-14 a RF-16: la página de lesiones con un registro cumple WCAG 2.1 AA', () => {
    cy.apiRegister(newAccount('a11y-lesiones')).then(({ token }) => {
      cy.apiCreate('/injuries', token, lesion());
      cy.visitWithSession('/injuries', token);
    });
    cy.contains('h4', 'Esguince leve').scrollIntoView().should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-18: la página de gimnasios con resultados cumple WCAG 2.1 AA', () => {
    cy.stubGoogleMaps(GIMNASIOS);
    cy.apiRegister(newAccount('a11y-gimnasios')).then(({ token }) => {
      cy.visitWithSession('/gyms', token);
    });
    cy.contains('h3.gym-card-name', 'Smart Fit Poblado').should('be.visible');
    comprobarAccesibilidad();
  });
});
