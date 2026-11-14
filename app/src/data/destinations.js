// Destinations, each based on a real NASA mission (see research/04).
// distanceAU: distance from the Sun (sunlight falls with 1/d²). delayMin: one-way signal delay.
export const DESTINATIONS = [
  {
    id: 'moon',
    name: { es: 'Luna · Polo Sur', en: 'Moon · South Pole' },
    crewed: true,
    budget: 2000,
    days: 10,
    distanceAU: 1,
    delayMin: 0.02,
    radiation: 1,
    color: '#cbd5e1',
    realMission: 'Artemis',
    summary: {
      es: 'Lleva una tripulación al Polo Sur lunar, donde hay hielo en cráteres que nunca ven el Sol.',
      en: 'Take a crew to the lunar South Pole, where ice hides in craters that never see the Sun.',
    },
    keyRisk: { es: 'Polvo lunar tóxico y regreso con escudo térmico', en: 'Toxic lunar dust and heat-shield reentry' },
    goals: ['camera', 'spectrometer', 'drill'],
  },
  {
    id: 'mars',
    name: { es: 'Marte', en: 'Mars' },
    crewed: true,
    budget: 2400,
    days: 14,
    distanceAU: 1.52,
    delayMin: 12,
    radiation: 2,
    color: '#f97316',
    realMission: 'Perseverance · Mars crewed missions',
    summary: {
      es: 'La primera tripulación en órbita de Marte. Tus órdenes tardan minutos en llegar: la tripulación decide sola en las emergencias.',
      en: 'The first crew in Mars orbit. Your orders take minutes to arrive: the crew decides alone in emergencies.',
    },
    keyRisk: { es: 'Retraso de comunicación y aislamiento', en: 'Communication delay and isolation' },
    goals: ['camera', 'spectrometer', 'radar'],
  },
  {
    id: 'europa',
    name: { es: 'Europa · Júpiter', en: 'Europa · Jupiter' },
    crewed: false,
    budget: 1600,
    days: 12,
    distanceAU: 5.2,
    delayMin: 43,
    radiation: 4,
    color: '#7dd3fc',
    realMission: 'Europa Clipper',
    summary: {
      es: 'Una sonda robótica busca si el océano bajo el hielo de Europa podría albergar vida. Júpiter la baña en radiación.',
      en: 'A robotic probe checks whether the ocean under Europa’s ice could host life. Jupiter bathes it in radiation.',
    },
    keyRisk: { es: 'Radiación acumulada que daña la electrónica', en: 'Accumulated radiation that damages electronics' },
    goals: ['camera', 'radar', 'magnetometer'],
  },
]

export const destinationById = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]))
