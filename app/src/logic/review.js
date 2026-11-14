import { count, singlePointFailures } from './budget'
import { TESTS } from '../data/parts'

const pct = (x) => `${Math.round(x * 100)}%`

// Flight Readiness Review: each console votes GO or NO-GO and explains why with a real fact.
export function reviewBoard(dest, sel, s, tests) {
  const consoles = []
  const add = (id, name, go, reason, fact) => consoles.push({ id, name, go, reason, fact })

  // Budget office
  add('budget', { es: 'Presupuesto', en: 'Budget office' }, s.budgetLeft >= 0,
    s.budgetLeft >= 0
      ? { es: `Quedan $${s.budgetLeft}M de reserva.`, en: `$${s.budgetLeft}M left in reserve.` }
      : { es: `Te pasas por $${-s.budgetLeft}M.`, en: `You are $${-s.budgetLeft}M over budget.` },
    { es: 'En 2026 el Congreso dejó sin apoyo el programa original para traer las muestras de Marte: el costo cancela misiones.', en: 'In 2026 Congress stopped supporting the original Mars Sample Return program: cost cancels missions.' })

  // Booster / trajectory (FIDO)
  const fits = s.launcher && s.massMargin >= 0
  const fuelOk = s.tanks >= s.tanksNeeded && count(sel, 'engine') > 0
  add('fido', { es: 'Trayectoria (FIDO)', en: 'Trajectory (FIDO)' }, fits && fuelOk,
    !s.launcher ? { es: 'Falta elegir cohete.', en: 'No rocket selected.' }
      : !fits ? { es: `La nave pesa ${s.mass} kg y el cohete solo carga ${s.capacity} kg.`, en: `The craft weighs ${s.mass} kg and the rocket only lifts ${s.capacity} kg.` }
        : count(sel, 'engine') === 0 ? { es: 'Sin motor principal no se puede frenar en el destino.', en: 'Without a main engine you cannot brake at the destination.' }
          : s.tanks < s.tanksNeeded ? { es: `Necesitas ${s.tanksNeeded} tanques para llegar y frenar; llevas ${s.tanks}.`, en: `You need ${s.tanksNeeded} tanks to arrive and brake; you have ${s.tanks}.` }
            : { es: `Margen de masa ${pct(s.massMargin)} y ${s.tanks - s.tanksNeeded} tanque(s) extra para maniobras.`, en: `Mass margin ${pct(s.massMargin)} and ${s.tanks - s.tanksNeeded} spare tank(s) for maneuvers.` },
    { es: 'La NASA reserva margen de masa desde el inicio: todo termina pesando más de lo planeado.', en: 'NASA reserves mass margin from day one: everything ends up heavier than planned.' })

  // Power (EECOM)
  add('power', { es: 'Energía', en: 'Power' }, s.powerMargin >= 0.1,
    s.powerMargin >= 0.1
      ? { es: `Generas ${s.generation} W y gastas ${s.use} W (margen ${pct(s.powerMargin)}).`, en: `You generate ${s.generation} W and use ${s.use} W (margin ${pct(s.powerMargin)}).` }
      : { es: `Generas ${s.generation} W pero gastas ${s.use} W. Necesitas al menos 10% de margen.`, en: `You generate ${s.generation} W but use ${s.use} W. You need at least a 10% margin.` },
    dest.distanceAU > 2
      ? { es: `A ${dest.distanceAU} UA llega ${pct(s.sunlight)} de la luz solar: Juno usa paneles enormes y Dragonfly un generador nuclear.`, en: `At ${dest.distanceAU} AU only ${pct(s.sunlight)} of sunlight arrives: Juno uses huge arrays and Dragonfly a nuclear generator.` }
      : { es: 'En 2018 una tormenta de polvo cubrió los paneles de Opportunity y terminó su misión.', en: 'In 2018 a dust storm covered Opportunity’s panels and ended its mission.' })

  // Communications (INCO)
  const hasLink = s.link > 0
  add('comms', { es: 'Comunicaciones', en: 'Communications' }, hasLink,
    !hasLink ? { es: 'Sin antena no hay forma de hablar con la Tierra.', en: 'Without an antenna there is no way to talk to Earth.' }
      : count(sel, 'lga') ? { es: 'Tienes antena de respaldo si la principal pierde la Tierra.', en: 'You have a backup antenna if the main one loses Earth.' }
        : { es: 'Funciona, pero sin antena de respaldo.', en: 'It works, but with no backup antenna.' },
    { es: `La señal tarda ~${dest.delayMin < 1 ? '1 segundo' : `${dest.delayMin} minutos`} en llegar. La Red de Espacio Profundo comparte 3 estaciones entre todas las misiones.`, en: `The signal takes ~${dest.delayMin < 1 ? '1 second' : `${dest.delayMin} minutes`} to arrive. The Deep Space Network shares 3 sites among all missions.` })

  // Science
  add('science', { es: 'Ciencia', en: 'Science' }, s.goalsCovered >= 2,
    { es: `Cubres ${s.goalsCovered} de ${dest.goals.length} objetivos científicos.`, en: `You cover ${s.goalsCovered} of ${dest.goals.length} science goals.` },
    { es: 'Las misiones se eligen por su valor científico: sin objetivos claros, el panel no aprueba.', en: 'Missions are chosen for their science value: without clear goals, the board won’t approve.' })

  // Medical / radiation
  if (dest.crewed) {
    const lifeOk = count(sel, 'eclss') > 0 && s.supplyDays >= dest.days
    add('surgeon', { es: 'Médico de vuelo', en: 'Flight surgeon' }, lifeOk,
      count(sel, 'eclss') === 0 ? { es: 'Sin soporte vital, la tripulación no tiene aire ni agua.', en: 'Without life support the crew has no air or water.' }
        : s.supplyDays < dest.days ? { es: `Las provisiones alcanzan ${s.supplyDays} días y la misión dura ${dest.days}.`, en: `Supplies last ${s.supplyDays} days and the mission takes ${dest.days}.` }
          : { es: `Provisiones para ${s.supplyDays} días.${count(sel, 'medkit') ? ' Hay enfermería a bordo.' : ' Ojo: no hay enfermería.'}`, en: `Supplies for ${s.supplyDays} days.${count(sel, 'medkit') ? ' Medical bay on board.' : ' Careful: no medical bay.'}` },
      { es: 'En enero de 2026 la NASA hizo la primera evacuación médica de la Estación Espacial: a bordo no hay equipo de diagnóstico completo.', en: 'In January 2026 NASA carried out the first ISS medical evacuation: there is no full diagnostic equipment on board.' })
  }
  const shieldNeeded = Math.max(0, dest.radiation - 1)
  add('radiation', { es: 'Clima espacial', en: 'Space weather' }, s.shield >= shieldNeeded,
    { es: `Blindaje ${s.shield} de ${shieldNeeded} recomendado.`, en: `Shielding ${s.shield} of ${shieldNeeded} recommended.` },
    dest.id === 'europa'
      ? { es: 'Europa Clipper lleva una bóveda de aluminio-zinc de hasta 9.2 mm para sus computadoras.', en: 'Europa Clipper carries an aluminum-zinc vault up to 9.2 mm thick for its computers.' }
      : { es: 'Fuera del campo magnético terrestre, una tormenta solar puede dañar la electrónica y a la tripulación.', en: 'Outside Earth’s magnetic field a solar storm can harm electronics and crew.' })

  return { consoles, noGo: consoles.filter((c) => !c.go).length, risks: riskMatrix(dest, sel, s, tests) }
}

