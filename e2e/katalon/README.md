# Pruebas E2E con Katalon Recorder

Suites para Katalon Recorder 7.1 contra https://athletia-frontend.vercel.app/

## Cómo ejecutarlas

1. Cerrar sesión en Athletia si está abierta en Chrome.
2. Katalon Recorder → **Open Test Suite** → seleccionar los `.html` de esta carpeta.
3. **Play All Suites** (o una suite con **Play Test Suite**).
4. Evidencias: pestaña **Log** (guardar con el ícono de disco) y pestaña **Screenshots**.

## Suites

| Suite | Casos positivos | Casos negativos |
|---|---|---|
| 01_Autenticacion | Login, cerrar sesión (menú y encabezado) | Clave incorrecta, usuario inexistente, campos vacíos, correo inválido |
| 02_Registro | Registro con correo nuevo, navegación login/registro | Clave débil, claves distintas, correo ya registrado |
| 03_Recuperar_Contrasena | Abrir, enviar enlace, volver al login | Correo inválido |
| 04_Paginas_Publicas | Inicio, Nosotros, FAQ, contacto, enviar otro mensaje | Contacto vacío, correo inválido |
| 05_Dashboard_y_Navegacion | Dashboard, navegación por módulos, notificaciones | — |
| 06_Entrenamientos | Crear, notificación, editar, cancelar edición, cancelar/confirmar eliminación | Título vacío, energía 15 |
| 07_Alimentacion | Registrar, notificación, editar, cancelar edición, cancelar/confirmar eliminación | Nombre vacío, calorías con decimales |
| 08_Sueno | Registrar, notificación, editar, cancelar edición, cancelar/confirmar eliminación | Calidad 15, 30 horas |
| 09_Lesiones | Reportar, notificación, marcar recuperada, cancelar edición, cancelar/confirmar eliminación | Nombre con números, severidad 0 |
| 10_Gimnasios | Abrir, limpiar búsqueda, buscar por ciudad, seleccionar gimnasio | Búsqueda vacía |
| 11_Perfil | Ver, editar, notificación, cancelar edición, exportar CSV, cerrar sesión | Altura 400 |
| 12_Administracion | Ver panel (solo cuenta ADMIN) | Admin no puede bloquearse a sí mismo |

## Criterios aplicados

- **Localizadores**: `id=` cuando el campo tiene id; si no, CSS por clase/atributo o XPath por texto visible. Nada de posiciones absolutas.
- **Sincronización**: `waitForElementPresent` / `waitForElementNotPresent` después de cada navegación o llamada al backend; `pause` solo en negativos donde se comprueba que *no* pasó nada.
- **Verificación**: `verifyText`, `verifyValue`, `verifyElementPresent`, `verifyChecked`, `verifyAttribute`.
- **Reproducibilidad**: cada suite privada inicia y cierra sesión; los registros creados se eliminan al final de su suite; el registro usa un correo único (`katalon.<timestamp>@test.com`).

## Límites del backend

- Registro: 3 por hora por IP. La suite 02 hace 2, así que solo se puede correr una vez por hora.
- Recuperar contraseña: 5 por hora por IP.

## Hallazgo

Abrir una ruta interna directamente (por ejemplo `/login`) devuelve 404 de Vercel porque falta la regla de rewrite de SPA. Por eso todas las pruebas entran por `/` y navegan con clics.
