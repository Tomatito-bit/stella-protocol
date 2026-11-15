import { Suspense, memo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, useTexture } from '@react-three/drei'
import * as THREE from 'three'

// Real NASA / USGS surface maps (public domain), see assets/texturas/FUENTES.md
const WORLDS = {
  moon: { map: '/textures/moon.jpg', glow: '#cbd5e1', tilt: 0.03 },
  mars: { map: '/textures/mars.jpg', glow: '#f97316', tilt: 0.44, atmosphere: true },
  europa: { map: '/textures/europa.jpg', glow: '#7dd3fc', tilt: 0.05 },
}

// Load every world up front so switching destinations never shows a blank frame
Object.values(WORLDS).forEach((w) => useTexture.preload(w.map))

function Globe({ id, speed }) {
  const w = WORLDS[id]
  const map = useTexture(w.map, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  })
  const ref = useRef()
  const shown = useRef(id)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    g.rotation.y += dt * speed
    // A new world pops in with a quick zoom-and-spin instead of a hard cut
    if (shown.current !== id) { shown.current = id; g.scale.setScalar(0.82); g.rotation.y -= 0.8 }
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 1, Math.min(1, dt * 6)))
  })
  return (
    <group rotation={[0, 0, w.tilt]}>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
    </group>
  )
}

// A rotating planet with its real map. `stars` adds a starfield behind it.
export const Planet3D = memo(function Planet3D({ id, speed = 0.12, stars = false, camera = 3.4 }) {
  return (
    <Canvas camera={{ position: [0, 0, camera], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-4, 1.5, 3]} intensity={2.6} />
      {stars && <Stars radius={60} depth={40} count={2500} factor={3} fade speed={0.4} />}
      <Suspense fallback={null}>
        <Globe id={id} speed={speed} />
      </Suspense>
    </Canvas>
  )
})