// 5×5 risk matrix: likelihood (1-5) × consequence (1-5)
export function riskMatrix(dest, sel, s, tests) {
  const r = []
  const add = (id, label, likelihood, consequence) => r.push({ id, label, likelihood, consequence, score: likelihood * consequence })
  singlePointFailures(dest, sel).forEach((id) =>
    add(`spf-${id}`, { es: `Punto único de falla: ${labelOf(id).es}`, en: `Single-point failure: ${labelOf(id).en}` }, 2, 5))
  TESTS.filter((t) => !tests.includes(t.id)).forEach((t) =>
    add(`test-${t.id}`, { es: `Sin ${t.name.es.toLowerCase()}: defectos ocultos`, en: `No ${t.name.en.toLowerCase()}: hidden defects` }, 3, 3))
  if (s.powerMargin < 0.2) add('power', { es: 'Margen de energía bajo', en: 'Low power margin' }, 4, 3)
  if (s.massMargin >= 0 && s.massMargin < 0.1) add('mass', { es: 'Margen de masa bajo', en: 'Low mass margin' }, 3, 3)
  const shieldNeeded = Math.max(0, dest.radiation - 1)
  if (s.shield < shieldNeeded) add('rad', { es: 'Radiación sin blindaje suficiente', en: 'Radiation with too little shielding' }, Math.min(5, dest.radiation + 1), 4)
  if (s.tanks <= s.tanksNeeded) add('fuel', { es: 'Sin combustible para maniobras extra', en: 'No propellant for extra maneuvers' }, 3, 2)
  if (dest.crewed && !count(sel, 'medkit')) add('med', { es: 'Sin enfermería a bordo', en: 'No medical bay on board' }, 3, 4)
  if (dest.crewed && s.supplyDays < dest.days + 2) add('food', { es: 'Provisiones justas', en: 'Tight supplies' }, 3, 4)
  if (!count(sel, 'spares')) add('spares', { es: 'Sin refacciones para reparar', en: 'No spare parts for repairs' }, 3, 3)
  if (!s.batteries) add('battery', { es: 'Sin baterías para la sombra', en: 'No batteries for shadow passes' }, 3, 3)
  return r.sort((a, b) => b.score - a.score)
}

function labelOf(id) {
  return {
    engine: { es: 'motor principal', en: 'main engine' },
    hga: { es: 'antena principal', en: 'main antenna' },
    eclss: { es: 'soporte vital', en: 'life support' },
    rtg: { es: 'generador nuclear', en: 'nuclear generator' },
    solar: { es: 'panel solar', en: 'solar array' },
  }[id]
}
