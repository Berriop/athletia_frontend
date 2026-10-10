import { By, PageElement, PageElements } from '@serenity-js/web';

/**
 * Elementos de la interfaz que usan los actores. Cada pantalla se describe una
 * sola vez; las tareas y las preguntas las reutilizan.
 */

export class LoginScreen {
  static emailField = () => PageElement.located(By.css('#email')).describedAs('el campo de correo');
  static passwordField = () => PageElement.located(By.css('#password')).describedAs('el campo de contraseña');
  static submitButton = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón "Iniciar Sesión"');
  static errorBanner = () => PageElement.located(By.css('[role="alert"]')).describedAs('el mensaje de error');
  static forgotPasswordLink = () => PageElement.located(By.cssContainingText('a', '¿Olvidaste tu contraseña?')).describedAs('el enlace de recuperación');
}

export class RegisterScreen {
  static nameField = () => PageElement.located(By.css('#name')).describedAs('el campo de nombre');
  static emailField = () => PageElement.located(By.css('#email')).describedAs('el campo de correo');
  static passwordField = () => PageElement.located(By.css('#password')).describedAs('el campo de contraseña');
  static confirmField = () => PageElement.located(By.css('#confirmPassword')).describedAs('el campo de confirmación');
  static submitButton = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón "Crear Cuenta"');
  static errorBanner = () => PageElement.located(By.css('[role="alert"]')).describedAs('el mensaje de error');
  static mismatchHint = () => PageElement.located(By.xpath('//div[normalize-space()="✗ Las contraseñas no coinciden"]')).describedAs('el aviso de contraseñas distintas');
}

export class ForgotPasswordScreen {
  static emailField = () => PageElement.located(By.css('#email')).describedAs('el campo de correo');
  static submitButton = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón de recuperación');
  static successTitle = () => PageElement.located(By.cssContainingText('h3, h2', '¡Correo Enviado!')).describedAs('el aviso de correo enviado');
}

export class AppShell {
  static greeting = () => PageElement.located(By.css('.greeting-name')).describedAs('el saludo del encabezado');
  static notificationsBell = () => PageElement.located(By.css('button[title="Notificaciones"]')).describedAs('la campana de notificaciones');
  static logoutButton = () => PageElement.located(By.css('button[title="Cerrar sesión"]')).describedAs('el botón de cerrar sesión');
  static notificationMessages = () => PageElements.located(By.css('.notification-content p')).describedAs('los mensajes de notificación');
  static menuLinks = () => PageElements.located(By.css('aside.sidebar nav a')).describedAs('las opciones del menú');
  static menuLink = (label: string) => PageElement.located(By.cssContainingText('aside.sidebar nav a', label)).describedAs(`la opción "${label}" del menú`);
  static notificationDeleteButtons = () => PageElements.located(By.css('.delete-notif-btn')).describedAs('los botones para borrar notificaciones');
  static notificationBadge = () => PageElement.located(By.css('.notification-badge')).describedAs('el contador de notificaciones');
  static clearNotificationsButton = () => PageElement.located(By.css('.clear-btn')).describedAs('el botón "Limpiar"');
  static emptyNotifications = () => PageElement.located(By.css('.notification-empty')).describedAs('el aviso de notificaciones vacías');
  static pageTitle = () => PageElement.located(By.css('h1.page-title')).describedAs('el título de la página');
}

export class ConfirmDialog {
  static acceptButton = () => PageElement.located(By.css('.confirm-modal .btn-danger')).describedAs('el botón "Aceptar" del diálogo');
  static cancelButton = () => PageElement.located(By.css('.confirm-modal .btn-secondary')).describedAs('el botón "Cancelar" del diálogo');
}

/** Tarjetas de las listas (entrenamientos, comidas, sueño y lesiones). */
export class RecordList {
  static headings = () => PageElements.located(By.css('.card.glass-panel h4')).describedAs('los títulos de la lista');
  static cardTitled = (title: string) =>
    PageElement.located(By.xpath(`//h4[normalize-space()="${title}"]/ancestor::div[contains(@class,"card")][1]`)).describedAs(`la tarjeta "${title}"`);
  static editButtonOf = (card: ReturnType<typeof RecordList.cardTitled>) =>
    PageElement.of(PageElement.located(By.css('button[title="Editar"]')), card).describedAs('el botón Editar');
  static deleteButtonOf = (card: ReturnType<typeof RecordList.cardTitled>) =>
    PageElement.of(PageElement.located(By.css('button[title="Eliminar"]')), card).describedAs('el botón Eliminar');
}

export class WorkoutForm {
  static title = () => PageElement.located(By.css('#title')).describedAs('el campo Título');
  static duration = () => PageElement.located(By.css('#duration')).describedAs('el campo Duración');
  static energy = () => PageElement.located(By.css('#energy')).describedAs('el campo Energía');
  static submit = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón de guardar');
}

