// Surface exploration with NASA-style vehicles (models: NASA 3D Resources, see assets/modelos/nasa).
// The player picks where the rover drives on a map (pos: 0–100, the lander sits at 50,50; 100 units = 10 km).
// Each site gives a rock sample; events below are based on things that really happened.

export const SITES = {
  mars: [
    { pos: [36, 38], risk: 'safe', sample: 'clay', es: 'Delta del cráter Jezero', en: 'Jezero crater delta', fact: { es: 'Hace 3500 millones de años aquí desembocaba un río en un lago.', en: '3.5 billion years ago a river flowed into a lake here.' } },
    { pos: [62, 63], risk: 'risky', sample: 'olivine', es: 'Dunas de Séítah', en: 'Séítah dunes', fact: { es: 'Arena tan suave que Perseverance la rodeó para no atascarse.', en: 'Sand so soft that Perseverance went around it to avoid getting stuck.' } },
    { pos: [20, 24], risk: 'medium', sample: 'pebbles', es: 'Cauce del valle Neretva', en: 'Neretva Vallis channel', fact: { es: 'Un antiguo cauce de río que alimentaba el lago de Jezero.', en: 'An ancient river channel that fed Jezero’s lake.' } },
    { pos: [72, 28], risk: 'medium', sample: 'layers', es: 'Borde del cráter Belva', en: 'Belva crater rim', fact: { es: 'Sus paredes muestran capas de roca como páginas de un libro.', en: 'Its walls show rock layers like pages of a book.' } },
    { pos: [28, 72], risk: 'safe', sample: 'sulfate', es: 'Colina Kodiak', en: 'Kodiak butte', fact: { es: 'Una colina de sedimentos que guarda la historia del lago.', en: 'A sediment butte that holds the lake’s history.' } },
    { pos: [86, 78], risk: 'risky', sample: 'ancient', es: 'Borde exterior de Jezero', en: 'Jezero outer rim', fact: { es: 'Rocas de las más antiguas que ha visitado un rover.', en: 'Some of the oldest rocks a rover has ever visited.' } },
  ],
  moon: [
    { pos: [56, 26], risk: 'medium', sample: 'breccia', es: 'Borde del cráter Shackleton', en: 'Shackleton crater rim', fact: { es: 'Su fondo no ha visto la luz del Sol en miles de millones de años.', en: 'Its floor hasn’t seen sunlight in billions of years.' } },
    { pos: [26, 40], risk: 'safe', sample: 'anorthosite', es: 'Cresta de Malapert', en: 'Malapert ridge', fact: { es: 'Desde aquí casi siempre se ve la Tierra: buen sitio para antenas.', en: 'Earth is almost always visible from here: a good antenna site.' } },
    { pos: [76, 56], risk: 'risky', sample: 'ice', es: 'Cráter Haworth', en: 'Haworth crater', fact: { es: 'Una trampa fría donde podría haber hielo de agua.', en: 'A cold trap where water ice may hide.' } },
    { pos: [38, 76], risk: 'medium', sample: 'glass', es: 'Macizo Mons Mouton', en: 'Mons Mouton massif', fact: { es: 'Una meseta elegida para explorar el polo sur lunar.', en: 'A plateau chosen to explore the lunar south pole.' } },
    { pos: [66, 84], risk: 'safe', sample: 'regolith', es: 'Llanura de regolito', en: 'Regolith plain', fact: { es: 'El polvo lunar es filoso como vidrio: desgasta trajes y ruedas.', en: 'Lunar dust is sharp like glass: it wears suits and wheels.' } },
  ],
}

const tier = { es: 'Exploración', en: 'Exploration' }

