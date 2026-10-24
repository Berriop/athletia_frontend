/** Cuerpos válidos para crear registros por la API; cada prueba cambia solo lo que le interesa. */
export const ID_INEXISTENTE = '00000000-0000-4000-8000-000000000000';

export const sueno = (cambios = {}) => ({
  hoursSlept: 7,
  sleepQuality: 8,
  stressLevel: 3,
  hadNightmares: false,
  date: new Date().toISOString(),
  ...cambios,
});

export const comida = (cambios = {}) => ({
  name: 'Arroz con pollo',
  calories: 620,
  mealType: 'LUNCH',
  proteinG: 35,
  carbsG: 70,
  fatG: 15,
  date: new Date().toISOString(),
  ...cambios,
});

export const lesion = (cambios = {}) => ({
  bodyArea: 'Rodilla derecha',
  injuryName: 'Esguince leve',
  severity: 4,
  ...cambios,
});
