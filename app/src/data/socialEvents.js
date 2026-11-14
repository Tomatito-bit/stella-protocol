// Social problems on board (team research, Nov 14 2026), in three difficulty tiers.
// Roles: captain = commander, specialist = scientist, pilot, engineer, doctor.
const tier = {
  easy: { es: 'Social · fácil', en: 'Social · easy' },
  mid: { es: 'Social · intermedio', en: 'Social · intermediate' },
  hard: { es: 'Social · difícil', en: 'Social · hard' },
}

export const SOCIAL_EVENTS = {
  // ---------- Easy: everyday friction ----------
  routineClash: {
    tier: 'easy', hazard: tier.easy,
    title: { es: 'Roces por turnos y desorden', en: 'Friction over shifts and mess' },
    text: { es: 'Ruido en horas de sueño, cosas tiradas en el módulo común… el encierro empieza a pesar.', en: 'Noise during sleep hours, stuff floating in the common module… confinement starts to weigh.' },
    fact: { es: 'Las tripulaciones de larga duración acuerdan horarios y zonas personales para evitar estos roces.', en: 'Long-duration crews agree on schedules and personal spaces to avoid this friction.' },
    options: [
      { id: 'rules', risk: 'safe', label: { es: 'Acordar reglas de convivencia', en: 'Agree on house rules' }, detail: { es: 'Media hora de reunión; el ánimo se mantiene.', en: 'A short meeting; morale holds.' } },
      { id: 'ignore', risk: 'medium', label: { es: 'Dejarlo pasar', en: 'Let it slide' }, detail: { es: '−5% de ánimo a todos.', en: '−5% morale for everyone.' } },
    ],
  },
  pilotEngineer: {
    tier: 'easy', hazard: tier.easy,
    title: { es: 'Malentendido técnico', en: 'Technical misunderstanding' },
    text: { es: 'El piloto ajustó la trayectoria sin avisar a la ingeniera y se gastó energía de más.', en: 'The pilot adjusted the trajectory without telling the engineer, and extra power was used.' },
    fact: { es: 'En el control de misión real, cada maniobra se anuncia y se confirma por radio antes de ejecutarse.', en: 'In real Mission Control every maneuver is announced and confirmed over the loop before execution.' },
    options: [
      { id: 'protocol', risk: 'safe', label: { es: 'Exigir aviso antes de cada maniobra', en: 'Require a callout before every maneuver' }, detail: { es: 'Sin más desperdicio.', en: 'No more waste.' } },
      { id: 'ignore', risk: 'medium', label: { es: 'No es para tanto', en: 'It’s not a big deal' }, detail: { es: 'Hoy rinde menos la energía.', en: 'Power runs a bit short today.' } },
    ],
  },
  // ---------- Intermediate: clashing priorities ----------
  scienceVsSafety: {
    tier: 'mid', hazard: tier.mid,
    title: { es: 'Ciencia contra seguridad', en: 'Science versus safety' },
    text: { es: 'La especialista quiere dejar los sensores encendidos en una zona inestable; el capitán quiere apagarlos para ahorrar energía.', en: 'The specialist wants the sensors on in an unstable zone; the captain wants them off to save power.' },
    fact: { es: 'Los directores de vuelo equilibran el valor científico contra el riesgo en cada decisión.', en: 'Flight directors weigh science value against risk in every decision.' },
    options: [
      { id: 'science', risk: 'risky', label: { es: 'Apoyar a la especialista', en: 'Back the specialist' }, detail: { es: '+ciencia, pero sube el estrés del capitán.', en: '+science, but the captain’s stress rises.' } },
      { id: 'captain', risk: 'safe', label: { es: 'Apoyar al capitán', en: 'Back the captain' }, detail: { es: 'Pierdes la ciencia del turno.', en: 'You lose this turn’s science.' } },
    ],
  },
  enginesHot: {
    tier: 'mid', hazard: tier.mid,
    title: { es: 'Motores al límite', en: 'Engines at the limit' },
    text: { es: 'El piloto exige máxima potencia; la ingeniera advierte que los motores se sobrecalientan. La discusión sube de tono.', en: 'The pilot demands full thrust; the engineer warns the engines are overheating. The argument heats up.' },
    fact: { es: 'Escuchar a los ingenieros es la gran lección de Challenger y Columbia.', en: 'Listening to engineers is the great lesson of Challenger and Columbia.' },
    options: [
      { id: 'engineer', risk: 'safe', label: { es: 'Dar la razón a la ingeniera', en: 'Side with the engineer' }, detail: { es: 'Motores a salvo; el piloto se molesta.', en: 'Engines safe; the pilot is annoyed.' } },
      { id: 'pilot', risk: 'risky', label: { es: 'Dar la razón al piloto', en: 'Side with the pilot' }, detail: { es: 'La ingeniera, frustrada, repara peor un turno.', en: 'The frustrated engineer repairs worse for a turn.' } },
    ],
  },
  fatigueIgnored: {
    tier: 'mid', hazard: tier.mid,
    title: { es: 'El médico exige descanso', en: 'The doctor demands rest' },
    text: { es: 'El médico pide un turno de descanso obligatorio por falta de sueño; el capitán no quiere retrasar el cronograma.', en: 'The doctor orders a mandatory rest shift for lack of sleep; the captain doesn’t want to slip the schedule.' },
    fact: { es: 'La NASA vigila el sueño de cada astronauta: el cansancio es una de las principales causas de errores.', en: 'NASA tracks every astronaut’s sleep: fatigue is a leading cause of errors.' },
    options: [
      { id: 'rest', risk: 'safe', label: { es: 'Descanso obligatorio', en: 'Mandatory rest' }, detail: { es: 'Sin ciencia hoy; todos recuperan energía.', en: 'No science today; everyone recovers.' } },
      { id: 'push', risk: 'risky', label: { es: 'Seguir operando', en: 'Keep operating' }, detail: { es: 'Baja la salud y sube el riesgo de error humano.', en: 'Health drops and human error risk rises.' } },
    ],
  },
  thirdQuarter: {
    tier: 'mid', hazard: tier.mid,
    title: { es: 'Síndrome del tercer cuarto', en: 'Third-quarter syndrome' },
    text: { es: 'A mitad de la misión, la monotonía y el retraso con la Tierra provocan apatía general.', en: 'Halfway through, monotony and the delay with Earth bring general apathy.' },
    fact: { es: 'Estudios en la Antártida y en análogos espaciales muestran una caída de ánimo en el tercer cuarto de las misiones largas.', en: 'Studies in Antarctica and space analogs show a morale dip in the third quarter of long missions.' },
    options: [
      { id: 'call', risk: 'safe', label: { es: 'Llamada con la Tierra y recreación', en: 'Call Earth and take a break' }, detail: { es: 'Media ciencia hoy; se acaba la apatía.', en: 'Half science today; the apathy ends.' } },
      { id: 'ignore', risk: 'risky', label: { es: 'Seguir con el plan', en: 'Stick to the plan' }, detail: { es: '−20% de rendimiento hasta que tomen un respiro.', en: '−20% performance until they get a break.' } },
    ],
  },
  // ---------- Hard: command crises ----------
  disobedience: {
    tier: 'hard', hazard: tier.hard,
    title: { es: 'Desobediencia científica', en: 'Scientific disobedience' },
    text: { es: 'La especialista ignoró la alerta de radiación para terminar un experimento crítico.', en: 'The specialist ignored a radiation alert to finish a critical experiment.' },
    fact: { es: 'Cada astronauta tiene un límite de radiación para toda su carrera; superarlo termina su vida de vuelo.', en: 'Every astronaut has a career radiation limit; exceeding it ends their flying career.' },
    options: [
      { id: 'order', risk: 'safe', label: { es: 'Ordenar que vuelva al refugio', en: 'Order her back to shelter' }, detail: { es: 'Se pierde el experimento, nadie se daña.', en: 'The experiment is lost, nobody is hurt.' } },
      { id: 'let', risk: 'risky', label: { es: 'Dejar que termine', en: 'Let her finish' }, detail: { es: '+ciencia; ella recibe radiación y el médico queda ocupado.', en: '+science; she takes radiation and the doctor is tied up.' } },
    ],
  },
  deadlock: {
    tier: 'hard', hazard: tier.hard,
    title: { es: 'Bloqueo en plena emergencia', en: 'Deadlock mid-emergency' },
    text: { es: 'Piloto e ingeniera dan órdenes opuestas: reorientar la nave o entrar en modo seguro. El tiempo corre.', en: 'Pilot and engineer give opposite orders: reorient the craft or go to safe mode. The clock is ticking.' },
    fact: { es: 'Por eso existe una sola voz de mando: el director de vuelo tiene la última palabra en una emergencia.', en: 'That’s why there is a single voice of command: the flight director has the final word in an emergency.' },
    options: [
      { id: 'safe', risk: 'safe', label: { es: 'Decidir tú: modo seguro', en: 'You decide: safe mode' }, detail: { es: 'Sin ciencia hoy, la nave queda protegida.', en: 'No science today; the craft is protected.' } },
      { id: 'argue', risk: 'risky', label: { es: 'Dejar que lo resuelvan', en: 'Let them sort it out' }, detail: { es: 'Se pierde el turno completo sin defensas.', en: 'The whole turn is lost with no defenses.' } },
    ],
  },
  authority: {
    tier: 'hard', hazard: tier.hard,
    title: { es: 'Crisis de autoridad', en: 'Authority crisis' },
    text: { es: 'El médico declara a la tripulación no apta por agotamiento y radiación, e intenta anular las órdenes del capitán.', en: 'The doctor declares the crew unfit from exhaustion and radiation, and tries to override the captain.' },
    fact: { es: 'En vuelos reales el médico de vuelo puede recomendar suspender actividades, pero la decisión final la toma el director de vuelo.', en: 'On real flights the flight surgeon can recommend stopping activities, but the flight director makes the final call.' },
    options: [
      { id: 'mediate', risk: 'medium', label: { es: 'Mediar y repartir el trabajo', en: 'Mediate and share the load' }, detail: { es: 'Usa el turno en mediación; se restablece el mando.', en: 'The turn goes to mediation; command is restored.' } },
      { id: 'doctor', risk: 'safe', label: { es: 'Dar la razón al médico', en: 'Side with the doctor' }, detail: { es: 'Dos días a media ciencia, la tripulación se recupera.', en: 'Two half-science days; the crew recovers.' } },
      { id: 'captain', risk: 'risky', label: { es: 'Respaldar al capitán', en: 'Back the captain' }, detail: { es: 'Sigues, pero la tripulación queda dividida.', en: 'You carry on, but the crew stays divided.' } },
    ],
  },
  panic: {
    tier: 'hard', hazard: tier.hard,
    title: { es: 'Pánico en cabina', en: 'Panic in the cabin' },
    text: { es: 'Radiación alta, pocos recursos y estrés máximo: la tripulación deja de comunicarse y cada quien actúa por su cuenta.', en: 'High radiation, few resources and peak stress: the crew stops talking and everyone acts alone.' },
    fact: { es: 'Los protocolos de la NASA piden detener todo, asegurar la nave y descansar antes de volver a operar.', en: 'NASA protocols call for stopping everything, safing the craft and resting before operating again.' },
    options: [
      { id: 'safe', risk: 'safe', label: { es: 'Modo seguro y descanso inmediato', en: 'Safe mode and rest right now' }, detail: { es: 'Sin ciencia hoy; se evita el colapso.', en: 'No science today; collapse is avoided.' } },
      { id: 'push', risk: 'risky', label: { es: 'Intentar seguir', en: 'Try to carry on' }, detail: { es: 'Castigo fuerte a salud, energía y ciencia por 2 días.', en: 'Heavy hit to health, energy and science for 2 days.' } },
    ],
  },
}
