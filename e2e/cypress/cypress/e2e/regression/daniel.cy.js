import { newAccount } from '../../support/accounts';
import { comida, sueno } from '../../support/datos';

const INTEGRANTE = 'Daniel Ortiz';
const NUEVA_CLAVE = 'NuevaClave@2026!';

const tarjeta = (titulo) => cy.contains('h4', titulo).scrollIntoView().closest('.card');

describe(`[${INTEGRANTE}] Regresión E2E`, () => {
  context('RF-09 Editar una comida', () => {
    it('edita el nombre y la lista deja de mostrar el anterior', () => {
      cy.apiRegister(newAccount('comida-editar')).then(({ token }) => {
        cy.apiCreate('/meals', token, comida({ name: 'Arroz con pollo' }));
        cy.visitWithSession('/meals', token);
      });
      cy.intercept('PUT', '**/meals/*').as('editar');

      tarjeta('Arroz con pollo').find('button[title="Editar"]').click();
      cy.get('#name').type('{selectall}Pasta con atún');
      cy.get('form button[type="submit"]').click();

      cy.wait('@editar').its('response.statusCode').should('eq', 200);
      cy.contains('h4', 'Pasta con atún').should('exist');
      cy.contains('h4', 'Arroz con pollo').should('not.exist');
    });
  });

  context('RF-10 Eliminar una comida', () => {
    beforeEach(() => {
      cy.apiRegister(newAccount('comida-eliminar')).then(({ token }) => {
        cy.apiCreate('/meals', token, comida({ name: 'Ensalada fresca' }));
        cy.visitWithSession('/meals', token);
      });
    });

    it('elimina la comida tras confirmar', () => {
      cy.intercept('DELETE', '**/meals/*').as('eliminar');

      tarjeta('Ensalada fresca').find('button[title="Eliminar"]').click();
      cy.get('.confirm-modal .btn-danger').click();

      cy.wait('@eliminar').its('response.statusCode').should('eq', 204);
      cy.contains('h4', 'Ensalada fresca').should('not.exist');
    });

    it('conserva la comida si se cancela la eliminación', () => {
      tarjeta('Ensalada fresca').find('button[title="Eliminar"]').click();
      cy.get('.confirm-modal .btn-secondary').click();

      cy.get('.confirm-modal').should('not.exist');
      cy.contains('h4', 'Ensalada fresca').should('exist');
    });
  });

  context('RF-11 Registrar sueño', () => {
    it('registra horas de sueño y las muestra en la lista con su notificación', () => {
      cy.apiRegister(newAccount('sueno-crear')).then(({ token }) => {
        cy.visitWithSession('/sleep', token);
      });
      cy.intercept('POST', '**/sleeps').as('crear');

      cy.get('#hours').type('{selectall}8');
      cy.get('form button[type="submit"]').click();

      cy.wait('@crear').its('response.statusCode').should('eq', 201);
      cy.contains('h4', '8 horas').should('exist');
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.notification-content p').should('contain.text', 'Registro de sueño creado');
    });
  });

  context('RF-26 Notificaciones', () => {
    beforeEach(() => {
      cy.apiRegister(newAccount('notificaciones')).then(({ token }) => {
        cy.visitWithSession('/meals', token);
      });
      cy.get('#name').type('Avena con fruta');
      cy.get('#calories').type('{selectall}300');
      cy.get('form button[type="submit"]').click();
      cy.contains('h4', 'Avena con fruta').should('exist');
      cy.openSection('Sueño');
      cy.get('#hours').type('{selectall}8');
      cy.get('form button[type="submit"]').click();
      cy.contains('h4', '8 horas').should('exist');
    });

    it('acumula las notificaciones de las acciones en la campana', () => {
      cy.get('.notification-badge').should('have.text', '2');
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.notification-content p')
        .should('contain.text', 'Comida registrada correctamente')
        .and('contain.text', 'Registro de sueño creado');
    });

    it('permite borrar una notificación y limpiar todas', () => {
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.delete-notif-btn').first().click();
      cy.get('.notification-badge').should('have.text', '1');

      cy.get('.clear-btn').click();
      cy.get('.notification-empty').should('contain.text', 'No tienes notificaciones nuevas');
    });
  });

  context('RF-27 Recuperar contraseña', () => {
    it('confirma la solicitud sin revelar si el correo existe', () => {
      cy.intercept('POST', '**/auth/forgot-password').as('recuperar');
      cy.visit('/forgot-password');

      cy.get('#email').type('no.existe.recuperar@athletia.test');
      cy.get('form button[type="submit"]').click();

      cy.wait('@recuperar').its('response.statusCode').should('eq', 200);
      cy.contains('¡Correo Enviado!').should('be.visible');
    });

    it('restablece la contraseña con el enlace y permite entrar con la nueva', () => {
      const cuenta = newAccount('reset-completo');
      cy.apiRegister(cuenta);

      cy.visit('/forgot-password');
      cy.get('#email').type(cuenta.email);
      cy.get('form button[type="submit"]').click();
      cy.contains('¡Correo Enviado!').should('be.visible');

      cy.task('resetTokenOf', cuenta.email).then((token) => {
        cy.visit(`/reset-password?token=${token}`);
      });
      cy.get('#password').type(NUEVA_CLAVE, { log: false });
      cy.get('#confirmPassword').type(NUEVA_CLAVE, { log: false });
      cy.get('form button[type="submit"]').click();
      cy.contains('Contraseña Restablecida').should('be.visible');

      cy.uiLogin(cuenta.email, cuenta.password);
      cy.get('[role="alert"]').should('contain.text', 'Correo o contraseña incorrectos');
      cy.uiLogin(cuenta.email, NUEVA_CLAVE);
      cy.location('pathname').should('eq', '/dashboard');
    });

    it('rechaza un enlace de recuperación con un token inválido', () => {
      cy.intercept('POST', '**/auth/reset-password').as('restablecer');
      cy.visit('/reset-password?token=token-falso-e2e');

      cy.get('#password').type(NUEVA_CLAVE, { log: false });
      cy.get('#confirmPassword').type(NUEVA_CLAVE, { log: false });
      cy.get('form button[type="submit"]').click();

      cy.wait('@restablecer').its('response.statusCode').should('be.within', 400, 499);
      cy.get('[role="alert"]').should('contain.text', 'inválido');
      cy.contains('Contraseña Restablecida').should('not.exist');
    });
  });

  context('RF-30 Administrar usuarios', () => {
    it('un administrador bloquea una cuenta y esa persona ya no puede entrar', () => {
      const victima = newAccount('bloqueada', 'Persona Bloqueada');
      const admin = newAccount('admin-bloqueo', 'Admin E2E');
      cy.apiRegister(victima);
      cy.apiRegisterAdmin(admin).then(({ token }) => {
        cy.visitWithSession('/admin', token);
      });

      cy.contains('td', victima.email).parent('tr').as('fila');
      cy.get('@fila').find('button[title="Bloquear"]').click();
      cy.get('@fila').find('td:nth-child(5)').should('have.text', 'Bloqueado');

      cy.get('button[title="Cerrar sesión"]').click();
      cy.uiLogin(victima.email, victima.password);
      cy.get('[role="alert"]').should('contain.text', 'bloqueada');
      cy.location('pathname').should('eq', '/login');
    });

    it('el administrador no puede bloquear su propia cuenta', () => {
      cy.apiRegisterAdmin(newAccount('admin-autobloqueo', 'Admin E2E')).then(({ token }) => {
        cy.visitWithSession('/admin', token);
      });

      cy.get('button[title="No puedes bloquearte a ti mismo"]').should('be.visible').and('be.disabled');
    });
  });
});
