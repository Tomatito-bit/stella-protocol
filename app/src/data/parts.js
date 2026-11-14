// Spacecraft parts. Units: cost in $M, mass in kg, power in W (negative = consumes).
// critical: a system the mission can't lose. With only one unit it is a single-point failure.
export const CATEGORIES = [
  { id: 'power', name: { es: 'Energía', en: 'Power' } },
  { id: 'propulsion', name: { es: 'Propulsión', en: 'Propulsion' } },
  { id: 'comms', name: { es: 'Comunicaciones', en: 'Communications' } },
  { id: 'instruments', name: { es: 'Instrumentos', en: 'Instruments' } },
  { id: 'life', name: { es: 'Soporte de vida', en: 'Life support' } },
]

export const PARTS = [
  // Power
  { id: 'solar', cat: 'power', cost: 40, mass: 120, power: 600, max: 4, solar: true,
    name: { es: 'Panel solar', en: 'Solar array' },
    info: { es: 'Barato y ligero, pero lejos del Sol rinde poco (1/d²).', en: 'Cheap and light, but weak far from the Sun (1/d²).' } },
  { id: 'solarxl', cat: 'power', cost: 130, mass: 450, power: 6000, max: 2, solar: true,
    name: { es: 'Panel solar gigante', en: 'Giant solar array' },
    info: { es: 'Alas de más de 30 m como las de Europa Clipper y Juno: así funcionan junto a Júpiter.', en: 'Wings over 30 m long like Europa Clipper’s and Juno’s: that’s how they work at Jupiter.' } },
  { id: 'battery', cat: 'power', cost: 25, mass: 80, power: 0, max: 3, battery: true,
    name: { es: 'Batería', en: 'Battery' },
    info: { es: 'Guarda energía para la sombra y las emergencias.', en: 'Stores energy for shadow and emergencies.' } },
  { id: 'rtg', cat: 'power', cost: 220, mass: 45, power: 110, max: 2, critical: 'power',
    name: { es: 'Generador nuclear (RTG)', en: 'Nuclear generator (RTG)' },
    info: { es: 'Funciona en cualquier lugar, como en Perseverance y Dragonfly. Caro.', en: 'Works anywhere, like on Perseverance and Dragonfly. Expensive.' } },
  // Propulsion
  { id: 'engine', cat: 'propulsion', cost: 80, mass: 300, power: -20, max: 2, critical: 'propulsion',
    name: { es: 'Motor principal', en: 'Main engine' },
    info: { es: 'Necesario para frenar en el destino. Con uno solo es punto único de falla.', en: 'Needed to brake at the destination. With only one it is a single-point failure.' } },
  { id: 'tank', cat: 'propulsion', cost: 20, mass: 400, power: 0, max: 5, fuel: true,
    name: { es: 'Tanque de combustible', en: 'Propellant tank' },
    info: { es: 'Cada tanque da margen para maniobras y correcciones.', en: 'Each tank gives margin for maneuvers and corrections.' } },
  // Comms
  { id: 'hga', cat: 'comms', cost: 60, mass: 70, power: -60, max: 2, critical: 'comms', link: 3,
    name: { es: 'Antena de alta ganancia', en: 'High-gain antenna' },
    info: { es: 'Manda muchos datos, pero tiene que apuntar a la Tierra.', en: 'Sends lots of data but must point at Earth.' } },
  { id: 'lga', cat: 'comms', cost: 15, mass: 10, power: -10, max: 2, link: 0.5,
    name: { es: 'Antena de baja ganancia', en: 'Low-gain antenna' },
    info: { es: 'Poca velocidad, pero funciona aunque la nave gire. Es el respaldo clásico.', en: 'Slow, but works even if the craft tumbles. The classic backup.' } },
  // Instruments
  { id: 'camera', cat: 'instruments', cost: 50, mass: 40, power: -40, max: 1, science: 3,
    name: { es: 'Cámara de alta resolución', en: 'High-resolution camera' },
    info: { es: 'Mapea la superficie y los sitios de aterrizaje.', en: 'Maps the surface and landing sites.' } },
  { id: 'spectrometer', cat: 'instruments', cost: 70, mass: 35, power: -50, max: 1, science: 4,
    name: { es: 'Espectrómetro', en: 'Spectrometer' },
    info: { es: 'Detecta agua, hielo y minerales por su luz.', en: 'Detects water, ice and minerals by their light.' } },
  { id: 'radar', cat: 'instruments', cost: 90, mass: 60, power: -80, max: 1, science: 4,
    name: { es: 'Radar de penetración', en: 'Ice-penetrating radar' },
    info: { es: 'Ve bajo el hielo y el suelo, como el de Europa Clipper.', en: 'Sees under ice and ground, like Europa Clipper’s.' } },
  { id: 'magnetometer', cat: 'instruments', cost: 30, mass: 15, power: -10, max: 1, science: 3,
    name: { es: 'Magnetómetro', en: 'Magnetometer' },
    info: { es: 'Mide campos magnéticos; revela océanos ocultos.', en: 'Measures magnetic fields; reveals hidden oceans.' } },
  { id: 'drill', cat: 'instruments', cost: 80, mass: 90, power: -70, max: 1, science: 4, crewedOnly: true,
    name: { es: 'Taladro de muestras', en: 'Sample drill' },
    info: { es: 'Saca hielo y roca del subsuelo.', en: 'Extracts ice and rock from below the surface.' } },
  // Life support and protection
  { id: 'eclss', cat: 'life', cost: 120, mass: 500, power: -150, max: 2, critical: 'life', crewedOnly: true,
    name: { es: 'Soporte vital (aire y agua)', en: 'Life support (air and water)' },
    info: { es: 'Recicla aire y agua. Sin respaldo, una falla es gravísima.', en: 'Recycles air and water. Without a backup, a failure is critical.' } },
  { id: 'shielding', cat: 'life', cost: 60, mass: 250, power: 0, max: 3, shield: 1,
    name: { es: 'Blindaje contra radiación', en: 'Radiation shielding' },
    info: { es: 'Protege electrónica y tripulación (la bóveda de Europa Clipper).', en: 'Protects electronics and crew (like Europa Clipper’s vault).' } },
  { id: 'supplies', cat: 'life', cost: 30, mass: 300, power: 0, max: 3, supplies: 1, crewedOnly: true,
    name: { es: 'Provisiones (comida y agua)', en: 'Supplies (food and water)' },
    info: { es: 'Cada módulo alarga cuánto aguanta la tripulación.', en: 'Each module extends how long the crew can last.' } },
  { id: 'medkit', cat: 'life', cost: 20, mass: 40, power: -5, max: 1, medical: true, crewedOnly: true,
    name: { es: 'Enfermería', en: 'Medical bay' },
    info: { es: 'Permite tratar coágulos, infecciones y lesiones a bordo.', en: 'Treats clots, infections and injuries on board.' } },
  { id: 'spares', cat: 'life', cost: 25, mass: 80, power: 0, max: 2, spares: true,
    name: { es: 'Refacciones', en: 'Spare parts' },
    info: { es: 'Permite reparar una pieza dañada durante la misión.', en: 'Lets you repair a damaged part during the mission.' } },
]

