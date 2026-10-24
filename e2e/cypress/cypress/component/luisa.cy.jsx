import React from 'react';
import { PasswordStrengthMeter } from '../../../../src/components/PasswordStrengthMeter';
import { AuthErrorBanner } from '../../../../src/components/AuthErrorBanner';

const INTEGRANTE = 'Luisa Espinal';

describe(`[${INTEGRANTE}] Componentes aislados`, () => {
  context('RF-01 PasswordStrengthMeter', () => {
    it('no muestra nada mientras no hay contraseña', () => {
      cy.mount(<PasswordStrengthMeter password="" />);
      cy.contains('Nivel de seguridad').should('not.exist');
    });

    it('marca como "Muy Débil" una contraseña que solo cumple una regla', () => {
      cy.mount(<PasswordStrengthMeter password="abc" />);
      cy.contains('Muy Débil').should('be.visible');
      cy.contains('Una letra minúscula (a-z)').parent().should('contain.text', '✓');
      cy.contains('Al menos 12 caracteres').parent().should('contain.text', '○');
    });

    it('marca como "Fuerte y Segura" una contraseña que cumple las cinco reglas', () => {
      cy.mount(<PasswordStrengthMeter password="E2eP@ssw0rd2026!" />);
      cy.contains('Fuerte y Segura').should('be.visible');
      cy.contains('○').should('not.exist');
    });
  });

  context('RF-02 AuthErrorBanner', () => {
    it('muestra el mensaje de error como una alerta accesible', () => {
      cy.mount(<AuthErrorBanner message="Correo o contraseña incorrectos" />);
      cy.get('[role="alert"]').should('be.visible').and('contain.text', 'Correo o contraseña incorrectos');
    });
  });
});
