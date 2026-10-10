import { describe, it } from '@serenity-js/playwright-test';
import { contain, Ensure, equals, includes, not } from '@serenity-js/assertions';
import { isEnabled, isVisible, Navigate, Text } from '@serenity-js/web';
import { LogIn, LogOut, Register, RequestPasswordReset } from '../src/tasks/Authentication';
import { OpenNotifications, OpenSection, RecordMeal, RecordSleep, RecordWorkout, RemoveRecord } from '../src/tasks/Records';
import { BlockAccount, ClearNotifications, EditMeal, OpenResetLink, PromoteToAdmin, RemoveFirstNotification, SetNewPassword } from '../src/tasks/MoreTasks';
import { CurrentPath, ListedTitles, Notifications } from '../src/questions/Questions';
import { AdminScreen, AppShell, ForgotPasswordScreen, LoginScreen, ResetPasswordScreen } from '../src/ui/Screens';
import { newAccount } from '../src/support/accounts';
import { documenta } from '../src/support/documentacion';

const INTEGRANTE = 'Daniel Ortiz' as const;
const NUEVA_CLAVE = 'NuevaClave@2026!';

describe(`${INTEGRANTE} · RF-09/10 Comidas`, () => {
  it(`[${INTEGRANTE}] edita el nombre de una comida existente`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-09',
      objetivo: 'Verificar que se puede modificar una comida ya registrada.',
      esperado: 'La lista muestra el nuevo nombre y deja de mostrar el anterior.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('comida-editar')),
      OpenSection.called('Alimentación'),
      RecordMeal.named('Arroz con pollo'),
      Ensure.eventually(ListedTitles(), contain('Arroz con pollo')),
      EditMeal.from('Arroz con pollo').to('Pasta con atún'),
      Ensure.eventually(ListedTitles(), contain('Pasta con atún')),
      Ensure.eventually(ListedTitles(), not(contain('Arroz con pollo'))),
    );
  });

  it(`[${INTEGRANTE}] elimina una comida tras confirmar`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-10',
      objetivo: 'Verificar que se puede eliminar una comida con confirmación.',
      esperado: 'La comida desaparece de la lista.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('comida-eliminar')),
      OpenSection.called('Alimentación'),
      RecordMeal.named('Ensalada fresca'),
      Ensure.eventually(ListedTitles(), contain('Ensalada fresca')),
      RemoveRecord.titled('Ensalada fresca'),
      Ensure.eventually(ListedTitles(), not(contain('Ensalada fresca'))),
    );
  });
});

describe(`${INTEGRANTE} · RF-11 Registrar sueño`, () => {
  it(`[${INTEGRANTE}] registra horas de sueño y las muestra en la lista`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-11',
      objetivo: 'Verificar que se puede registrar el sueño de una noche.',
      esperado: 'El registro aparece en la lista como "8 horas" y se notifica "Registro de sueño creado".',
    });

    await actor.attemptsTo(
      Register.account(newAccount('sueno-crear')),
      OpenSection.called('Sueño'),
      RecordSleep.of(8),
      Ensure.eventually(ListedTitles(), contain('8 horas')),
      OpenNotifications.panel(),
      Ensure.eventually(Notifications(), contain('Registro de sueño creado')),
    );
  });
});

describe(`${INTEGRANTE} · RF-26 Notificaciones`, () => {
  it(`[${INTEGRANTE}] acumula las notificaciones de las acciones en la campana`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-26',
      objetivo: 'Verificar que cada acción exitosa genera una notificación visible en la campana.',
      esperado: 'Tras registrar una comida y un entrenamiento el contador muestra 2 y ambos mensajes están en la lista.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('notif-acumular')),
      OpenSection.called('Alimentación'),
      RecordMeal.named('Avena con fruta'),
      Ensure.eventually(ListedTitles(), contain('Avena con fruta')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Pierna ligera'),
      Ensure.eventually(ListedTitles(), contain('Pierna ligera')),
      Ensure.eventually(Text.of(AppShell.notificationBadge()), equals('2')),
      OpenNotifications.panel(),
      Ensure.eventually(Notifications(), contain('Comida registrada correctamente')),
      Ensure.that(Notifications(), contain('Entrenamiento creado correctamente')),
    );
  });

  it(`[${INTEGRANTE}] permite borrar una notificación y limpiar todas`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-26',
      objetivo: 'Verificar que las notificaciones se pueden descartar una a una o todas a la vez.',
      esperado: 'Al borrar una queda una; al pulsar "Limpiar" aparece "No tienes notificaciones nuevas".',
    });

    await actor.attemptsTo(
      Register.account(newAccount('notif-limpiar')),
      OpenSection.called('Alimentación'),
      RecordMeal.named('Avena con fruta'),
      Ensure.eventually(ListedTitles(), contain('Avena con fruta')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Pierna ligera'),
      Ensure.eventually(ListedTitles(), contain('Pierna ligera')),
      OpenNotifications.panel(),
      RemoveFirstNotification.now(),
      Ensure.eventually(Text.of(AppShell.notificationBadge()), equals('1')),
      ClearNotifications.now(),
      Ensure.eventually(Text.of(AppShell.emptyNotifications()), includes('No tienes notificaciones nuevas')),
    );
  });
});

