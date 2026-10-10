import { describe, it } from '@serenity-js/playwright-test';
import { contain, Ensure, includes, isTrue, not } from '@serenity-js/assertions';
import { Text } from '@serenity-js/web';
import { Register } from '../src/tasks/Authentication';
import { OpenNotifications, OpenSection, RecordSleep, RemoveRecord, ReportInjury } from '../src/tasks/Records';
import { EditInjury, EditSleep, SearchGyms, StubGoogleMaps } from '../src/tasks/MoreTasks';
import { FieldRejectsItsValue, GymNames, ListedTitles, Notifications } from '../src/questions/Questions';
import { GymScreen, InjuryForm } from '../src/ui/Screens';
import { newAccount } from '../src/support/accounts';
import { documenta } from '../src/support/documentacion';
import type { FakeGym } from '../src/support/googleMapsStub';

const INTEGRANTE = 'Juan Pablo Berrío' as const;

const GIMNASIOS: FakeGym[] = [
  { name: 'Smart Fit Poblado', address: 'Cra 43A #10-50, Medellín', zone: 'poblado', rating: 4.6, lat: 6.2088, lng: -75.5679 },
  { name: 'Bodytech Envigado', address: 'Cl 37 Sur #43-10, Envigado', zone: 'envigado', rating: 4.4, lat: 6.1759, lng: -75.5917 },
];

describe(`${INTEGRANTE} · RF-14/15/16 Lesiones`, () => {
  it(`[${INTEGRANTE}] reporta una lesión y la muestra en la lista`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-14',
      objetivo: 'Verificar que se puede reportar una lesión.',
      esperado: 'La lesión aparece en la lista y se notifica "Lesión registrada correctamente".',
    });

    await actor.attemptsTo(
      Register.account(newAccount('lesion-crear')),
      OpenSection.called('Lesiones'),
      ReportInjury.called('Esguince leve'),
      Ensure.eventually(ListedTitles(), contain('Esguince leve')),
      OpenNotifications.panel(),
      Ensure.eventually(Notifications(), contain('Lesión registrada correctamente')),
    );
  });

  it(`[${INTEGRANTE}] no acepta un nombre de lesión con números`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-14',
      objetivo: 'Verificar que el formulario rechaza nombres con caracteres no permitidos (escenario alternativo).',
      esperado: 'El navegador marca el campo como inválido (solo letras y espacios) y la lesión no se agrega a la lista.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('lesion-invalida')),
      OpenSection.called('Lesiones'),
      ReportInjury.called('Esguince2'),
      Ensure.eventually(FieldRejectsItsValue(InjuryForm.injuryName()), isTrue()),
      Ensure.that(ListedTitles(), not(contain('Esguince2'))),
    );
  });

  it(`[${INTEGRANTE}] edita el nombre de una lesión existente`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-15',
      objetivo: 'Verificar que se puede modificar una lesión ya reportada.',
      esperado: 'La lista muestra el nuevo nombre y deja de mostrar el anterior.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('lesion-editar')),
      OpenSection.called('Lesiones'),
      ReportInjury.called('Esguince leve'),
      Ensure.eventually(ListedTitles(), contain('Esguince leve')),
      EditInjury.from('Esguince leve').to('Esguince grave'),
      Ensure.eventually(ListedTitles(), contain('Esguince grave')),
      Ensure.eventually(ListedTitles(), not(contain('Esguince leve'))),
    );
  });

  it(`[${INTEGRANTE}] elimina una lesión tras confirmar`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-16',
      objetivo: 'Verificar que se puede eliminar una lesión con confirmación.',
      esperado: 'La lesión desaparece de la lista.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('lesion-eliminar')),
      OpenSection.called('Lesiones'),
      ReportInjury.called('Tendinitis rotuliana', 'Hombro izquierdo'),
      Ensure.eventually(ListedTitles(), contain('Tendinitis rotuliana')),
      RemoveRecord.titled('Tendinitis rotuliana'),
      Ensure.eventually(ListedTitles(), not(contain('Tendinitis rotuliana'))),
    );
  });
});

describe(`${INTEGRANTE} · RF-12/13 Sueño`, () => {
  it(`[${INTEGRANTE}] edita las horas de un registro de sueño`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-12',
      objetivo: 'Verificar que se puede modificar un registro de sueño.',
      esperado: 'La lista muestra las nuevas horas y deja de mostrar las anteriores.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('sueno-editar')),
      OpenSection.called('Sueño'),
      RecordSleep.of(7),
      Ensure.eventually(ListedTitles(), contain('7 horas')),
      EditSleep.from('7 horas').toHours(9),
      Ensure.eventually(ListedTitles(), contain('9 horas')),
      Ensure.eventually(ListedTitles(), not(contain('7 horas'))),
    );
  });

  it(`[${INTEGRANTE}] elimina un registro de sueño tras confirmar`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-13',
      objetivo: 'Verificar que se puede eliminar un registro de sueño con confirmación.',
      esperado: 'El registro desaparece de la lista.',
    });

    await actor.attemptsTo(
      Register.account(newAccount('sueno-eliminar')),
      OpenSection.called('Sueño'),
      RecordSleep.of(6),
      Ensure.eventually(ListedTitles(), contain('6 horas')),
      RemoveRecord.titled('6 horas'),
      Ensure.eventually(ListedTitles(), not(contain('6 horas'))),
    );
  });
});

describe(`${INTEGRANTE} · RF-18 Buscar gimnasios por texto`, () => {
  it(`[${INTEGRANTE}] encuentra los gimnasios de la zona buscada`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-18',
      objetivo: 'Verificar que se pueden buscar gimnasios escribiendo una ciudad o zona (Google Maps simulado).',
      esperado: 'La lista muestra solo los gimnasios de la zona buscada con su contador de resultados.',
    });

    await actor.attemptsTo(
      StubGoogleMaps.with(GIMNASIOS),
      Register.account(newAccount('gimnasios-buscar')),
      OpenSection.called('Gimnasios'),
      Ensure.eventually(GymNames(), contain('Smart Fit Poblado')),
      SearchGyms.for('envigado'),
      Ensure.eventually(GymNames(), contain('Bodytech Envigado')),
      Ensure.eventually(GymNames(), not(contain('Smart Fit Poblado'))),
      Ensure.eventually(Text.of(GymScreen.resultsCount()), includes('1 gimnasio')),
    );
  });

  it(`[${INTEGRANTE}] avisa cuando no hay gimnasios en la zona buscada`, async ({ actor }) => {
    documenta({
      integrante: INTEGRANTE,
      requisito: 'RF-18',
      objetivo: 'Verificar el mensaje cuando la búsqueda no tiene resultados (escenario alternativo).',
      esperado: 'Se muestra "No se encontraron resultados para esa búsqueda." y la lista queda vacía.',
    });

    await actor.attemptsTo(
      StubGoogleMaps.with(GIMNASIOS),
      Register.account(newAccount('gimnasios-vacio')),
      OpenSection.called('Gimnasios'),
      Ensure.eventually(GymNames(), contain('Smart Fit Poblado')),
      SearchGyms.for('zonainexistente'),
      Ensure.eventually(Text.of(GymScreen.errorMessage()), includes('No se encontraron resultados para esa búsqueda.')),
      Ensure.that(GymNames(), not(contain('Smart Fit Poblado'))),
    );
  });
});
