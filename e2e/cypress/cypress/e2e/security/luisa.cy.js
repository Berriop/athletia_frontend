import { newAccount } from '../../support/accounts';

const INTEGRANTE = 'Luisa Espinal';

describe(`[${INTEGRANTE}] Seguridad`, () => {
  context('Cabeceras y exposición de datos', () => {
    it('RF-02: la API envía las cabeceras de seguridad esperadas', () => {
      cy.apiRequest('GET', '/auth/me').then(({ headers }) => {
        expect(headers['x-content-type-options']).to.eq('nosniff');
        expect(headers).not.to.have.property('x-powered-by');
        expect(headers['strict-transport-security']).to.be.a('string');
      });
    });

    it('RF-01/RF-02: las respuestas de autenticación no incluyen la contraseña ni su hash', () => {
      const account = newAccount('seg-sin-clave');
      cy.apiRegister(account).then(({ token }) => {
        cy.apiRequest('GET', '/auth/me', { token }).then(({ body }) => {
          expect(body.data).not.to.have.property('password');
          expect(JSON.stringify(body)).not.to.include('$2');
        });
      });
    });

    it('RF-01/RF-02: las respuestas de autenticación no incluyen los tokens secretos de verificación o recuperación', () => {
      cy.apiRegister(newAccount('seg-sin-tokens')).then(({ token }) => {
        cy.apiRequest('GET', '/auth/me', { token }).then(({ body }) => {
          expect(body.data, 'token de verificación de correo').not.to.have.property('emailVerificationToken');
          expect(body.data, 'token de recuperación de contraseña').not.to.have.property('resetPasswordToken');
        });
      });
    });
  });

  context('RF-01 Registro', () => {
    it('rechaza en el servidor una contraseña débil, aunque se omita la validación del formulario', () => {
      const account = newAccount('seg-clave-debil');
      cy.apiRequest('POST', '/auth/register', {
        body: { email: account.email, password: 'debil', confirmPassword: 'debil' },
      }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.error.code).to.eq('VALIDATION_ERROR');
      });
    });

    it('un nombre con código HTML se muestra como texto y no se ejecuta', () => {
      const account = newAccount('seg-xss', '<img src=x onerror=alert(1)>');
      cy.apiRegister(account).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });

      cy.get('.greeting-name').should('contain.text', '<img src=x onerror=alert(1)>');
      cy.get('.greeting-name img').should('not.exist');
    });
  });

  context('RF-02 Inicio de sesión', () => {
    it('no revela si un correo existe: mismo error con contraseña incorrecta y con correo desconocido', () => {
      const account = newAccount('seg-enumeracion');
      cy.apiRegister(account);

      cy.apiRequest('POST', '/auth/login', { body: { email: account.email, password: 'ClaveIncorrecta@2026' } }).then((conocido) => {
        cy.apiRequest('POST', '/auth/login', { body: { email: 'no.existe.e2e@athletia.test', password: 'ClaveIncorrecta@2026' } }).then((desconocido) => {
          expect(desconocido.status).to.eq(conocido.status);
          expect(desconocido.body.error.message).to.eq(conocido.body.error.message);
        });
      });
    });

    it('una inyección SQL en el correo o la contraseña no inicia sesión ni provoca un error del servidor', () => {
      ["' OR '1'='1", "admin@athletia.test' --"].forEach((payload) => {
        cy.apiRequest('POST', '/auth/login', { body: { email: payload, password: payload } }).its('status').should('be.oneOf', [400, 401]);
      });
      cy.apiRequest('POST', '/auth/login', { body: { email: 'a@athletia.test', password: "' OR '1'='1" } }).its('status').should('eq', 401);
    });
  });

  context('RF-03 Sesión', () => {
    it('un token manipulado se rechaza', () => {
      cy.apiRegister(newAccount('seg-token')).then(({ token }) => {
        const [header, payload, signature] = token.split('.');
        const adulterado = [header, payload, `${signature.slice(0, -2)}xx`].join('.');
        cy.apiRequest('GET', '/auth/me', { token: adulterado }).its('status').should('eq', 401);
      });
    });

    it('sin sesión, las rutas privadas del navegador redirigen al inicio de sesión', () => {
      ['/dashboard', '/profile', '/admin'].forEach((route) => {
        cy.visit(route);
        cy.location('pathname').should('eq', '/login');
      });
    });

    it('cerrar sesión elimina el token guardado en el navegador', () => {
      cy.apiRegister(newAccount('seg-logout')).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });
      cy.get('button[title="Cerrar sesión"]').click();
      cy.location('pathname').should('eq', '/login');
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
    });
  });

  context('RF-22 Control de acceso por rol', () => {
    it('un usuario normal no puede bloquear cuentas ajenas ni listar usuarios', () => {
      cy.apiRegister(newAccount('seg-objetivo')).then((objetivo) => {
        cy.apiRegister(newAccount('seg-intruso')).then(({ token }) => {
          cy.apiRequest('GET', '/admin/users', { token }).its('status').should('eq', 403);
          cy.apiRequest('PATCH', `/admin/users/${objetivo.id}/toggle-block`, { token }).its('status').should('eq', 403);
        });
      });
    });

    it('un usuario normal que escribe /admin en la barra de direcciones no obtiene datos de administración', () => {
      cy.apiRegister(newAccount('seg-url-admin')).then(({ token }) => {
        cy.intercept('GET', '**/admin/users').as('adminUsers');
        cy.visitWithSession('/admin', token);
        cy.wait('@adminUsers').its('response.statusCode').should('eq', 403);
        cy.get('table tbody tr').should('not.exist');
      });
    });
  });

  context('RF-29 Exportación', () => {
    it('cada persona exporta solo sus propios datos', () => {
      cy.apiRegister(newAccount('seg-export-a')).then(({ token }) => {
        cy.apiRequest('POST', '/workouts', {
          token,
          body: {
            title: 'Rutina privada de A',
            bodyPart: 'LEGS',
            durationMinutes: 30,
            energyLevel: 5,
            fatigueLevel: 5,
            painLevel: 1,
            date: new Date().toISOString(),
          },
        }).its('status').should('eq', 201);
      });
      cy.apiRegister(newAccount('seg-export-b')).then(({ token }) => {
        cy.apiRequest('GET', '/user/export', { token }).its('body').should('not.include', 'Rutina privada de A');
      });
    });
  });
});
