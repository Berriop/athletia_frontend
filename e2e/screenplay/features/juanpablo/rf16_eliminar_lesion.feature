# language: es
@JuanPabloBerrio @RF16
Característica: [Juan Pablo Berrío] RF-16 Eliminar una lesión
  Como persona que entrena
  Quiero eliminar una lesión con confirmación
  Para quitar de mi historial una lesión que ya sanó

  Escenario: [Juan Pablo Berrío] Eliminar una lesión tras confirmar
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Lesiones"
    Y ella reporta la lesión "Tendinitis rotuliana" en "Hombro izquierdo"
    Entonces ella ve "Tendinitis rotuliana" en la lista
    Cuando ella elimina "Tendinitis rotuliana" y confirma
    Entonces ella ya no ve "Tendinitis rotuliana" en la lista
