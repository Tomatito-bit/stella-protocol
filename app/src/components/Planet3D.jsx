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

function Globe({ id, speed }) {
  const w = WORLDS[id]
  const map = useTexture(w.map, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  })
  const ref = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed
  })
  return (
    <group rotation={[0, 0, w.tilt]}>
      <mesh ref={ref}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      {/* Thin glowing rim so each world stands out against space */}
      <mesh scale={w.atmosphere ? 1.06 : 1.03}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color={w.glow} transparent opacity={w.atmosphere ? 0.22 : 0.12} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
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
