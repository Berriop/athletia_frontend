import { describe, it } from '@serenity-js/playwright-test';
import { contain, Ensure, includes, not } from '@serenity-js/assertions';
import { isVisible, Navigate, Text } from '@serenity-js/web';
import { Register } from '../src/tasks/Authentication';
import { OpenNotifications, OpenSection, RecordMeal, RecordSleep, RecordWorkout, RemoveRecord, RenameWorkout } from '../src/tasks/Records';
import { SendContactMessage } from '../src/tasks/MoreTasks';
import { ListedTitles, Notifications, RecoveryCardText } from '../src/questions/Questions';
import { ContactScreen } from '../src/ui/Screens';
import { newAccount } from '../src/support/accounts';
import { documenta } from '../src/support/documentacion';

const INTEGRANTE = 'Michael Pardo' as const;

describe(`${INTEGRANTE} · RF-05/06/07 Entrenamientos`, () => {
  it(`[${INTEGRANTE}] registra un entrenamiento y lo muestra en la lista`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-05',
      objetivo: 'Verificar que se puede registrar un entrenamiento.',
      esperado: 'El entrenamiento aparece en la lista y se notifica "Entrenamiento creado correctamente".',
    });

    await actor.attemptsTo(
      Register.account(newAccount('entreno-crear')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Pierna pesada', 50),
      Ensure.eventually(ListedTitles(), contain('Pierna pesada')),
      OpenNotifications.panel(),
      Ensure.eventually(Notifications(), contain('Entrenamiento creado correctamente')),
    );
  });

  it(`[${INTEGRANTE}] el entrenamiento sigue en la lista después de recargar la página`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-06',
      objetivo: 'Verificar que los entrenamientos se consultan desde el servidor y no se pierden al recargar.',
      esperado: 'Tras recargar la página el entrenamiento registrado sigue apareciendo en la lista.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('entreno-listar')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Espalda y bíceps'),
      Ensure.eventually(ListedTitles(), contain('Espalda y bíceps')),
      Navigate.reloadPage(),
      Ensure.eventually(ListedTitles(), contain('Espalda y bíceps')),
    );
  });

  it(`[${INTEGRANTE}] edita el título de un entrenamiento existente`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-07',
      objetivo: 'Verificar que se puede modificar un entrenamiento ya registrado.',
      esperado: 'La lista muestra el nuevo título y deja de mostrar el anterior.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('entreno-editar')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Pierna pesada'),
      Ensure.eventually(ListedTitles(), contain('Pierna pesada')),
      RenameWorkout.from('Pierna pesada').to('Pecho y tríceps'),
      Ensure.eventually(ListedTitles(), contain('Pecho y tríceps')),
      Ensure.eventually(ListedTitles(), not(contain('Pierna pesada'))),
    );
  });

  it(`[${INTEGRANTE}] elimina un entrenamiento tras confirmar`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-07',
      objetivo: 'Verificar que se puede eliminar un entrenamiento con confirmación.',
      esperado: 'El entrenamiento desaparece de la lista y se notifica "Entrenamiento eliminado correctamente".',
    });

    await actor.attemptsTo(
      Register.account(newAccount('entreno-eliminar')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Pierna pesada'),
      Ensure.eventually(ListedTitles(), contain('Pierna pesada')),
      RemoveRecord.titled('Pierna pesada'),
      Ensure.eventually(ListedTitles(), not(contain('Pierna pesada'))),
      OpenNotifications.panel(),
      Ensure.eventually(Notifications(), contain('Entrenamiento eliminado correctamente')),
    );
  });

  it(`[${INTEGRANTE}] conserva el entrenamiento si se cancela la eliminación`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-07',
      objetivo: 'Verificar que cancelar el diálogo de confirmación no borra el entrenamiento (escenario alternativo).',
      esperado: 'Tras cancelar, el entrenamiento sigue en la lista.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('entreno-cancelar')),
      OpenSection.called('Entrenamientos'),
      RecordWorkout.titled('Pierna pesada'),
      Ensure.eventually(ListedTitles(), contain('Pierna pesada')),
      RemoveRecord.butCancelsFor('Pierna pesada'),
      Ensure.that(ListedTitles(), contain('Pierna pesada')),
    );
  });
});

