import { VALID_PASSWORD } from '../../support/accounts';

const INTEGRANTE = 'Luisa Espinal';

// Cuentas fijas: así el correo y el nombre que se ven en pantalla no cambian entre ejecuciones
// y Argos solo marca diferencias cuando cambia la interfaz.
const USUARIO = { name: 'Ana Atleta', email: 'e2e.visual.luisa@athletia.test', password: VALID_PASSWORD };
const ADMIN = { name: 'Admin Visual', email: 'e2e.visual.luisa.admin@athletia.test', password: VALID_PASSWORD };

/** Crea la cuenta si todavía no existe (409 si ya existe) y devuelve la sesión iniciada. */
function cuentaFija(cuenta, { admin = false } = {}) {
  cy.apiRequest('POST', '/auth/register', {
    body: { name: cuenta.name, email: cuenta.email, password: cuenta.password, confirmPassword: cuenta.password },
  }).its('status').should('be.oneOf', [201, 409]);
  if (admin) cy.task('promoteToAdmin', cuenta.email);
  return cy.apiLogin(cuenta);
}

describe(`[${INTEGRANTE}] Pruebas visuales con Argos`, () => {
  context('RF-01 Registro de cuenta', () => {
    it('formulario vacío', () => {
      cy.visit('/register');
      cy.get('#name').should('be.visible');
      cy.argosScreenshot('RF-01 registro - formulario vacío');
    });

    it('contraseña débil y confirmación distinta', () => {
      cy.visit('/register');
      cy.get('#name').type('Ana Atleta');
      cy.get('#email').type('ana@athletia.test');
      cy.get('#password').type('debil');
      cy.get('#confirmPassword').type('otra');
      cy.contains('✗ Las contraseñas no coinciden').should('be.visible');
      cy.argosScreenshot('RF-01 registro - contraseña débil y confirmación distinta');
    });

    it('contraseña fuerte', () => {
      cy.visit('/register');
      cy.get('#password').type(VALID_PASSWORD, { log: false });
      cy.contains('Fuerte y Segura').should('be.visible');
      cy.argosScreenshot('RF-01 registro - contraseña fuerte');
    });
  });

  context('RF-02 Inicio de sesión', () => {
    it('formulario vacío', () => {
      cy.visit('/login');
      cy.get('#email').should('be.visible');
      cy.argosScreenshot('RF-02 login - formulario vacío');
    });

    it('contraseña incorrecta', () => {
      cuentaFija(USUARIO);
      cy.uiLogin(USUARIO.email, 'ClaveIncorrecta@2026');
      cy.get('[role="alert"]').should('contain.text', 'Correo o contraseña incorrectos');
      cy.argosScreenshot('RF-02 login - contraseña incorrecta');
    });
  });

  context('RF-03 y RF-04 Panel y perfil', () => {
    beforeEach(() => {
      cuentaFija(USUARIO).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });
    });

    it('panel después de iniciar sesión', () => {
      cy.contains('.greeting-name', USUARIO.name).should('be.visible');
      cy.contains('Cargando datos...').should('not.exist');
      cy.argosScreenshot('RF-03 panel - sesión iniciada');
    });

    it('perfil en modo lectura y en modo edición', () => {
      cy.openSection('Perfil');
      cy.contains('button', 'Editar perfil').should('be.visible');
      cy.argosScreenshot('RF-04 perfil - lectura');

      cy.contains('button', 'Editar perfil').click();
      cy.contains('button', 'Guardar cambios').should('be.visible');
      cy.argosScreenshot('RF-04 perfil - edición');
    });
  });

  context('RF-22 Menú según el rol', () => {
    it('menú de un usuario normal (sin Admin)', () => {
      cuentaFija(USUARIO).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });
      cy.get('aside.sidebar').should('be.visible');
      cy.get('aside.sidebar').argosScreenshot('RF-22 menú - usuario normal');
    });

    it('menú de un administrador (con Admin)', () => {
      cuentaFija(ADMIN, { admin: true }).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });
      cy.contains('aside.sidebar nav a', 'Admin').should('be.visible');
      cy.get('aside.sidebar').argosScreenshot('RF-22 menú - administrador');
    });
  });
});
