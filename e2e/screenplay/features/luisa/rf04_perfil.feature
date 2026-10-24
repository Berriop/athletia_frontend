# language: es
@LuisaEspinal @RF04
Característica: [Luisa Espinal] RF-04 Perfil de usuario
  Como persona registrada en Athletia
  Quiero editar el nombre de mi perfil
  Para que la aplicación me salude con el nombre que prefiero

  Escenario: [Luisa Espinal] Cambiar el nombre y verlo reflejado en el saludo
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Perfil"
    Y ella cambia su nombre de perfil a "Ana Renombrada"
    Entonces ella ve el saludo "Ana Renombrada"
    Cuando ella abre las notificaciones
    Entonces ella ve la notificación "Perfil actualizado correctamente"
