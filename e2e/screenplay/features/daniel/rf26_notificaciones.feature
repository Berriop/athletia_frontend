# language: es
@DanielOrtiz @RF26
Característica: [Daniel Ortiz] RF-26 Notificaciones
  Como persona que usa Athletia
  Quiero ver una notificación por cada acción que realizo
  Para saber que la aplicación registró mis cambios

  Escenario: [Daniel Ortiz] Acumular las notificaciones de las acciones en la campana
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Alimentación"
    Y ella registra la comida "Avena con fruta"
    Entonces ella ve "Avena con fruta" en la lista
    Cuando ella abre la sección "Entrenamientos"
    Y ella registra el entrenamiento "Pierna ligera"
    Entonces ella ve "Pierna ligera" en la lista
    Y el contador de notificaciones muestra "2"
    Cuando ella abre las notificaciones
    Entonces ella ve la notificación "Comida registrada correctamente"
    Y ella ve la notificación "Entrenamiento creado correctamente"

  Escenario: [Daniel Ortiz] Borrar una notificación y limpiar todas
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Alimentación"
    Y ella registra la comida "Avena con fruta"
    Entonces ella ve "Avena con fruta" en la lista
    Cuando ella abre la sección "Entrenamientos"
    Y ella registra el entrenamiento "Pierna ligera"
    Entonces ella ve "Pierna ligera" en la lista
    Cuando ella abre las notificaciones
    Y ella borra la primera notificación
    Entonces el contador de notificaciones muestra "1"
    Cuando ella limpia todas las notificaciones
    Entonces la campana muestra "No tienes notificaciones nuevas"
