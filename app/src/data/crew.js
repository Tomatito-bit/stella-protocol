// Crew of the Astraea, written by the team. Four original characters.
export const SHIP_NAME = 'Astraea'

// The chosen one commands; the other three fly as crew.
// style changes risk appetite and the advice they give during the mission.
export const CREW = [
  {
    id: 'valeria',
    name: 'Maya',
    role: { es: 'Ingeniera en jefe', en: 'Chief engineer' },
    bio: {
      es: 'Ingeniera en jefe de la Astraea. Con su casco de alta seguridad y sus herramientas listas, se encarga de que los motores y los escudos térmicos nunca fallen. Nadie conoce los conductos y paneles como ella, y su casco cibernético la conecta directo a la red de la nave para corregir errores de software en segundos. Astuta y alegre aun con el estrés del espacio profundo.',
      en: 'Chief engineer of the Astraea. With her high-security helmet and tools at hand, she keeps the engines and heat shields from ever failing. Nobody knows the vents and control panels like she does, and her cyber helmet plugs her straight into the ship network to fix software faults in seconds. Sharp and cheerful even under deep-space stress.',
    },
    duty: 'engineer',
    skin: '#e3ad86', hair: '#3b2418',
    style: 'cautious',
    color: '#f97316',
    styleName: { es: 'Cautelosa', en: 'Cautious' },
    quote: { es: 'Primero la nave y la gente; la ciencia puede esperar un día.', en: 'Ship and people first; science can wait a day.' },
    perk: { es: 'Los eventos peligrosos llegan menos seguido.', en: 'Dangerous events happen less often.' },
    drawback: { es: 'Se hace un poco menos de ciencia.', en: 'A bit less science gets done.' },
  },
  {
    id: 'diego',
    name: 'Frost',
    role: { es: 'Capitán · piloto comandante', en: 'Captain · commander pilot' },
    bio: {
      es: 'Al mando del puente, el Capitán Frost luce con orgullo su gorra de gala sobre el casco presurizado. Veterano de mil rutas y explorador de nebulosas, es famoso por su frialdad y precisión entre campos de asteroides. Su visor refleja mapas estelares en tiempo real para trazar la trayectoria. Su meta: llevar a su tripulación a salvo, y ser el último en dejar el puente si hay emergencia.',
      en: 'In command of the bridge, Captain Frost proudly wears his dress cap over his pressurized helmet. A veteran of a thousand routes and an explorer of nebulae, he is famous for his cool precision through asteroid fields. His visor reflects star maps in real time to plot the trajectory. His goal: bring the crew home safe, and be the last to leave the bridge in an emergency.',
    },
    duty: 'pilot',
    skin: '#c4875c', hair: '#15100c',
    style: 'bold',
    color: '#3b82f6',
    styleName: { es: 'Audaz', en: 'Bold' },
    quote: { es: 'Si no arriesgamos, nunca sabremos qué hay allá.', en: 'If we never take risks, we’ll never know what’s out there.' },
    perk: { es: 'Ruta rápida: más días de operación.', en: 'Fast route: more operating days.' },
    drawback: { es: 'El paso cercano a un planeta puede dañar una pieza.', en: 'The close flyby can damage a part.' },
  },
  {
    id: 'mei',
    name: 'Mei Lin',
    role: { es: 'Analista de datos', en: 'Data analyst' },
    bio: {
      es: 'La mente analítica de la tripulación. Procesa flujos enormes de información con interfaces holográficas y descifra señales de radio misteriosas que llegan de los confines del universo.',
      en: 'The analytical mind of the crew. She processes huge streams of data through holographic interfaces and deciphers mysterious radio signals from the far reaches of the universe.',
    },
    duty: 'scientist',
    skin: '#f1d0b0', hair: '#0f0f14',
    style: 'science',
    color: '#a855f7',
    styleName: { es: 'Científica', en: 'Scientist' },
    quote: { es: 'Cada dato que traigamos se va a usar durante décadas.', en: 'Every bit of data we bring back will be used for decades.' },
    perk: { es: 'Más oportunidades científicas.', en: 'More science opportunities.' },
    drawback: { es: 'La tripulación se cansa más rápido.', en: 'The crew tires faster.' },
    hidden: { es: 'Claustrofóbica', en: 'Claustrophobic' },
  },
  {
    id: 'kwame',
    name: 'Kwame Mensah',
    role: { es: 'Cirujano espacial', en: 'Space surgeon' },
    duty: 'doctor',
    skin: '#6b4226', hair: '#120c08',
    style: 'diplomat',
    color: '#22c55e',
    styleName: { es: 'Diplomático', en: 'Diplomat' },
    quote: { es: 'Un equipo unido resuelve cualquier problema.', en: 'A united team can solve any problem.' },
    perk: { es: 'El ánimo baja mucho más lento y casi no hay peleas.', en: 'Morale drops much slower and fights are rare.' },
    drawback: { es: 'Es más lento en emergencias sin ayuda de la Tierra.', en: 'Slower in emergencies without help from Earth.' },
  },
]

export const crewById = Object.fromEntries(CREW.map((c) => [c.id, c]))
