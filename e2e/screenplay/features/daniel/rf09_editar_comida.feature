# language: es
@DanielOrtiz @RF09
Característica: [Daniel Ortiz] RF-09 Editar una comida
  Como persona que registra su alimentación
  Quiero modificar una comida ya registrada
  Para corregir su nombre cuando me equivoqué

  Escenario: [Daniel Ortiz] Editar el nombre de una comida existente
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Alimentación"
    Y ella registra la comida "Arroz con pollo"
    Entonces ella ve "Arroz con pollo" en la lista
    Cuando ella cambia la comida "Arroz con pollo" por "Pasta con atún"
    Entonces ella ve "Pasta con atún" en la lista
    Y ella ya no ve "Arroz con pollo" en la lista
