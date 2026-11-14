// Mission events. Each one is based on a real hazard (research/02, 03 and 07).
// risk: 'safe' | 'medium' | 'risky' is shown on every option so the player sees the trade-off.
export const EVENTS = {
  solarStorm: {
    hazard: { es: 'Radiación', en: 'Radiation' },
    title: { es: 'Tormenta solar en camino', en: 'Solar storm incoming' },
    text: { es: 'Los satélites de clima espacial detectan una eyección del Sol. Llega en unas horas.', en: 'Space-weather satellites detect an eruption from the Sun. It arrives in a few hours.' },
    fact: { es: 'La NASA aplica ALARA: exposición tan baja como sea razonablemente posible. El agua y el combustible protegen mejor que el plomo.', en: 'NASA follows ALARA: exposure as low as reasonably achievable. Water and propellant shield better than lead.' },
    options: [
      { id: 'shelter', risk: 'safe', label: { es: 'Refugio y modo seguro', en: 'Shelter and safe mode' }, detail: { es: 'Sin ciencia hoy, casi sin radiación.', en: 'No science today, almost no radiation.' } },
      { id: 'orbit', risk: 'medium', label: { es: 'Cambiar de órbita', en: 'Change orbit' }, detail: { es: 'Gasta 1 tanque y sigues trabajando.', en: 'Spend 1 tank and keep working.' }, needs: 'fuel' },
      { id: 'risk', risk: 'risky', label: { es: 'Arriesgarse y seguir', en: 'Take the risk' }, detail: { es: 'Ciencia completa, pero sube la dosis y se daña la electrónica.', en: 'Full science, but dose rises and electronics degrade.' } },
    ],
  },
  radiationBelt: {
    hazard: { es: 'Radiación', en: 'Radiation' },
    title: { es: 'Entrando al cinturón de radiación', en: 'Entering the radiation belt' },
    text: { es: 'La órbita cruza la zona donde el campo magnético de Júpiter atrapa partículas.', en: 'The orbit crosses the zone where Jupiter’s magnetic field traps particles.' },
    fact: { es: 'Europa Clipper no orbita Europa: la sobrevuela rápido en órbitas alargadas para salir de la radiación.', en: 'Europa Clipper doesn’t orbit Europa: it flies past quickly on long orbits to escape the radiation.' },
    options: [
      { id: 'shelter', risk: 'safe', label: { es: 'Modo seguro', en: 'Safe mode' }, detail: { es: 'Apaga instrumentos: sin ciencia, sin daño.', en: 'Instruments off: no science, no damage.' } },
      { id: 'orbit', risk: 'medium', label: { es: 'Órbita elíptica rápida', en: 'Fast elliptical pass' }, detail: { es: 'Gasta 1 tanque: entras, mides y sales.', en: 'Spend 1 tank: dive in, measure, get out.' }, needs: 'fuel' },
      { id: 'risk', risk: 'risky', label: { es: 'Seguir midiendo', en: 'Keep measuring' }, detail: { es: 'Mucha ciencia, mucho daño a la electrónica.', en: 'Lots of science, heavy electronics damage.' } },
    ],
  },
  micrometeoroid: {
    hazard: { es: 'Ambiente hostil', en: 'Hostile environment' },
    title: { es: 'Impacto de micrometeorito', en: 'Micrometeoroid hit' },
    text: { es: 'Un grano de polvo a decenas de km/s golpeó la nave.', en: 'A dust grain at tens of km/s struck the spacecraft.' },
    fact: { es: 'En 2022 un micrometeorito golpeó un segmento del espejo de Webb, y otro perforó el radiador de la Soyuz MS-22.', en: 'In 2022 a micrometeoroid hit one of Webb’s mirror segments, and another punctured Soyuz MS-22’s radiator.' },
    options: [
      { id: 'repair', risk: 'safe', label: { es: 'Reparar con refacciones', en: 'Repair with spares' }, detail: { es: 'Usa 1 refacción y queda como nueva.', en: 'Uses 1 spare part; good as new.' }, needs: 'spares' },
      { id: 'eva', risk: 'risky', label: { es: 'Caminata espacial para revisar', en: 'Spacewalk to inspect' }, detail: { es: 'Arreglas sin refacción, pero el astronauta se expone.', en: 'Fix it without spares, but the astronaut is exposed.' }, crewedOnly: true },
      { id: 'ignore', risk: 'medium', label: { es: 'Seguir sin reparar', en: 'Carry on unrepaired' }, detail: { es: 'La pieza dañada deja de funcionar.', en: 'The damaged part stops working.' } },
    ],
  },
  co2: {
    hazard: { es: 'Ambiente cerrado', en: 'Closed environment' },
    title: { es: 'Sube el CO₂ en la cabina', en: 'CO₂ rising in the cabin' },
    text: { es: 'Un filtro de aire está fallando: dolor de cabeza y pensamiento lento.', en: 'An air filter is failing: headaches and slow thinking.' },
    fact: { es: 'En el Apolo 13 la tripulación adaptó filtros de CO₂ con cinta, plástico y cartón.', en: 'On Apollo 13 the crew rigged CO₂ filters with tape, plastic and cardboard.' },
    options: [
      { id: 'repair', risk: 'safe', label: { es: 'Cambiar el filtro (refacción)', en: 'Swap the filter (spare)' }, detail: { es: 'Usa 1 refacción.', en: 'Uses 1 spare part.' }, needs: 'spares' },
      { id: 'improvise', risk: 'medium', label: { es: 'Improvisar como el Apolo 13', en: 'Improvise like Apollo 13' }, detail: { es: 'Sale bien si la ingeniera está descansada.', en: 'Works if the engineer is rested.' } },
      { id: 'ignore', risk: 'risky', label: { es: 'Aguantar', en: 'Tough it out' }, detail: { es: 'Baja la salud de todos.', en: 'Everyone’s health drops.' } },
    ],
  },
  medical: {
    hazard: { es: 'Distancia de la Tierra', en: 'Distance from Earth' },
    title: { es: 'Emergencia médica a bordo', en: 'Medical emergency on board' },
    text: { es: 'El médico detecta un coágulo en la vena del cuello de un tripulante.', en: 'The surgeon finds a blood clot in a crew member’s neck vein.' },
    fact: { es: 'En 2020 se trató un coágulo así en la Estación con anticoagulantes, y en 2026 la NASA hizo la primera evacuación médica de la Estación.', en: 'In 2020 such a clot was treated on the ISS with blood thinners, and in 2026 NASA carried out the first ISS medical evacuation.' },
    options: [
      { id: 'treat', risk: 'safe', label: { es: 'Tratar en la enfermería', en: 'Treat in the medical bay' }, detail: { es: 'Funciona si llevas enfermería.', en: 'Works if you brought a medical bay.' }, needs: 'medkit' },
      { id: 'ground', risk: 'medium', label: { es: 'Consultar a la Tierra', en: 'Consult Earth' }, detail: { es: 'Más seguro, pero el retraso de señal cuesta un día de ciencia.', en: 'Safer, but the signal delay costs a science day.' } },
      { id: 'wait', risk: 'risky', label: { es: 'Esperar y vigilar', en: 'Wait and watch' }, detail: { es: 'Puede empeorar.', en: 'It may get worse.' } },
    ],
  },
  conflict: {
    hazard: { es: 'Aislamiento', en: 'Isolation' },
    title: { es: 'Tensión en la tripulación', en: 'Tension in the crew' },
    text: { es: 'Días de encierro: dos tripulantes discuten por el horario del laboratorio.', en: 'Days of confinement: two crew members argue over lab time.' },
    fact: { es: 'En el análogo HERA, los equipos aislados por semanas pierden poco a poco su capacidad de resolver problemas juntos.', en: 'In the HERA analog, crews isolated for weeks gradually lose their ability to solve problems together.' },
    options: [
      { id: 'talk', risk: 'medium', label: { es: 'Mediar la discusión', en: 'Mediate' }, detail: { es: 'Sin costo; mejor si el comandante es diplomático.', en: 'No cost; best with a diplomat commander.' } },
      { id: 'rest', risk: 'safe', label: { es: 'Día libre para todos', en: 'Day off for everyone' }, detail: { es: 'Sube el ánimo, sin ciencia hoy.', en: 'Morale up, no science today.' } },
      { id: 'ignore', risk: 'risky', label: { es: 'Que lo resuelvan solos', en: 'Let them sort it out' }, detail: { es: 'Puede bajar el ánimo de todos.', en: 'Everyone’s morale may drop.' } },
    ],
  },
  gravity: {
    hazard: { es: 'Gravedad', en: 'Gravity' },
    title: { es: 'Adaptación a la nueva gravedad', en: 'Adapting to a new gravity' },
    text: { es: 'Tras días sin peso, la tripulación siente mareo y torpeza al operar en la nueva gravedad.', en: 'After days weightless, the crew feels dizzy and clumsy operating in the new gravity.' },
    fact: { es: 'Una misión a Marte cruza 3 campos de gravedad; el cambio afecta equilibrio, coordinación ojo-mano y orientación.', en: 'A Mars mission crosses 3 gravity fields; each change affects balance, eye-hand coordination and orientation.' },
    options: [
      { id: 'adapt', risk: 'safe', label: { es: 'Dar un día para adaptarse', en: 'Allow a day to adapt' }, detail: { es: 'Sin ciencia hoy; luego todos rinden normal.', en: 'No science today; then everyone performs normally.' } },
      { id: 'push', risk: 'risky', label: { es: 'Trabajar de inmediato', en: 'Work right away' }, detail: { es: 'Ciencia hoy, con riesgo de lesión.', en: 'Science today, with injury risk.' } },
    ],
  },
  dust: {
    hazard: { es: 'Ambiente hostil', en: 'Hostile environment' },
    title: { es: 'Polvo lunar en la cabina', en: 'Lunar dust in the cabin' },
    text: { es: 'Tras salir a la superficie, el polvo afilado se pegó a los trajes y entró al módulo.', en: 'After a moonwalk, sharp dust clung to the suits and got into the module.' },
    fact: { es: 'Harrison Schmitt (Apolo 17) tuvo “fiebre del heno lunar”; en laboratorio, simuladores de polvo mataron hasta 90 % de células de pulmón.', en: 'Harrison Schmitt (Apollo 17) got “lunar hay fever”; in the lab, dust simulants killed up to 90% of lung cells.' },
    options: [
      { id: 'clean', risk: 'safe', label: { es: 'Limpieza a fondo', en: 'Deep clean' }, detail: { es: 'Medio día de ciencia perdido.', en: 'Half a science day lost.' } },
      { id: 'ignore', risk: 'risky', label: { es: 'Seguir trabajando', en: 'Keep working' }, detail: { es: 'Baja la salud de la tripulación.', en: 'Crew health drops.' } },
    ],
  },
  dustStorm: {
    hazard: { es: 'Energía', en: 'Power' },
    title: { es: 'Tormenta de polvo global', en: 'Global dust storm' },
    text: { es: 'Una tormenta cubre Marte y oscurece los paneles solares.', en: 'A storm wraps Mars and darkens the solar panels.' },
    fact: { es: 'En 2018 una tormenta global dejó sin energía al rover Opportunity y terminó su misión.', en: 'In 2018 a global storm cut Opportunity’s power and ended its mission.' },
    options: [
      { id: 'save', risk: 'safe', label: { es: 'Ahorro de energía', en: 'Power saving' }, detail: { es: 'Media ciencia hoy, nada se apaga.', en: 'Half science today, nothing shuts down.' } },
      { id: 'risk', risk: 'risky', label: { es: 'Operación normal', en: 'Normal operations' }, detail: { es: 'Sin baterías suficientes, algo puede fallar.', en: 'Without enough batteries something may fail.' } },
    ],
  },
  delay: {
    hazard: { es: 'Distancia de la Tierra', en: 'Distance from Earth' },
    title: { es: 'Falla sin ayuda de Houston', en: 'A failure with no Houston' },
    text: { es: 'Falla una bomba de enfriamiento. Tu orden tardará demasiado en llegar: quien está allá debe decidir.', en: 'A cooling pump fails. Your order would take too long to arrive: whoever is out there must decide.' },
    fact: { es: 'Con Marte la señal tarda de 4 a 24 min por sentido; con Júpiter, de 33 a 54 min. Las naves y tripulaciones deben ser autónomas.', en: 'To Mars a signal takes 4 to 24 min one way; to Jupiter, 33 to 54 min. Craft and crews must be autonomous.' },
    options: [
      { id: 'auto', risk: 'medium', label: { es: 'Confiar en la autonomía', en: 'Trust autonomy' }, detail: { es: 'Rápido; sale bien si el equipo está en forma.', en: 'Fast; works if the team is in shape.' } },
      { id: 'wait', risk: 'safe', label: { es: 'Esperar instrucciones', en: 'Wait for instructions' }, detail: { es: 'Seguro, pero pierdes el día.', en: 'Safe, but you lose the day.' } },
    ],
  },
  gyro: {
    hazard: { es: 'Falla de la nave', en: 'Spacecraft failure' },
    title: { es: 'Falla un giroscopio', en: 'A gyroscope fails' },
    text: { es: 'La nave no puede apuntar con precisión y entró sola en modo seguro.', en: 'The craft can’t point precisely and dropped into safe mode on its own.' },
    fact: { es: 'Hubble opera con un solo giroscopio desde 2024 para alargar su vida.', en: 'Hubble has run on a single gyroscope since 2024 to extend its life.' },
    options: [
      { id: 'onegyro', risk: 'medium', label: { es: 'Modo de un giroscopio', en: 'One-gyro mode' }, detail: { es: 'Sigues, con 20 % menos ciencia el resto de la misión.', en: 'Carry on with 20% less science for the rest of the mission.' } },
      { id: 'repair', risk: 'safe', label: { es: 'Reconfigurar con refacciones', en: 'Reconfigure with spares' }, detail: { es: 'Usa 1 refacción y todo sigue normal.', en: 'Uses 1 spare part; all normal.' }, needs: 'spares' },
    ],
  },
  opportunity: {
    hazard: { es: 'Oportunidad', en: 'Opportunity' },
    title: { es: 'Oportunidad científica', en: 'Science opportunity' },
    text: { es: 'Los instrumentos detectan algo inesperado justo debajo de la órbita.', en: 'The instruments detect something unexpected right below the orbit.' },
    fact: { es: 'Las misiones reales cambian sus planes cuando aparece algo así: así se descubrieron las plumas de Encélado.', en: 'Real missions change plans when this happens: that’s how Enceladus’s plumes were found.' },
    options: [
      { id: 'study', risk: 'medium', label: { es: 'Desviar los instrumentos', en: 'Point the instruments' }, detail: { es: '+ciencia extra si llevas el instrumento indicado.', en: '+bonus science if you carry the right instrument.' } },
      { id: 'skip', risk: 'safe', label: { es: 'Seguir con el plan', en: 'Stick to the plan' }, detail: { es: 'No pasa nada.', en: 'Nothing happens.' } },
    ],
  },
  // ---------- Unique to the Moon ----------
  shadowIce: {
    hazard: { es: 'Descubrimiento lunar', en: 'Lunar discovery' },
    title: { es: 'Hielo en un cráter de sombra eterna', en: 'Ice in a crater of eternal shadow' },
    text: { es: 'En el Polo Sur hay cráteres donde el Sol no ha entrado en miles de millones de años. Los sensores marcan hielo… a −230 °C.', en: 'At the South Pole there are craters the Sun hasn’t touched in billions of years. Sensors show ice… at −230 °C.' },
    fact: { es: 'El hielo de los polos lunares podría dar agua, oxígeno y combustible a futuras bases de Artemis.', en: 'Polar lunar ice could supply water, oxygen and propellant to future Artemis bases.' },
    options: [
      { id: 'sample', risk: 'risky', label: { es: 'Bajar al cráter por una muestra', en: 'Descend into the crater for a sample' }, detail: { es: '+25 de ciencia, pero el frío extremo puede dañar equipo y trajes.', en: '+25 science, but the extreme cold can damage gear and suits.' }, crewedOnly: true },
      { id: 'scan', risk: 'safe', label: { es: 'Medirlo desde arriba', en: 'Measure it from above' }, detail: { es: '+10 de ciencia si llevas espectrómetro o radar.', en: '+10 science if you carry a spectrometer or radar.' } },
    ],
  },
  earthset: {
    hazard: { es: 'Comunicaciones', en: 'Communications' },
    title: { es: 'La Tierra se oculta tras el horizonte', en: 'Earth sets behind the horizon' },
    text: { es: 'En el Polo Sur lunar la Tierra se ve muy baja: una montaña bloqueará la señal por horas.', en: 'At the lunar South Pole Earth sits very low: a mountain will block the signal for hours.' },
    fact: { es: 'Artemis planea satélites de relevo en órbita lunar para no perder contacto en el Polo Sur.', en: 'Artemis plans relay satellites in lunar orbit so the South Pole never loses contact.' },
    options: [
      { id: 'store', risk: 'safe', label: { es: 'Guardar datos y esperar', en: 'Store data and wait' }, detail: { es: 'Los datos se mandan después; nada se pierde.', en: 'Data is sent later; nothing is lost.' } },
      { id: 'climb', risk: 'risky', label: { es: 'Subir la antena a una cresta', en: 'Carry the antenna up a ridge' }, detail: { es: 'Mantienes el enlace, pero alguien se cansa mucho.', en: 'You keep the link, but someone gets exhausted.' }, crewedOnly: true },
    ],
  },
  // ---------- Unique to Mars ----------
  dustDevil: {
    hazard: { es: 'Sorpresa marciana', en: 'Martian surprise' },
    title: { es: 'Un remolino de polvo pasa junto a la nave', en: 'A dust devil sweeps past' },
    text: { es: 'Un remolino marciano cruza el campo de trabajo… y deja los paneles más limpios que antes.', en: 'A Martian dust devil crosses the work area… and leaves the panels cleaner than before.' },
    fact: { es: 'Los remolinos de polvo limpiaron varias veces los paneles de los rovers Spirit y Opportunity y alargaron sus misiones por años.', en: 'Dust devils cleaned the Spirit and Opportunity rovers’ panels several times, stretching their missions by years.' },
    options: [
      { id: 'enjoy', risk: 'safe', label: { es: '¡Aprovechar la energía extra!', en: 'Use the extra power!' }, detail: { es: '+10 de ciencia hoy.', en: '+10 science today.' } },
    ],
  },
  conjunction: {
    hazard: { es: 'Distancia de la Tierra', en: 'Distance from Earth' },
    title: { es: 'Conjunción solar: el Sol entre Marte y la Tierra', en: 'Solar conjunction: the Sun between Mars and Earth' },
    text: { es: 'El Sol bloquea y distorsiona las señales. Durante días no habrá comunicación confiable.', en: 'The Sun blocks and scrambles the signals. For days there will be no reliable communication.' },
    fact: { es: 'Cada ~26 meses la NASA congela los comandos a sus misiones en Marte unas dos semanas por la conjunción solar.', en: 'Every ~26 months NASA freezes commands to its Mars missions for about two weeks during solar conjunction.' },
    options: [
      { id: 'freeze', risk: 'safe', label: { es: 'Congelar comandos como la NASA', en: 'Freeze commands like NASA does' }, detail: { es: 'Hoy no se transmite nada, pero no se corre riesgo.', en: 'Nothing is transmitted today, but there’s no risk.' } },
      { id: 'push', risk: 'risky', label: { es: 'Transmitir de todos modos', en: 'Transmit anyway' }, detail: { es: 'Datos corruptos pueden confundir a la computadora.', en: 'Corrupted data may confuse the computer.' } },
    ],
  },
  // ---------- Unique to Europa ----------
  plume: {
    hazard: { es: 'Descubrimiento en Europa', en: 'Europa discovery' },
    title: { es: '¡Una pluma de agua sale del hielo!', en: 'A water plume bursts from the ice!' },
    text: { es: 'Los instrumentos ven vapor de agua disparado al espacio desde una grieta. Podría venir del océano oculto.', en: 'Instruments see water vapor shooting into space from a crack. It may come from the hidden ocean.' },
    fact: { es: 'El telescopio Hubble vio posibles plumas en Europa; atravesar una permitiría “probar” el océano sin aterrizar.', en: 'Hubble spotted possible plumes on Europa; flying through one would let a probe “taste” the ocean without landing.' },
    options: [
      { id: 'fly', risk: 'risky', label: { es: 'Atravesar la pluma', en: 'Fly through the plume' }, detail: { es: '+35 de ciencia; gasta 1 tanque y más radiación.', en: '+35 science; costs 1 tank and extra radiation.' }, needs: 'fuel' },
      { id: 'watch', risk: 'safe', label: { es: 'Observarla desde lejos', en: 'Observe it from afar' }, detail: { es: '+12 de ciencia si llevas cámara.', en: '+12 science if you carry a camera.' } },
    ],
  },
  transistor: {
    hazard: { es: 'Radiación', en: 'Radiation' },
    title: { es: 'Transistores que se degradan', en: 'Transistors wearing out' },
    text: { es: 'La radiación de Júpiter está desgastando unos componentes más rápido de lo planeado.', en: 'Jupiter’s radiation is wearing some components faster than planned.' },
    fact: { es: 'En 2024 la NASA descubrió que transistores de Europa Clipper eran menos resistentes a la radiación de lo esperado y ajustó su plan.', en: 'In 2024 NASA found some Europa Clipper transistors were less radiation-hardened than expected and adjusted its plan.' },
    options: [
      { id: 'anneal', risk: 'medium', label: { es: 'Calentar para “curarlos”', en: 'Heat them to “heal” them' }, detail: { es: 'Pierdes medio día, recuperas electrónica.', en: 'Lose half a day, recover electronics.' } },
      { id: 'ignore', risk: 'risky', label: { es: 'Seguir operando', en: 'Keep operating' }, detail: { es: 'La electrónica sigue bajando.', en: 'Electronics keep degrading.' } },
    ],
  },
  // ---------- Crew life (any crewed mission) ----------
  homeMessage: {
    hazard: { es: 'Vida a bordo', en: 'Life on board' },
    title: { es: 'Llegó un video de casa', en: 'A video from home arrived' },
    text: { es: 'Las familias mandaron mensajes para la tripulación.', en: 'The families sent messages to the crew.' },
    fact: { es: 'El apoyo psicológico de la NASA incluye llamadas privadas con la familia: protege el ánimo en misiones largas.', en: 'NASA’s psychological support includes private family calls: it protects morale on long missions.' },
    options: [
      { id: 'watch', risk: 'safe', label: { es: 'Verlo todos juntos', en: 'Watch it together' }, detail: { es: '+15 de ánimo a todos; media mañana sin ciencia.', en: '+15 morale for all; half a morning without science.' } },
      { id: 'later', risk: 'medium', label: { es: 'Guardarlo para la noche', en: 'Save it for tonight' }, detail: { es: '+6 de ánimo, sin perder ciencia.', en: '+6 morale, no science lost.' } },
    ],
  },
  harvest: {
    hazard: { es: 'Vida a bordo', en: 'Life on board' },
    title: { es: 'Primera cosecha a bordo', en: 'First harvest on board' },
    text: { es: 'Las lechugas del mini invernadero están listas.', en: 'The mini-greenhouse lettuce is ready.' },
    fact: { es: 'El experimento Veggie de la Estación Espacial cultiva lechuga y chile: la comida fresca mejora el ánimo y la nutrición.', en: 'The ISS Veggie experiment grows lettuce and chili peppers: fresh food boosts morale and nutrition.' },
    options: [
      { id: 'eat', risk: 'safe', label: { es: '¡A comer ensalada!', en: 'Salad time!' }, detail: { es: '+10 ánimo y +1 día de provisiones.', en: '+10 morale and +1 day of supplies.' } },
    ],
  },
  drill: {
    hazard: { es: 'Entrenamiento', en: 'Training' },
    title: { es: 'Simulacro sorpresa', en: 'Surprise drill' },
    text: { es: 'El comandante propone practicar una fuga de aire, como hace el control de misión con cientos de fallas simuladas.', en: 'The commander proposes rehearsing an air leak, like Mission Control does with hundreds of simulated failures.' },
    fact: { es: 'La NASA entrena a tripulaciones y controladores con simulacros para que una emergencia real se sienta conocida.', en: 'NASA trains crews and controllers with drills so a real emergency feels familiar.' },
    options: [
      { id: 'train', risk: 'safe', label: { es: 'Hacer el simulacro', en: 'Run the drill' }, detail: { es: 'Media ciencia hoy; las emergencias futuras salen mejor.', en: 'Half science today; future emergencies go better.' } },
      { id: 'skip', risk: 'medium', label: { es: 'Hoy no', en: 'Not today' }, detail: { es: 'Sin cambios.', en: 'No change.' } },
    ],
  },
}

// Hidden defects that environmental tests would have caught (team research doc 06)
export const DEFECTS = {
  vacuum: { part: 'camera', text: { es: 'Un instrumento se congeló en el vacío: la prueba de vacío térmico lo habría detectado.', en: 'An instrument froze in vacuum: a thermal vacuum test would have caught it.' } },
  vibration: { part: 'battery', text: { es: 'Una pieza se aflojó en el despegue y dejó de funcionar: la mesa de vibración lo habría detectado.', en: 'A part shook loose at launch and stopped working: the vibration table would have caught it.' } },
  deployment: { part: 'solar', text: { es: 'Un panel solar no terminó de abrirse: la prueba de despliegue lo habría detectado.', en: 'A solar panel didn’t fully unfold: a deployment test would have caught it.' } },
}
