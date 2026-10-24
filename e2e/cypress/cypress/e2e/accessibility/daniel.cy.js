import { newAccount } from '../../support/accounts';
import { comprobarAccesibilidad } from '../../support/accesibilidad';
import { comida, sueno } from '../../support/datos';

const INTEGRANTE = 'Daniel Ortiz';

describe(`[${INTEGRANTE}] Accesibilidad automática con axe`, () => {
  it('RF-09 y RF-10: la página de comidas con un registro cumple WCAG 2.1 AA', () => {
    cy.apiRegister(newAccount('a11y-comidas')).then(({ token }) => {
      cy.apiCreate('/meals', token, comida());
      cy.visitWithSession('/meals', token);
    });
    cy.contains('h4', 'Arroz con pollo').scrollIntoView().should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-11: la página de sueño cumple WCAG 2.1 AA', () => {
    cy.apiRegister(newAccount('a11y-sueno-d')).then(({ token }) => {
      cy.apiCreate('/sleeps', token, sueno());
      cy.visitWithSession('/sleep', token);
    });
    cy.contains('h4', '7 horas').scrollIntoView().should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-26: el panel de notificaciones abierto cumple WCAG 2.1 AA', () => {
    cy.apiRegister(newAccount('a11y-notificaciones')).then(({ token }) => {
      cy.visitWithSession('/meals', token);
    });
    cy.get('#name').type('Avena con fruta');
    cy.get('#calories').type('{selectall}300');
    cy.get('form button[type="submit"]').click();
    cy.get('button[title="Notificaciones"]').click();
    cy.get('.notification-content p').should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-27: la página de recuperar contraseña cumple WCAG 2.1 AA', () => {
    cy.visit('/forgot-password');
    cy.get('#email').should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-27: la página de restablecer contraseña cumple WCAG 2.1 AA', () => {
    cy.visit('/reset-password?token=token-e2e');
    cy.get('#password').should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-30: el panel de administración cumple WCAG 2.1 AA', () => {
    const admin = newAccount('a11y-admin-d', 'Admin E2E');
    cy.apiRegisterAdmin(admin).then(({ token }) => {
      cy.visitWithSession('/admin', token);
    });
    cy.contains('td', admin.email).should('exist');
    comprobarAccesibilidad();
  });
});
