import { describe, it } from '@serenity-js/playwright-test';
import { contain, Ensure, equals, includes, not } from '@serenity-js/assertions';
import { isEnabled, isVisible, Navigate, Text } from '@serenity-js/web';
import { LogIn, LogOut, Register } from '../src/tasks/Authentication';
import { ChangeProfileName, OpenNotifications, OpenSection, RecordWorkout } from '../src/tasks/Records';
import { ExportData, ExportedFile, PromoteToAdmin } from '../src/tasks/MoreTasks';
import { CurrentPath, ExportedContent, ExportedFileName, ListedTitles, MenuOptions, Notifications } from '../src/questions/Questions';
import { AdminScreen, AppShell, LoginScreen, RegisterScreen } from '../src/ui/Screens';
import { newAccount } from '../src/support/accounts';
import { documenta } from '../src/support/documentacion';

const INTEGRANTE = 'Luisa Espinal' as const;

describe(`${INTEGRANTE} · RF-01 Registro de cuenta`, () => {
  it(`[${INTEGRANTE}] permite crear una cuenta con datos válidos y entrar al panel`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-01',
      objetivo: 'Verificar que una persona nueva puede registrarse con datos válidos.',
      esperado: 'Se crea la cuenta, se inicia sesión y se muestra el panel (/dashboard) saludando por su nombre.',
    });
    const account = newAccount('registro-ok', 'Ana Atleta');

    await actor.attemptsTo(
      Register.account(account),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      Ensure.eventually(Text.of(AppShell.greeting()), equals('Ana Atleta')),
    );
  });

  it(`[${INTEGRANTE}] no deja registrarse con una contraseña débil`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-01',
      objetivo: 'Verificar que la política de contraseñas se aplica en el formulario (escenario alternativo).',
      esperado: 'Con una contraseña débil el botón "Crear Cuenta" queda deshabilitado y la persona sigue en /register.',
    });
    const account = { ...newAccount('registro-debil'), password: 'debil' };

    await actor.attemptsTo(
      Register.fillingIn(account, 'debil'),
      Ensure.eventually(RegisterScreen.submitButton(), not(isEnabled())),
      Ensure.that(CurrentPath(), equals('/register')),
    );
  });

  it(`[${INTEGRANTE}] no deja registrarse si la confirmación no coincide`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-01',
      objetivo: 'Verificar que la contraseña y su confirmación deben ser iguales (escenario alternativo).',
      esperado: 'Aparece el aviso de contraseñas distintas y el botón queda deshabilitado.',
    });

    await actor.attemptsTo(
      Register.fillingIn(newAccount('registro-distinta'), 'OtraClave@2026x'),
      Ensure.eventually(Text.of(RegisterScreen.mismatchHint()), includes('Las contraseñas no coinciden')),
      Ensure.that(RegisterScreen.submitButton(), not(isEnabled())),
    );
  });

  it(`[${INTEGRANTE}] rechaza un correo que ya está registrado`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-01',
      objetivo: 'Verificar que no se puede crear dos cuentas con el mismo correo (escenario alternativo).',
      esperado: 'El segundo registro muestra el error "Email already in use" y no entra al panel.',
    });
    const account = newAccount('registro-duplicado');

    await actor.attemptsTo(
      Register.account(account),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      LogOut.now(),
      Ensure.eventually(CurrentPath(), equals('/login')),
      Register.account(account),
      Ensure.eventually(Text.of(RegisterScreen.errorBanner()), includes('Email already in use')),
      Ensure.that(CurrentPath(), equals('/register')),
    );
  });
});

describe(`${INTEGRANTE} · RF-02 Inicio de sesión`, () => {
  it(`[${INTEGRANTE}] permite entrar con credenciales válidas`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-02',
      objetivo: 'Verificar que una persona registrada puede iniciar sesión.',
      esperado: 'Tras iniciar sesión se muestra el panel (/dashboard) con el saludo de la persona.',
    });
    const account = newAccount('login-ok', 'Ana Atleta');

    await actor.attemptsTo(
      Register.account(account),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      LogOut.now(),
      Ensure.eventually(CurrentPath(), equals('/login')),
      LogIn.as(account),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      Ensure.eventually(Text.of(AppShell.greeting()), equals('Ana Atleta')),
    );
  });

  it(`[${INTEGRANTE}] rechaza una contraseña incorrecta sin iniciar sesión`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-02',
      objetivo: 'Verificar que una contraseña incorrecta no permite entrar (escenario alternativo).',
      esperado: 'Se muestra "Correo o contraseña incorrectos" y la persona sigue en /login.',
    });
    const account = newAccount('login-clave-mala');

    await actor.attemptsTo(
      Register.account(account),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      LogOut.now(),
      LogIn.as({ email: account.email, password: 'ClaveIncorrecta@2026' }),
      Ensure.eventually(Text.of(LoginScreen.errorBanner()), includes('Correo o contraseña incorrectos')),
      Ensure.that(CurrentPath(), equals('/login')),
    );
  });

  it(`[${INTEGRANTE}] muestra el mismo error para un correo que no existe`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-02',
      objetivo: 'Verificar que el sistema no revela si un correo está registrado (escenario alternativo de seguridad).',
      esperado: 'Con un correo inexistente se muestra el mismo mensaje que con una contraseña incorrecta.',
    });

    await actor.attemptsTo(
      LogIn.as({ email: 'no.existe.e2e@athletia.test', password: 'Cualquiera@2026x' }),
      Ensure.eventually(Text.of(LoginScreen.errorBanner()), includes('Correo o contraseña incorrectos')),
      Ensure.that(CurrentPath(), equals('/login')),
    );
  });
});

