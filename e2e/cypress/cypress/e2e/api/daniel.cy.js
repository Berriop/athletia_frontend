import { newAccount, VALID_PASSWORD } from '../../support/accounts';
import { comida, ID_INEXISTENTE, sueno } from '../../support/datos';

const INTEGRANTE = 'Daniel Ortiz';
const NUEVA_CLAVE = 'NuevaClave@2026!';

describe(`[${INTEGRANTE}] API`, () => {
  let token;

  beforeEach(() => {
    cy.apiRegister(newAccount('api-daniel')).then((cuenta) => {
      token = cuenta.token;
    });
  });

  context('RF-09 Comidas: editar', () => {
    it('200: modifica las calorías de una comida', () => {
      cy.apiCreate('/meals', token, comida({ calories: 600 })).then(({ id }) => {
        cy.apiRequest('PUT', `/meals/${id}`, { token, body: { calories: 750 } }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data.calories).to.eq(750);
        });
      });
    });

    it('404: no edita una comida que no existe', () => {
      cy.apiRequest('PUT', `/meals/${ID_INEXISTENTE}`, { token, body: { calories: 750 } }).then(({ status, body }) => {
        expect(status).to.eq(404);
        expect(body.error.code).to.eq('NOT_FOUND');
      });
    });

    it('400: rechaza calorías negativas y un tipo de comida inválido', () => {
      cy.apiCreate('/meals', token, comida()).then(({ id }) => {
        [{ calories: -5 }, { mealType: 'MERIENDA' }].forEach((invalido) => {
          cy.apiRequest('PUT', `/meals/${id}`, { token, body: invalido }).then(({ status, body }) => {
            expect(status).to.eq(400);
            expect(body.error.code).to.eq('VALIDATION_ERROR');
          });
        });
      });
    });
  });

  context('RF-10 Comidas: eliminar', () => {
    it('204: elimina la comida y deja de existir', () => {
      cy.apiCreate('/meals', token, comida()).then(({ id }) => {
        cy.apiRequest('DELETE', `/meals/${id}`, { token }).its('status').should('eq', 204);
        cy.apiRequest('GET', `/meals/${id}`, { token }).its('status').should('eq', 404);
      });
    });

    it('404: no elimina una comida que no existe', () => {
      cy.apiRequest('DELETE', `/meals/${ID_INEXISTENTE}`, { token }).its('status').should('eq', 404);
    });
  });

  context('RF-11 Sueño: registrar', () => {
    it('201: registra el sueño con horas decimales', () => {
      cy.apiRequest('POST', '/sleeps', { token, body: sueno({ hoursSlept: 7.5 }) }).then(({ status, body }) => {
        expect(status).to.eq(201);
        expect(body.success).to.eq(true);
        expect(body.data.hoursSlept).to.eq(7.5);
      });
    });

    it('400: rechaza datos incompletos o fuera de rango', () => {
      [{ hoursSlept: 0 }, { stressLevel: 0 }, { date: 'no-es-fecha' }].forEach((invalido) => {
        cy.apiRequest('POST', '/sleeps', { token, body: sueno(invalido) }).its('status').should('eq', 400);
      });
    });
  });

  context('RF-26 Notificaciones (origen: respuestas de la API)', () => {
    it('201 y 204: las acciones que generan notificación responden con los códigos que la interfaz espera', () => {
      cy.apiRequest('POST', '/meals', { token, body: comida() }).then(({ status, body }) => {
        expect(status).to.eq(201);
        cy.apiRequest('DELETE', `/meals/${body.data.id}`, { token }).its('status').should('eq', 204);
      });
    });
  });

  context('RF-27 Recuperar contraseña', () => {
    it('200: la solicitud responde igual aunque el correo no exista', () => {
      cy.apiRequest('POST', '/auth/forgot-password', { body: { email: 'no.existe.api@athletia.test' } }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.data.message).to.eq('Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.');
      });
    });

    it('400: rechaza un correo con formato inválido', () => {
      cy.apiRequest('POST', '/auth/forgot-password', { body: { email: 'no-es-un-correo' } }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.error.code).to.eq('VALIDATION_ERROR');
      });
    });

    it('200: restablece la contraseña con el token y la nueva ya permite entrar', () => {
      const cuenta = newAccount('api-reset');
      cy.apiRegister(cuenta);
      cy.apiRequest('POST', '/auth/forgot-password', { body: { email: cuenta.email } }).its('status').should('eq', 200);

      cy.task('resetTokenOf', cuenta.email).then((resetToken) => {
        cy.apiRequest('POST', '/auth/reset-password', { body: { token: resetToken, newPassword: NUEVA_CLAVE } }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data.message).to.eq('La contraseña se restableció correctamente.');
        });
      });
      cy.apiRequest('POST', '/auth/login', { body: { email: cuenta.email, password: NUEVA_CLAVE } }).its('status').should('eq', 200);
      cy.apiRequest('POST', '/auth/login', { body: { email: cuenta.email, password: cuenta.password } }).its('status').should('eq', 401);
    });

    it('400: rechaza una contraseña nueva que incumple la política', () => {
      cy.apiRequest('POST', '/auth/reset-password', { body: { token: 'cualquiera', newPassword: 'debil' } }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.error.code).to.eq('VALIDATION_ERROR');
      });
    });

    it('400: rechaza un token que no existe', () => {
      cy.apiRequest('POST', '/auth/reset-password', { body: { token: 'token-falso-api', newPassword: NUEVA_CLAVE } }).then(({ status }) => {
        expect(status).to.be.within(400, 404);
      });
    });
  });

  context('RF-30 Administración de usuarios', () => {
    let admin;

    beforeEach(() => {
      cy.apiRegisterAdmin(newAccount('api-admin-d', 'Admin E2E')).then((cuenta) => {
        admin = cuenta;
      });
    });

    it('200: el administrador bloquea y desbloquea una cuenta', () => {
      cy.apiRegister(newAccount('api-objetivo')).then((objetivo) => {
        cy.apiRequest('PATCH', `/admin/users/${objetivo.id}/toggle-block`, { token: admin.token }).its('body.data.isBlocked').should('eq', true);
        cy.apiRequest('PATCH', `/admin/users/${objetivo.id}/toggle-block`, { token: admin.token }).its('body.data.isBlocked').should('eq', false);
      });
    });

    it('403: el administrador no puede bloquear su propia cuenta', () => {
      cy.apiRequest('PATCH', `/admin/users/${admin.id}/toggle-block`, { token: admin.token }).then(({ status, body }) => {
        expect(status).to.eq(403);
        expect(body.error.code).to.eq('FORBIDDEN');
      });
    });

    it('404: no bloquea una cuenta que no existe', () => {
      cy.apiRequest('PATCH', `/admin/users/${ID_INEXISTENTE}/toggle-block`, { token: admin.token }).its('status').should('eq', 404);
    });

    it('403: una cuenta bloqueada no puede iniciar sesión', () => {
      cy.apiRegister(newAccount('api-bloqueada')).then((objetivo) => {
        cy.apiRequest('PATCH', `/admin/users/${objetivo.id}/toggle-block`, { token: admin.token });
        cy.apiRequest('POST', '/auth/login', { body: { email: objetivo.email, password: VALID_PASSWORD } }).then(({ status, body }) => {
          expect(status).to.eq(403);
          expect(body.error.code).to.eq('FORBIDDEN');
        });
      });
    });

    it('403: un usuario normal no puede bloquear cuentas', () => {
      cy.apiRequest('PATCH', `/admin/users/${admin.id}/toggle-block`, { token }).its('status').should('eq', 403);
    });
  });
});
