import { newAccount } from '../../support/accounts';

const INTEGRANTE = 'Luisa Espinal';

describe(`[${INTEGRANTE}] Regresión E2E`, () => {
  context('RF-01 Registro de cuenta', () => {
    it('crea una cuenta con datos válidos y entra al panel', () => {
      const account = newAccount('registro-ok');
      cy.intercept('POST', '**/auth/register').as('register');

      cy.uiRegister(account);

      cy.wait('@register').its('response.statusCode').should('eq', 201);
      cy.location('pathname').should('eq', '/dashboard');
      cy.get('.greeting-name').should('have.text', account.name);
    });

    it('rechaza un correo que ya está registrado', () => {
      const account = newAccount('registro-duplicado');
      cy.apiRegister(account);
      cy.intercept('POST', '**/auth/register').as('register');

      cy.uiRegister(account);

      cy.wait('@register').its('response.statusCode').should('eq', 409);
      cy.get('[role="alert"]').should('contain.text', 'Ya existe una cuenta con este correo');
      cy.location('pathname').should('eq', '/register');
    });
  });

  context('RF-02 Inicio de sesión', () => {
    it('permite entrar con credenciales válidas', () => {
      const account = newAccount('login-ok');
      cy.apiRegister(account);
      cy.intercept('POST', '**/auth/login').as('login');

      cy.uiLogin(account.email, account.password);

      cy.wait('@login').its('response.statusCode').should('eq', 200);
      cy.location('pathname').should('eq', '/dashboard');
      cy.get('.greeting-name').should('have.text', account.name);
    });

    it('rechaza una contraseña incorrecta y se queda en el inicio de sesión', () => {
      const account = newAccount('login-clave-mala');
      cy.apiRegister(account);
      cy.intercept('POST', '**/auth/login').as('login');

      cy.uiLogin(account.email, 'ClaveIncorrecta@2026');

      cy.wait('@login').its('response.statusCode').should('eq', 401);
      cy.get('[role="alert"]').should('contain.text', 'Correo o contraseña incorrectos');
      cy.location('pathname').should('eq', '/login');
    });
  });

  context('RF-03 Cerrar sesión', () => {
    it('cerrar sesión devuelve al inicio de sesión y bloquea el panel', () => {
      cy.apiRegister(newAccount('sesion-cierre')).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });

      cy.get('button[title="Cerrar sesión"]').click();
      cy.location('pathname').should('eq', '/login');

      cy.visit('/dashboard');
      cy.location('pathname').should('eq', '/login');
    });

    it('una persona sin sesión no puede abrir una sección privada', () => {
      cy.visit('/workouts');
      cy.location('pathname').should('eq', '/login');
    });
  });

  context('RF-04 Perfil', () => {
    it('permite cambiar el nombre y lo refleja en el saludo', () => {
      cy.apiRegister(newAccount('perfil-nombre')).then(({ token }) => {
        cy.visitWithSession('/profile', token);
      });
      cy.intercept('PUT', '**/auth/profile').as('profile');

      cy.contains('button', 'Editar perfil').click();
      cy.get('input[type="text"]').clear().type('Ana Renombrada');
      cy.contains('button', 'Guardar cambios').click();

      cy.wait('@profile').its('response.statusCode').should('eq', 200);
      cy.get('.greeting-name').should('have.text', 'Ana Renombrada');
      cy.get('button[title="Notificaciones"]').click();
      cy.get('.notification-content p').should('contain.text', 'Perfil actualizado correctamente');
    });
  });

  context('RF-22 Acceso al panel de administración', () => {
    it('un usuario normal no ve la opción "Admin" en el menú', () => {
      cy.apiRegister(newAccount('menu-usuario')).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });

      cy.contains('aside.sidebar nav a', 'Entrenamientos').should('be.visible');
      cy.contains('aside.sidebar nav a', 'Admin').should('not.exist');
    });

    it('un administrador ve la opción "Admin" y abre el panel de usuarios', () => {
      const admin = newAccount('admin-panel', 'Admin E2E');
      cy.apiRegisterAdmin(admin).then(({ token }) => {
        cy.visitWithSession('/dashboard', token);
      });

      cy.openSection('Admin');

      cy.contains('td', admin.email).parent('tr').should('contain.text', '(Tú)');
    });
  });

  context('RF-29 Exportar historial', () => {
    it('exporta los datos a un CSV con el encabezado fijo', () => {
      cy.apiRegister(newAccount('exportar')).then(({ token }) => {
        cy.visitWithSession('/profile', token);
      });

      cy.contains('button', 'Exportar mis datos').click();

      cy.readFile(`${Cypress.config('downloadsFolder')}/athletia_export.csv`, { timeout: 15000 })
        .should('include', 'TYPE,DATE,DETAIL_1,DETAIL_2,DETAIL_3');
    });
  });
});
