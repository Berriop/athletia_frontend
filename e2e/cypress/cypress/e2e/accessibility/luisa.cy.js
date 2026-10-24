import { newAccount } from '../../support/accounts';
import { comprobarAccesibilidad } from '../../support/accesibilidad';

const INTEGRANTE = 'Luisa Espinal';

describe(`[${INTEGRANTE}] Accesibilidad automática con axe`, () => {
  it('RF-02: el formulario de inicio de sesión cumple WCAG 2.1 AA', () => {
    cy.visit('/login');
    cy.get('#email').should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-01: el formulario de registro cumple WCAG 2.1 AA', () => {
    cy.visit('/register');
    cy.get('#name').should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-04 y RF-29: la página de perfil cumple WCAG 2.1 AA', () => {
    cy.apiRegister(newAccount('a11y-perfil')).then(({ token }) => {
      cy.visitWithSession('/profile', token);
    });
    cy.contains('button', 'Editar perfil').should('be.visible');
    comprobarAccesibilidad();
  });

  it('RF-22: el panel de administración cumple WCAG 2.1 AA', () => {
    const admin = newAccount('a11y-admin', 'Admin E2E');
    cy.apiRegisterAdmin(admin).then(({ token }) => {
      cy.visitWithSession('/admin', token);
    });
    cy.contains('td', admin.email).should('be.visible');
    comprobarAccesibilidad();
  });
});
