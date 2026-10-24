# language: es
@JuanPabloBerrio @RF14
Característica: [Juan Pablo Berrío] RF-14 Reportar una lesión
  Como persona que entrena
  Quiero reportar una lesión
  Para llevar el control de lo que me impide entrenar

  Escenario: [Juan Pablo Berrío] Reportar una lesión y verla en la lista
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Lesiones"
    Y ella reporta la lesión "Esguince leve"
    Entonces ella ve "Esguince leve" en la lista
    Cuando ella abre las notificaciones
    Entonces ella ve la notificación "Lesión registrada correctamente"

  Escenario: [Juan Pablo Berrío] No aceptar un nombre de lesión con números
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Lesiones"
    Y ella reporta la lesión "Esguince2"
    Entonces el campo del nombre de la lesión rechaza el valor escrito
    Y "Esguince2" no aparece en la lista