export const BASE = { cost: 100, mass: 900, power: -120 } // structure, computer, avionics
export const CREW_BASE = { cost: 150, mass: 2500, power: -200 } // crew cabin

export const LAUNCHERS = [
  { id: 'medium', name: { es: 'Cohete mediano', en: 'Medium rocket' }, capacity: 4500, cost: 120 },
  { id: 'heavy', name: { es: 'Cohete pesado', en: 'Heavy rocket' }, capacity: 9000, cost: 250 },
  { id: 'superheavy', name: { es: 'Cohete superpesado (tipo SLS)', en: 'Super heavy rocket (SLS-class)' }, capacity: 16000, cost: 500 },
]

// Environmental tests (team research doc 06): each removes a type of hidden defect
export const TESTS = [
  { id: 'vacuum', cost: 25, name: { es: 'Cámara de vacío térmico', en: 'Thermal vacuum chamber' },
    info: { es: 'Encuentra fallas por frío, calor y vacío.', en: 'Finds failures from cold, heat and vacuum.' } },
  { id: 'vibration', cost: 20, name: { es: 'Mesa de vibración', en: 'Vibration table' },
    info: { es: 'Simula el despegue: encuentra piezas flojas.', en: 'Simulates launch: finds loose parts.' } },
  { id: 'deployment', cost: 15, name: { es: 'Prueba de despliegue', en: 'Deployment test' },
    info: { es: 'Abre antenas y paneles en tierra (como hizo Webb).', en: 'Unfolds antennas and panels on the ground (like Webb).' } },
]

export const partById = Object.fromEntries(PARTS.map((p) => [p.id, p]))
