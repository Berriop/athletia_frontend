# language: es
@DanielOrtiz @RF27
Característica: [Daniel Ortiz] RF-27 Recuperar contraseña
  Como persona que olvidó su contraseña
  Quiero restablecerla mediante un enlace
  Para volver a entrar a mi cuenta

  Escenario: [Daniel Ortiz] Confirmar la solicitud sin revelar si el correo existe
    Dado Ana no ha iniciado sesión
    Cuando ella solicita recuperar la contraseña del correo "no.existe.recuperar@athletia.test"
    Entonces ella ve la confirmación "Correo Enviado"

  Escenario: [Daniel Ortiz] Restablecer la contraseña con el enlace y entrar con la nueva
    Dado Ana tiene una cuenta registrada pero no ha iniciado sesión
    Cuando ella solicita recuperar la contraseña de su cuenta
    Entonces ella ve la confirmación "Correo Enviado"
    Cuando ella abre el enlace de recuperación que recibió en su correo
    Y ella define la nueva contraseña "NuevaClave@2026!"
    Entonces ella ve que la contraseña fue restablecida
    Cuando ella inicia sesión con su correo y su contraseña
    Entonces ella ve el mensaje de error "Correo o contraseña incorrectos"
    Cuando ella inicia sesión con su correo y la contraseña "NuevaClave@2026!"
    Entonces ella está en la ruta "/dashboard"

  Escenario: [Daniel Ortiz] Rechazar un enlace de recuperación con un token inválido
    Dado Ana no ha iniciado sesión
    Cuando ella abre un enlace de recuperación con un token falso
    Y ella define la nueva contraseña "NuevaClave@2026!"
    Entonces ella ve el mensaje de error "inválido"
    Y no aparece la confirmación de contraseña restablecida
