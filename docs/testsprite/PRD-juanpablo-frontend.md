# Athletia Web: PRD para pruebas de TestSprite (Juan Pablo Berrío)

## Propósito
Athletia es una aplicación web (React + Vite + TypeScript) para el seguimiento de deportistas, que consume una API REST.
Este documento limita las pruebas a las funcionalidades de Juan Pablo: **RF-12, RF-13, RF-14, RF-15, RF-16 y RF-18**.
No se deben probar otras páginas (entrenamientos, alimentación, perfil, administración, landing, registro, recuperación de contraseña).

- URL: `http://localhost:5180`
- Backend: `http://localhost:4010` (ya está corriendo)

## Inicio de sesión (preparación)
- Ir a `/login`, escribir el correo y la contraseña de la cuenta de prueba en los campos "Correo electrónico" y "Contraseña", y pulsar **Iniciar Sesión**.
- Cuenta de prueba: `testsprite.jp@athletia.test` / `TestSprite#2026jp`.
- Tras iniciar sesión se muestra el dashboard. La barra lateral tiene los enlaces **Sueño** (`/sleep`), **Lesiones** (`/injuries`) y **Gimnasios** (`/gyms`).
- Las pruebas comparten esa cuenta, así que cada prueba debe crear sus propios datos con valores reconocibles y no depender de registros previos.

## Sueño (`/sleep`)
La página tiene un formulario (horas de sueño, calidad 1-10, nivel de estrés 1-10, pesadillas, notas, fecha) con el botón **Guardar Registro** y una lista de tarjetas que muestran, por ejemplo, "7 horas". Cada tarjeta tiene un botón de editar (lápiz) y uno de eliminar (papelera).

### RF-12: Editar registro de sueño
1. Crear un registro (por ejemplo, 7 horas) y pulsar **Guardar Registro**. Aparece la tarjeta "7 horas".
2. Pulsar el lápiz de esa tarjeta. El formulario cambia al título **Editar Registro** con los valores cargados.
3. Cambiar las horas (por ejemplo, a 9) y pulsar **Actualizar Registro**.
4. Resultado esperado: la tarjeta muestra "9 horas" y ya no aparece "7 horas".
5. Valores inválidos (horas mayores que 24, calidad o estrés fuera de 1-10, fecha futura) no se guardan y se muestra un mensaje de error.

### RF-13: Eliminar registro de sueño
1. Crear un registro (por ejemplo, 6 horas).
2. Pulsar la papelera de esa tarjeta. Aparece un diálogo de confirmación.
3. Al aceptar, la tarjeta desaparece. Si era el único registro, se muestra "No hay registros de sueño.".
4. Al cancelar, el registro sigue en la lista.

## Lesiones (`/injuries`)
Formulario: **Área del cuerpo** (placeholder "Ej. Rodilla Derecha"), **Nombre de la lesión** (placeholder "Ej. Esguince"), severidad 1-10, estado activa/recuperada y notas. Botón **Registrar Lesión**. Cada lesión aparece como una tarjeta con botones de editar (lápiz) y eliminar (papelera).

### RF-14: Reportar lesión
- Llenar el área "Rodilla derecha" y el nombre "Esguince leve" y pulsar **Registrar Lesión**. Aparece una tarjeta "Esguince leve".
- El área y el nombre solo aceptan letras y espacios (con tildes y ñ). Un texto como "Rodilla2" o "Rodilla!" no se registra y se muestra un error.
- Si faltan los campos obligatorios, no se registra.

### RF-15: Editar lesión
1. Crear una lesión y pulsar el lápiz de su tarjeta. El formulario muestra el título **Editar Lesión** con los datos cargados.
2. Cambiar el nombre (por ejemplo, a "Esguince grave") y pulsar **Actualizar Lesión**.
3. Resultado esperado: la tarjeta muestra el nuevo nombre y no el anterior.

### RF-16: Eliminar lesión
1. Crear una lesión y pulsar la papelera de su tarjeta. Aparece un diálogo de confirmación.
2. Al aceptar, la tarjeta desaparece de la lista.

## RF-18: Buscar gimnasios (`/gyms`)
- La página carga un mapa de Google y un buscador ("Buscar ciudad o zona...") con el botón **Buscar**.
- **Nota importante:** la cuenta de Google Maps de este entorno no tiene facturación activa, por lo que Google no devuelve gimnasios.
  El comportamiento esperado es que la app maneje el error: la página deja de mostrar "Buscando gimnasios...", muestra un aviso
  ("Error al buscar gimnasios..." o "No se encontraron resultados para esa búsqueda.") y el botón **Buscar** queda habilitado para reintentar.
- Prueba: buscar "Envigado" y verificar ese manejo del error. No se esperan resultados reales.
