import * as THREE from 'three'

// Clone the Blender astronaut and tint it for one crew member: accent colour, skin and hair
export function dressAstronaut(scene, person) {
  const m = scene.clone(true)
  m.traverse((o) => {
    if (!o.isMesh || !o.material) return
    const name = o.material.name
    if (name === 'Accent') {
      const mat = o.material.clone()
      mat.color.set(person.color)
      mat.emissive = new THREE.Color(person.color)
      mat.emissiveIntensity = 0.35
      o.material = mat
    } else if (name === 'Skin' && person.skin) {
      const mat = o.material.clone(); mat.color.set(person.skin); o.material = mat
    } else if (name === 'Hair' && person.hair) {
      const mat = o.material.clone(); mat.color.set(person.hair); o.material = mat
    }
  })
  return m
}