export const EXPLORE_EVENTS = {
  roverStuck: {
    explore: true, hazard: tier,
    title: { es: 'Rover atascado', en: 'Rover stuck' },
    text: { es: 'Las ruedas del rover se hundieron en arena suave y giran sin avanzar.', en: 'The rover’s wheels sank into soft sand and spin without moving.' },
    fact: { es: 'En 2009 el rover Spirit quedó atrapado en arena en Marte y nunca pudo salir.', en: 'In 2009 the Spirit rover got trapped in Martian sand and never got out.' },
    options: [
      { id: 'slow', risk: 'safe', label: { es: 'Mover las ruedas poco a poco', en: 'Wiggle the wheels slowly' }, detail: { es: 'Tarda dos días, pero casi siempre funciona.', en: 'Takes two days, but almost always works.' } },
      { id: 'force', risk: 'risky', label: { es: 'Acelerar a fondo', en: 'Full throttle' }, detail: { es: 'Puede salir hoy… o romper una rueda.', en: 'It may get out today… or break a wheel.' } },
    ],
  },
  leopardRock: {
    explore: true, dests: ['mars'], hazard: tier,
    title: { es: 'Una roca con manchas de leopardo', en: 'A rock with leopard spots' },
    text: { es: 'El rover encontró una roca rojiza con manchas claras de borde oscuro. En la Tierra, algo así puede formarse con ayuda de microbios.', en: 'The rover found a reddish rock with light spots ringed in dark. On Earth, something like this can form with help from microbes.' },
    fact: { es: 'En 2024 Perseverance encontró la roca “Cheyava Falls” con manchas así: una posible señal de vida antigua que aún se estudia.', en: 'In 2024 Perseverance found the “Cheyava Falls” rock with spots like these: a possible sign of ancient life still under study.' },
    options: [
      { id: 'core', risk: 'medium', label: { es: 'Perforar y guardar una muestra', en: 'Drill and cache a sample' }, detail: { es: 'Mucha ciencia, pero el rover se queda todo el día.', en: 'Lots of science, but the rover stays all day.' } },
      { id: 'photo', risk: 'safe', label: { es: 'Fotografiarla y seguir', en: 'Photograph it and move on' }, detail: { es: 'Un poco de ciencia, sin perder tiempo.', en: 'A little science, no time lost.' } },
    ],
  },
  scoutFlight: {
    explore: true, needsHeli: true, hazard: tier,
    title: { es: 'Vuelo de reconocimiento', en: 'Scouting flight' },
    text: { es: 'El helicóptero puede volar adelante del rover para buscar el camino más seguro, pero hay ráfagas de viento.', en: 'The helicopter can fly ahead of the rover to find the safest path, but the wind is gusting.' },
    fact: { es: 'Ingenuity hizo 72 vuelos en Marte (2021–2024); se planeaban solo 5.', en: 'Ingenuity flew 72 times on Mars (2021–2024); only 5 were planned.' },
    options: [
      { id: 'fly', risk: 'medium', label: { es: 'Volar de todos modos', en: 'Fly anyway' }, detail: { es: 'Encuentra una ruta con buenos sitios (+ciencia los próximos días).', en: 'Finds a route with good sites (+science in the next days).' } },
      { id: 'wait', risk: 'safe', label: { es: 'Esperar a que calme el viento', en: 'Wait for the wind to calm' }, detail: { es: 'Sin riesgo, sin ruta nueva.', en: 'No risk, no new route.' } },
    ],
  },
  surfaceStorm: {
    explore: true, dests: ['mars'], hazard: tier,
    title: { es: 'Tormenta en la superficie', en: 'Storm at the surface' },
    text: { es: 'Un frente de polvo avanza hacia el rover. Si lo alcanza, cubrirá sus cámaras.', en: 'A dust front is moving toward the rover. If it hits, it will cover the cameras.' },
    fact: { es: 'Los remolinos de polvo de Marte llegan a medir kilómetros de alto.', en: 'Martian dust devils can be kilometers tall.' },
    options: [
      { id: 'park', risk: 'safe', label: { es: 'Estacionar y esperar', en: 'Park and wait' }, detail: { es: 'Se pierde un día de exploración.', en: 'One exploration day is lost.' } },
      { id: 'race', risk: 'risky', label: { es: 'Adelantarse a la tormenta', en: 'Outrun the storm' }, detail: { es: 'Llegas al siguiente sitio… si no te alcanza.', en: 'You reach the next site… if it doesn’t catch you.' } },
    ],
  },
  regolithJam: {
    explore: true, dests: ['moon'], hazard: tier,
    title: { es: 'Polvo lunar en las ruedas', en: 'Moon dust in the wheels' },
    text: { es: 'El regolito, filoso como vidrio molido, se metió en las articulaciones del rover.', en: 'The regolith, sharp like ground glass, got into the rover’s joints.' },
    fact: { es: 'Los astronautas del Apolo vieron cómo el polvo lunar dañaba sellos y trajes en solo tres días.', en: 'Apollo astronauts saw lunar dust damage seals and suits in just three days.' },
    options: [
      { id: 'clean', risk: 'safe', label: { es: 'Limpiar con cuidado', en: 'Clean it carefully' }, detail: { es: 'Gasta una refacción si hay; si no, un día de trabajo.', en: 'Uses a spare part if available; otherwise a day of work.' } },
      { id: 'ignore', risk: 'risky', label: { es: 'Seguir así', en: 'Keep going' }, detail: { es: 'Las ruedas pueden trabarse en cualquier momento.', en: 'The wheels may lock up at any time.' } },
    ],
  },
  lavaTube: {
    explore: true, dests: ['moon'], hazard: tier,
    title: { es: 'La entrada a un tubo de lava', en: 'A lava tube entrance' },
    text: { es: 'Las cámaras muestran un pozo oscuro y profundo: la entrada a un túnel de lava antiguo, perfecto para futuras bases.', en: 'The cameras show a deep, dark pit: the entrance to an ancient lava tunnel, perfect for future bases.' },
    fact: { es: 'La sonda LRO ha encontrado más de 200 pozos así en la Luna.', en: 'The LRO probe has found more than 200 pits like this on the Moon.' },
    options: [
      { id: 'probe', risk: 'risky', label: { es: 'Bajar el rover al borde', en: 'Drive the rover to the edge' }, detail: { es: 'Gran descubrimiento… si el borde aguanta.', en: 'A great discovery… if the edge holds.' } },
      { id: 'map', risk: 'safe', label: { es: 'Mapearlo desde lejos', en: 'Map it from afar' }, detail: { es: 'Algo de ciencia y el rover a salvo.', en: 'Some science and the rover stays safe.' } },
    ],
  },
}

