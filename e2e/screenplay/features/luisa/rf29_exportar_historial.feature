# language: es
@LuisaEspinal @RF29
Característica: [Luisa Espinal] RF-29 Exportar historial
  Como persona que registra sus entrenamientos
  Quiero descargar mi historial en un archivo CSV
  Para conservar una copia de mis datos

  Escenario: [Luisa Espinal] Exportar los datos con la rutina registrada
    Dado Ana creó su cuenta y está en el panel
    Cuando ella abre la sección "Entrenamientos"
    Y ella registra el entrenamiento "Rutina exportada"
    Entonces ella ve "Rutina exportada" en la lista
    Cuando ella abre la sección "Perfil"
    Y ella exporta sus datos a CSV
    Entonces se descarga el archivo "athletia_export.csv"
    Y el archivo contiene "TYPE,DATE,DETAIL_1,DETAIL_2,DETAIL_3"
    Y el archivo contiene la rutina "Rutina exportada"
