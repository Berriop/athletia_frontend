import { Then, When } from '@cucumber/cucumber';
import { Ensure, equals, includes, not } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight } from '@serenity-js/core';
import { isEnabled, isVisible, Navigate, Text } from '@serenity-js/web';

import { RequestPasswordReset } from '../../src/tasks/Authentication';
import { BlockAccount, OpenResetLink, SetNewPassword } from '../../src/tasks/MoreTasks';
import { AdminScreen, ForgotPasswordScreen, ResetPasswordScreen } from '../../src/ui/Screens';
import { accountOf } from '../../src/support/scenarioState';

/** Pasos de recuperación de contraseña (RF-27) y administración de usuarios (RF-30). */

When('{actor} solicita recuperar la contraseña de su cuenta', async (actor: Actor) => {
  await actor.attemptsTo(RequestPasswordReset.for(accountOf(actor.name).email));
});

When('{actor} solicita recuperar la contraseña del correo {string}', async (actor: Actor, email: string) => {
  await actor.attemptsTo(RequestPasswordReset.for(email));
});

When('{actor} abre el enlace de recuperación que recibió en su correo', async (actor: Actor) => {
  await actor.attemptsTo(OpenResetLink.for(accountOf(actor.name).email));
});

When('{actor} abre un enlace de recuperación con un token falso', async (actor: Actor) => {
  await actor.attemptsTo(Navigate.to('/reset-password?token=token-falso-e2e'));
});

When('{actor} define la nueva contraseña {string}', async (actor: Actor, password: string) => {
  await actor.attemptsTo(SetNewPassword.to(password));
});

When('{actor} bloquea la cuenta de {persona}', async (actor: Actor, other: string) => {
  await actor.attemptsTo(BlockAccount.of(accountOf(other).email));
});

Then('{actor} ve la confirmación {string}', async (actor: Actor, confirmation: string) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(ForgotPasswordScreen.successTitle()), includes(confirmation)));
});

Then('{actor} ve que la contraseña fue restablecida', async (actor: Actor) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(ResetPasswordScreen.successTitle()), includes('Contraseña Restablecida')));
});

Then('no aparece la confirmación de contraseña restablecida', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(ResetPasswordScreen.successTitle(), not(isVisible())));
});

Then('{actor} ve la cuenta de {persona} en la lista de usuarios', async (actor: Actor, other: string) => {
  await actor.attemptsTo(Ensure.eventually(AdminScreen.rowOf(accountOf(other).email), isVisible()));
});

Then('{actor} ve la cuenta de {persona} con el estado {string}', async (actor: Actor, other: string, status: string) => {
  const row = AdminScreen.rowOf(accountOf(other).email);
  await actor.attemptsTo(Ensure.eventually(Text.of(AdminScreen.statusOf(row)), equals(status)));
});

Then('el botón para bloquear su propia cuenta está deshabilitado', async () => {
  await actorInTheSpotlight().attemptsTo(
    Ensure.eventually(AdminScreen.selfBlockButton(), isVisible()),
    Ensure.that(AdminScreen.selfBlockButton(), not(isEnabled())),
  );
});
