import 'dotenv/config';
import { z } from 'zod';
import { assertIncludes, assertListIncludes, assertListExcludes, assertTrue } from '../src/assert.js';
import { createRecord, mealRecord, newAccount, openAs, openPublic, registerAccount, waitForPath, waitForTitle, waitForTitleGone } from '../src/athletia.js';
import { run } from '../src/run.js';
import { runScenarios } from '../src/scenarios.js';

const INTEGRANTE = 'Daniel Ortiz';

const LISTED_TITLES = 'Extrae los títulos de todos los registros de la lista (no los del formulario ni los del menú).';

run(() =>
  runScenarios(INTEGRANTE, [
    {
      requisito: 'RF-09',
      nombre: 'Editar el nombre de una comida',
      objetivo: 'Verificar que la IA edita una comida existente y que extract lee la lista actualizada.',
      esperado: 'La lista incluye "Pasta con atún" y ya no incluye "Arroz con pollo".',
      run: async ({ page, stack, stagehand, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-comida-editar'));
        await createRecord(stack, '/meals', cuenta.token, mealRecord('Arroz con pollo'));
        await openAs(page, stack, cuenta.token, '/meals');
        await waitForTitle(page, 'Arroz con pollo');

        await act('Haz clic en el botón Editar');
        await act('Escribe %nombre% en el campo Nombre de la comida', { nombre: 'Pasta con atún' });
        await act('Haz clic en el botón Actualizar Comida');

        await waitForTitle(page, 'Pasta con atún');
        const lista = await stagehand.extract(LISTED_TITLES, z.object({ titulos: z.array(z.string()) }), { page });
        console.log('  Extract entregó:', lista.data.titulos);
        assertListIncludes(lista.data.titulos, 'Pasta con atún', 'No aparece la comida editada.');
        assertListExcludes(lista.data.titulos, 'Arroz con pollo', 'Sigue apareciendo el nombre anterior.');
      },
    },
    {
      requisito: 'RF-10',
      nombre: 'Eliminar una comida tras confirmar',
      objetivo: 'Verificar que la IA elimina una comida y confirma el diálogo.',
      esperado: 'La comida desaparece de la lista.',
      run: async ({ page, stack, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-comida-borrar'));
        await createRecord(stack, '/meals', cuenta.token, mealRecord('Ensalada fresca'));
        await openAs(page, stack, cuenta.token, '/meals');
        await waitForTitle(page, 'Ensalada fresca');

        await act('Haz clic en el botón Eliminar');
        await act('Haz clic en el botón Aceptar');

        await waitForTitleGone(page, 'Ensalada fresca');
      },
    },
    {
      requisito: 'RF-11',
      nombre: 'Registrar horas de sueño',
      objetivo: 'Verificar que la IA registra el sueño de una noche.',
      esperado: 'El registro aparece en la lista como "8 horas".',
      run: async ({ page, stack, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-sueno'));
        await openAs(page, stack, cuenta.token, '/sleep');

        await act('Escribe %horas% en el campo Horas de sueño', { horas: '8' });
        await act('Haz clic en el botón Guardar Registro');

        await waitForTitle(page, '8 horas');
      },
    },
    {
      requisito: 'RF-26',
      nombre: 'Leer las notificaciones con extract',
      objetivo: 'Verificar que cada acción exitosa genera una notificación y que extract las lista.',
      esperado: 'La campana contiene "Comida registrada correctamente".',
      run: async ({ page, stack, stagehand, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-notificaciones'));
        await openAs(page, stack, cuenta.token, '/meals');

        await act('Escribe %nombre% en el campo Nombre de la comida', { nombre: 'Avena con fruta' });
        await act('Escribe %calorias% en el campo Calorías', { calorias: '300' });
        await act('Haz clic en el botón Guardar Comida');
        await waitForTitle(page, 'Avena con fruta');

        await act('Haz clic en el botón Notificaciones');
        const notificaciones = await stagehand.extract(
          'Extrae los mensajes de todas las notificaciones que se muestran en el panel de notificaciones.',
          z.object({ mensajes: z.array(z.string()) }),
          { page },
        );
        console.log('  Extract entregó:', notificaciones.data.mensajes);
        assertListIncludes(notificaciones.data.mensajes, 'Comida registrada correctamente', 'Falta la notificación de la comida.');
      },
    },
    {
      requisito: 'RF-27',
      nombre: 'Solicitar recuperar la contraseña',
      objetivo: 'Verificar que la IA solicita la recuperación y que el sistema no revela si el correo existe.',
      esperado: 'Se muestra "¡Correo Enviado!" aunque el correo no esté registrado.',
      run: async ({ page, stack, stagehand, act }) => {
        await openPublic(page, stack, '/forgot-password', '#email');

        await act('Escribe %correo% en el campo Correo electrónico', { correo: 'no.existe.stagehand@athletia.test' });
        await act('Haz clic en el botón Enviar Enlace de Recuperación');

        await page.waitForFunction(() => document.body.innerText.includes('Correo Enviado'), undefined, { timeout: 20_000 });
        const aviso = await stagehand.extract(
          'Extrae el título del aviso de confirmación que se muestra.',
          z.object({ titulo: z.string() }),
          { page },
        );
        console.log('  Extract entregó:', aviso.data);
        assertIncludes(aviso.data.titulo, 'Correo Enviado', 'El aviso extraído no es el esperado.');
      },
    },
    {
      requisito: 'RF-27',
      nombre: 'Rechazar un enlace de recuperación con token inválido (escenario de error)',
      objetivo: 'Verificar que un token falso no permite cambiar la contraseña.',
      esperado: 'Se muestra un error con "inválido", no aparece "Contraseña Restablecida" y no hay sesión.',
      run: async ({ page, stack, act }) => {
        await openPublic(page, stack, '/reset-password?token=token-falso-stagehand', '#password');

        await act('Escribe %clave% en el campo Nueva Contraseña', { clave: 'NuevaClave@2026!' });
        await act('Escribe %clave% en el campo Confirmar Nueva Contraseña', { clave: 'NuevaClave@2026!' });
        await act('Haz clic en el botón Guardar Nueva Contraseña');

        await page.waitForSelector('[role="alert"]', { state: 'visible', timeout: 20_000 });
        assertIncludes(await page.locator('[role="alert"]').innerText(), 'inválido', 'No apareció el error esperado.');
        const restablecida = await page.evaluate(() => document.body.innerText.includes('Contraseña Restablecida'));
        assertTrue(!restablecida, 'No debería aparecer la confirmación de contraseña restablecida.');
        await waitForPath(page, '/reset-password', 5_000);
      },
    },
  ]),
);
