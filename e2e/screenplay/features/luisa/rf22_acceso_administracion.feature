# language: es
@LuisaEspinal @RF22
Característica: [Luisa Espinal] RF-22 Acceso al panel de administración
  Como responsable de la plataforma
  Quiero que solo las cuentas con rol de administrador vean el panel de usuarios
  Para que una persona común no pueda gestionar cuentas ajenas

  Escenario: [Luisa Espinal] Un usuario normal no ve la opción Admin
    Dado Ana creó su cuenta y está en el panel
    Entonces el menú incluye la opción "Entrenamientos"
    Y el menú no incluye la opción "Admin"

  Escenario: [Luisa Espinal] Un administrador ve la opción Admin y abre el panel de usuarios
    Dado Sofía tiene una cuenta con rol de administrador pero no ha iniciado sesión
    Cuando ella inicia sesión con su correo y su contraseña
    Entonces el menú incluye la opción "Admin"
    Cuando ella abre la sección "Admin"
    Entonces ella ve su propia cuenta en la lista de usuarios marcada como "(Tú)"
