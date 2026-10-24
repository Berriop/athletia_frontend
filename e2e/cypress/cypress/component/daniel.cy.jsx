import React from 'react';
import { ConfirmDialog } from '../../../../src/components/ConfirmDialog';
import { AuthSuccessPanel } from '../../../../src/components/AuthSuccessPanel';

const INTEGRANTE = 'Daniel Ortiz';

describe(`[${INTEGRANTE}] Componentes aislados`, () => {
  context('RF-10 ConfirmDialog', () => {
    const montar = (propiedades = {}) =>
      cy.mount(
        <ConfirmDialog
          isOpen
          title="Eliminar comida"
          message="¿Seguro que quieres eliminar esta comida?"
          onConfirm={cy.stub().as('confirmar')}
          onCancel={cy.stub().as('cancelar')}
          {...propiedades}
        />,
      );

    it('muestra el título, el mensaje y los botones por defecto', () => {
      montar();
      cy.contains('h3', 'Eliminar comida').should('be.visible');
      cy.contains('p', '¿Seguro que quieres eliminar esta comida?').should('be.visible');
      cy.get('.btn-secondary').should('have.text', 'Cancelar');
      cy.get('.btn-danger').should('have.text', 'Aceptar');
    });

    it('Aceptar invoca onConfirm y no onCancel', () => {
      montar();
      cy.get('.btn-danger').click();
      cy.get('@confirmar').should('have.been.calledOnce');
      cy.get('@cancelar').should('not.have.been.called');
    });

    it('Cancelar invoca onCancel y no onConfirm', () => {
      montar();
      cy.get('.btn-secondary').click();
      cy.get('@cancelar').should('have.been.calledOnce');
      cy.get('@confirmar').should('not.have.been.called');
    });

    it('no se muestra cuando isOpen es falso', () => {
      montar({ isOpen: false });
      cy.get('.confirm-modal').should('not.exist');
    });

    it('permite cambiar el texto de los botones', () => {
      montar({ confirmText: 'Sí, eliminar', cancelText: 'No, volver' });
      cy.get('.btn-danger').should('have.text', 'Sí, eliminar');
      cy.get('.btn-secondary').should('have.text', 'No, volver');
    });
  });

  context('RF-27 AuthSuccessPanel', () => {
    it('muestra el título y el mensaje de confirmación', () => {
      cy.mount(<AuthSuccessPanel title="¡Correo Enviado!">Revisa tu bandeja de entrada.</AuthSuccessPanel>);
      cy.contains('h3', '¡Correo Enviado!').should('be.visible');
      cy.contains('p', 'Revisa tu bandeja de entrada.').should('be.visible');
    });
  });
});
