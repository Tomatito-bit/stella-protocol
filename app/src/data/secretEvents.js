// Secret events: fan theories about what "NASA hides". Rare, one per mission at most.
// Investigating costs something; the reveal gives the real explanation (sources in investigacion/09-teorias-fans.md).
const tier = { es: 'Archivo clasificado', en: 'Classified file' }
const ignoreLabel = { es: 'Dejarlo en el archivo', en: 'Leave it in the file' }

export const SECRET_EVENTS = {
  faceMars: {
    secret: true, dests: ['mars'], hazard: tier,
    title: { es: 'La Cara de Marte', en: 'The Face on Mars' },
    text: { es: 'Al pasar sobre Cidonia, la cámara capta una roca gigante con forma de rostro humano mirando al cielo. En los foros dicen que la NASA la borró de sus fotos…', en: 'Passing over Cydonia, the camera catches a giant rock shaped like a human face staring at the sky. Online forums say NASA erased it from its photos…' },
    fact: { es: 'Viking 1 la fotografió en 1976 con el Sol muy bajo.', en: 'Viking 1 photographed it in 1976 with the Sun very low.' },
    options: [
      { id: 'investigate', risk: 'medium', needs: 'fuel', label: { es: 'Cambiar de órbita para fotografiarla de cerca', en: 'Change orbit to photograph it up close' }, detail: { es: 'Gasta un tanque de combustible.', en: 'Uses one propellant tank.' } },
      { id: 'ignore', risk: 'safe', label: ignoreLabel, detail: { es: 'Nunca sabrán qué era.', en: 'You’ll never know what it was.' } },
    ],
    reveal: { es: 'Con otra luz, la “cara” es una meseta erosionada. Las sombras y los errores de la foto de 1976 completaban los ojos y la boca: se llama pareidolia. Mars Global Surveyor lo confirmó en 1998 y 2001.', en: 'In different light, the “face” is an eroded mesa. Shadows and glitches in the 1976 photo filled in the eyes and mouth: it’s called pareidolia. Mars Global Surveyor confirmed it in 1998 and 2001.' },
  },
  marsDoor: {
    secret: true, dests: ['mars'], hazard: tier,
    title: { es: 'Una puerta en la roca', en: 'A door in the rock' },
    text: { es: 'En las imágenes aparece una entrada rectangular tallada en un acantilado marciano. ¿Una puerta a una base escondida?', en: 'The images show a rectangular entrance cut into a Martian cliff. A door to a hidden base?' },
    fact: { es: 'Curiosity fotografió algo así el 7 de mayo de 2022 en “East Cliffs”.', en: 'Curiosity photographed something like this on May 7, 2022 at “East Cliffs”.' },
    options: [
      { id: 'investigate', risk: 'medium', label: { es: 'Dedicar el día a estudiarla', en: 'Spend the day studying it' }, detail: { es: 'Se pierde media ciencia del día.', en: 'Half of today’s science is lost.' } },
      { id: 'ignore', risk: 'safe', label: ignoreLabel, detail: { es: 'Seguir con el plan.', en: 'Stick to the plan.' } },
    ],
    reveal: { es: 'Mide como una puerta para perro, no para personas: es una fractura natural donde la roca en capas se agrietó y un bloque se desprendió.', en: 'It’s the size of a dog door, not a human one: a natural fracture where layered rock cracked and a block fell out.' },
  },
  phobosMonolith: {
    secret: true, dests: ['mars'], hazard: tier,
    title: { es: 'El monolito de Fobos', en: 'The Phobos monolith' },
    text: { es: 'Sobre la luna Fobos sobresale una columna enorme, sola, con una sombra larguísima. Hay quien dice que alguien la puso ahí.', en: 'A huge lone column sticks out of the moon Phobos, casting a very long shadow. Some say someone put it there.' },
    fact: { es: 'Mars Global Surveyor la vio en 1998.', en: 'Mars Global Surveyor spotted it in 1998.' },
    options: [
      { id: 'investigate', risk: 'medium', needs: 'fuel', label: { es: 'Acercarse a Fobos', en: 'Approach Phobos' }, detail: { es: 'Gasta un tanque de combustible.', en: 'Uses one propellant tank.' } },
      { id: 'ignore', risk: 'safe', label: ignoreLabel, detail: { es: 'Fobos seguirá guardando su secreto.', en: 'Phobos keeps its secret.' } },
    ],
    reveal: { es: 'Es una roca de unos 85 metros, probablemente lanzada por un impacto. Parece un monolito porque el Sol bajo estira su sombra.', en: 'It’s a boulder about 85 meters across, probably thrown out by an impact. It looks like a monolith because the low Sun stretches its shadow.' },
  },
  moonLights: {
    secret: true, dests: ['moon'], hazard: tier,
    title: { es: 'Luces en la Luna', en: 'Lights on the Moon' },
    text: { es: 'Un destello brillante aparece y desaparece en la superficie lunar. Las teorías hablan de bases alienígenas ocultas en la Luna.', en: 'A bright flash appears and vanishes on the lunar surface. Theories talk about hidden alien bases on the Moon.' },
    fact: { es: 'La NASA tiene un programa que vigila estos destellos desde 2005.', en: 'NASA has run a program watching for these flashes since 2005.' },
    options: [
      { id: 'investigate', risk: 'medium', label: { es: 'Apuntar todos los instrumentos', en: 'Point every instrument at it' }, detail: { es: 'Se pierde media ciencia del día.', en: 'Half of today’s science is lost.' } },
      { id: 'ignore', risk: 'safe', label: ignoreLabel, detail: { es: 'La luz se apaga sola.', en: 'The light fades on its own.' } },
    ],
    reveal: { es: 'Era el impacto de un meteoroide: chocan tan rápido que brillan un instante. Y las fotos de la sonda LRO solo muestran cráteres… y los módulos y huellas del Apolo, justo donde deben estar.', en: 'It was a meteoroid impact: they hit so fast they glow for an instant. And the LRO probe’s photos show only craters… plus the Apollo landers and footprints, right where they should be.' },
  },
  blackKnight: {
    secret: true, dests: ['moon', 'mars', 'europa'], hazard: tier,
    title: { es: 'El Caballero Negro', en: 'The Black Knight' },
    text: { es: 'Un objeto oscuro y deforme flota cerca de la nave. Según la leyenda, es un satélite alienígena que vigila la Tierra desde hace 13 000 años.', en: 'A dark, misshapen object drifts near the craft. Legend says it’s an alien satellite that has watched Earth for 13,000 years.' },
    fact: { es: 'La foto más famosa es de 1998, de la misión STS-88.', en: 'The most famous photo is from 1998, mission STS-88.' },
    options: [
      { id: 'investigate', risk: 'risky', crewedOnly: false, label: { es: 'Acercarse para verlo', en: 'Move in for a look' }, detail: { es: 'Arriesgado: podría chocar con la nave.', en: 'Risky: it could hit the craft.' } },
      { id: 'ignore', risk: 'safe', label: ignoreLabel, detail: { es: 'Mantener distancia.', en: 'Keep your distance.' } },
    ],
    reveal: { es: 'Es una manta térmica que los astronautas perdieron durante una caminata espacial en 1998. Basura espacial: hoy la NASA rastrea decenas de miles de objetos así.', en: 'It’s a thermal blanket astronauts lost during a 1998 spacewalk. Space junk: today NASA tracks tens of thousands of objects like it.' },
  },
  wowSignal: {
    secret: true, dests: ['moon', 'mars', 'europa'], hazard: tier,
    title: { es: 'Señal ¡Wow!', en: 'The Wow! signal' },
    text: { es: 'Durante 72 segundos llega una señal de radio fortísima y muy pura desde el espacio profundo. Luego, silencio. ¿Alguien intenta hablarnos?', en: 'For 72 seconds a very strong, very pure radio signal arrives from deep space. Then silence. Is someone trying to talk to us?' },
    fact: { es: 'En 1977 el radiotelescopio Big Ear captó una señal así y un astrónomo escribió “Wow!” al lado.', en: 'In 1977 the Big Ear radio telescope caught a signal like this and an astronomer wrote “Wow!” next to it.' },
    options: [
      { id: 'investigate', risk: 'medium', label: { es: 'Que la analista la estudie toda la noche', en: 'Have the analyst study it all night' }, detail: { es: 'Se cansa la tripulación.', en: 'The crew gets tired.' } },
      { id: 'ignore', risk: 'safe', label: ignoreLabel, detail: { es: 'Guardar la grabación.', en: 'Save the recording.' } },
    ],
    reveal: { es: 'No se repitió nunca. Un estudio de 2024 propone que fue una nube de hidrógeno iluminada de golpe por una estrella; otros creen que fue un cometa. Sigue sin resolverse del todo: es uno de los grandes misterios de la radioastronomía.', en: 'It never repeated. A 2024 study suggests a hydrogen cloud suddenly lit up by a star; others think it was a comet. It is still not fully solved: one of radio astronomy’s great mysteries.' },
  },
}
