import { Interaction, Question, Task } from '@serenity-js/core';
import { BrowseTheWebWithPlaywright } from '@serenity-js/playwright';
import type { PlaywrightPage } from '@serenity-js/playwright';
import type { Route } from 'playwright';
import { Click, Enter, Navigate } from '@serenity-js/web';
import fs from 'node:fs';
import { promoteToAdmin, resetTokenOf } from '../support/database';
import { fakeGoogleMapsScript } from '../support/googleMapsStub';
import type { FakeGym } from '../support/googleMapsStub';
import {
  AdminScreen,
  AppShell,
  ContactScreen,
  GymScreen,
  InjuryForm,
  MealForm,
  RecordList,
  ResetPasswordScreen,
  SleepForm,
} from '../ui/Screens';

/** Acciones de apoyo "tras bambalinas" que no se hacen por la interfaz. */

export class PromoteToAdmin {
  static theAccount = (email: string) =>
    Interaction.where(`#actor promueve la cuenta ${email} a ADMIN en la base de pruebas`, async () => {
      await promoteToAdmin(email);
    });
}

export class OpenResetLink {
  static for = (email: string) =>
    Task.where(
      `#actor abre el enlace de recuperación que recibió ${email}`,
      Navigate.to(Question.about('el enlace de recuperación', async () => `/reset-password?token=${await resetTokenOf(email)}`)),
    );
}

export class StubGoogleMaps {
  static with = (gyms: FakeGym[]) =>
    Interaction.where(`#actor simula Google Maps con ${gyms.length} gimnasios`, async (actor) => {
      const page = (await BrowseTheWebWithPlaywright.as(actor).currentPage()) as PlaywrightPage;
      const nativePage = await page.nativePage();
      await nativePage.route(/maps\.googleapis\.com/, (route: Route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: fakeGoogleMapsScript(gyms) }),
      );
    });
}

/** Acciones de la persona dentro de la aplicación. */

export class SearchGyms {
  static for = (text: string) =>
    Task.where(`#actor busca gimnasios por "${text}"`, Enter.theValue(text).into(GymScreen.searchField()), Click.on(GymScreen.searchButton()));
}

export class SendContactMessage {
  static as = (contact: { name: string; email: string; subject: string; message: string }) =>
    Task.where(
      `#actor envía un mensaje de contacto`,
      Navigate.to('/contact'),
      Enter.theValue(contact.name).into(ContactScreen.name()),
      Enter.theValue(contact.email).into(ContactScreen.email()),
      Enter.theValue(contact.subject).into(ContactScreen.subject()),
      Enter.theValue(contact.message).into(ContactScreen.message()),
      Click.on(ContactScreen.submit()),
    );
}

export class RemoveFirstNotification {
  static now = () => Task.where(`#actor borra la primera notificación`, Click.on(AppShell.notificationDeleteButtons().first()));
}

export class ClearNotifications {
  static now = () => Task.where(`#actor limpia todas las notificaciones`, Click.on(AppShell.clearNotificationsButton()));
}

export class SetNewPassword {
  static to = (password: string) =>
    Task.where(
      `#actor define su nueva contraseña`,
      Enter.theValue(password).into(ResetPasswordScreen.newPassword()),
      Enter.theValue(password).into(ResetPasswordScreen.confirmPassword()),
      Click.on(ResetPasswordScreen.submitButton()),
    );
}

export class BlockAccount {
  static of = (email: string) => Task.where(`#actor bloquea la cuenta ${email}`, Click.on(AdminScreen.blockButtonOf(AdminScreen.rowOf(email))));
}

export class EditMeal {
  static from = (oldName: string) => ({
    to: (newName: string) =>
      Task.where(
        `#actor cambia la comida "${oldName}" por "${newName}"`,
        Click.on(RecordList.editButtonOf(RecordList.cardTitled(oldName))),
        Enter.theValue(newName).into(MealForm.name()),
        Click.on(MealForm.submit()),
      ),
  });
}

export class EditSleep {
  static from = (oldTitle: string) => ({
    toHours: (hours: number) =>
      Task.where(
        `#actor cambia el registro "${oldTitle}" a ${hours} horas`,
        Click.on(RecordList.editButtonOf(RecordList.cardTitled(oldTitle))),
        Enter.theValue(String(hours)).into(SleepForm.hours()),
        Click.on(SleepForm.submit()),
      ),
  });
}

export class EditInjury {
  static from = (oldName: string) => ({
    to: (newName: string) =>
      Task.where(
        `#actor cambia la lesión "${oldName}" por "${newName}"`,
        Click.on(RecordList.editButtonOf(RecordList.cardTitled(oldName))),
        Enter.theValue(newName).into(InjuryForm.injuryName()),
        Click.on(InjuryForm.submit()),
      ),
  });
}

/** Archivo descargado por la exportación (RF-29). */
export class ExportedFile {
  fileName = '';
  content = '';
}

export class ExportData {
  static into = (file: ExportedFile) =>
    Interaction.where(`#actor exporta sus datos a CSV`, async (actor) => {
      const page = (await BrowseTheWebWithPlaywright.as(actor).currentPage()) as PlaywrightPage;
      const nativePage = await page.nativePage();
      const button = nativePage.getByRole('button', { name: /Exportar mis datos/ });
      const [download] = await Promise.all([nativePage.waitForEvent('download'), button.click()]);
      file.fileName = download.suggestedFilename();
      file.content = fs.readFileSync(await download.path(), 'utf-8');
    });
}

