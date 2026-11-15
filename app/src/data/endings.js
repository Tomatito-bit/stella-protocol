// Story endings: which one you get depends on the result, Earth's voice (the antenna) and how the crew came home.

export function endingOf(m, level) {
  if (m.lost) return {
    title: { es: 'Final: la última transmisión', en: 'Ending: the last transmission' },
    text: { es: 'La Astraea no pudo completar la misión. Lo que sí llegó a la Tierra fueron las lecciones: cada falla se estudió durante años para que la siguiente tripulación tuviera una oportunidad mejor. Así ha aprendido siempre la NASA.', en: 'The Astraea could not complete the mission. What did reach Earth were the lessons: every failure was studied for years so the next crew would have a better chance. That is how NASA has always learned.' },
  }
  if (!m.voiceBack) return {
    title: { es: 'Final: el largo silencio', en: 'Ending: the long silence' },
    text: { es: 'La antena nunca se reparó. La tripulación trabajó sola, sin una sola palabra de casa, y regresó con los datos guardados a bordo. En la Tierra los recibieron como fantasmas que vuelven: nadie sabía si seguían vivos.', en: 'The antenna was never repaired. The crew worked alone, without a single word from home, and returned with the data stored on board. Earth greeted them like ghosts coming back: nobody knew if they were still alive.' },
  }
  const healthy = m.crew ? m.crew.every((c) => c.health > 60) : true
  if (level === 'success' && healthy) return {
    title: { es: 'Final: el regreso de la Astraea', en: 'Ending: the Astraea comes home' },
    text: { es: 'Recuperaron la voz de la Tierra, cumplieron la ciencia y volvieron todos de pie. Los datos de la Astraea se convirtieron en la base de la siguiente misión, y su bitácora se lee hoy en las escuelas.', en: 'They got Earth’s voice back, completed the science and everyone came home standing. The Astraea’s data became the foundation of the next mission, and its logbook is now read in schools.' },
  }
  if (level === 'success') return {
    title: { es: 'Final: victoria a un precio', en: 'Ending: victory at a price' },
    text: { es: 'La ciencia se cumplió, pero el cuerpo de la tripulación pagó la cuenta. La misión será recordada como un éxito… y como una advertencia sobre cuidar a quienes viajan.', en: 'The science was done, but the crew’s bodies paid the bill. The mission will be remembered as a success… and as a warning about caring for those who fly.' },
  }
  return {
    title: { es: 'Final: a medio camino', en: 'Ending: halfway there' },
    text: { es: 'Volvieron a casa y la voz de la Tierra los acompañó, pero faltaron datos. La siguiente tripulación partirá con su bitácora en la mano para terminar lo que la Astraea empezó.', en: 'They came home and Earth’s voice was with them, but data was missing. The next crew will leave with the Astraea’s logbook in hand to finish what it started.' },
  }
}

// One line per crew member: body (health) + mind (morale) + what their role leads them to do next
const NEXT = {
  engineer: {
    up: { es: 'ya diseña los filtros y antenas de la siguiente nave', en: 'is already designing the filters and antennas of the next ship' },
    down: { es: 'pidió tiempo en tierra antes de volver a tocar una llave', en: 'asked for time on the ground before picking up a wrench again' },
  },
  pilot: {
    up: { es: 'entrena a los nuevos pilotos con las rutas que trazó', en: 'trains new pilots on the routes he flew' },
    down: { es: 'colgó la gorra de capitán por un tiempo', en: 'hung up his captain’s cap for a while' },
  },
  scientist: {
    up: { es: 'publica el análisis de las señales que descifró a bordo', en: 'is publishing the analysis of the signals she decoded on board' },
    down: { es: 'se tomó un año lejos de las pantallas', en: 'took a year away from the screens' },
  },
  doctor: {
    up: { es: 'escribe el nuevo protocolo médico para viajes largos', en: 'is writing the new medical protocol for long voyages' },
    down: { es: 'volvió a un hospital en la Tierra, donde los pacientes no flotan', en: 'went back to a hospital on Earth, where patients don’t float' },
  },
}

export function epilogueLine(c, duty, es) {
  const body = c.health > 70 ? (es ? 'regresó en buena forma' : 'came home in good shape')
    : c.health > 35 ? (es ? 'regresó débil y necesitó meses de rehabilitación por la pérdida de hueso y músculo' : 'came home weak and needed months of rehab for bone and muscle loss')
      : (es ? 'regresó en estado delicado y pasó semanas en el hospital' : 'came home in a fragile state and spent weeks in hospital')
  const next = NEXT[duty] && NEXT[duty][c.morale >= 45 ? 'up' : 'down']
  return `${body}${next ? (es ? ' y ' : ' and ') + next[es ? 'es' : 'en'] : ''}.`
}
