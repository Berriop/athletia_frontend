import { newAccount } from '../../support/accounts';
import { GIMNASIOS } from '../../support/googleMaps';
import { lesion, sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

const tarjeta = (titulo) => cy.contains('h4', titulo).closest('.card');

describe(`[${INTEGRANTE}] Regresión E2E`, () => {
  context('RF-12 Editar un registro de sueño', () => {
    it('edita las horas y la lista deja de mostrar las anteriores', () => {
      cy.apiRegister(newAccount('sueno-editar')).then(({ token }) => {
        cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 7 }));
        cy.visitWithSession('/sleep', token);
      });
      cy.intercept('PUT', '**/sleeps/*').as('editar');

      tarjeta('7 horas').find('button[title="Editar"]').click();
      cy.get('#hours').type('{selectall}9');
      cy.get('form button[type="submit"]').click();

      cy.wait('@editar').its('response.statusCode').should('eq', 200);
      cy.contains('h4', '9 horas').scrollIntoView().should('be.visible');
      cy.contains('h4', '7 horas').should('not.exist');
    });

    it('si se vacía el campo de horas el formulario avisa y no envía el cambio', () => {
      cy.apiRegister(newAccount('sueno-editar-vacio')).then(({ token }) => {
        cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 7 }));
        cy.visitWithSession('/sleep', token);
      });
      cy.intercept('PUT', '**/sleeps/*').as('editar');

      tarjeta('7 horas').find('button[title="Editar"]').click();
      cy.get('#hours').clear();
      cy.get('#hours').should('have.value', '');
      cy.get('form button[type="submit"]').click();

      cy.contains('El campo horas de sueño es obligatorio').should('be.visible');
      cy.get('@editar.all').should('have.length', 0);
      cy.contains('h4', '7 horas').should('exist');
    });
  });

  context('RF-13 Eliminar un registro de sueño', () => {
    it('elimina el registro tras confirmar', () => {
      cy.apiRegister(newAccount('sueno-eliminar')).then(({ token }) => {
        cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 6 }));
        cy.visitWithSession('/sleep', token);
      });
      cy.intercept('DELETE', '**/sleeps/*').as('eliminar');

      tarjeta('6 horas').find('button[title="Eliminar"]').click();
      cy.get('.confirm-modal .btn-danger').click();

      cy.wait('@eliminar').its('response.statusCode').should('eq', 204);
      cy.contains('h4', '6 horas').should('not.exist');
    });

    it('conserva el registro si se cancela la eliminación', () => {
      cy.apiRegister(newAccount('sueno-cancelar')).then(({ token }) => {
        cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 6 }));
        cy.visitWithSession('/sleep', token);
      });

      tarjeta('6 horas').find('button[title="Eliminar"]').click();
      cy.get('.confirm-modal .btn-secondary').click();

      cy.get('.confirm-modal').should('not.exist');
      cy.contains('h4', '6 horas').scrollIntoView().should('be.visible');
    });
  });

  context('RF-14 Reportar una lesión', () => {
    beforeEach(() => {
      cy.apiRegister(newAccount('lesion')).then(({ token }) => {
        cy.visitWithSession('/injuries', token);
      });
    });

    it('reporta una lesión y la muestra en la lista con su notificación', () => {
      cy.intercept('POST', '**/injuries').as('crear');

      cy.get('#bodyArea').type('Rodilla derecha');
      cy.get('#injuryName').type('Esguince leve');
      cy.get('form button[type="submit"]').click();

      cy.wait('@crear').its('response.statusCode').should('eq', 201);
      cy.contains('h4', 'Esguince leve').scrollIntoView().should('be.visible');
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.notification-content p').should('contain.text', 'Lesión registrada correctamente');
    });

    it('no acepta un nombre de lesión con números y no la agrega a la lista', () => {
      cy.intercept('POST', '**/injuries').as('crear');

      cy.get('#bodyArea').type('Rodilla derecha');
      cy.get('#injuryName').type('Esguince2');
      cy.get('form button[type="submit"]').click();

      cy.get('#injuryName:invalid').should('exist');
      cy.get('@crear.all').should('have.length', 0);
      cy.contains('h4', 'Esguince2').should('not.exist');
    });
  });

  context('RF-15 Editar una lesión', () => {
    it('edita el nombre y la lista deja de mostrar el anterior', () => {
      cy.apiRegister(newAccount('lesion-editar')).then(({ token }) => {
        cy.apiCreate('/injuries', token, lesion({ injuryName: 'Esguince leve' }));
        cy.visitWithSession('/injuries', token);
      });
      cy.intercept('PUT', '**/injuries/*').as('editar');

      tarjeta('Esguince leve').find('button[title="Editar"]').click();
      cy.get('#injuryName').clear().type('Esguince grave');
      cy.get('form button[type="submit"]').click();

      cy.wait('@editar').its('response.statusCode').should('eq', 200);
      cy.contains('h4', 'Esguince grave').scrollIntoView().should('be.visible');
      cy.contains('h4', 'Esguince leve').should('not.exist');
    });
  });

  context('RF-16 Eliminar una lesión', () => {
    it('elimina la lesión tras confirmar', () => {
      cy.apiRegister(newAccount('lesion-eliminar')).then(({ token }) => {
        cy.apiCreate('/injuries', token, lesion({ injuryName: 'Tendinitis rotuliana', bodyArea: 'Hombro izquierdo' }));
        cy.visitWithSession('/injuries', token);
      });
      cy.intercept('DELETE', '**/injuries/*').as('eliminar');

      tarjeta('Tendinitis rotuliana').find('button[title="Eliminar"]').click();
      cy.get('.confirm-modal .btn-danger').click();

      cy.wait('@eliminar').its('response.statusCode').should('eq', 204);
      cy.contains('h4', 'Tendinitis rotuliana').should('not.exist');
    });
  });

  context('RF-18 Buscar gimnasios por texto (Google Maps simulado)', () => {
    beforeEach(() => {
      cy.stubGoogleMaps(GIMNASIOS);
      cy.apiRegister(newAccount('gimnasios')).then(({ token }) => {
        cy.visitWithSession('/gyms', token);
      });
      cy.contains('h3.gym-card-name', 'Smart Fit Poblado').should('be.visible');
    });

    it('encuentra solo los gimnasios de la zona buscada', () => {
      cy.get('.gym-search-input').type('envigado');
      cy.get('.gym-search-btn').click();

      cy.contains('h3.gym-card-name', 'Bodytech Envigado').should('be.visible');
      cy.contains('h3.gym-card-name', 'Smart Fit Poblado').should('not.exist');
      cy.get('.gym-results-count').should('contain.text', '1 gimnasio');
    });

    it('avisa cuando no hay gimnasios en la zona buscada', () => {
      cy.get('.gym-search-input').type('zonainexistente');
      cy.get('.gym-search-btn').click();

      cy.get('.gym-error').should('contain.text', 'No se encontraron resultados para esa búsqueda.');
      cy.contains('h3.gym-card-name', 'Smart Fit Poblado').should('not.exist');
    });
  });
});
