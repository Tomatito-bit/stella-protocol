import * as THREE from 'three'
import { SPOT_ROOM } from './crewPlaces'

// Walking on the deck: a straight central corridor, the engine room and bridge at its ends,
// and three rooms on each side. People only change room through a door.
const SIDE_ROOMS = ['Quarters', 'LifeSupport', 'Lab', 'Galley', 'Airlock', 'Medbay']

// Which part of the deck a point is in: 'hall', 'Engines', 'Bridge' or a side room
export function regionOf(nodes, p) {
  const hz = nodes.Hall_Galley.z
  const lo = Math.min(nodes.Door_Engines.x, nodes.Door_Bridge.x)
  const hi = Math.max(nodes.Door_Engines.x, nodes.Door_Bridge.x)
  const engineEnd = nodes.Door_Engines.x < nodes.Door_Bridge.x ? 'Engines' : 'Bridge'
  if (p.x <= lo) return engineEnd
  if (p.x >= hi) return engineEnd === 'Engines' ? 'Bridge' : 'Engines'
  if (Math.abs(p.z - hz) < Math.abs(nodes.Door_Galley.z - hz) * 0.98) return 'hall'
  const side = Math.sign(p.z - hz)
  let best = null
  let bd = Infinity
  for (const r of SIDE_ROOMS) {
    const c = nodes[`Room_${r}`]
    if (!c || Math.sign(c.z - hz) !== side) continue
    const d = Math.abs(c.x - p.x)
    if (d < bd) { bd = d; best = r }
  }
  return best
}

// Route from where the astronaut stands right now: out through their door (if in a room),
// along the corridor, in through the other door. Works even if the destination changes mid-walk.
export function route(nodes, from, toSpot, offset) {
  const end = nodes[toSpot].clone().add(new THREE.Vector3(offset[0], 0, offset[1]))
  const a = regionOf(nodes, from)
  const b = SPOT_ROOM[toSpot] || regionOf(nodes, end)
  if (a === b) return [end]
  const pts = []
  if (a !== 'hall') pts.push(nodes[`Door_${a}`], nodes[`Hall_${a}`])
  if (b !== 'hall') pts.push(nodes[`Hall_${b}`], nodes[`Door_${b}`])
  pts.push(end)
  return pts.filter(Boolean).map((v) => v.clone())
}
