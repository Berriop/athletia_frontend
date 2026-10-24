# language: es
@LuisaEspinal @RF03
Característica: [Luisa Espinal] RF-03 Cierre de sesión
  Como persona con sesión iniciada
  Quiero cerrar mi sesión
  Para que nadie más pueda ver mis datos desde este navegador

  Escenario: [Luisa Espinal] Cerrar sesión devuelve al inicio de sesión y bloquea el panel
    Dado Ana creó su cuenta y está en el panel
    Cuando ella cierra sesión
    Entonces ella está en la ruta "/login"
    Cuando ella intenta abrir la ruta "/dashboard"
    Entonces ella está en la ruta "/login"

  Escenario: [Luisa Espinal] Una persona sin sesión no puede abrir una sección privada
    Dado Ana no ha iniciado sesión
    Cuando ella intenta abrir la ruta "/workouts"
    Entonces ella está en la ruta "/login"
