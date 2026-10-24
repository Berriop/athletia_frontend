# language: es
@DanielOrtiz @RF30
Característica: [Daniel Ortiz] RF-30 Administrar usuarios
  Como administrador de Athletia
  Quiero bloquear cuentas de usuario
  Para impedir que entren personas que incumplen las reglas

  Escenario: [Daniel Ortiz] Un administrador bloquea una cuenta y esa persona ya no puede entrar
    Dado Bruno tiene una cuenta registrada pero no ha iniciado sesión
    Y Sofía tiene una cuenta con rol de administrador pero no ha iniciado sesión
    Cuando ella inicia sesión con su correo y su contraseña
    Y ella abre la sección "Admin"
    Entonces ella ve la cuenta de Bruno en la lista de usuarios
    Cuando ella bloquea la cuenta de Bruno
    Entonces ella ve la cuenta de Bruno con el estado "Bloqueado"
    Cuando Bruno inicia sesión con su correo y su contraseña
    Entonces ella ve el mensaje de error "bloqueada"
    Y ella está en la ruta "/login"

  Escenario: [Daniel Ortiz] El administrador no puede bloquear su propia cuenta
    Dado Sofía tiene una cuenta con rol de administrador pero no ha iniciado sesión
    Cuando ella inicia sesión con su correo y su contraseña
    Y ella abre la sección "Admin"
    Entonces el botón para bloquear su propia cuenta está deshabilitado
