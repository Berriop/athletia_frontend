import { newAccount, VALID_PASSWORD } from '../../support/accounts';

const INTEGRANTE = 'Luisa Espinal';

describe(`[${INTEGRANTE}] API`, () => {
  context('RF-01 POST /auth/register', () => {
    it('201: crea la cuenta y responde con token sin exponer la contraseña', () => {
      const account = newAccount('api-registro');
      cy.apiRequest('POST', '/auth/register', {
        body: { name: account.name, email: account.email, password: account.password, confirmPassword: account.password },
      }).then(({ status, body }) => {
        expect(status).to.eq(201);
        expect(body.success).to.eq(true);
        expect(body.data.token).to.be.a('string');
        expect(body.data.user.email).to.eq(account.email);
        expect(body.data.user).not.to.have.property('password');
      });
    });

    it('409: rechaza un correo que ya está registrado', () => {
      const account = newAccount('api-duplicado');
      cy.apiRegister(account);
      cy.apiRequest('POST', '/auth/register', {
        body: { name: account.name, email: account.email, password: account.password, confirmPassword: account.password },
      }).then(({ status, body }) => {
        expect(status).to.eq(409);
        expect(body.success).to.eq(false);
        expect(body.error.code).to.eq('CONFLICT');
      });
    });

    it('400: las contraseñas que no coinciden devuelven el detalle del campo', () => {
      const account = newAccount('api-no-coincide');
      cy.apiRequest('POST', '/auth/register', {
        body: { email: account.email, password: account.password, confirmPassword: 'OtraClave@2026x' },
      }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.error.code).to.eq('VALIDATION_ERROR');
        expect(body.error.details.map((d) => d.field).join()).to.include('confirmPassword');
      });
    });
  });

  context('RF-02 POST /auth/login', () => {
    it('200: credenciales correctas devuelven token y el usuario sin contraseña', () => {
      const account = newAccount('api-login');
      cy.apiRegister(account);
      cy.apiRequest('POST', '/auth/login', { body: { email: account.email, password: account.password } }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.data.token).to.be.a('string');
        expect(body.data.user).not.to.have.property('password');
      });
    });

    it('401: contraseña incorrecta devuelve UNAUTHORIZED', () => {
      const account = newAccount('api-login-mala');
      cy.apiRegister(account);
      cy.apiRequest('POST', '/auth/login', { body: { email: account.email, password: 'incorrecta' } }).then(({ status, body }) => {
        expect(status).to.eq(401);
        expect(body.error.code).to.eq('UNAUTHORIZED');
        expect(body.error.message).to.eq('Correo o contraseña incorrectos');
      });
    });

    it('400: un correo con formato inválido no llega a autenticarse', () => {
      cy.apiRequest('POST', '/auth/login', { body: { email: 'no-es-un-correo', password: VALID_PASSWORD } }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.error.code).to.eq('VALIDATION_ERROR');
      });
    });
  });

  context('RF-03 Sesión (token)', () => {
    it('200: GET /auth/me devuelve a la persona del token', () => {
      const account = newAccount('api-me');
      cy.apiRegister(account).then(({ token }) => {
        cy.apiRequest('GET', '/auth/me', { token }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data.email).to.eq(account.email);
        });
      });
    });

    it('401: sin token no se accede a una ruta privada', () => {
      cy.apiRequest('GET', '/auth/me').then(({ status, body }) => {
        expect(status).to.eq(401);
        expect(body.error.code).to.eq('UNAUTHORIZED');
      });
    });

    it('401: un token inválido se rechaza', () => {
      cy.apiRequest('GET', '/auth/me', { token: 'token.invalido.e2e' }).then(({ status, body }) => {
        expect(status).to.eq(401);
        expect(body.error.message).to.eq('Token inválido o expirado');
      });
    });
  });

  context('RF-04 PUT /auth/profile', () => {
    it('200: actualiza el perfil y devuelve el usuario sin contraseña', () => {
      cy.apiRegister(newAccount('api-perfil')).then(({ token }) => {
        cy.apiRequest('PUT', '/auth/profile', { token, body: { name: 'Nombre Nuevo' } }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data.name).to.eq('Nombre Nuevo');
          expect(body.data).not.to.have.property('password');
        });
      });
    });

    it('401: sin token no se puede modificar el perfil', () => {
      cy.apiRequest('PUT', '/auth/profile', { body: { name: 'Intruso' } }).its('status').should('eq', 401);
    });
  });

  context('RF-22 GET /admin/users', () => {
    it('200: un administrador lista usuarios sin contraseñas', () => {
      cy.apiRegisterAdmin(newAccount('api-admin', 'Admin E2E')).then(({ token }) => {
        cy.apiRequest('GET', '/admin/users', { token }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data).to.be.an('array').and.not.be.empty;
          expect(body.data[0]).not.to.have.property('password');
        });
      });
    });

    it('403: un usuario normal no puede listar usuarios', () => {
      cy.apiRegister(newAccount('api-no-admin')).then(({ token }) => {
        cy.apiRequest('GET', '/admin/users', { token }).then(({ status, body }) => {
          expect(status).to.eq(403);
          expect(body.success).to.eq(false);
          expect(body.message).to.include('permisos de administrador');
        });
      });
    });

    it('401: sin token no hay acceso al panel de administración', () => {
      cy.apiRequest('GET', '/admin/users').its('status').should('eq', 401);
    });
  });

  context('RF-29 GET /user/export', () => {
    it('200: entrega un CSV descargable con el encabezado fijo', () => {
      cy.apiRegister(newAccount('api-export')).then(({ token }) => {
        cy.apiRequest('GET', '/user/export', { token }).then(({ status, headers, body }) => {
          expect(status).to.eq(200);
          expect(headers['content-type']).to.include('text/csv');
          expect(body.split('\n')[0]).to.eq('TYPE,DATE,DETAIL_1,DETAIL_2,DETAIL_3');
        });
      });
    });

    it('401: sin token no se exportan datos', () => {
      cy.apiRequest('GET', '/user/export').its('status').should('eq', 401);
    });
  });
});
