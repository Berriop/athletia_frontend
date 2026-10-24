# language: es
@JuanPabloBerrio @RF18
Característica: [Juan Pablo Berrío] RF-18 Buscar gimnasios por texto
  Como persona que busca dónde entrenar
  Quiero buscar gimnasios escribiendo una ciudad o zona
  Para encontrar uno cercano a donde estoy

  Antecedentes:
    Dado Ana usa un Google Maps simulado con los gimnasios:
      | nombre             | dirección                   | zona     | calificación | latitud | longitud |
      | Smart Fit Poblado  | Cra 43A #10-50, Medellín    | poblado  | 4.6          | 6.2088  | -75.5679 |
      | Bodytech Envigado  | Cl 37 Sur #43-10, Envigado  | envigado | 4.4          | 6.1759  | -75.5917 |
    Y Ana creó su cuenta y está en el panel
    Y ella abre la sección "Gimnasios"
    Y ella ve el gimnasio "Smart Fit Poblado" en los resultados

  Escenario: [Juan Pablo Berrío] Encontrar los gimnasios de la zona buscada
    Cuando ella busca gimnasios por "envigado"
    Entonces ella ve el gimnasio "Bodytech Envigado" en los resultados
    Y ella no ve el gimnasio "Smart Fit Poblado" en los resultados
    Y ella ve el contador "1 gimnasio"

  Escenario: [Juan Pablo Berrío] Avisar cuando no hay gimnasios en la zona buscada
    Cuando ella busca gimnasios por "zonainexistente"
    Entonces ella ve el aviso de búsqueda "No se encontraron resultados para esa búsqueda."
    Y ella no ve el gimnasio "Smart Fit Poblado" en los resultados
