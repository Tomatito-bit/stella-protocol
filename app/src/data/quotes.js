// What a crew member writes in the margin of the logbook, depending on how they feel
const Q = {
  engineer: {
    good: [
      { es: 'Todo zumba como debe. Me encanta ese sonido.', en: 'Everything hums the way it should. I love that sound.' },
      { es: 'Si algo truena, avísenme primero a mí.', en: 'If anything breaks, tell me first.' },
    ],
    bad: [
      { es: 'No me alcanzan las manos para tantas fallas.', en: 'I don’t have enough hands for all these failures.' },
      { es: 'Necesito dormir antes de tocar otro cable.', en: 'I need sleep before I touch another wire.' },
    ],
  },
  pilot: {
    good: [
      { es: 'Ruta estable. Así se vuela.', en: 'Stable route. That’s how you fly.' },
      { es: 'Desde aquí la vista vale cada riesgo.', en: 'From up here the view is worth every risk.' },
    ],
    bad: [
      { es: 'El capitán es el último en dejar el puente… pero hoy pesa.', en: 'The captain is the last to leave the bridge… but today it weighs.' },
      { es: 'Extraño el ruido de la Tierra en la radio.', en: 'I miss Earth’s chatter on the radio.' },
    ],
  },
  scientist: {
    good: [
      { es: 'Los datos de hoy son preciosos. Literalmente.', en: 'Today’s data is beautiful. Literally.' },
      { es: 'Probabilidad de éxito: subiendo.', en: 'Probability of success: rising.' },
    ],
    bad: [
      { es: 'Las paredes se sienten más cerca cada día.', en: 'The walls feel closer every day.' },
      { es: 'Los números no mienten, y hoy no me gustan.', en: 'The numbers don’t lie, and today I don’t like them.' },
    ],
  },
  doctor: {
    good: [
      { es: 'Signos vitales en orden. Sigan tomando agua.', en: 'Vitals in order. Keep drinking water.' },
      { es: 'Un equipo que ríe es un equipo sano.', en: 'A crew that laughs is a healthy crew.' },
    ],
    bad: [
      { es: 'Están más cansados de lo que admiten.', en: 'They’re more tired than they admit.' },
      { es: 'Si nadie descansa, voy a tener mucho trabajo.', en: 'If nobody rests, I’ll have a lot of work.' },
    ],
  },
}

// The person who most needs to be heard today writes the note (the most worn out, or the commander on good days)
export function quoteOfDay(crew, day) {
  if (!crew || !crew.length) return null
  const worst = [...crew].sort((a, b) => (a.morale + a.energy + a.health) - (b.morale + b.energy + b.health))[0]
  const struggling = worst.morale < 50 || worst.energy < 35 || worst.health < 50
  const who = struggling ? worst : crew.find((c) => c.commander) || crew[0]
  const pool = (Q[who.duty] || Q.pilot)[struggling ? 'bad' : 'good']
  return { id: who.id, text: pool[day % pool.length] }
}
