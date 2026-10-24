# language: es
@DanielOrtiz @RF11
Característica: [Daniel Ortiz] RF-11 Registrar sueño
  Como persona que cuida su descanso
  Quiero registrar las horas que dormí
  Para llevar el seguimiento de mi sueño

  Escenario: [Daniel Ortiz] Registrar horas de sueño y verlas en la lista
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Sueño"
    Y ella registra 8 horas de sueño
    Entonces ella ve "8 horas" en la lista
    Cuando ella abre las notificaciones
    Entonces ella ve la notificación "Registro de sueño creado"