// Rock samples: one per site, plus a few that only events can give. Collect SAMPLE_GOAL for a special ending.
export const SAMPLE_GOAL = 5
export const SAMPLES = {
  clay: { color: '#c98b5b', name: { es: 'Arcilla del delta', en: 'Delta clay' }, fact: { es: 'Las arcillas solo se forman con agua: guardan pistas de un Marte húmedo.', en: 'Clays only form with water: they hold clues to a wet Mars.' } },
  olivine: { color: '#7d8f3c', name: { es: 'Olivina', en: 'Olivine' }, fact: { es: 'Perseverance encontró en Séítah roca rica en olivina, nacida de magma que se enfrió despacio.', en: 'Perseverance found olivine-rich rock at Séítah, born from slowly cooling magma.' } },
  pebbles: { color: '#a77a58', name: { es: 'Guijarros de río', en: 'River pebbles' }, fact: { es: 'Piedras redondeadas por el agua: en 2012 Curiosity halló guijarros así, prueba de un antiguo río.', en: 'Stones rounded by water: in 2012 Curiosity found pebbles like these, proof of an ancient stream.' } },
  layers: { color: '#b4664a', name: { es: 'Roca en capas', en: 'Layered rock' }, fact: { es: 'Cada capa es un capítulo: lagos que se llenaron y se secaron una y otra vez.', en: 'Each layer is a chapter: lakes that filled and dried again and again.' } },
  sulfate: { color: '#e8d36a', name: { es: 'Cristales de azufre', en: 'Sulfur crystals' }, fact: { es: 'En 2024 Curiosity aplastó una roca y encontró azufre puro, algo que nadie esperaba en Marte.', en: 'In 2024 Curiosity crushed a rock and found pure sulfur, something nobody expected on Mars.' } },
  ancient: { color: '#6b5148', name: { es: 'Megabrecha', en: 'Megabreccia' }, fact: { es: 'Bloques de más de 3900 millones de años arrojados por impactos gigantes.', en: 'Blocks more than 3.9 billion years old thrown out by giant impacts.' } },
  leopard: { color: '#d0553a', event: true, name: { es: 'Roca “manchas de leopardo”', en: '“Leopard spots” rock' }, fact: { es: 'Como Cheyava Falls (2024): una posible huella de vida antigua que aún se estudia.', en: 'Like Cheyava Falls (2024): a possible trace of ancient life still under study.' } },
  meteorite: { color: '#8a8f99', event: true, name: { es: 'Meteorito de hierro', en: 'Iron meteorite' }, fact: { es: 'En 2005 Opportunity encontró “Heat Shield Rock”, el primer meteorito hallado en otro planeta.', en: 'In 2005 Opportunity found “Heat Shield Rock”, the first meteorite ever found on another planet.' } },
  air: { color: '#9ec9d6', event: true, name: { es: 'Aire con metano', en: 'Methane air sample' }, fact: { es: 'Curiosity midió picos de metano en el cráter Gale. En la Tierra casi todo el metano lo producen seres vivos.', en: 'Curiosity measured methane spikes in Gale crater. On Earth, nearly all methane is made by living things.' } },
  breccia: { color: '#8d8a86', name: { es: 'Brecha de impacto', en: 'Impact breccia' }, fact: { es: 'Roca hecha de fragmentos soldados por el calor de impactos antiguos.', en: 'Rock made of fragments welded together by the heat of ancient impacts.' } },
  anorthosite: { color: '#e9e6dc', name: { es: 'Anortosita', en: 'Anorthosite' }, fact: { es: 'La roca blanca de las tierras altas; la “Genesis Rock” del Apolo 15 era de este tipo.', en: 'The white rock of the highlands; Apollo 15’s “Genesis Rock” is this kind.' } },
  ice: { color: '#a8dcf0', name: { es: 'Hielo de agua', en: 'Water ice' }, fact: { es: 'En 2009 la sonda LCROSS chocó contra el cráter Cabeus y levantó vapor de agua: había hielo.', en: 'In 2009 the LCROSS probe crashed into Cabeus crater and kicked up water vapor: there was ice.' } },
  glass: { color: '#5a7a6a', name: { es: 'Perlas de vidrio', en: 'Glass beads' }, fact: { es: 'Gotitas de roca derretida por impactos; algunas guardan agua en su interior.', en: 'Droplets of rock melted by impacts; some hold water inside.' } },
  regolith: { color: '#a3a3a3', name: { es: 'Regolito', en: 'Regolith' }, fact: { es: 'Roca molida por meteoritos durante miles de millones de años. Filosa como vidrio.', en: 'Rock ground down by meteorites for billions of years. Sharp as glass.' } },
  basalt: { color: '#4a4d55', event: true, name: { es: 'Basalto del tubo de lava', en: 'Lava tube basalt' }, fact: { es: 'Lava solidificada: los “mares” oscuros de la Luna son basalto.', en: 'Solidified lava: the Moon’s dark “seas” are basalt.' } },
  flash: { color: '#f2c94c', event: true, name: { es: 'Vidrio de un cráter nuevo', en: 'Fresh crater glass' }, fact: { es: 'LRO ha fotografiado cientos de cráteres que se formaron en los últimos años.', en: 'LRO has photographed hundreds of craters that formed in recent years.' } },
  frost: { color: '#d7f0ff', event: true, name: { es: 'Escarcha de sombra', en: 'Shadow frost' }, fact: { es: 'El instrumento LAMP de LRO encontró señales de escarcha en cráteres que nunca ven el Sol.', en: 'LRO’s LAMP instrument found signs of frost in craters that never see the Sun.' } },
}
export const SAMPLES_FOR = {
  mars: ['clay', 'olivine', 'pebbles', 'layers', 'sulfate', 'ancient', 'leopard', 'meteorite', 'air'],
  moon: ['breccia', 'anorthosite', 'ice', 'glass', 'regolith', 'basalt', 'flash', 'frost'],
}

