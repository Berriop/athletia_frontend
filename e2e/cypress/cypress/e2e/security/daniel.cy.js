import { newAccount, VALID_PASSWORD } from '../../support/accounts';
import { comida, ID_INEXISTENTE } from '../../support/datos';

const INTEGRANTE = 'Daniel Ortiz';
const NUEVA_CLAVE = 'NuevaClave@2026!';

describe(`[${INTEGRANTE}] Seguridad`, () => {
  context('Autenticación obligatoria', () => {
    [
      ['GET', '/meals'],
      ['POST', '/meals'],
      ['PUT', `/meals/${ID_INEXISTENTE}`],
      ['DELETE', `/meals/${ID_INEXISTENTE}`],
      ['POST', '/sleeps'],
      ['GET', '/admin/users'],
      ['PATCH', `/admin/users/${ID_INEXISTENTE}/toggle-block`],
    ].forEach(([metodo, ruta]) => {
      it(`RF-09 a RF-30: ${metodo} ${ruta} sin token responde 401`, () => {
        cy.apiRequest(metodo, ruta).its('status').should('eq', 401);
      });
    });
  });

  context('Aislamiento entre personas', () => {
    it('RF-09/RF-10: una persona no puede ver, editar ni eliminar las comidas de otra', () => {
      cy.apiRegister(newAccount('seg-d-duena')).then((duena) => {
        cy.apiCreate('/meals', duena.token, comida({ name: 'Comida privada' })).then(({ id }) => {
          cy.apiRegister(newAccount('seg-d-intrusa')).then((intrusa) => {
            cy.apiRequest('GET', `/meals/${id}`, { token: intrusa.token }).its('status').should('be.oneOf', [403, 404]);
            cy.apiRequest('PUT', `/meals/${id}`, { token: intrusa.token, body: { name: 'Hackeada' } }).its('status').should('be.oneOf', [403, 404]);
            cy.apiRequest('DELETE', `/meals/${id}`, { token: intrusa.token }).its('status').should('be.oneOf', [403, 404]);
          });
          cy.apiRequest('GET', `/meals/${id}`, { token: duena.token }).its('body.data.name').should('eq', 'Comida privada');
        });
      });
    });
  });

  context('RF-27 Recuperación de contraseña', () => {
    it('no revela si un correo existe: misma respuesta para un correo registrado y uno desconocido', () => {
      const cuenta = newAccount('seg-d-enumeracion');
      cy.apiRegister(cuenta);
      cy.apiRequest('POST', '/auth/forgot-password', { body: { email: cuenta.email } }).then((conocido) => {
        cy.apiRequest('POST', '/auth/forgot-password', { body: { email: 'no.existe.seg@athletia.test' } }).then((desconocido) => {
          expect(desconocido.status).to.eq(conocido.status);
          expect(desconocido.body).to.deep.eq(conocido.body);
        });
      });
    });

    it('la respuesta de la solicitud no incluye el token de recuperación', () => {
      const cuenta = newAccount('seg-d-sin-token');
      cy.apiRegister(cuenta);
      cy.apiRequest('POST', '/auth/forgot-password', { body: { email: cuenta.email } }).then(({ body }) => {
        expect(JSON.stringify(body)).not.to.match(/token/i);
      });
    });

    it('un token de recuperación solo sirve una vez', () => {
      const cuenta = newAccount('seg-d-un-uso');
      cy.apiRegister(cuenta);
      cy.apiRequest('POST', '/auth/forgot-password', { body: { email: cuenta.email } });

      cy.task('resetTokenOf', cuenta.email).then((resetToken) => {
        cy.apiRequest('POST', '/auth/reset-password', { body: { token: resetToken, newPassword: NUEVA_CLAVE } }).its('status').should('eq', 200);
        cy.apiRequest('POST', '/auth/reset-password', { body: { token: resetToken, newPassword: 'OtraClave@2026xyz' } }).its('status').should('be.within', 400, 404);
      });
      cy.apiRequest('POST', '/auth/login', { body: { email: cuenta.email, password: NUEVA_CLAVE } }).its('status').should('eq', 200);
    });

    it('un token de recuperación inventado no cambia ninguna contraseña', () => {
      ['abc', "' OR '1'='1", '00000000-0000-4000-8000-000000000000'].forEach((falso) => {
        cy.apiRequest('POST', '/auth/reset-password', { body: { token: falso, newPassword: NUEVA_CLAVE } }).its('status').should('be.within', 400, 404);
      });
    });

    it('la página de restablecer con un token falso no concede acceso', () => {
      cy.visit('/reset-password?token=token-falso-e2e');
      cy.get('#password').type(NUEVA_CLAVE, { log: false });
      cy.get('#confirmPassword').type(NUEVA_CLAVE, { log: false });
      cy.get('form button[type="submit"]').click();
      cy.location('pathname').should('not.eq', '/dashboard');
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
    });
  });

  context('RF-30 Control de acceso por rol', () => {
    it('un usuario normal no puede listar ni bloquear cuentas', () => {
      cy.apiRegister(newAccount('seg-d-normal')).then(({ token }) => {
        cy.apiRequest('GET', '/admin/users', { token }).its('status').should('eq', 403);
        cy.apiRequest('POST', `/admin/users/${ID_INEXISTENTE}/toggle-block`, { token }).its('status').should('eq', 403);
      });
    });

    it('una cuenta bloqueada no puede iniciar sesión aunque use la contraseña correcta', () => {
      cy.apiRegisterAdmin(newAccount('seg-d-admin', 'Admin E2E')).then((admin) => {
        cy.apiRegister(newAccount('seg-d-bloqueada')).then((objetivo) => {
          cy.apiRequest('PATCH', `/admin/users/${objetivo.id}/toggle-block`, { token: admin.token });
          cy.apiRequest('POST', '/auth/login', { body: { email: objetivo.email, password: VALID_PASSWORD } }).its('status').should('eq', 403);
        });
      });
    });

    it('el listado de administración no expone contraseñas ni tokens secretos', () => {
      cy.apiRegisterAdmin(newAccount('seg-d-listado', 'Admin E2E')).then(({ token }) => {
        cy.apiRequest('GET', '/admin/users', { token }).then(({ body }) => {
          body.data.forEach((usuario) => {
            expect(usuario).not.to.have.property('password');
            expect(usuario).not.to.have.property('emailVerificationToken');
            expect(usuario).not.to.have.property('resetPasswordToken');
          });
        });
      });
    });
  });

  context('RF-26 Notificaciones', () => {
    it('un mensaje con código HTML en el nombre de una comida se muestra como texto', () => {
      const peligroso = '<img src=x onerror=alert(1)>';
      cy.apiRegister(newAccount('seg-d-xss')).then(({ token }) => {
        cy.apiCreate('/meals', token, comida({ name: peligroso }));
        cy.visitWithSession('/meals', token);
      });
      cy.contains('h4', peligroso).should('exist');
      cy.get('h4 img').should('not.exist');
    });
  });
});