describe(`${INTEGRANTE} · RF-03 Cerrar sesión`, () => {
  it(`[${INTEGRANTE}] cerrar sesión devuelve al inicio de sesión y bloquea el panel`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-03',
      objetivo: 'Verificar que cerrar sesión termina la sesión y que el panel deja de ser accesible.',
      esperado: 'Se muestra /login; al intentar abrir /dashboard se redirige otra vez a /login.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('sesion-cierre')),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      LogOut.now(),
      Ensure.eventually(CurrentPath(), equals('/login')),
      Navigate.to('/dashboard'),
      Ensure.eventually(CurrentPath(), equals('/login')),
    );
  });

  it(`[${INTEGRANTE}] una persona sin sesión no puede abrir una sección privada`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-03',
      objetivo: 'Verificar que las rutas privadas exigen sesión (escenario alternativo).',
      esperado: 'Abrir /workouts sin sesión redirige a /login.',
    });

    await actor.attemptsTo(
      Navigate.to('/workouts'),
      Ensure.eventually(CurrentPath(), equals('/login')),
    );
  });
});

describe(`${INTEGRANTE} · RF-04 Perfil`, () => {
  it(`[${INTEGRANTE}] permite cambiar el nombre y lo refleja en el saludo`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-04',
      objetivo: 'Verificar que la persona puede actualizar su perfil.',
      esperado: 'Se notifica "Perfil actualizado correctamente" y el saludo muestra el nuevo nombre.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('perfil-nombre', 'Ana Atleta')),
      OpenSection.called('Perfil'),
      ChangeProfileName.to('Ana Renombrada'),
      Ensure.eventually(Text.of(AppShell.greeting()), equals('Ana Renombrada')),
      OpenNotifications.panel(),
      Ensure.eventually(Notifications(), contain('Perfil actualizado correctamente')),
    );
  });
});

describe(`${INTEGRANTE} · RF-22 Acceso al panel de administración`, () => {
  it(`[${INTEGRANTE}] un usuario normal no ve la opción "Admin" en el menú`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-22',
      objetivo: 'Verificar que la opción de administración solo la ve quien tiene rol ADMIN (escenario alternativo).',
      esperado: 'El menú de un usuario normal muestra sus secciones pero no incluye "Admin".',
    });

    await actor.attemptsTo(
      Register.account(newAccount('menu-usuario')),
      Ensure.eventually(MenuOptions(), contain('Entrenamientos')),
      Ensure.that(MenuOptions(), not(contain('Admin'))),
    );
  });

  it(`[${INTEGRANTE}] un administrador ve la opción "Admin" y abre el panel de usuarios`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-22',
      objetivo: 'Verificar que una cuenta con rol ADMIN accede al panel de administración.',
      esperado: 'El menú incluye "Admin" y el panel lista a los usuarios, incluida su propia cuenta marcada como "Tú".',
    });
    const admin = newAccount('admin-panel', 'Admin E2E');

    await actor.attemptsTo(
      Register.account(admin),
      Ensure.eventually(CurrentPath(), equals('/dashboard')),
      PromoteToAdmin.theAccount(admin.email),
      LogOut.now(),
      LogIn.as(admin),
      Ensure.eventually(MenuOptions(), contain('Admin')),
      OpenSection.called('Admin'),
      Ensure.eventually(AdminScreen.rowOf(admin.email), isVisible()),
      Ensure.that(Text.of(AdminScreen.rowOf(admin.email)), includes('(Tú)')),
    );
  });
});

describe(`${INTEGRANTE} · RF-29 Exportar historial`, () => {
  it(`[${INTEGRANTE}] exporta los datos a un CSV con las rutinas registradas`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-29',
      objetivo: 'Verificar que la persona puede descargar su historial en CSV.',
      esperado: 'Se descarga "athletia_export.csv" con el encabezado fijo y una fila WORKOUT con la rutina registrada.',
    });
    const file = new ExportedFile();

    await actor.attemptsTo(
      Register.account(newAccount('exportar')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Rutina exportada', 30),
      Ensure.eventually(ListedTitles(), contain('Rutina exportada')),
      OpenSection.called('Perfil'),
      ExportData.into(file),
      Ensure.that(ExportedFileName(file), equals('athletia_export.csv')),
      Ensure.that(ExportedContent(file), includes('TYPE,DATE,DETAIL_1,DETAIL_2,DETAIL_3')),
      Ensure.that(ExportedContent(file), includes('"Rutina exportada"')),
    );
  });
});