// Rover missions: an event puts a special site on the map; the rover has QUEST_DAYS to get there
export const QUEST_DAYS = 3
export const QUEST_SITES = {
  brightSpot: { pos: [84, 44], risk: 'medium', sci: 30, sample: 'meteorite', es: 'Roca metálica brillante', en: 'Shiny metal rock', fact: { es: 'Es hierro y níquel: un meteorito que cayó hace millones de años.', en: 'It’s iron and nickel: a meteorite that fell millions of years ago.' } },
  methaneSpike: { pos: [14, 56], risk: 'medium', sci: 28, sample: 'air', es: 'Fuente del metano', en: 'Methane source', fact: { es: 'El metano sale de una grieta. ¿Geología… o algo vivo bajo el suelo? La muestra viajará a la Tierra.', en: 'The methane seeps from a crack. Geology… or something alive underground? The sample will travel to Earth.' } },
  heliLost: { pos: [52, 88], risk: 'medium', sci: 10, es: 'Aterrizaje de Ingenuity', en: 'Ingenuity’s landing spot', fact: { es: 'El rover sirve de antena: el helicóptero vuelve a hablar con la nave.', en: 'The rover acts as a relay: the helicopter talks to the ship again.' } },
  impactFlash: { pos: [88, 30], risk: 'medium', sci: 30, sample: 'flash', es: 'Cráter recién nacido', en: 'Newborn crater', fact: { es: 'Un cráter de pocos días: el suelo debajo del polvo nunca había visto el espacio.', en: 'A crater only days old: the ground under the dust had never seen space.' } },
  hydrogenSignal: { pos: [12, 62], risk: 'risky', sci: 32, sample: 'frost', es: 'Sombra con hidrógeno', en: 'Hydrogen shadow', fact: { es: 'El rover entra a la sombra eterna a −230 °C y raspa la escarcha.', en: 'The rover enters eternal shadow at −230 °C and scrapes up the frost.' } },
}

