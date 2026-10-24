import { Then, When } from '@cucumber/cucumber';
import { contain, Ensure, equals, includes, isTrue, not } from '@serenity-js/assertions';
import { Actor, actorInTheSpotlight } from '@serenity-js/core';
import { Text } from '@serenity-js/web';

import { RemoveRecord, RecordMeal, RecordSleep, RecordWorkout, ReportInjury } from '../../src/tasks/Records';
import { ClearNotifications, EditInjury, EditMeal, EditSleep, RemoveFirstNotification } from '../../src/tasks/MoreTasks';
import { FieldRejectsItsValue, ListedTitles } from '../../src/questions/Questions';
import { AppShell, InjuryForm } from '../../src/ui/Screens';

/** Pasos para registrar, editar y eliminar comidas, entrenamientos, sueño y lesiones. */

When('{actor} registra el entrenamiento {string}', async (actor: Actor, title: string) => {
  await actor.attemptsTo(RecordWorkout.titled(title));
});

When('{actor} registra la comida {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(RecordMeal.named(name));
});

When('{actor} registra {int} horas de sueño', async (actor: Actor, hours: number) => {
  await actor.attemptsTo(RecordSleep.of(hours));
});

When('{actor} reporta la lesión {string}', async (actor: Actor, name: string) => {
  await actor.attemptsTo(ReportInjury.called(name));
});

When('{actor} reporta la lesión {string} en {string}', async (actor: Actor, name: string, bodyArea: string) => {
  await actor.attemptsTo(ReportInjury.called(name, bodyArea));
});

When('{actor} cambia la comida {string} por {string}', async (actor: Actor, oldName: string, newName: string) => {
  await actor.attemptsTo(EditMeal.from(oldName).to(newName));
});

When('{actor} cambia el registro {string} por {int} horas de sueño', async (actor: Actor, oldTitle: string, hours: number) => {
  await actor.attemptsTo(EditSleep.from(oldTitle).toHours(hours));
});

When('{actor} cambia la lesión {string} por {string}', async (actor: Actor, oldName: string, newName: string) => {
  await actor.attemptsTo(EditInjury.from(oldName).to(newName));
});

When('{actor} elimina {string} y confirma', async (actor: Actor, title: string) => {
  await actor.attemptsTo(RemoveRecord.titled(title));
});

When('{actor} borra la primera notificación', async (actor: Actor) => {
  await actor.attemptsTo(RemoveFirstNotification.now());
});

When('{actor} limpia todas las notificaciones', async (actor: Actor) => {
  await actor.attemptsTo(ClearNotifications.now());
});

Then('{actor} ve {string} en la lista', async (actor: Actor, title: string) => {
  await actor.attemptsTo(Ensure.eventually(ListedTitles(), contain(title)));
});

Then('{actor} ya no ve {string} en la lista', async (actor: Actor, title: string) => {
  await actor.attemptsTo(Ensure.eventually(ListedTitles(), not(contain(title))));
});

Then('{string} no aparece en la lista', async (title: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.that(ListedTitles(), not(contain(title))));
});

Then('el campo del nombre de la lesión rechaza el valor escrito', async () => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(FieldRejectsItsValue(InjuryForm.injuryName()), isTrue()));
});

Then('el contador de notificaciones muestra {string}', async (count: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Text.of(AppShell.notificationBadge()), equals(count)));
});

Then('la campana muestra {string}', async (message: string) => {
  await actorInTheSpotlight().attemptsTo(Ensure.eventually(Text.of(AppShell.emptyNotifications()), includes(message)));
});
