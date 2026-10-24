# language: es
@LuisaEspinal @RF01
Característica: [Luisa Espinal] RF-01 Registro de cuenta
  Como persona nueva en Athletia
  Quiero crear una cuenta con mis datos
  Para guardar mi seguimiento de entrenamiento, alimentación y sueño

  Escenario: [Luisa Espinal] Crear una cuenta con datos válidos
    Dado Ana no ha iniciado sesión
    Cuando ella se registra con sus datos
    Entonces ella está en la ruta "/dashboard"
    Y ella ve su nombre en el saludo

  Esquema del escenario: [Luisa Espinal] No permite registrarse con <caso>
    Dado Ana no ha iniciado sesión
    Cuando ella completa el formulario de registro con la contraseña "<contraseña>" y la confirmación "<confirmación>"
    Entonces el botón de crear cuenta está deshabilitado
    Y ella está en la ruta "/register"

    Ejemplos:
      | caso                    | contraseña       | confirmación    |
      | una contraseña débil    | debil            | debil           |
      | una confirmación errada | E2eP@ssw0rd2026! | OtraClave@2026x |

  Escenario: [Luisa Espinal] Avisa que las contraseñas no coinciden
    Dado Ana no ha iniciado sesión
    Cuando ella completa el formulario de registro con la contraseña "E2eP@ssw0rd2026!" y la confirmación "OtraClave@2026x"
    Entonces ella ve la advertencia "Las contraseñas no coinciden"

  Escenario: [Luisa Espinal] Rechaza un correo que ya está registrado
    Dado Ana tiene una cuenta registrada pero no ha iniciado sesión
    Cuando ella intenta registrarse otra vez con el mismo correo
    Entonces ella ve el mensaje de error "Email already in use"
    Y ella está en la ruta "/register"