describe(`${INTEGRANTE} · RF-08 Registrar comidas`, () => {
  it(`[${INTEGRANTE}] registra una comida y la muestra en la lista`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-08',
      objetivo: 'Verificar que se puede registrar una comida.',
      esperado: 'La comida aparece en la lista y se notifica "Comida registrada correctamente".',
    });

    await actor.attemptsTo(
      Register.account(newAccount('comida-crear')),
      OpenSection.called('Alimentación'),
      RecordMeal.named('Arroz con pollo', 620),
      Ensure.eventually(ListedTitles(), contain('Arroz con pollo')),
      OpenNotifications.panel(),
      Ensure.eventually(Notifications(), contain('Comida registrada correctamente')),
    );
  });
});

describe(`${INTEGRANTE} · RF-20 Recovery Score`, () => {
  it(`[${INTEGRANTE}] sin registros el panel indica que aún no hay datos`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-20',
      objetivo: 'Verificar el estado inicial del puntaje de recuperación de una cuenta nueva.',
      esperado: 'La tarjeta muestra "Aún no tienes registros de sueño ni entrenamientos" con 0/100.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('recovery-vacio')),
      Ensure.eventually(RecoveryCardText(), includes('Aún no tienes registros de sueño ni entrenamientos')),
      Ensure.that(RecoveryCardText(), includes('0/100')),
    );
  });

  it(`[${INTEGRANTE}] con un registro de sueño el panel calcula el estado de recuperación`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-20',
      objetivo: 'Verificar que el puntaje de recuperación se calcula a partir de los datos registrados.',
      esperado: 'Tras registrar 8 horas de sueño la tarjeta muestra "Tu estado actual es …" en lugar del aviso vacío.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('recovery-calculo')),
      OpenSection.called('Sueño'),
      RecordSleep.of(8),
      Ensure.eventually(ListedTitles(), contain('8 horas')),
      OpenSection.called('Dashboard'),
      Ensure.eventually(RecoveryCardText(), includes('Tu estado actual es')),
      Ensure.that(RecoveryCardText(), not(includes('Aún no tienes registros'))),
    );
  });
});

describe(`${INTEGRANTE} · RF-25 Contacto`, () => {
  const contacto = {
    name: 'Ana Atleta',
    email: 'ana.contacto@athletia.test',
    subject: 'Consulta sobre planes',
    message: 'Hola, quisiera saber más sobre cómo funciona el seguimiento de entrenamientos.',
  };

  it(`[${INTEGRANTE}] envía el formulario de contacto y muestra el agradecimiento`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-25',
      objetivo: 'Verificar que una persona (sin sesión) puede enviar un mensaje de contacto.',
      esperado: 'Se muestra "Gracias por contactar a Athletia." y el formulario desaparece.',
    });

    await actor.attemptsTo(
      SendContactMessage.as(contacto),
      Ensure.eventually(Text.of(ContactScreen.thanks()), includes('Gracias por contactar a Athletia.')),
    );
  });

  it(`[${INTEGRANTE}] no envía el formulario si faltan campos obligatorios`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-25',
      objetivo: 'Verificar que el formulario exige los campos obligatorios (escenario alternativo).',
      esperado: 'Con el mensaje vacío no aparece el agradecimiento.',
    });

    await actor.attemptsTo(
      SendContactMessage.as({ ...contacto, message: '' }),
      Ensure.that(ContactScreen.submit(), isVisible()),
      Ensure.that(ContactScreen.thanks(), not(isVisible())),
    );
  });
});
