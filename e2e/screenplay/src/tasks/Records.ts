import { Task } from '@serenity-js/core';
import { Click, Enter } from '@serenity-js/web';
import { AppShell, ConfirmDialog, InjuryForm, MealForm, ProfileScreen, RecordList, SleepForm, WorkoutForm } from '../ui/Screens';

/** Tareas de registro de datos de entrenamiento, alimentación, sueño, lesiones y perfil. */

export class OpenSection {
  static called = (label: string) => Task.where(`#actor abre la sección "${label}"`, Click.on(AppShell.menuLink(label)));
}

export class OpenNotifications {
  static panel = () => Task.where(`#actor abre las notificaciones`, Click.on(AppShell.notificationsBell()));
}

export class RecordWorkout {
  static titled = (title: string, durationMinutes = 45) =>
    Task.where(
      `#actor registra el entrenamiento "${title}"`,
      Enter.theValue(title).into(WorkoutForm.title()),
      Enter.theValue(String(durationMinutes)).into(WorkoutForm.duration()),
      Click.on(WorkoutForm.submit()),
    );
}

export class RenameWorkout {
  static from = (oldTitle: string) => ({
    to: (newTitle: string) =>
      Task.where(
        `#actor cambia el entrenamiento "${oldTitle}" por "${newTitle}"`,
        Click.on(RecordList.editButtonOf(RecordList.cardTitled(oldTitle))),
        Enter.theValue(newTitle).into(WorkoutForm.title()),
        Click.on(WorkoutForm.submit()),
      ),
  });
}

export class RemoveRecord {
  static titled = (title: string) =>
    Task.where(
      `#actor elimina "${title}" y confirma`,
      Click.on(RecordList.deleteButtonOf(RecordList.cardTitled(title))),
      Click.on(ConfirmDialog.acceptButton()),
    );

  static butCancelsFor = (title: string) =>
    Task.where(
      `#actor intenta eliminar "${title}" pero cancela`,
      Click.on(RecordList.deleteButtonOf(RecordList.cardTitled(title))),
      Click.on(ConfirmDialog.cancelButton()),
    );
}

export class RecordMeal {
  static named = (name: string, calories = 550) =>
    Task.where(
      `#actor registra la comida "${name}"`,
      Enter.theValue(name).into(MealForm.name()),
      Enter.theValue(String(calories)).into(MealForm.calories()),
      Click.on(MealForm.submit()),
    );
}

export class RecordSleep {
  static of = (hours: number) =>
    Task.where(`#actor registra ${hours} horas de sueño`, Enter.theValue(String(hours)).into(SleepForm.hours()), Click.on(SleepForm.submit()));
}

export class ReportInjury {
  static called = (injuryName: string, bodyArea = 'Rodilla derecha') =>
    Task.where(
      `#actor reporta la lesión "${injuryName}" en ${bodyArea}`,
      Enter.theValue(bodyArea).into(InjuryForm.bodyArea()),
      Enter.theValue(injuryName).into(InjuryForm.injuryName()),
      Click.on(InjuryForm.submit()),
    );
}

export class ChangeProfileName {
  static to = (newName: string) =>
    Task.where(
      `#actor cambia su nombre de perfil a "${newName}"`,
      Click.on(ProfileScreen.editButton()),
      Enter.theValue(newName).into(ProfileScreen.nameInput()),
      Click.on(ProfileScreen.saveButton()),
    );
}
