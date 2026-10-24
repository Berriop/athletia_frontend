import { newAccount } from '../../support/accounts';
import { GIMNASIOS } from '../../support/googleMaps';
import { lesion, sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

describe(`[${INTEGRANTE}] UI: formularios, validación y teclado`, () => {
  context('RF-12/RF-13 Sueño', () => {
    beforeEach(() => {
      cy.apiRegister(newAccount('ui-sueno')).then(({ token }) => {
        cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 7 }));
        cy.visitWithSession('/sleep', token);
      });
    });

    it('cada registro ofrece los botones Editar y Eliminar', () => {
      cy.contains('h4', '7 horas').scrollIntoView().closest('.card').within(() => {
        cy.get('button[title="Editar"]').should('be.visible');
        cy.get('button[title="Eliminar"]').should('be.visible');
      });
    });

    it('el diálogo de confirmación pide aceptar o cancelar antes de eliminar', () => {
      cy.contains('h4', '7 horas').closest('.card').find('button[title="Eliminar"]').click();
      cy.get('.confirm-modal').should('be.visible');
      cy.get('.confirm-modal .btn-secondary').should('contain.text', 'Cancelar');
      cy.get('.confirm-modal .btn-danger').should('contain.text', 'Aceptar');
    });

    it('al editar, el formulario carga las horas actuales del registro', () => {
      cy.contains('h4', '7 horas').closest('.card').find('button[title="Editar"]').click();
      cy.get('#hours').should('have.value', '7');
    });
  });

  context('RF-14/RF-15 Lesiones', () => {
    beforeEach(() => {
      cy.apiRegister(newAccount('ui-lesion')).then(({ token }) => {
        cy.apiCreate('/injuries', token, lesion());
        cy.visitWithSession('/injuries', token);
      });
    });

    it('el campo del nombre exige solo letras y espacios', () => {
      cy.get('#injuryName').should('have.attr', 'pattern');
      cy.get('#injuryName').type('Esguince2').then(($campo) => {
        expect($campo[0].validity.patternMismatch).to.eq(true);
      });
    });

    it('un nombre solo con letras es válido', () => {
      cy.get('#injuryName').type('Tendinitis rotuliana').then(($campo) => {
        expect($campo[0].validity.valid).to.eq(true);
      });
    });

    it('al editar, el formulario carga el nombre actual de la lesión', () => {
      cy.contains('h4', 'Esguince leve').closest('.card').find('button[title="Editar"]').click();
      cy.get('#injuryName').should('have.value', 'Esguince leve');
    });
  });

  context('RF-18 Gimnasios', () => {
    beforeEach(() => {
      cy.stubGoogleMaps(GIMNASIOS);
      cy.apiRegister(newAccount('ui-gym')).then(({ token }) => {
        cy.visitWithSession('/gyms', token);
      });
      cy.contains('h3.gym-card-name', 'Smart Fit Poblado').should('be.visible');
    });

    it('la búsqueda se puede lanzar con la tecla Enter', () => {
      cy.get('.gym-search-input').type('envigado{enter}');
      cy.contains('h3.gym-card-name', 'Bodytech Envigado').should('be.visible');
    });

    it('al cargar la página lista los gimnasios cercanos con su contador', () => {
      cy.get('h3.gym-card-name').should('have.length', 2);
      cy.get('.gym-results-count').should('contain.text', '2 gimnasios');
    });
  });
});