const questEvent = (dests, title, text, fact, extra = {}) => ({
  explore: true, quest: true, dests, hazard: tier, title, text, fact,
  options: [
    { id: 'go', risk: 'medium', label: { es: 'Mandar el rover', en: 'Send the rover' }, detail: { es: `Aparece en el mapa de la bitácora: tienes ${QUEST_DAYS} días para llegar.`, en: `It appears on the logbook map: you have ${QUEST_DAYS} days to get there.` } },
    extra.skip || { id: 'skip', risk: 'safe', label: { es: 'Anotarlo para otra misión', en: 'Log it for another mission' }, detail: { es: 'El rover sigue su plan.', en: 'The rover keeps to its plan.' } },
  ],
  ...extra.more,
})

export const QUEST_EVENTS = {
  brightSpot: questEvent(['mars'],
    { es: 'Algo brilla en el horizonte', en: 'Something shines on the horizon' },
    { es: 'La cámara del orbitador captó una roca que brilla como metal, a unos kilómetros del rover. Si llegas antes de que el polvo la cubra, podrás estudiarla.', en: 'The orbiter’s camera caught a rock shining like metal, a few kilometers from the rover. Get there before dust covers it and you can study it.' },
    { es: 'En 2005 Opportunity encontró “Heat Shield Rock”, el primer meteorito hallado en otro planeta.', en: 'In 2005 Opportunity found “Heat Shield Rock”, the first meteorite ever found on another planet.' }),
  methaneSpike: questEvent(['mars'],
    { es: 'Un pico de metano', en: 'A methane spike' },
    { es: 'Los sensores detectan metano diez veces arriba de lo normal, viniendo del oeste. El pico no durará mucho.', en: 'The sensors detect methane ten times above normal, coming from the west. The spike won’t last long.' },
    { es: 'En 2019 Curiosity midió el pico de metano más alto de su misión en el cráter Gale. Su origen sigue siendo un misterio.', en: 'In 2019 Curiosity measured the biggest methane spike of its mission in Gale crater. Its source is still a mystery.' }),
  heliLost: questEvent(['mars'],
    { es: 'Ingenuity no contesta', en: 'Ingenuity isn’t answering' },
    { es: 'El helicóptero aterrizó lejos para cargar sus baterías y dejó de comunicarse. Sin el rover cerca que le sirva de antena, se quedará en silencio para siempre.', en: 'The helicopter landed far away to recharge and stopped answering. Without the rover nearby to relay its signal, it will go silent forever.' },
    { es: 'Ingenuity hablaba con la Tierra a través de Perseverance. En 2024, tras su vuelo 72, perdió contacto por dos días.', en: 'Ingenuity talked to Earth through Perseverance. In 2024, after its 72nd flight, it lost contact for two days.' },
    { skip: { id: 'skip', risk: 'risky', label: { es: 'Esperar a que vuelva solo', en: 'Wait for it to come back alone' }, detail: { es: 'Quizá se reconecte… quizá no.', en: 'Maybe it reconnects… maybe not.' } }, more: { needsHeli: true } }),
  impactFlash: questEvent(['moon'],
    { es: 'Un destello en la Luna', en: 'A flash on the Moon' },
    { es: 'Un telescopio en la Tierra vio un destello cerca de la base: un meteorito acaba de chocar. Hay un cráter recién hecho a pocos kilómetros.', en: 'A telescope on Earth saw a flash near the base: a meteorite just hit. There is a brand-new crater a few kilometers away.' },
    { es: 'Desde 2005 el programa de monitoreo de impactos de la NASA ha registrado cientos de destellos en la Luna.', en: 'Since 2005 NASA’s lunar impact monitoring program has recorded hundreds of flashes on the Moon.' }),
  hydrogenSignal: questEvent(['moon'],
    { es: 'Señal de hidrógeno', en: 'A hydrogen signal' },
    { es: 'El espectrómetro de neutrones marca hidrógeno en una sombra cercana: puede ser hielo. Pero la sombra es tan fría que las baterías sufren.', en: 'The neutron spectrometer shows hydrogen in a nearby shadow: it may be ice. But the shadow is so cold the batteries suffer.' },
    { es: 'En 1998 Lunar Prospector detectó hidrógeno en los polos de la Luna: la primera pista de hielo lunar.', en: 'In 1998 Lunar Prospector detected hydrogen at the Moon’s poles: the first hint of lunar ice.' }),
}
Object.assign(EXPLORE_EVENTS, QUEST_EVENTS)

