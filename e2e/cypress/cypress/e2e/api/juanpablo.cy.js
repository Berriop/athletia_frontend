import { newAccount } from '../../support/accounts';
import { ID_INEXISTENTE, lesion, sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

describe(`[${INTEGRANTE}] API`, () => {
  let token;

  beforeEach(() => {
    cy.apiRegister(newAccount('api-jp')).then((cuenta) => {
      token = cuenta.token;
    });
  });

  context('RF-12 Sueño: crear, consultar y editar', () => {
    it('201: registra una noche de sueño', () => {
      cy.apiRequest('POST', '/sleeps', { token, body: sueno({ hoursSlept: 7.5 }) }).then(({ status, body }) => {
        expect(status).to.eq(201);
        expect(body.success).to.eq(true);
        expect(body.data.hoursSlept).to.eq(7.5);
      });
    });

    it('400: rechaza horas negativas y calidad fuera de rango', () => {
      [sueno({ hoursSlept: -1 }), sueno({ sleepQuality: 11 })].forEach((invalido) => {
        cy.apiRequest('POST', '/sleeps', { token, body: invalido }).then(({ status, body }) => {
          expect(status).to.eq(400);
          expect(body.error.code).to.eq('VALIDATION_ERROR');
        });
      });
    });

    it('200: la lista devuelve los registros propios con paginación', () => {
      cy.apiCreate('/sleeps', token, sueno());
      cy.apiRequest('GET', '/sleeps', { token, qs: { page: 1, limit: 5 } }).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.data).to.have.length(1);
      });
    });

    it('200: edita las horas de un registro', () => {
      cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 7 })).then(({ id }) => {
        cy.apiRequest('PUT', `/sleeps/${id}`, { token, body: { hoursSlept: 9 } }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data.hoursSlept).to.eq(9);
        });
      });
    });

    it('404: no edita un registro que no existe', () => {
      cy.apiRequest('PUT', `/sleeps/${ID_INEXISTENTE}`, { token, body: { hoursSlept: 9 } }).then(({ status, body }) => {
        expect(status).to.eq(404);
        expect(body.error.code).to.eq('NOT_FOUND');
      });
    });

    it('400: rechaza una edición sin ningún campo', () => {
      cy.apiCreate('/sleeps', token, sueno()).then(({ id }) => {
        cy.apiRequest('PUT', `/sleeps/${id}`, { token, body: {} }).its('status').should('eq', 400);
      });
    });
  });

  context('RF-13 Sueño: eliminar', () => {
    it('204: elimina el registro y deja de existir', () => {
      cy.apiCreate('/sleeps', token, sueno()).then(({ id }) => {
        cy.apiRequest('DELETE', `/sleeps/${id}`, { token }).its('status').should('eq', 204);
        cy.apiRequest('GET', `/sleeps/${id}`, { token }).its('status').should('eq', 404);
      });
    });

    it('404: no elimina un registro que no existe', () => {
      cy.apiRequest('DELETE', `/sleeps/${ID_INEXISTENTE}`, { token }).its('status').should('eq', 404);
    });
  });

  context('RF-14 Lesiones: reportar', () => {
    it('201: reporta una lesión', () => {
      cy.apiRequest('POST', '/injuries', { token, body: lesion() }).then(({ status, body }) => {
        expect(status).to.eq(201);
        expect(body.data.injuryName).to.eq('Esguince leve');
        expect(body.data.isActive).to.eq(true);
      });
    });

    it('400: rechaza nombres de lesión con números o símbolos', () => {
      ['Esguince2', 'Esguince!'].forEach((nombre) => {
        cy.apiRequest('POST', '/injuries', { token, body: lesion({ injuryName: nombre }) }).then(({ status, body }) => {
          expect(status).to.eq(400);
          expect(body.error.code).to.eq('VALIDATION_ERROR');
        });
      });
    });

    it('400: rechaza una severidad fuera de rango', () => {
      cy.apiRequest('POST', '/injuries', { token, body: lesion({ severity: 11 }) }).its('status').should('eq', 400);
    });
  });

  context('RF-15 Lesiones: editar', () => {
    it('200: cambia el nombre de la lesión', () => {
      cy.apiCreate('/injuries', token, lesion()).then(({ id }) => {
        cy.apiRequest('PUT', `/injuries/${id}`, { token, body: { injuryName: 'Esguince grave' } }).then(({ status, body }) => {
          expect(status).to.eq(200);
          expect(body.data.injuryName).to.eq('Esguince grave');
        });
      });
    });

    it('404: no edita una lesión que no existe', () => {
      cy.apiRequest('PUT', `/injuries/${ID_INEXISTENTE}`, { token, body: { injuryName: 'Esguince grave' } }).its('status').should('eq', 404);
    });
  });

  context('RF-16 Lesiones: eliminar', () => {
    it('204: elimina la lesión y deja de existir', () => {
      cy.apiCreate('/injuries', token, lesion()).then(({ id }) => {
        cy.apiRequest('DELETE', `/injuries/${id}`, { token }).its('status').should('eq', 204);
        cy.apiRequest('GET', `/injuries/${id}`, { token }).its('status').should('eq', 404);
      });
    });

    it('404: no elimina una lesión que no existe', () => {
      cy.apiRequest('DELETE', `/injuries/${ID_INEXISTENTE}`, { token }).its('status').should('eq', 404);
    });
  });

  context('RF-18 Gimnasios: validación de la búsqueda', () => {
    it('401: la búsqueda exige sesión', () => {
      cy.apiRequest('GET', '/gyms/search', { qs: { q: 'envigado' } }).its('status').should('eq', 401);
    });

    it('400: la búsqueda por texto exige el parámetro q', () => {
      cy.apiRequest('GET', '/gyms/search', { token }).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.error.code).to.eq('VALIDATION_ERROR');
      });
    });

    it('400: la búsqueda cercana exige latitud y longitud numéricas', () => {
      cy.apiRequest('GET', '/gyms/nearby', { token, qs: { lat: 'abc', lng: 'xyz' } }).its('status').should('eq', 400);
    });
  });
});
