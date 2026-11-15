import { SAMPLE_GOAL } from './exploration'
// Story endings: which one you get depends on the result, Earth's voice (the antenna) and how the crew came home.

// Endings when the mission is lost: what happened, and the real lesson NASA learned from something similar
const LOST = {
  crew: {
    title: { es: 'Final: regreso de emergencia', en: 'Ending: emergency return' },
    text: { es: 'Un tripulante quedó en estado crítico y la Astraea abortó la misión. El regreso fue una carrera contra el reloj, con el doctor sin dormir y el capitán al mando del puente todo el camino. Llegaron a tiempo, pero la ciencia se quedó atrás.', en: 'A crew member became critically ill and the Astraea aborted the mission. The trip home was a race against the clock, the doctor without sleep and the captain on the bridge the whole way. They made it in time, but the science was left behind.' },
    lesson: { es: 'En enero de 2026 la NASA hizo la primera evacuación médica de la Estación Espacial: la salud de la tripulación siempre va primero.', en: 'In January 2026 NASA carried out the first medical evacuation of the Space Station: crew health always comes first.' },
  },
  o2: {
    title: { es: 'Final: el último aliento', en: 'Ending: the last breath' },
    text: { es: 'El aire se volvió irrespirable. Con mascarillas y los tanques de emergencia, la tripulación selló módulos y dio la vuelta. Volvieron vivos, pero la Astraea quedó flotando vacía en órbita.', en: 'The air became unbreathable. On masks and emergency tanks, the crew sealed modules and turned back. They came home alive, but the Astraea was left floating empty in orbit.' },
    lesson: { es: 'En el Apolo 13 los filtros de CO₂ no encajaban y la tripulación tuvo que improvisar uno con cinta y cartón para sobrevivir.', en: 'On Apollo 13 the CO₂ filters didn’t fit and the crew had to rig one with tape and cardboard to survive.' },
  },
  engine: {
    title: { es: 'Final: varados', en: 'Ending: stranded' },
    text: { es: 'El último día, el motor principal no encendió. Sin la maniobra de regreso, la Astraea quedó atrapada en órbita esperando una nave de rescate. La Tierra volvió a quedarse en silencio, esta vez por mucho más tiempo.', en: 'On the last day the main engine failed to fire. Without the return burn, the Astraea was trapped in orbit waiting for a rescue ship. Earth went silent again, this time for much longer.' },
    lesson: { es: 'Por eso las misiones reales prueban el motor una y otra vez y llevan combustible de sobra: una sola falla puede dejar a una nave sin regreso.', en: 'That is why real missions test the engine again and again and carry spare propellant: a single failure can leave a craft with no way home.' },
  },
  radiation: {
    title: { es: 'Final: tormenta de partículas', en: 'Ending: particle storm' },
    text: { es: 'La radiación frió la electrónica de la nave, circuito por circuito, hasta que las computadoras dejaron de responder. Lo último que llegó a la Tierra fue una línea de datos cortada a la mitad.', en: 'Radiation fried the craft’s electronics, circuit by circuit, until the computers stopped answering. The last thing to reach Earth was a line of data cut in half.' },
    lesson: { es: 'La sonda Galileo sufrió fallas por la radiación de Júpiter, y por eso Juno y Europa Clipper protegen sus computadoras dentro de bóvedas blindadas.', en: 'The Galileo probe suffered radiation failures at Jupiter, which is why Juno and Europa Clipper keep their computers inside shielded vaults.' },
  },
  probe: {
    title: { es: 'Final: silencio total', en: 'Ending: total silence' },
    text: { es: 'Sin antenas funcionando, la sonda siguió su camino sola. Tal vez sigue tomando fotos que nadie verá jamás.', en: 'With no working antennas, the probe went on alone. Maybe it is still taking pictures no one will ever see.' },
    lesson: { es: 'En 1999 la Mars Climate Orbiter se perdió por un error de unidades: la NASA aprendió a revisar cada dato dos veces.', en: 'In 1999 the Mars Climate Orbiter was lost to a units mix-up: NASA learned to check every number twice.' },
  },
}

export function endingOf(m, level) {
  if (m.lost) return LOST[m.lostWhy] || LOST.probe
  if (level === 'fail') return {
    title: { es: 'Final: con las manos vacías', en: 'Ending: empty-handed' },
    text: { es: 'Volvieron a casa, pero sin los datos que prometieron. En la conferencia de prensa nadie aplaudió. La tripulación sabe que hizo lo que pudo… y que alguien tendrá que volver a intentarlo.', en: 'They came home, but without the data they promised. Nobody clapped at the press conference. The crew knows they did what they could… and that someone will have to try again.' },
    lesson: { es: 'La NASA ha fallado muchas veces: cada misión que no logra su objetivo deja lecciones para la siguiente.', en: 'NASA has failed many times: every mission that misses its goal leaves lessons for the next one.' },
  }
  if (!m.voiceBack) return {
    title: { es: 'Final: el largo silencio', en: 'Ending: the long silence' },
    text: { es: 'La antena nunca se reparó. La tripulación trabajó sola, sin una sola palabra de casa, y regresó con los datos guardados a bordo. En la Tierra los recibieron como fantasmas que vuelven: nadie sabía si seguían vivos.', en: 'The antenna was never repaired. The crew worked alone, without a single word from home, and returned with the data stored on board. Earth greeted them like ghosts coming back: nobody knew if they were still alive.' },
  }
  const healthy = m.crew ? m.crew.every((c) => c.health > 60) : true
  // The rover's rock collection, complete
  if (level === 'success' && m.explore && m.explore.samples.length >= SAMPLE_GOAL) return {
    title: { es: 'Final: la bóveda de piedras', en: 'Ending: the vault of stones' },
    text: { es: `La Astraea volvió con ${m.explore.samples.length} muestras distintas de la superficie. Laboratorios de todo el mundo se pelean por estudiarlas, y una de ellas podría responder la pregunta más grande: ¿estamos solos?`, en: `The Astraea came home with ${m.explore.samples.length} different surface samples. Labs around the world compete to study them, and one of them might answer the biggest question: are we alone?` },
    lesson: { es: 'Los 382 kg de roca que trajo el programa Apolo se siguen estudiando hoy, más de 50 años después: una buena muestra dura para siempre.', en: 'The 382 kg of rock brought back by Apollo are still being studied today, more than 50 years later: a good sample lasts forever.' },
  }
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
