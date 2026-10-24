import { Question } from '@serenity-js/core';
import type { Answerable } from '@serenity-js/core';
import { Page, Text } from '@serenity-js/web';
import type { Locator } from 'playwright';
import type { PageElement } from '@serenity-js/web';
import { AppShell, DashboardScreen, GymScreen, RecordList } from '../ui/Screens';
import type { ExportedFile } from '../tasks/MoreTasks';

/** Preguntas: lo que un actor puede "ver" en la aplicación para verificar un resultado. */

export const CurrentPath = () =>
  Question.about<Promise<string>>('la ruta actual', async (actor) => {
    const url = await actor.answer(Page.current().url());
    return url.pathname;
  });

export const ListedTitles = () => Text.ofAll(RecordList.headings()).describedAs('los títulos listados');

export const Notifications = () => Text.ofAll(AppShell.notificationMessages()).describedAs('las notificaciones');

export const MenuOptions = () => Text.ofAll(AppShell.menuLinks()).describedAs('las opciones del menú');

/** Indica si el navegador marca el campo como inválido porque su valor no cumple el patrón (atributo pattern). */
export const FieldRejectsItsValue = (field: Answerable<PageElement>) =>
  Question.about<Promise<boolean>>('si el navegador rechaza el valor del campo', async (actor) => {
    const element = await actor.answer(field);
    const locator = (await element.nativeElement()) as Locator;
    return locator.evaluate((input) => (input as HTMLInputElement).validity.patternMismatch);
  });

export const GymNames = () => Text.ofAll(GymScreen.names()).describedAs('los gimnasios listados');

export const RecoveryCardText = () => Text.of(DashboardScreen.recoveryCard()).describedAs('el contenido de la tarjeta Recovery Score');

export const ExportedFileName = (file: ExportedFile) =>
  Question.about<Promise<string>>('el nombre del archivo exportado', async () => file.fileName);

export const ExportedContent = (file: ExportedFile) =>
  Question.about<Promise<string>>('el contenido del archivo exportado', async () => file.content);
