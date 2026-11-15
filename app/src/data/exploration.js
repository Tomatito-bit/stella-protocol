// Surface exploration with NASA-style vehicles (models: NASA 3D Resources, see assets/modelos/nasa).
// Each visit goes to the next real site; events below are based on things that really happened.

export const SITES = {
  mars: [
    { es: 'Delta del cráter Jezero', en: 'Jezero crater delta', fact: { es: 'Hace 3500 millones de años aquí desembocaba un río en un lago.', en: '3.5 billion years ago a river flowed into a lake here.' } },
    { es: 'Dunas de Séítah', en: 'Séítah dunes', fact: { es: 'Arena tan suave que Perseverance la rodeó para no atascarse.', en: 'Sand so soft that Perseverance went around it to avoid getting stuck.' } },
    { es: 'Cauce del valle Neretva', en: 'Neretva Vallis channel', fact: { es: 'Un antiguo cauce de río que alimentaba el lago de Jezero.', en: 'An ancient river channel that fed Jezero’s lake.' } },
    { es: 'Borde del cráter Belva', en: 'Belva crater rim', fact: { es: 'Sus paredes muestran capas de roca como páginas de un libro.', en: 'Its walls show rock layers like pages of a book.' } },
    { es: 'Colina Kodiak', en: 'Kodiak butte', fact: { es: 'Una colina de sedimentos que guarda la historia del lago.', en: 'A sediment butte that holds the lake’s history.' } },
    { es: 'Borde exterior de Jezero', en: 'Jezero outer rim', fact: { es: 'Rocas de las más antiguas que ha visitado un rover.', en: 'Some of the oldest rocks a rover has ever visited.' } },
  ],
  moon: [
    { es: 'Borde del cráter Shackleton', en: 'Shackleton crater rim', fact: { es: 'Su fondo no ha visto la luz del Sol en miles de millones de años.', en: 'Its floor hasn’t seen sunlight in billions of years.' } },
    { es: 'Cresta de Malapert', en: 'Malapert ridge', fact: { es: 'Desde aquí casi siempre se ve la Tierra: buen sitio para antenas.', en: 'Earth is almost always visible from here: a good antenna site.' } },
    { es: 'Cráter Haworth', en: 'Haworth crater', fact: { es: 'Una trampa fría donde podría haber hielo de agua.', en: 'A cold trap where water ice may hide.' } },
    { es: 'Macizo Mons Mouton', en: 'Mons Mouton massif', fact: { es: 'Una meseta elegida para explorar el polo sur lunar.', en: 'A plateau chosen to explore the lunar south pole.' } },
    { es: 'Llanura de regolito', en: 'Regolith plain', fact: { es: 'El polvo lunar es filoso como vidrio: desgasta trajes y ruedas.', en: 'Lunar dust is sharp like glass: it wears suits and wheels.' } },
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
