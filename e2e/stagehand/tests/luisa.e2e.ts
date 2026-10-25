import 'dotenv/config';
import { z } from 'zod';
import { assertEquals, assertIncludes, assertListExcludes, assertListIncludes, assertTrue } from '../src/assert.js';
import { currentPath, newAccount, openAs, openPublic, registerAccount, waitForPath } from '../src/athletia.js';
import { run } from '../src/run.js';
import { runScenarios } from '../src/scenarios.js';

const INTEGRANTE = 'Luisa Espinal';

run(() =>
  runScenarios(INTEGRANTE, [
    {
      requisito: 'RF-01',
      nombre: 'Registrar una cuenta con instrucciones en lenguaje natural',
      objetivo: 'Verificar que una persona nueva se registra cuando la IA completa el formulario (act con variables).',
      esperado: 'Se llega al panel (/dashboard) y el saludo muestra el nombre registrado.',
      run: async ({ page, stack, act }) => {
        const cuenta = newAccount('sh-registro');
        await openPublic(page, stack, '/register', '#name');

        await act('Escribe %nombre% en el campo Nombre completo', { nombre: cuenta.name });
        await act('Escribe %correo% en el campo Correo electrónico', { correo: cuenta.email });
        await act('Escribe %clave% en el campo Contraseña segura', { clave: cuenta.password });
        await act('Escribe %clave% en el campo Confirmar contraseña', { clave: cuenta.password });
        await act('Haz clic en el botón Crear Cuenta');

        await waitForPath(page, '/dashboard');
        const saludo = (await page.locator('.greeting-name').innerText()).trim();
        assertEquals(saludo, cuenta.name, 'El saludo no muestra el nombre registrado.');
      },
    },
    {
      requisito: 'RF-02',
      nombre: 'Iniciar sesión con credenciales válidas',
      objetivo: 'Verificar que una persona registrada entra cuando la IA completa el formulario de acceso.',
      esperado: 'Se llega al panel (/dashboard) con el saludo de la persona.',
      run: async ({ page, stack, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-login'));
        await openPublic(page, stack, '/login', '#email');

        await act('Escribe %correo% en el campo Correo electrónico', { correo: cuenta.email });
        await act('Escribe %clave% en el campo Contraseña', { clave: cuenta.password });
        await act('Haz clic en el botón Iniciar Sesión');

        await waitForPath(page, '/dashboard');
        assertEquals((await page.locator('.greeting-name').innerText()).trim(), cuenta.name, 'El saludo no es el esperado.');
      },
    },
    {
      requisito: 'RF-02',
      nombre: 'Rechazar una contraseña incorrecta (escenario de error)',
      objetivo: 'Verificar que una contraseña incorrecta no permite entrar aunque la IA complete el formulario.',
      esperado: 'Se muestra "Correo o contraseña incorrectos" y la persona sigue en /login.',
      run: async ({ page, stack, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-login-mala'));
        await openPublic(page, stack, '/login', '#email');

        await act('Escribe %correo% en el campo Correo electrónico', { correo: cuenta.email });
        await act('Escribe %clave% en el campo Contraseña', { clave: 'ClaveIncorrecta@2026' });
        await act('Haz clic en el botón Iniciar Sesión');

        await page.waitForSelector('[role="alert"]', { state: 'visible', timeout: 20_000 });
        assertIncludes(await page.locator('[role="alert"]').innerText(), 'Correo o contraseña incorrectos', 'No apareció el error esperado.');
        assertEquals(await currentPath(page), '/login', 'La persona no debería salir del inicio de sesión.');
      },
    },
    {
      requisito: 'RF-03',
      nombre: 'Cerrar sesión y quedar fuera del panel',
      objetivo: 'Verificar que la IA encuentra y pulsa el botón de cerrar sesión (observe + act).',
      esperado: 'Observe localiza el botón, se vuelve a /login y /dashboard ya no es accesible.',
      run: async ({ page, stack, stagehand, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-logout'));
        await openAs(page, stack, cuenta.token, '/dashboard');

        const botones = await stagehand.observe('Encuentra el botón para cerrar sesión', { page });
        assertTrue(botones.data.length > 0, 'Observe no encontró el botón de cerrar sesión.');
        console.log('  Observe encontró:', botones.data[0]?.description);

        await act('Haz clic en el botón Cerrar sesión');
        await waitForPath(page, '/login');

        await page.goto(`${stack.baseUrl}/dashboard`);
        await waitForPath(page, '/login');
      },
    },
    {
      requisito: 'RF-04',
      nombre: 'Cambiar el nombre del perfil y extraer sus datos',
      objetivo: 'Verificar que la IA edita el perfil (act) y que extract devuelve datos estructurados correctos.',
      esperado: 'El saludo muestra el nuevo nombre y extract entrega el nombre y el correo del perfil.',
      run: async ({ page, stack, stagehand, act }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-perfil'));
        await openAs(page, stack, cuenta.token, '/profile');

        await act('Haz clic en el botón Editar perfil');
        await act('Escribe %nombre% en el campo Tu nombre', { nombre: 'Ana Renombrada' });
        await act('Haz clic en el botón Guardar cambios');

        await page.waitForFunction(() => document.querySelector('.greeting-name')?.textContent?.trim() === 'Ana Renombrada', undefined, { timeout: 20_000 });

        const perfil = await stagehand.extract(
          'Extrae el nombre y el correo electrónico de la persona que se muestran en su perfil.',
          z.object({ nombre: z.string(), correo: z.string() }),
          { page },
        );
        console.log('  Extract entregó:', perfil.data);
        assertIncludes(perfil.data.nombre, 'Ana Renombrada', 'El nombre extraído no es el nuevo.');
        assertIncludes(perfil.data.correo, cuenta.email, 'El correo extraído no es el de la cuenta.');
      },
    },
    {
      requisito: 'RF-22',
      nombre: 'Un usuario normal no ve la opción Admin',
      objetivo: 'Verificar con extract que el menú de un usuario normal no incluye la opción de administración.',
      esperado: 'La lista extraída incluye "Entrenamientos" y no incluye "Admin".',
      run: async ({ page, stack, stagehand }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-menu'));
        await openAs(page, stack, cuenta.token, '/dashboard');

        const menu = await stagehand.extract(
          'Extrae los nombres de todas las opciones del menú lateral de navegación.',
          z.object({ opciones: z.array(z.string()) }),
          { page },
        );
        console.log('  Extract entregó:', menu.data.opciones);
        assertListIncludes(menu.data.opciones, 'Entrenamientos', 'El menú no muestra Entrenamientos.');
        assertListExcludes(menu.data.opciones, 'Admin', 'Un usuario normal no debería ver la opción Admin.');
      },
    },
    {
      requisito: 'RF-29',
      nombre: 'Localizar el botón de exportar datos',
      objetivo: 'Verificar con observe que la página de perfil ofrece la exportación del historial.',
      esperado: 'Observe devuelve al menos un elemento para "Exportar mis datos".',
      run: async ({ page, stack, stagehand }) => {
        const cuenta = await registerAccount(stack, newAccount('sh-exportar'));
        await openAs(page, stack, cuenta.token, '/profile');

        const botones = await stagehand.observe('Encuentra el botón para exportar mis datos', { page });
        assertTrue(botones.data.length > 0, 'Observe no encontró el botón de exportar.');
        console.log('  Observe encontró:', botones.data[0]?.description);
        const existe = await page.evaluate(() => [...document.querySelectorAll('button')].some((boton) => boton.textContent?.includes('Exportar mis datos')));
        assertTrue(existe, 'El botón "Exportar mis datos" no está en la página.');
      },
    },
  ]),
);