// ---- Map helpers (shared by the game logic, the logbook map and the 3D surface) ----
export const LANDING = [50, 50]
export const posOf = (destId, x, at) => (at === 'q' ? (x.quest ? QUEST_SITES[x.quest.id].pos : LANDING) : at == null || at < 0 ? LANDING : SITES[destId][at].pos)
export const distKm = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) / 10
// Up to 3 places worth driving to next (closest unvisited first), plus the rover mission's site if one is open
export function siteChoices(destId, x) {
  const here = x.pos || LANDING
  const list = SITES[destId].map((s, i) => ({ i, s, d: distKm(here, s.pos), seen: x.visited.includes(i) })).filter((c) => c.i !== x.at)
  list.sort((a, b) => (a.seen - b.seen) || (a.d - b.d))
  const out = list.slice(0, 3).map((c) => ({ key: c.i, site: c.s, km: c.d, seen: c.seen, risk: c.s.risk }))
  if (x.quest) { const q = QUEST_SITES[x.quest.id]; out.unshift({ key: 'q', site: q, km: distKm(here, q.pos), seen: false, risk: q.risk, quest: true }) }
  return out
}
// Where the rover goes today: the player's pick if it's still valid, otherwise the best choice
export function exploreTarget(destId, x, task) {
  const raw = (task || '').split(':')[1]
  const choices = siteChoices(destId, x)
  const want = raw === 'q' ? 'q' : raw != null && raw !== '' ? Number(raw) : null
  return (choices.find((c) => c.key === want) || choices[0]).key
}
export const SITE_SCIENCE = { safe: 10, medium: 15, risky: 22 }
export const SITE_STUCK = { safe: 0.04, medium: 0.1, risky: 0.2 }
