import * as THREE from 'three'

// Which accessory kit each duty wears (Kit_<kit>_* nodes in astronaut.glb)
const KIT = { engineer: 'engineer', pilot: 'pilot', doctor: 'doctor', scientist: 'analyst' }

// Clone the Blender astronaut for one crew member: whole suit in their colour and only their role's kit
export function dressAstronaut(scene, person) {
  const m = scene.clone(true)
  const kit = KIT[person.duty]
  const suit = new THREE.MeshStandardMaterial({ color: person.color, roughness: 0.55 })
  m.traverse((o) => {
    const k = o.name.match(/^Kit_([a-z]+)_/)
    if (k) o.visible = k[1] === kit
    if (o.isMesh && o.material && o.material.name === 'Suit') o.material = suit
  })
  return m
}
