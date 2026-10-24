# language: es
@JuanPabloBerrio @RF15
Característica: [Juan Pablo Berrío] RF-15 Editar una lesión
  Como persona que entrena
  Quiero modificar una lesión ya reportada
  Para mantener actualizado su nombre

  Escenario: [Juan Pablo Berrío] Editar el nombre de una lesión existente
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Lesiones"
    Y ella reporta la lesión "Esguince leve"
    Entonces ella ve "Esguince leve" en la lista
    Cuando ella cambia la lesión "Esguince leve" por "Esguince grave"
    Entonces ella ve "Esguince grave" en la lista
    Y ella ya no ve "Esguince leve" en la lista
