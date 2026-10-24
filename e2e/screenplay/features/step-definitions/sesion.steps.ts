import { Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, not } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight } from '@serenity-js/core';
import { isEnabled, isVisible, Navigate, Text } from '@serenity-js/web';

import { LogIn, LogOut, Register } from '../../src/tasks/Authentication';
import { ChangeProfileName, OpenNotifications, OpenSection } from '../../src/tasks/Records';
import { ExportData, PromoteToAdmin } from '../../src/tasks/MoreTasks';
import { CurrentPath, ExportedContent, ExportedFileName, MenuOptions, Notifications } from '../../src/questions/Questions';
import { AdminScreen, AppShell, LoginScreen, RegisterScreen } from '../../src/ui/Screens';
import { accountOf, downloadedFile } from '../../src/support/scenarioState';

/** Pasos de autenticación, navegación, perfil, notificaciones, administración y exportación. */

Given('{actor} no ha iniciado sesión', async (_actor: Actor) => {
  // Sin acciones: la persona entra a la aplicación sin una sesión abierta.
});

Given('{actor} creó su cuenta y está en el panel', async (actor: Actor) => {
  await actor.attemptsTo(
    Register.account(accountOf(actor.name)),
    Ensure.eventually(CurrentPath(), equals('/dashboard')),
  );
});

Given('{actor} tiene una cuenta registrada pero no ha iniciado sesión', async (actor: Actor) => {
  await actor.attemptsTo(
    Register.account(accountOf(actor.name)),
    Ensure.eventually(CurrentPath(), equals('/dashboard')),
    LogOut.now(),
    Ensure.eventually(CurrentPath(), equals('/login')),
  );
});

Given('{actor} tiene una cuenta con rol de administrador pero no ha iniciado sesión', async (actor: Actor) => {
  const account = accountOf(actor.name);
  await actor.attemptsTo(
    Register.account(account),
    Ensure.eventually(CurrentPath(), equals('/dashboard')),
    PromoteToAdmin.theAccount(account.email),
    LogOut.now(),
    Ensure.eventually(CurrentPath(), equals('/login')),
  );
});

When('{actor} se registra con sus datos', async (actor: Actor) => {
  await actor.attemptsTo(Register.account(accountOf(actor.name)));
});

When('{actor} intenta registrarse otra vez con el mismo correo', async (actor: Actor) => {
  await actor.attemptsTo(Register.account(accountOf(actor.name)));
});

When('{actor} completa el formulario de registro con la contraseña {string} y la confirmación {string}', async (
  actor: Actor,
  password: string,
  confirmation: string,
) => {
  await actor.attemptsTo(Register.fillingIn({ ...accountOf(actor.name), password }, confirmation));
});

When('{actor} inicia sesión con su correo y su contraseña', async (actor: Actor) => {
  await actor.attemptsTo(LogIn.as(accountOf(actor.name)));
});

When('{actor} inicia sesión con su correo y la contraseña {string}', async (actor: Actor, password: string) => {
  await actor.attemptsTo(LogIn.as({ email: accountOf(actor.name).email, password }));
});

When('{actor} inicia sesión con el correo {string} y la contraseña {string}', async (actor: Actor, email: string, password: string) => {
  await actor.attemptsTo(LogIn.as({ email, password }));
});

When('{actor} cierra sesión', async (actor: Actor) => {
  await actor.attemptsTo(LogOut.now());
});

When('{actor} intenta abrir la ruta {string}', async (actor: Actor, route: string) => {
  await actor.attemptsTo(Navigate.to(route));
});

When('{actor} abre la sección {string}', async (actor: Actor, section: string) => {
  await actor.attemptsTo(OpenSection.called(section));
});

When('{actor} abre las notificaciones', async (actor: Actor) => {
  await actor.attemptsTo(OpenNotifications.panel());
});

When('{actor} cambia su nombre de perfil a {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(ChangeProfileName.to(name));
});

When('{actor} exporta sus datos a CSV', async (actor: Actor) => {
  await actor.attemptsTo(ExportData.into(downloadedFile()));
});

Then('{actor} está en la ruta {string}', async (actor: Actor, route: string) => {
  await actor.attemptsTo(Ensure.eventually(CurrentPath(), equals(route)));
});

Then('{actor} ve su nombre en el saludo', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(AppShell.greeting()), equals(accountOf(actor.name).name)));
});

Then('{actor} ve el saludo {string}', async (actor: Actor, greeting: string) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(AppShell.greeting()), equals(greeting)));
});

Then('{actor} ve el mensaje de error {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(LoginScreen.errorBanner()), includes(message)));
});

Then('{actor} ve la advertencia {string}', async (actor: Actor, warning: string) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(RegisterScreen.mismatchHint()), includes(warning)));
});

Then('el botón de crear cuenta está deshabilitado', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(RegisterScreen.submitButton(), not(isEnabled())));
});

Then('{actor} ve la notificación {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Ensure.eventually(Notifications(), contain(message)));
});

Then('el menú incluye la opción {string}', async (option: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(MenuOptions(), contain(option)));
});

Then('el menú no incluye la opción {string}', async (option: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(MenuOptions(), not(contain(option))));
});

Then('{actor} ve su propia cuenta en la lista de usuarios marcada como {string}', async (actor: Actor, mark: string) => {
  const { email } = accountOf(actor.name);
  await actor.attemptsTo(
    Ensure.eventually(AdminScreen.rowOf(email), isVisible()),
    Ensure.that(Text.of(AdminScreen.rowOf(email)), includes(mark)),
  );
});

Then('se descarga el archivo {string}', async (fileName: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(ExportedFileName(downloadedFile()), equals(fileName)));
});

Then('el archivo contiene {string}', async (content: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(ExportedContent(downloadedFile()), includes(content)));
});

Then('el archivo contiene la rutina {string}', async (title: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(ExportedContent(downloadedFile()), includes(`"${title}"`)));
});
