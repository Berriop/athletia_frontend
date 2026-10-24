# language: es
@LuisaEspinal @RF02
Característica: [Luisa Espinal] RF-02 Inicio de sesión
  Como persona registrada en Athletia
  Quiero iniciar sesión con mi correo y mi contraseña
  Para acceder a mi panel personal

  Escenario: [Luisa Espinal] Entrar con credenciales válidas
    Dado Ana tiene una cuenta registrada pero no ha iniciado sesión
    Cuando ella inicia sesión con su correo y su contraseña
    Entonces ella está en la ruta "/dashboard"
    Y ella ve su nombre en el saludo

  Escenario: [Luisa Espinal] Rechazar una contraseña incorrecta
    Dado Ana tiene una cuenta registrada pero no ha iniciado sesión
    Cuando ella inicia sesión con su correo y la contraseña "ClaveIncorrecta@2026"
    Entonces ella ve el mensaje de error "Correo o contraseña incorrectos"
    Y ella está en la ruta "/login"

  Escenario: [Luisa Espinal] Mostrar el mismo error para un correo que no existe
    Dado Ana no ha iniciado sesión
    Cuando ella inicia sesión con el correo "no.existe.e2e@athletia.test" y la contraseña "Cualquiera@2026x"
    Entonces ella ve el mensaje de error "Correo o contraseña incorrectos"
    Y ella está en la ruta "/login"