describe(`${INTEGRANTE} · RF-27 Recuperar contraseña`, () => {
  it(`[${INTEGRANTE}] confirma la solicitud sin revelar si el correo existe`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-27',
      objetivo: 'Verificar que se puede solicitar la recuperación de contraseña.',
      esperado: 'Se muestra "¡Correo Enviado!" aunque el correo no esté registrado.',
    });

    await actor.attemptsTo(
      RequestPasswordReset.for('no.existe.recuperar@athletia.test'),
      Ensure.eventually(Text.of(ForgotPasswordScreen.successTitle()), includes('Correo Enviado')),
    );
  });

  it(`[${INTEGRANTE}] restablece la contraseña con el enlace y permite entrar con la nueva`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-27',
      objetivo: 'Verificar el recorrido completo de recuperación: solicitar, abrir el enlace, definir la nueva contraseña y entrar.',
      esperado: 'Se muestra "Contraseña Restablecida", la contraseña anterior deja de servir y la nueva permite entrar al panel.',
    });
    const account = newAccount('reset-completo');

    await actor.attemptsTo(
      Register.account(account),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      LogOut.now(),
      RequestPasswordReset.for(account.email),
      Ensure.eventually(Text.of(ForgotPasswordScreen.successTitle()), includes('Correo Enviado')),
      OpenResetLink.for(account.email),
      SetNewPassword.to(NUEVA_CLAVE),
      Ensure.eventually(Text.of(ResetPasswordScreen.successTitle()), includes('Contraseña Restablecida')),
      LogIn.as({ email: account.email, password: account.password }),
      Ensure.eventually(Text.of(LoginScreen.errorBanner()), includes('Correo o contraseña incorrectos')),
      LogIn.as({ email: account.email, password: NUEVA_CLAVE }),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
    );
  });

  it(`[${INTEGRANTE}] rechaza un enlace de recuperación con un token inválido`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-27',
      objetivo: 'Verificar que un token falso o vencido no permite cambiar la contraseña (escenario alternativo).',
      esperado: 'Al enviar la nueva contraseña se muestra un error y no aparece "Contraseña Restablecida".',
    });

    await actor.attemptsTo(
      Navigate.to('/reset-password?token=token-falso-e2e'),
      SetNewPassword.to(NUEVA_CLAVE),
      Ensure.eventually(Text.of(ResetPasswordScreen.errorBanner()), includes('inválido')),
      Ensure.that(ResetPasswordScreen.successTitle(), not(isVisible())),
    );
  });
});

describe(`${INTEGRANTE} · RF-30 Administrar usuarios`, () => {
  it(`[${INTEGRANTE}] un administrador bloquea una cuenta y esa persona ya no puede entrar`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-30',
      objetivo: 'Verificar que el administrador puede bloquear a un usuario y que el bloqueo se aplica al iniciar sesión.',
      esperado: 'La cuenta aparece como "Bloqueado" y al iniciar sesión se muestra que la cuenta está bloqueada.',
    });
    const victim = newAccount('bloqueada', 'Persona Bloqueada');
    const admin = newAccount('admin-bloqueo', 'Admin E2E');

    await actor.attemptsTo(
      Register.account(victim),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      LogOut.now(),
      Register.account(admin),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      PromoteToAdmin.theAccount(admin.email),
      LogOut.now(),
      LogIn.as(admin),
      OpenSection.called('Admin'),
      Ensure.eventually(AdminScreen.rowOf(victim.email), isVisible()),
      BlockAccount.of(victim.email),
      Ensure.eventually(Text.of(AdminScreen.statusOf(AdminScreen.rowOf(victim.email))), equals('Bloqueado')),
      LogOut.now(),
      LogIn.as(victim),
      Ensure.eventually(Text.of(LoginScreen.errorBanner()), includes('bloqueada')),
      Ensure.that(CurrentPath(), equals('/login')),
    );
  });

  it(`[${INTEGRANTE}] el administrador no puede bloquear su propia cuenta`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-30',
      objetivo: 'Verificar que el administrador no puede bloquearse a sí mismo (escenario alternativo).',
      esperado: 'En su propia fila el botón de bloqueo está deshabilitado.',
    });
    const admin = newAccount('admin-autobloqueo', 'Admin E2E');

    await actor.attemptsTo(
      Register.account(admin),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      PromoteToAdmin.theAccount(admin.email),
      LogOut.now(),
      LogIn.as(admin),
      OpenSection.called('Admin'),
      Ensure.eventually(AdminScreen.selfBlockButton(), isVisible()),
      Ensure.that(AdminScreen.selfBlockButton(), not(isEnabled())),
    );
  });
});
