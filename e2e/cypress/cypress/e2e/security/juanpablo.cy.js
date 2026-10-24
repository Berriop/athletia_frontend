import { newAccount } from '../../support/accounts';
import { GIMNASIOS } from '../../support/googleMaps';
import { ID_INEXISTENTE, lesion, sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

describe(`[${INTEGRANTE}] Seguridad`, () => {
  context('Autenticación obligatoria', () => {
    [
      ['GET', '/sleeps'],
      ['POST', '/sleeps'],
      ['PUT', `/sleeps/${ID_INEXISTENTE}`],
      ['DELETE', `/sleeps/${ID_INEXISTENTE}`],
      ['GET', '/injuries'],
      ['POST', '/injuries'],
      ['PUT', `/injuries/${ID_INEXISTENTE}`],
      ['DELETE', `/injuries/${ID_INEXISTENTE}`],
      ['GET', '/gyms/search'],
      ['GET', '/gyms/nearby'],
    ].forEach(([metodo, ruta]) => {
      it(`RF-12 a RF-18: ${metodo} ${ruta} sin token responde 401`, () => {
        cy.apiRequest(metodo, ruta).then(({ status, body }) => {
          expect(status).to.eq(401);
          expect(body.error.code).to.eq('UNAUTHORIZED');
        });
      });
    });

    it('un token manipulado no da acceso a los registros de sueño', () => {
      cy.apiRegister(newAccount('seg-jp-token')).then(({ token }) => {
        cy.apiRequest('GET', '/sleeps', { token: `${token.slice(0, -2)}xx` }).its('status').should('eq', 401);
      });
    });
  });

  context('Aislamiento entre personas (acceso a registros ajenos)', () => {
    it('RF-12/RF-13: una persona no puede ver, editar ni eliminar el sueño de otra', () => {
      cy.apiRegister(newAccount('seg-jp-duena')).then((duena) => {
        cy.apiCreate('/sleeps', duena.token, sueno({ hoursSlept: 7 })).then(({ id }) => {
          cy.apiRegister(newAccount('seg-jp-intrusa')).then((intrusa) => {
            cy.apiRequest('GET', `/sleeps/${id}`, { token: intrusa.token }).its('status').should('be.oneOf', [403, 404]);
            cy.apiRequest('PUT', `/sleeps/${id}`, { token: intrusa.token, body: { hoursSlept: 1 } }).its('status').should('be.oneOf', [403, 404]);
            cy.apiRequest('DELETE', `/sleeps/${id}`, { token: intrusa.token }).its('status').should('be.oneOf', [403, 404]);
          });
          cy.apiRequest('GET', `/sleeps/${id}`, { token: duena.token }).its('body.data.hoursSlept').should('eq', 7);
        });
      });
    });

    it('RF-14/RF-15/RF-16: una persona no puede ver, editar ni eliminar las lesiones de otra', () => {
      cy.apiRegister(newAccount('seg-jp-duena2')).then((duena) => {
        cy.apiCreate('/injuries', duena.token, lesion()).then(({ id }) => {
          cy.apiRegister(newAccount('seg-jp-intrusa2')).then((intrusa) => {
            cy.apiRequest('GET', `/injuries/${id}`, { token: intrusa.token }).its('status').should('be.oneOf', [403, 404]);
            cy.apiRequest('PUT', `/injuries/${id}`, { token: intrusa.token, body: { injuryName: 'Hackeada' } }).its('status').should('be.oneOf', [403, 404]);
            cy.apiRequest('DELETE', `/injuries/${id}`, { token: intrusa.token }).its('status').should('be.oneOf', [403, 404]);
          });
          cy.apiRequest('GET', `/injuries/${id}`, { token: duena.token }).its('body.data.injuryName').should('eq', 'Esguince leve');
        });
      });
    });

    it('RF-12: la lista de una persona nunca incluye registros de otra', () => {
      cy.apiRegister(newAccount('seg-jp-lista-a')).then((a) => {
        cy.apiCreate('/sleeps', a.token, sueno({ hoursSlept: 11 }));
      });
      cy.apiRegister(newAccount('seg-jp-lista-b')).then((b) => {
        cy.apiRequest('GET', '/sleeps', { token: b.token }).its('body.data').should('have.length', 0);
      });
    });
  });

  context('Validación de entradas y ejecución de contenido', () => {
    it('RF-14: rechaza código HTML o SQL en el nombre y en el área de la lesión', () => {
      cy.apiRegister(newAccount('seg-jp-inyeccion')).then(({ token }) => {
        ['<script>alert(1)</script>', "Esguince'; DROP TABLE \"Injury\";--"].forEach((peligroso) => {
          cy.apiRequest('POST', '/injuries', { token, body: lesion({ injuryName: peligroso }) }).its('status').should('eq', 400);
          cy.apiRequest('POST', '/injuries', { token, body: lesion({ bodyArea: peligroso }) }).its('status').should('eq', 400);
        });
      });
    });

    it('RF-12: rechaza notas de más de 1000 caracteres', () => {
      cy.apiRegister(newAccount('seg-jp-notas')).then(({ token }) => {
        cy.apiRequest('POST', '/sleeps', { token, body: sueno({ notes: 'a'.repeat(1001) }) }).its('status').should('eq', 400);
      });
    });

    it('RF-18: el nombre de un gimnasio con código HTML se muestra como texto y no se ejecuta', () => {
      const peligroso = '<img src=x onerror=alert(1)>';
      cy.stubGoogleMaps([{ ...GIMNASIOS[0], name: peligroso }]);
      cy.apiRegister(newAccount('seg-jp-gym')).then(({ token }) => {
        cy.visitWithSession('/gyms', token);
      });

      cy.get('h3.gym-card-name').should('contain.text', peligroso);
      cy.get('h3.gym-card-name img').should('not.exist');
    });
  });

  context('Rutas privadas del navegador', () => {
    it('RF-12 a RF-18: sin sesión, las secciones de sueño, lesiones y gimnasios redirigen al inicio de sesión', () => {
      ['/sleep', '/injuries', '/gyms'].forEach((ruta) => {
        cy.visit(ruta);
        cy.location('pathname').should('eq', '/login');
      });
    });
  });
});
