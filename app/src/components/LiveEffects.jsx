import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Live event effects in the orbit view: what is happening right now, before you decide in the logbook.
// The planet sits at [0, -7.2, -2] with radius 6.2; the craft orbits around [0, 1, -0.6].

const hash = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }

// Micrometeoroids: bright streaks fly in and flash on impact near the craft
export function Meteors() {
  const group = useRef()
  const flash = useRef()
  const N = 6
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    group.current?.children.forEach((m, i) => {
      const k = (t * 0.35 + i / N) % 1
      const from = new THREE.Vector3(-9 + hash(i, 1) * 4, 5 + hash(i, 2) * 3, -4 + hash(i, 3) * 3)
      const to = new THREE.Vector3((hash(i, 4) - 0.5) * 1.6, 1 + (hash(i, 5) - 0.5), -0.6)
      m.position.lerpVectors(from, to, k)
      m.lookAt(to)
      m.scale.set(0.7, 0.7, 1 + (1 - k) * 2.5)
      m.visible = k < 0.97
    })
    if (flash.current) { const k = (t * 0.35 * N) % 1; flash.current.intensity = k > 0.9 ? 30 : Math.max(0, flash.current.intensity - 1.5) }
  })
  return (
    <>
      <group ref={group}>
        {Array.from({ length: N }, (_, i) => (
          <mesh key={i}><boxGeometry args={[0.07, 0.07, 0.6]} /><meshBasicMaterial color="#fff1c9" toneMapped={false} transparent opacity={0.95} blending={THREE.AdditiveBlending} /></mesh>
        ))}
      </group>
      <pointLight ref={flash} position={[0, 1.2, 0]} color="#ffd59e" distance={6} intensity={0} />
    </>
  )
}

// Martian dust storm: an orange haze spreads over the planet and dust swirls past
export function DustStorm() {
  const haze = useRef()
  const dust = useRef()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(900 * 3)
    for (let i = 0; i < 900; i++) { p[i * 3] = (hash(i, 1) - 0.5) * 22; p[i * 3 + 1] = -3 + hash(i, 2) * 6; p[i * 3 + 2] = (hash(i, 3) - 0.5) * 10 }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [])
  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    if (haze.current) haze.current.material.opacity = 0.35 + Math.sin(t * 0.8) * 0.08
    if (dust.current) { dust.current.rotation.y += dt * 0.15; dust.current.position.x = Math.sin(t * 0.3) * 0.5 }
  })
  return (
    <>
      <mesh ref={haze} position={[0, -7.2, -2]} scale={1.04}>
        <sphereGeometry args={[6.2, 64, 64]} />
        <meshBasicMaterial color="#c8743a" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <points ref={dust} geometry={geo}><pointsMaterial color="#e0a06a" size={0.05} transparent opacity={0.7} /></points>
    </>
  )
}

// Europa's plume: a column of water vapour shooting up from the ice
export function Plume() {
  const pts = useRef()
  const N = 500
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    return g
  }, [])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!pts.current) return
    const attr = pts.current.geometry.attributes.position
    const a = attr.array
    for (let i = 0; i < N; i++) {
      const k = (t * 0.35 + hash(i, 1)) % 1
      const spread = k * 0.9
      a[i * 3] = -2.2 + (hash(i, 2) - 0.5) * spread
      a[i * 3 + 1] = -1.4 + k * 4.5
      a[i * 3 + 2] = -1.2 + (hash(i, 3) - 0.5) * spread
    }
    attr.needsUpdate = true
  })
  return <points ref={pts} geometry={geo}><pointsMaterial color="#dff3ff" size={0.07} transparent opacity={0.75} depthWrite={false} /></points>
}

// Something interesting on the surface: a pulsing beacon where the discovery is
export function Beacon({ color = '#5ad1ff' }) {
  const ring = useRef()
  useFrame(({ clock }) => {
    const k = (clock.getElapsedTime() * 0.8) % 1
    if (ring.current) { ring.current.scale.setScalar(0.3 + k * 1.4); ring.current.material.opacity = 1 - k }
  })
  return (
    <group position={[1.4, -1.25, 1.2]} rotation={[-1.2, 0, 0.2]}>
      <mesh ref={ring}><ringGeometry args={[0.35, 0.42, 48]} /><meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} side={THREE.DoubleSide} /></mesh>
      <mesh><circleGeometry args={[0.08, 24]} /><meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} /></mesh>
    </group>
  )
}

// Signal delay / blackout: radio pulses leave the craft and fade out before reaching Earth
export function SignalPulses() {
  const g = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    g.current?.children.forEach((m, i) => {
      const k = (t * 0.5 + i / 3) % 1
      m.position.set(k * 9, 1.3 + k * 2.5, -0.6 - k * 4)
      m.scale.setScalar(0.3 + k * 1.5)
      m.material.opacity = (1 - k) * 0.8
    })
  })
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, -0.9, 0]}><torusGeometry args={[0.4, 0.02, 8, 40]} /><meshBasicMaterial color="#7ee0ff" transparent toneMapped={false} /></mesh>
      ))}
    </group>
  )
}

// The "Black Knight": a dark crumpled shape tumbling slowly past the craft
export function Knight() {
  const ref = useRef()
  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    if (!ref.current) return
    ref.current.rotation.x += dt * 0.4
    ref.current.rotation.y += dt * 0.25
    ref.current.position.set(2.6 + Math.sin(t * 0.15) * 0.8, 1.6 + Math.sin(t * 0.3) * 0.3, 1.2)
  })
  return (
    <mesh ref={ref} scale={[1.1, 0.55, 0.8]}>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#141414" roughness={0.35} metalness={0.6} flatShading />
    </mesh>
  )
}
