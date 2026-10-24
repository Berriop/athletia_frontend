import { defineParameterType } from '@cucumber/cucumber';
import { actorCalled, actorInTheSpotlight } from '@serenity-js/core';

/**
 * {actor}: la persona que protagoniza el paso. Puede ser su nombre ("Ana") o un
 * pronombre ("ella") que se refiere a la última persona mencionada.
 */
defineParameterType({
  name: 'actor',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+|él|ella/,
  transformer: (name: string) => (name === 'él' || name === 'ella' ? actorInTheSpotlight() : actorCalled(name)),
});

/** {persona}: nombre de otra persona a la que se hace referencia, sin cambiar de protagonista. */
defineParameterType({
  name: 'persona',
  regexp: /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
  transformer: (name: string) => name,
});
