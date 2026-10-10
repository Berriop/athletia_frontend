import { Task } from '@serenity-js/core';
import { Click, Enter, Navigate } from '@serenity-js/web';
import type { Account } from '../support/accounts';
import { AppShell, ForgotPasswordScreen, LoginScreen, RegisterScreen } from '../ui/Screens';

/** Tareas de autenticación: lo que una persona hace para entrar o salir de Athletia. */

export class Register {
  static account = (account: Account) =>
    Task.where(
      `#actor crea la cuenta ${account.email}`,
      Navigate.to('/register'),
      Enter.theValue(account.name).into(RegisterScreen.nameField()),
      Enter.theValue(account.email).into(RegisterScreen.emailField()),
      Enter.theValue(account.password).into(RegisterScreen.passwordField()),
      Enter.theValue(account.password).into(RegisterScreen.confirmField()),
      Click.on(RegisterScreen.submitButton()),
    );

  static fillingIn = (account: Account, confirmation: string) =>
    Task.where(
      `#actor completa el formulario de registro (sin enviarlo)`,
      Navigate.to('/register'),
      Enter.theValue(account.name).into(RegisterScreen.nameField()),
      Enter.theValue(account.email).into(RegisterScreen.emailField()),
      Enter.theValue(account.password).into(RegisterScreen.passwordField()),
      Enter.theValue(confirmation).into(RegisterScreen.confirmField()),
    );
}

export class LogIn {
  static as = (credentials: { email: string; password: string }) =>
    Task.where(
      `#actor inicia sesión como ${credentials.email}`,
      Navigate.to('/login'),
      Enter.theValue(credentials.email).into(LoginScreen.emailField()),
      Enter.theValue(credentials.password).into(LoginScreen.passwordField()),
      Click.on(LoginScreen.submitButton()),
    );
}

export class LogOut {
  static now = () => Task.where(`#actor cierra sesión`, Click.on(AppShell.logoutButton()));
}

export class RequestPasswordReset {
  static for = (email: string) =>
    Task.where(
      `#actor solicita recuperar la contraseña de ${email}`,
      Navigate.to('/forgot-password'),
      Enter.theValue(email).into(ForgotPasswordScreen.emailField()),
      Click.on(ForgotPasswordScreen.submitButton()),
    );
}
