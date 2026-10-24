import { newAccount, VALID_PASSWORD } from '../../support/accounts';

const INTEGRANTE = 'Luisa Espinal';

describe(`[${INTEGRANTE}] UI: formularios, validación y teclado`, () => {
  context('RF-01 Formulario de registro', () => {
    beforeEach(() => cy.visit('/register'));

    it('oculta la contraseña mientras se escribe', () => {
      cy.get('#password').should('have.attr', 'type', 'password');
      cy.get('#confirmPassword').should('have.attr', 'type', 'password');
    });

    it('mantiene deshabilitado el botón mientras la contraseña no cumple la política', () => {
      cy.get('#name').type('Ana Atleta');
      cy.get('#email').type('ana.ui@athletia.test');
      cy.get('#password').type('debil');
      cy.get('#confirmPassword').type('debil');
      cy.get('form button[type="submit"]').should('be.disabled');
    });

    it('el medidor de seguridad pasa de "Muy Débil" a "Fuerte y Segura"', () => {
      cy.get('#password').type('abc');
      cy.contains('Muy Débil').should('be.visible');
      cy.get('#password').clear().type(VALID_PASSWORD, { log: false });
      cy.contains('Fuerte y Segura').should('be.visible');
    });

    it('avisa cuando la confirmación no coincide y habilita el botón al corregirla', () => {
      cy.get('#name').type('Ana Atleta');
      cy.get('#email').type('ana.ui2@athletia.test');
      cy.get('#password').type(VALID_PASSWORD, { log: false });
      cy.get('#confirmPassword').type('OtraClave@2026x', { log: false });
      cy.contains('div', '✗ Las contraseñas no coinciden').should('be.visible');
      cy.get('form button[type="submit"]').should('be.disabled');

      cy.get('#confirmPassword').clear().type(VALID_PASSWORD, { log: false });
      cy.get('form button[type="submit"]').should('be.enabled');
    });
  });

  context('RF-02 Formulario de inicio de sesión', () => {
    beforeEach(() => cy.visit('/login'));

    it('no envía el formulario si faltan los campos obligatorios', () => {
      cy.intercept('POST', '**/auth/login').as('login');
      cy.get('form button[type="submit"]').click();
      cy.get('#email:invalid').should('exist');
      cy.get('@login.all').should('have.length', 0);
    });

    it('permite enviar el formulario con la tecla Enter', () => {
      const account = newAccount('ui-enter');
      cy.apiRegister(account);
      cy.get('#email').type(account.email);
      cy.get('#password').type(`${account.password}{enter}`, { log: false });
      cy.location('pathname').should('eq', '/dashboard');
    });

    it('el enlace de recuperación lleva a la página de recuperar contraseña', () => {
      cy.contains('a', '¿Olvidaste tu contraseña?').click();
      cy.location('pathname').should('eq', '/forgot-password');
    });
  });

  context('RF-03 y RF-22 Menú lateral', () => {
    it('un usuario normal ve sus secciones y el botón para cerrar sesión', () => {
      cy.apiRegister(newAccount('ui-menu')).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });
      ['Entrenamientos', 'Alimentación', 'Sueño', 'Lesiones', 'Gimnasios', 'Perfil'].forEach((section) => {
        cy.contains('aside.sidebar nav a', section).should('be.visible');
      });
      cy.get('button[title="Cerrar sesión"]').should('be.visible');
    });
  });

  context('RF-04 Perfil', () => {
    it('al pulsar "Editar perfil" se puede escribir el nombre y se ofrece guardar los cambios', () => {
      cy.apiRegister(newAccount('ui-perfil')).then(({ token }) => {
        cy.visitWithSession('/profile', token);
      });
      cy.contains('button', 'Editar perfil').click();
      cy.get('input[type="text"]').should('be.visible').and('be.enabled');
      cy.contains('button', 'Guardar cambios').should('be.visible');
    });
  });
});
