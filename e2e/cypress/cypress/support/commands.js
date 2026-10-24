import { fakeGoogleMapsScript } from './googleMaps';

const api = (path) => `${Cypress.expose('apiUrl')}${path}`;

/** Llamada HTTP al backend sin pasar por la interfaz; no falla con 4xx para poder verificar el rechazo. */
Cypress.Commands.add('apiRequest', (method, path, { token, body, qs } = {}) =>
  cy.request({
    method,
    url: api(path),
    qs,
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    failOnStatusCode: false,
  }),
);

/** Crea una cuenta por la API y entrega sus datos junto con el token y el id. */
Cypress.Commands.add('apiRegister', (account) =>
  cy
    .apiRequest('POST', '/auth/register', {
      body: { name: account.name, email: account.email, password: account.password, confirmPassword: account.password },
    })
    .then(({ status, body }) => {
      expect(status, 'registro por API').to.eq(201);
      return { ...account, token: body.data.token, id: body.data.user.id };
    }),
);

/** Inicia sesión por la API y entrega el token (el rol viaja en el token: vuelve a iniciar sesión tras cambiarlo). */
Cypress.Commands.add('apiLogin', (account) =>
  cy.apiRequest('POST', '/auth/login', { body: { email: account.email, password: account.password } }).then(({ status, body }) => {
    expect(status, 'inicio de sesión por API').to.eq(200);
    return { ...account, token: body.data.token, id: body.data.user.id };
  }),
);

/** Cuenta con rol ADMIN lista para usar (se promueve en la base de pruebas y se vuelve a iniciar sesión). */
Cypress.Commands.add('apiRegisterAdmin', (account) =>
  cy
    .apiRegister(account)
    .then(() => cy.task('promoteToAdmin', account.email))
    .then(() => cy.apiLogin(account)),
);

/** Crea un registro (sueño, comida, lesión...) por la API y entrega el registro creado. */
Cypress.Commands.add('apiCreate', (path, token, body) =>
  cy.apiRequest('POST', path, { token, body }).then(({ status, body: respuesta }) => {
    expect(status, `crear ${path} por API`).to.eq(201);
    return respuesta.data;
  }),
);

/** Abre una página privada con la sesión ya iniciada (equivale a haber entrado antes). */
Cypress.Commands.add('visitWithSession', (path, token) =>
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', token);
      // Ubicación fija (Medellín): la página de gimnasios la pide al cargar.
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((alExito) =>
        alExito({ coords: { latitude: 6.21, longitude: -75.57, accuracy: 10 }, timestamp: Date.now() }),
      );
    },
  }),
);

/** Crea la cuenta desde el formulario de registro. */
Cypress.Commands.add('uiRegister', (account) => {
  cy.visit('/register');
  cy.get('#name').type(account.name);
  cy.get('#email').type(account.email);
  cy.get('#password').type(account.password, { log: false });
  cy.get('#confirmPassword').type(account.password, { log: false });
  cy.get('form button[type="submit"]').click();
});

/** Inicia sesión desde el formulario de acceso. */
Cypress.Commands.add('uiLogin', (email, password) => {
  cy.visit('/login');
  cy.get('#email').type(email);
  cy.get('#password').type(password, { log: false });
  cy.get('form button[type="submit"]').click();
});

/** Abre una sección desde el menú lateral. */
Cypress.Commands.add('openSection', (label) => {
  cy.contains('aside.sidebar nav a', label).click();
});

/** Reemplaza el SDK de Google Maps por uno simulado con los gimnasios indicados. */
Cypress.Commands.add('stubGoogleMaps', (gyms) => {
  cy.intercept(/maps\.googleapis\.com/, {
    statusCode: 200,
    headers: { 'content-type': 'application/javascript' },
    body: fakeGoogleMapsScript(gyms),
  });
});
