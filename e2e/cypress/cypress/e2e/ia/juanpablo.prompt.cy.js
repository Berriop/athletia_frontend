import { newAccount } from '../../support/accounts';
import { GIMNASIOS } from '../../support/googleMaps';
import { lesion, sueno } from '../../support/datos';

const INTEGRANTE = 'Juan Pablo Berrío';

/**
 * Pruebas E2E escritas en lenguaje natural con cy.prompt (IA de Cypress Cloud).
 *
 * La cuenta y los registros se crean por la API (rápido y repetible); los pasos que
 * hace la persona en la interfaz se describen en lenguaje natural y la IA los traduce
 * a comandos de Cypress. Si un selector o un texto de la app cambia, cy.prompt vuelve
 * a buscar el elemento (autorreparación) en lugar de fallar.
 *
 * Requiere iniciar sesión en Cypress Cloud desde la interfaz de Cypress (npm run ia:open)
 * o grabar con la record key (npm run ia:record:juanpablo).
 */
describe(`[${INTEGRANTE}] Pruebas con cy.prompt (IA)`, () => {
  it('RF-12: edita las horas de un registro de sueño', () => {
    cy.apiRegister(newAccount('ia-sueno-editar')).then(({ token }) => {
      cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 7 }));
      cy.visitWithSession('/sleep', token);
    });

    cy.prompt([
      'click the "Editar" button on the card that shows "7 horas"',
      'clear the "Horas de sueño" field and type "9"',
      'click the "Actualizar Registro" button',
      'verify a card with the heading "9 horas" is visible',
      'verify there is no card with the heading "7 horas"',
    ]);
  });

  it('RF-13: elimina un registro de sueño tras confirmar', () => {
    cy.apiRegister(newAccount('ia-sueno-eliminar')).then(({ token }) => {
      cy.apiCreate('/sleeps', token, sueno({ hoursSlept: 6 }));
      cy.visitWithSession('/sleep', token);
    });

    cy.prompt([
      'click the "Eliminar" button on the card that shows "6 horas"',
      'click the "Aceptar" button in the confirmation dialog',
      'verify there is no card with the heading "6 horas"',
      'verify the text "No hay registros de sueño." is visible',
    ]);
  });

  it('RF-14: reporta una lesión nueva', () => {
    cy.apiRegister(newAccount('ia-lesion')).then(({ token }) => {
      cy.visitWithSession('/injuries', token);
    });

    cy.prompt([
      'type "Rodilla derecha" in the "Área del cuerpo" field',
      'type "Esguince leve" in the "Nombre de la lesión" field',
      'clear the "Severidad (1-10)" field and type "4"',
      'click the "Registrar Lesión" button',
      'verify a card with the heading "Esguince leve" is visible',
      'verify the card shows the text "ACTIVA"',
    ]);
  });

  it('RF-14: no reporta una lesión con un nombre que solo tiene espacios', () => {
    cy.apiRegister(newAccount('ia-lesion-vacia')).then(({ token }) => {
      cy.visitWithSession('/injuries', token);
    });

    cy.prompt([
      'type "Rodilla derecha" in the "Área del cuerpo" field',
      'type "   " in the "Nombre de la lesión" field',
      'click the "Registrar Lesión" button',
      'verify the text "El campo nombre de la lesión es obligatorio" is visible',
      'verify the text "No hay lesiones reportadas." is visible',
    ]);
  });

  it('RF-15: edita el nombre de una lesión', () => {
    cy.apiRegister(newAccount('ia-lesion-editar')).then(({ token }) => {
      cy.apiCreate('/injuries', token, lesion({ injuryName: 'Esguince leve' }));
      cy.visitWithSession('/injuries', token);
    });

    cy.prompt([
      'click the "Editar" button on the card that shows "Esguince leve"',
      // Al nombrar el campo por su etiqueta ("Nombre de la lesión") la IA eligió el
      // <label>, y por su placeholder a veces lo buscó como texto visible. Con el id
      // del campo la instrucción deja de ser ambigua.
      'clear the input with id "injuryName"',
      'type "Esguince grave" in the input with id "injuryName"',
      'click the "Actualizar Lesión" button',
    ]);
    // Las verificaciones quedan como aserciones normales de Cypress: la IA tradujo
    // "verify there is no card ... Esguince leve" como "la lista no es visible", y la
    // tarjeta nueva queda dentro de un contenedor con scroll, así que su "is visible"
    // pasaba o fallaba según si el código generado hacía scroll o no.
    cy.contains('h4', 'Esguince grave').scrollIntoView().should('be.visible');
    cy.contains('h4', 'Esguince leve').should('not.exist');
  });

  it('RF-16: elimina una lesión tras confirmar', () => {
    cy.apiRegister(newAccount('ia-lesion-eliminar')).then(({ token }) => {
      cy.apiCreate('/injuries', token, lesion({ injuryName: 'Tendinitis rotuliana' }));
      cy.visitWithSession('/injuries', token);
    });

    cy.prompt([
      'click the "Eliminar" button on the card that shows "Tendinitis rotuliana"',
      'click the "Aceptar" button in the confirmation dialog',
      'verify there is no card with the heading "Tendinitis rotuliana"',
    ]);
  });

  it('RF-18: busca gimnasios por zona (Google Maps simulado)', () => {
    cy.stubGoogleMaps(GIMNASIOS);
    cy.apiRegister(newAccount('ia-gimnasios')).then(({ token }) => {
      cy.visitWithSession('/gyms', token);
    });

    cy.prompt([
      'verify the gym "Smart Fit Poblado" is listed',
      'type "envigado" in the "Buscar ciudad o zona..." field',
      'click the "Buscar" button',
      'verify the gym "Bodytech Envigado" is listed',
      'verify the gym "Smart Fit Poblado" is not listed',
    ]);
  });
});
