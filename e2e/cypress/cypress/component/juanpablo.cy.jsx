import React from 'react';
import { RowActionButtons } from '../../../../src/components/RowActionButtons';
import { ListStatus } from '../../../../src/components/ListStatus';

const INTEGRANTE = 'Juan Pablo Berrío';

describe(`[${INTEGRANTE}] Componentes aislados`, () => {
  context('RF-15/RF-16 RowActionButtons', () => {
    it('muestra los botones Editar y Eliminar', () => {
      cy.mount(<RowActionButtons onEdit={cy.stub()} onDelete={cy.stub()} />);
      cy.get('button[title="Editar"]').should('be.visible');
      cy.get('button[title="Eliminar"]').should('be.visible');
    });

    it('Editar invoca onEdit y no onDelete', () => {
      cy.mount(<RowActionButtons onEdit={cy.stub().as('editar')} onDelete={cy.stub().as('eliminar')} />);
      cy.get('button[title="Editar"]').click();
      cy.get('@editar').should('have.been.calledOnce');
      cy.get('@eliminar').should('not.have.been.called');
    });

    it('Eliminar invoca onDelete y no onEdit', () => {
      cy.mount(<RowActionButtons onEdit={cy.stub().as('editar')} onDelete={cy.stub().as('eliminar')} />);
      cy.get('button[title="Eliminar"]').click();
      cy.get('@eliminar').should('have.been.calledOnce');
      cy.get('@editar').should('not.have.been.called');
    });
  });

  context('RF-12/RF-14 ListStatus', () => {
    it('muestra "Cargando..." mientras la lista vacía se está consultando', () => {
      cy.mount(<ListStatus isLoading isEmpty emptyText="Sin registros" />);
      cy.contains('Cargando...').should('be.visible');
    });

    it('muestra el texto de lista vacía cuando terminó de cargar y no hay registros', () => {
      cy.mount(<ListStatus isLoading={false} isEmpty emptyText="No tienes registros de sueño" />);
      cy.contains('No tienes registros de sueño').should('be.visible');
    });

    it('no muestra nada cuando la lista tiene registros', () => {
      cy.mount(<ListStatus isLoading={false} isEmpty={false} emptyText="Sin registros" />);
      cy.get('[data-cy-root]').should('be.empty');
    });
  });
});
