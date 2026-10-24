import { newAccount } from '../../support/accounts';
import { comida } from '../../support/datos';

const INTEGRANTE = 'Daniel Ortiz';

describe(`[${INTEGRANTE}] UI: formularios, validación y teclado`, () => {
  context('RF-09/RF-10 Comidas', () => {
    beforeEach(() => {
      cy.apiRegister(newAccount('ui-comida')).then(({ token }) => {
        cy.apiCreate('/meals', token, comida({ name: 'Arroz con pollo' }));
        cy.visitWithSession('/meals', token);
      });
    });

    it('cada comida ofrece los botones Editar y Eliminar', () => {
      cy.contains('h4', 'Arroz con pollo').scrollIntoView().closest('.card').within(() => {
        cy.get('button[title="Editar"]').should('be.visible');
        cy.get('button[title="Eliminar"]').should('be.visible');
      });
    });

    it('al editar, el formulario carga el nombre actual de la comida', () => {
      cy.contains('h4', 'Arroz con pollo').scrollIntoView().closest('.card').find('button[title="Editar"]').click();
      cy.get('#name').should('have.value', 'Arroz con pollo');
    });

    it('el diálogo de confirmación pide aceptar o cancelar antes de eliminar', () => {
      cy.contains('h4', 'Arroz con pollo').scrollIntoView().closest('.card').find('button[title="Eliminar"]').click();
      cy.get('.confirm-modal').should('be.visible');
      cy.get('.confirm-modal .btn-secondary').should('contain.text', 'Cancelar');
      cy.get('.confirm-modal .btn-danger').should('contain.text', 'Aceptar');
    });
  });

  context('RF-26 Notificaciones', () => {
    beforeEach(() => {
      cy.apiRegister(newAccount('ui-notif')).then(({ token }) => {
        cy.visitWithSession('/meals', token);
      });
    });

    it('sin acciones, la campana no muestra contador', () => {
      cy.get('.notification-badge').should('not.exist');
    });

    it('al abrir la campana sin notificaciones se indica que no hay nuevas', () => {
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.notification-empty').should('contain.text', 'No tienes notificaciones nuevas');
    });

    it('la campana se cierra al pulsarla de nuevo', () => {
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.notification-empty').should('be.visible');
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.notification-empty').should('not.exist');
    });
  });

  context('RF-27 Recuperar contraseña', () => {
    it('la solicitud exige un correo y no se envía con el campo vacío', () => {
      cy.intercept('POST', '**/auth/forgot-password').as('recuperar');
      cy.visit('/forgot-password');
      cy.get('form button[type="submit"]').click();
      cy.get('#email:invalid').should('exist');
      cy.get('@recuperar.all').should('have.length', 0);
    });

    it('la solicitud se puede enviar con la tecla Enter', () => {
      cy.visit('/forgot-password');
      cy.get('#email').type('alguien@athletia.test{enter}');
      cy.contains('¡Correo Enviado!').should('be.visible');
    });

    it('el formulario de restablecer oculta las contraseñas mientras se escriben', () => {
      cy.visit('/reset-password?token=token-e2e');
      cy.get('#password').should('have.attr', 'type', 'password');
      cy.get('#confirmPassword').should('have.attr', 'type', 'password');
    });
  });

  context('RF-30 Panel de administración', () => {
    it('la tabla de usuarios muestra el estado de cada cuenta y la propia fila marcada', () => {
      const admin = newAccount('ui-admin', 'Admin E2E');
      cy.apiRegisterAdmin(admin).then(({ token }) => {
        cy.visitWithSession('/admin', token);
      });
      cy.contains('td', admin.email).parent('tr').should('contain.text', '(Tú)').and('contain.text', 'Activo');
    });
  });
});
