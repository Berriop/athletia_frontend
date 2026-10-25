import 'dotenv/config';
import { z } from 'zod';
import { assertEquals, assertListExcludes, assertListIncludes, assertTrue } from '../src/assert.js';
import { createRecord, injuryRecord, newAccount, openAs, registerAccount, sleepRecord, waitForTitle, waitForTitleGone } from '../src/athletia.js';
import { run } from '../src/run.js';
import { runScenarios } from '../src/scenarios.js';

const INTEGRANTE = 'Juan Pablo Berrío';

const LISTED_TITLES = 'Extrae los títulos de todos los registros de la lista (no los del formulario ni los del menú).';

run(() =>
  runScenarios(INTEGRANTE, [
    {
      requisito: 'RF-12',
      nombre: 'Editar las horas de un registro de sueño',
      objetivo: 'Verificar que la IA edita un registro de sueño existente y que extract lee la lista actualizada.',
      esperado: 'La lista extraída incluye "9 horas" y ya no incluye "7 horas".',
      run: async ({ page, stack, stagehand, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-sueno-editar'));
        await createRecord(stack, '/sleeps', cuenta.token, sleepRecord(7));
        await openAs(page, stack, cuenta.token, '/sleep');
        await waitForTitle(page, '7 horas');

        await act('Haz clic en el botón Editar');
        await act('Escribe %horas% en el campo Horas de sueño', { horas: '9' });
        await act('Haz clic en el botón Actualizar Registro');

        await waitForTitle(page, '9 horas');
        const lista = await stagehand.extract(LISTED_TITLES, z.object({ titulos: z.array(z.string()) }), { page });
        console.log('  Extract entregó:', lista.data.titulos);
        assertListIncludes(lista.data.titulos, '9 horas', 'No aparece el registro editado.');
        assertListExcludes(lista.data.titulos, '7 horas', 'Sigue apareciendo el valor anterior.');
      },
    },
    {
      requisito: 'RF-13',
      nombre: 'Eliminar un registro de sueño tras confirmar',
      objetivo: 'Verificar que la IA elimina un registro de sueño y confirma el diálogo.',
      esperado: 'El registro de 6 horas desaparece de la lista.',
      run: async ({ page, stack, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-sueno-borrar'));
        await createRecord(stack, '/sleeps', cuenta.token, sleepRecord(6));
        await openAs(page, stack, cuenta.token, '/sleep');
        await waitForTitle(page, '6 horas');

        await act('Haz clic en el botón Eliminar');
        await act('Haz clic en el botón Aceptar');

        await waitForTitleGone(page, '6 horas');
      },
    },
    {
      requisito: 'RF-14',
      nombre: 'Reportar una lesión y extraer la lista',
      objetivo: 'Verificar que la IA reporta una lesión (act) y que extract devuelve la lista con ella.',
      esperado: 'La lista extraída incluye "Esguince leve".',
      run: async ({ page, stack, stagehand, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-lesion'));
        await openAs(page, stack, cuenta.token, '/injuries');

        await act('Escribe %area% en el campo Área del cuerpo', { area: 'Rodilla derecha' });
        await act('Escribe %lesion% en el campo Nombre de la lesión', { lesion: 'Esguince leve' });
        await act('Haz clic en el botón Registrar Lesión');

        await waitForTitle(page, 'Esguince leve');
        const lista = await stagehand.extract(LISTED_TITLES, z.object({ titulos: z.array(z.string()) }), { page });
        console.log('  Extract entregó:', lista.data.titulos);
        assertListIncludes(lista.data.titulos, 'Esguince leve', 'La lesión no aparece en la lista.');
      },
    },
    {
      requisito: 'RF-14',
      nombre: 'No aceptar un nombre de lesión con números (escenario de error)',
      objetivo: 'Verificar que el formulario rechaza un nombre con números aunque la IA lo escriba.',
      esperado: 'El campo queda inválido (solo letras) y la lesión no se agrega a la lista.',
      run: async ({ page, stack, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-lesion-invalida'));
        await openAs(page, stack, cuenta.token, '/injuries');

        await act('Escribe %area% en el campo Área del cuerpo', { area: 'Rodilla derecha' });
        await act('Escribe %lesion% en el campo Nombre de la lesión', { lesion: 'Esguince2' });
        await act('Haz clic en el botón Registrar Lesión');

        const invalido = await page.evaluate(() => (document.querySelector('#injuryName') as HTMLInputElement).validity.patternMismatch);
        assertEquals(invalido, true, 'El navegador debería marcar el nombre como inválido.');
        const agregada = await page.evaluate(() => [...document.querySelectorAll('h4')].some((h) => h.textContent?.includes('Esguince2')));
        assertEquals(agregada, false, 'La lesión inválida no debería aparecer en la lista.');
      },
    },
    {
      requisito: 'RF-15',
      nombre: 'Editar el nombre de una lesión',
      objetivo: 'Verificar que la IA modifica una lesión ya reportada.',
      esperado: 'La lista muestra "Esguince grave" y deja de mostrar "Esguince leve".',
      run: async ({ page, stack, stagehand, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-lesion-editar'));
        await createRecord(stack, '/injuries', cuenta.token, injuryRecord('Esguince leve'));
        await openAs(page, stack, cuenta.token, '/injuries');
        await waitForTitle(page, 'Esguince leve');

        await act('Haz clic en el botón Editar');
        await act('Escribe %lesion% en el campo Nombre de la lesión', { lesion: 'Esguince grave' });
        await act('Haz clic en el botón Actualizar Lesión');

        await waitForTitle(page, 'Esguince grave');
        const lista = await stagehand.extract(LISTED_TITLES, z.object({ titulos: z.array(z.string()) }), { page });
        assertListExcludes(lista.data.titulos, 'Esguince leve', 'Sigue apareciendo el nombre anterior.');
      },
    },
    {
      requisito: 'RF-16',
      nombre: 'Eliminar una lesión tras confirmar',
      objetivo: 'Verificar que la IA elimina una lesión y confirma el diálogo.',
      esperado: 'La lesión desaparece de la lista.',
      run: async ({ page, stack, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-lesion-borrar'));
        await createRecord(stack, '/injuries', cuenta.token, injuryRecord('Tendinitis rotuliana', 'Hombro izquierdo'));
        await openAs(page, stack, cuenta.token, '/injuries');
        await waitForTitle(page, 'Tendinitis rotuliana');

        await act('Haz clic en el botón Eliminar');
        await act('Haz clic en el botón Aceptar');

        await waitForTitleGone(page, 'Tendinitis rotuliana');
      },
    },
    {
      requisito: 'RF-18',
      nombre: 'Localizar la búsqueda de gimnasios',
      objetivo: 'Verificar con observe que la página de gimnasios ofrece un campo para buscar por ciudad o zona.',
      esperado: 'Observe devuelve al menos un elemento para el campo de búsqueda.',
      run: async ({ page, stack, stagehand }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-gimnasios'));
        await openAs(page, stack, cuenta.token, '/gyms');

        const campos = await stagehand.observe('Encuentra el campo de texto para buscar gimnasios por ciudad o zona', { page });
        assertTrue(campos.data.length > 0, 'Observe no encontró el campo de búsqueda de gimnasios.');
        console.log('  Observe encontró:', campos.data[0]?.description);
      },
    },
  ]),
);
