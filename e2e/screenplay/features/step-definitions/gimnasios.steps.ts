import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import { contain, Ensure, includes, not } from '@serenity-js/assertions';
import { Actor } from '@serenity-js/core';
import { Text } from '@serenity-js/web';

import { SearchGyms, StubGoogleMaps } from '../../src/tasks/MoreTasks';
import { GymNames } from '../../src/questions/Questions';
import { GymScreen } from '../../src/ui/Screens';
import type { FakeGym } from '../../src/support/googleMapsStub';

/** Pasos de la búsqueda de gimnasios (RF-18) con Google Maps simulado. */

Given('{actor} usa un Google Maps simulado con los gimnasios:', async (actor: Actor, table: DataTable) => {
  const gyms: FakeGym[] = table.hashes().map((row) => ({
    name: row['nombre'],
    address: row['dirección'],
    zone: row['zona'],
    rating: Number(row['calificación']),
    lat: Number(row['latitud']),
    lng: Number(row['longitud']),
  }));
  await actor.attemptsTo(StubGoogleMaps.with(gyms));
});

When('{actor} busca gimnasios por {string}', async (actor: Actor, text: string) => {
  await actor.attemptsTo(SearchGyms.for(text));
});

Then('{actor} ve el gimnasio {string} en los resultados', async (actor: Actor, name: string) => {
  await actor.attemptsTo(Ensure.eventually(GymNames(), contain(name)));
});

Then('{actor} no ve el gimnasio {string} en los resultados', async (actor: Actor, name: string) => {
  await actor.attemptsTo(Ensure.eventually(GymNames(), not(contain(name))));
});

Then('{actor} ve el contador {string}', async (actor: Actor, count: string) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(GymScreen.resultsCount()), includes(count)));
});

Then('{actor} ve el aviso de búsqueda {string}', async (actor: Actor, message: string) => {
  await actor.attemptsTo(Ensure.eventually(Text.of(GymScreen.errorMessage()), includes(message)));
});
