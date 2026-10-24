# language: es
@DanielOrtiz @RF10
Característica: [Daniel Ortiz] RF-10 Eliminar una comida
  Como persona que registra su alimentación
  Quiero eliminar una comida con confirmación
  Para quitar registros que ya no necesito sin borrarlos por accidente

  Escenario: [Daniel Ortiz] Eliminar una comida tras confirmar
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Alimentación"
    Y ella registra la comida "Ensalada fresca"
    Entonces ella ve "Ensalada fresca" en la lista
    Cuando ella elimina "Ensalada fresca" y confirma
    Entonces ella ya no ve "Ensalada fresca" en la lista
