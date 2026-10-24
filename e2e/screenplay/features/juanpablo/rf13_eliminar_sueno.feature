# language: es
@JuanPabloBerrio @RF13
Característica: [Juan Pablo Berrío] RF-13 Eliminar un registro de sueño
  Como persona que cuida su descanso
  Quiero eliminar un registro de sueño con confirmación
  Para quitar datos que ya no necesito sin borrarlos por accidente

  Escenario: [Juan Pablo Berrío] Eliminar un registro de sueño tras confirmar
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Sueño"
    Y ella registra 6 horas de sueño
    Entonces ella ve "6 horas" en la lista
    Cuando ella elimina "6 horas" y confirma
    Entonces ella ya no ve "6 horas" en la lista
