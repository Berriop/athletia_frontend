# language: es
@JuanPabloBerrio @RF12
Característica: [Juan Pablo Berrío] RF-12 Editar un registro de sueño
  Como persona que cuida su descanso
  Quiero modificar un registro de sueño
  Para corregir las horas que anoté mal

  Escenario: [Juan Pablo Berrío] Editar las horas de un registro de sueño
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Sueño"
    Y ella registra 7 horas de sueño
    Entonces ella ve "7 horas" en la lista
    Cuando ella cambia el registro "7 horas" por 9 horas de sueño
    Entonces ella ve "9 horas" en la lista
    Y ella ya no ve "7 horas" en la lista