export class MealForm {
  static name = () => PageElement.located(By.css('#name')).describedAs('el campo Nombre de la comida');
  static calories = () => PageElement.located(By.css('#calories')).describedAs('el campo Calorías');
  static submit = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón de guardar');
}

export class SleepForm {
  static hours = () => PageElement.located(By.css('#hours')).describedAs('el campo Horas de sueño');
  static submit = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón de guardar');
}

export class InjuryForm {
  static bodyArea = () => PageElement.located(By.css('#bodyArea')).describedAs('el campo Área del cuerpo');
  static injuryName = () => PageElement.located(By.css('#injuryName')).describedAs('el campo Nombre de la lesión');
  static submit = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón de guardar');
}

export class ProfileScreen {
  static editButton = () => PageElement.located(By.cssContainingText('button', 'Editar perfil')).describedAs('el botón "Editar perfil"');
  static nameInput = () => PageElement.located(By.css('input[type="text"]')).describedAs('el campo de nombre del perfil');
  static saveButton = () => PageElement.located(By.cssContainingText('button', 'Guardar cambios')).describedAs('el botón "Guardar cambios"');
  static displayedName = () => PageElement.located(By.css('.card.glass-panel h2')).describedAs('el nombre mostrado en el perfil');
}

export class ResetPasswordScreen {
  static newPassword = () => PageElement.located(By.css('#password')).describedAs('el campo de nueva contraseña');
  static confirmPassword = () => PageElement.located(By.css('#confirmPassword')).describedAs('el campo de confirmación');
  static submitButton = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón "Guardar Nueva Contraseña"');
  static errorBanner = () => PageElement.located(By.css('[role="alert"]')).describedAs('el mensaje de error');
  static successTitle = () => PageElement.located(By.xpath('//*[self::h2 or self::h3][contains(., "Contraseña Restablecida")]')).describedAs('el aviso de contraseña restablecida');
  static invalidLinkTitle = () => PageElement.located(By.xpath('//h2[contains(., "Enlace Inválido")]')).describedAs('el aviso de enlace inválido');
}

export class AdminScreen {
  static rowOf = (email: string) =>
    PageElement.located(By.xpath(`//td[normalize-space()="${email}"]/parent::tr`)).describedAs(`la fila de ${email}`);
  static blockButtonOf = (row: ReturnType<typeof AdminScreen.rowOf>) =>
    PageElement.of(PageElement.located(By.css('button[title="Bloquear"]')), row).describedAs('el botón Bloquear');
  static statusOf = (row: ReturnType<typeof AdminScreen.rowOf>) =>
    PageElement.of(PageElement.located(By.css('td:nth-child(5)')), row).describedAs('el estado de la cuenta');
  static selfBlockButton = () => PageElement.located(By.css('button[title="No puedes bloquearte a ti mismo"]')).describedAs('el botón de la propia cuenta');
}

export class GymScreen {
  static searchField = () => PageElement.located(By.css('.gym-search-input')).describedAs('el campo de búsqueda');
  static searchButton = () => PageElement.located(By.css('.gym-search-btn')).describedAs('el botón "Buscar"');
  static names = () => PageElements.located(By.css('h3.gym-card-name')).describedAs('los nombres de los gimnasios');
  static resultsCount = () => PageElement.located(By.css('.gym-results-count')).describedAs('el contador de resultados');
  static errorMessage = () => PageElement.located(By.css('.gym-error')).describedAs('el mensaje de la búsqueda');
}

export class DashboardScreen {
  static recoveryCard = () =>
    PageElement.located(By.xpath('//h3[contains(., "Recovery Score")]/ancestor::div[contains(@class,"card")][1]')).describedAs('la tarjeta Recovery Score');
}

export class ContactScreen {
  static name = () => PageElement.located(By.css('#name')).describedAs('el campo Nombre');
  static email = () => PageElement.located(By.css('#email')).describedAs('el campo Correo');
  static subject = () => PageElement.located(By.css('#subject')).describedAs('el campo Asunto');
  static message = () => PageElement.located(By.css('#message')).describedAs('el campo Mensaje');
  static submit = () => PageElement.located(By.css('form button[type="submit"]')).describedAs('el botón "Enviar Mensaje"');
  static thanks = () => PageElement.located(By.xpath('//h2[contains(., "Gracias por contactar")]')).describedAs('el mensaje de agradecimiento');
}

export class ProfileExport {
  static exportButton = () => PageElement.located(By.cssContainingText('button', 'Exportar mis datos')).describedAs('el botón "Exportar mis datos"');
}
