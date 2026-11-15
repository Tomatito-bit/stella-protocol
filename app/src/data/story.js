// Story beats written into the logbook on certain days, plus each crew member's past.

// Who they were before the Astraea (shown when choosing the commander)
export const PAST = {
  valeria: { es: 'Creció en Monterrey arreglando los radios del taller de su papá. Su hermano de 9 años construye cohetes de botella y le pidió que le traiga “una piedra del espacio”.', en: 'She grew up in Monterrey fixing radios in her dad’s workshop. Her 9-year-old brother builds bottle rockets and asked her to bring back “a space rock”.' },
  diego: { es: 'Fue piloto de pruebas y voló más de cuarenta aviones distintos. En casa lo espera Cometa, una perra vieja que cada noche se sienta junto a la puerta.', en: 'He was a test pilot who flew more than forty different aircraft. At home Cometa, an old dog, waits by the door every night.' },
  mei: { es: 'Su abuela le enseñó los nombres de las estrellas desde una azotea en Taipéi. Lleva en el bolsillo el mapa del cielo que ella dibujó a mano.', en: 'Her grandmother taught her the names of the stars from a Taipei rooftop. She carries the hand-drawn sky map her grandmother made.' },
  kwame: { es: 'Trabajó en hospitales de campaña en Ghana antes de entrenar como cirujano espacial. Su hijo de 12 años quiere ser médico “pero en Marte”.', en: 'He worked in field hospitals in Ghana before training as a space surgeon. His 12-year-old son wants to be a doctor “but on Mars”.' },
}

// Personal moments: day → which crew member and what happens
const CREW_BEATS = {
  2: { id: 'valeria', es: 'Maya pegó en su litera un dibujo de su hermano: un cohete de botella con su nombre. Dice que ya va en camino.', en: 'Maya taped her brother’s drawing to her bunk: a bottle rocket with her name on it. She says it’s on its way.' },
  4: { id: 'mei', es: 'Lyra desdobló el mapa del cielo de su abuela junto a la ventana. Las estrellas están en el mismo lugar; ella ya no.', en: 'Lyra unfolded her grandmother’s sky map by the window. The stars are in the same place; she is not.' },
  6: { id: 'diego', es: 'Hoy es el cumpleaños de Frost. La tripulación le hizo un “pastel” con raciones apiladas y una vela de luz LED.', en: 'Today is Frost’s birthday. The crew made him a “cake” of stacked rations and an LED candle.' },
  8: { id: 'kwame', es: 'Ezra grabó un mensaje para su hijo: le explicó cómo se toma el pulso en gravedad cero. Lo repitió tres veces hasta que le salió sin llorar.', en: 'Ezra recorded a message for his son, explaining how to take a pulse in zero gravity. He did it three times until he could finish without crying.' },
  10: { id: 'diego', es: 'Frost soñó que Cometa ladraba en la cabina. Al despertar, se quedó un rato mirando la puerta.', en: 'Frost dreamed Cometa was barking in the cabin. When he woke up, he stared at the door for a while.' },
  12: { id: 'valeria', es: 'Maya encontró un tornillo suelto flotando en la esclusa. Lo guardó: será la “piedra del espacio” para su hermano.', en: 'Maya found a loose screw floating in the airlock. She kept it: it will be the “space rock” for her brother.' },
}

// Moments tied to each destination
const DEST_BEATS = {
  moon: {
    1: { es: 'Desde la órbita, la Tierra cabe completa detrás del pulgar. Nadie dijo nada durante un minuto.', en: 'From orbit, Earth fits entirely behind a thumb. Nobody said a word for a minute.' },
    5: { es: 'Sobre el polo sur, los cráteres guardan sombra eterna desde hace miles de millones de años. Ahí podría estar el agua del futuro.', en: 'Over the south pole, craters have held eternal shadow for billions of years. The water of the future could be there.' },
  },
  mars: {
    1: { es: 'Marte se ve rojo óxido y enorme. La señal tarda doce minutos en llegar a casa: cualquier “hola” ya es pasado.', en: 'Mars looks rust-red and huge. The signal takes twelve minutes to reach home: every “hello” is already the past.' },
    5: { es: 'Pasamos sobre el valle Marineris: un cañón que cruzaría todo México. La analista no paró de tomar datos.', en: 'We passed over Valles Marineris: a canyon that would cross all of Mexico. The analyst never stopped taking data.' },
    9: { es: 'Esta noche Fobos cruzó el cielo dos veces. Aquí hasta las lunas tienen prisa.', en: 'Tonight Phobos crossed the sky twice. Here even the moons are in a hurry.' },
  },
  europa: {
    1: { es: 'Júpiter llena media ventana. Bajo el hielo de Europa hay más agua que en todos los océanos de la Tierra.', en: 'Jupiter fills half the window. Under Europa’s ice there is more water than in all of Earth’s oceans.' },
    6: { es: 'Las grietas del hielo dibujan líneas rojizas, como cicatrices. Algo ahí abajo se mueve con las mareas de Júpiter.', en: 'Cracks in the ice draw reddish lines, like scars. Something down there moves with Jupiter’s tides.' },
  },
}

const LAST = { es: 'Último día. Alguien escribió en la pared, con plumón: “Volvimos a casa, pero una parte de nosotros se queda aquí”.', en: 'Last day. Someone wrote on the wall in marker: “We went home, but part of us stays here”.' }

// The story lines for a given day (crew beats only for those on board)
export function storyFor(day, dest, crew, totalDays) {
  const out = []
  const d = DEST_BEATS[dest.id] && DEST_BEATS[dest.id][day]
  if (d) out.push(d)
  const c = crew && CREW_BEATS[day]
  if (c && crew.some((x) => x.id === c.id)) out.push(c)
  if (crew && day === totalDays) out.push(LAST)
  return out
}
