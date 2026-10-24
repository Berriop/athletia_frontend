import { newAccount } from './accounts';
import type { Account } from './accounts';
import { ExportedFile } from '../tasks/MoreTasks';

/**
 * Datos de un escenario: cada persona (actor) tiene su propia cuenta de prueba,
 * creada la primera vez que se necesita, y el archivo que descargó, si lo hizo.
 * Se reinicia antes de cada escenario para que sean independientes.
 */
let accounts = new Map<string, Account>();
let exportedFile = new ExportedFile();

export function resetScenarioState(): void {
  accounts = new Map();
  exportedFile = new ExportedFile();
}

export function accountOf(actorName: string): Account {
  let account = accounts.get(actorName);
  if (!account) {
    const label = actorName.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    account = newAccount(label, actorName);
    accounts.set(actorName, account);
  }
  return account;
}

export function downloadedFile(): ExportedFile {
  return exportedFile;
}
