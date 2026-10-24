const { Client } = require('pg');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Acceso mínimo a la base de datos de pruebas para dos cosas que la aplicación
 * no permite hacer por la interfaz:
 *   - Promover una cuenta de prueba a ADMIN (RF-22 y RF-30).
 *   - Leer el token de recuperación de contraseña que el backend solo "envía"
 *     por consola (RF-27).
 *
 * Seguridad: solo se puede tocar a las cuentas creadas por estas pruebas
 * (correos e2e.*@athletia.test); cualquier otro correo se rechaza.
 */

const E2E_EMAIL = /^e2e\..+@athletia\.test$/;
const projectRoot = path.resolve(__dirname, '../..');

function databaseUrl() {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;

  const backendDir = path.resolve(projectRoot, process.env.E2E_BACKEND_DIR || '../../../athletia_backend');
  const envFile = path.join(backendDir, '.env');
  const content = fs.readFileSync(envFile, 'utf-8');
  const match = /^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m.exec(content);
  if (!match) throw new Error(`No se encontró DATABASE_URL en ${envFile}. Define E2E_DATABASE_URL.`);
  return match[1];
}

/**
 * Supabase ofrece el pooler en modo sesión (puerto 5432, una conexión reservada por
 * cliente y compartida con todo el equipo) y en modo transacción (6543). Las pruebas
 * usan el segundo para no agotar el cupo de conexiones del equipo.
 */
function toTransactionPooler(url) {
  const parsed = new URL(url);
  if (!parsed.hostname.endsWith('pooler.supabase.com')) return url;
  parsed.port = '6543';
  return parsed.toString();
}

function assertTestAccount(email) {
  if (!E2E_EMAIL.test(email)) {
    throw new Error(`Por seguridad solo se pueden modificar cuentas e2e.*@athletia.test, no "${email}".`);
  }
}

async function withClient(work) {
  // Si el pooler está lleno se reintenta unos segundos.
  const maxAttempts = 8;
  for (let attempt = 1; ; attempt++) {
    const client = new Client({ connectionString: toTransactionPooler(databaseUrl()), ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
    } catch (error) {
      await client.end().catch(() => undefined);
      const poolIsFull = String(error.message).includes('EMAXCONNSESSION');
      if (!poolIsFull || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      continue;
    }
    try {
      return await work(client);
    } finally {
      await client.end();
    }
  }
}

async function promoteToAdmin(email) {
  assertTestAccount(email);
  await withClient(async (client) => {
    const result = await client.query('UPDATE "User" SET "role" = \'ADMIN\' WHERE "email" = $1', [email]);
    if (result.rowCount !== 1) throw new Error(`No se encontró la cuenta ${email} para promoverla a ADMIN.`);
  });
}

async function resetTokenOf(email) {
  assertTestAccount(email);
  return withClient(async (client) => {
    const result = await client.query('SELECT "resetPasswordToken" AS token FROM "User" WHERE "email" = $1', [email]);
    const token = result.rows[0] && result.rows[0].token;
    if (!token) throw new Error(`La cuenta ${email} no tiene un token de recuperación activo.`);
    return token;
  });
}

module.exports = { promoteToAdmin, resetTokenOf };
