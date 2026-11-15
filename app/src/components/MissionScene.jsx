import { Suspense, memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { GameCanvas } from './GameCanvas'
import { OrbitControls, Stars, useTexture, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Ship } from './Ship3D'
import { Meteors, DustStorm, Plume, Beacon, SignalPulses, Knight } from './LiveEffects'

// The mission happens AT the chosen world: its real NASA map fills the view below the spacecraft.
const MAPS = { moon: '/textures/moon.jpg', mars: '/textures/mars.jpg', europa: '/textures/europa.jpg' }
const GLOW = { moon: '#cbd5e1', mars: '#ff8a4c', europa: '#9fd8ff' }

function World({ id }) {
  const map = useTexture(MAPS[id], (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8 })
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.025 })
  return (
    <group position={[0, -7.2, -2]} rotation={[0.35, 0, 0.12]}>
      <mesh ref={ref}>
        <sphereGeometry args={[6.2, 96, 96]} />
        <meshStandardMaterial map={map} roughness={0.95} />
      </mesh>
      <mesh scale={1.015}>
        <sphereGeometry args={[6.2, 64, 64]} />
        <meshBasicMaterial color={GLOW[id]} transparent opacity={id === 'mars' ? 0.1 : 0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

// Jupiter looms behind Europa (banded texture drawn in code)
function Jupiter() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    const g = c.getContext('2d')
    const bands = ['#e8d6b5', '#c99a6b', '#f2e4c8', '#b07a52', '#e9cfa6', '#a86f4a', '#f0dcc0', '#c58c5c', '#e6cfa8', '#b98058', '#efe0c4']
    bands.forEach((b, i) => { g.fillStyle = b; g.fillRect(0, (i * 256) / bands.length, 512, 256 / bands.length + 1) })
    g.fillStyle = 'rgba(180,80,50,0.85)'
    g.beginPath(); g.ellipse(340, 160, 34, 16, 0, 0, Math.PI * 2); g.fill()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  return (
    <mesh position={[14, 6, -40]} rotation={[0, 0, 0.05]}>
      <sphereGeometry args={[11, 64, 64]} />
      <meshStandardMaterial map={tex} roughness={1} />
    </mesh>
  )
}

// Solar storm / radiation: red pulsing light and a stream of particles crossing the scene
function Storm() {
  const pts = useRef()
  const light = useRef()
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(600 * 3)
    // Deterministic pseudo-random spread so renders stay pure
    for (let i = 0; i < 600; i++) {
      const h = (k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }
      p[i * 3] = (h(1) - 0.5) * 30; p[i * 3 + 1] = (h(2) - 0.5) * 12; p[i * 3 + 2] = (h(3) - 0.5) * 12
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [])
  useFrame(({ clock }, dt) => {
    if (pts.current) { pts.current.position.x += dt * 9; if (pts.current.position.x > 15) pts.current.position.x = -15 }
    if (light.current) light.current.intensity = 2 + Math.sin(clock.getElapsedTime() * 6) * 1.5
  })
  return (
    <>
      <points ref={pts} geometry={geo}><pointsMaterial color="#ffb347" size={0.06} transparent opacity={0.8} /></points>
      <pointLight ref={light} position={[-6, 3, 4]} color="#ff5533" distance={30} />
    </>
  )
}

function Orbiting({ sel, crewed, shield, safe, wobble }) {
  const ref = useRef()
  // The craft really orbits: it rises over the planet's limb, crosses the sky and sets again
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const a = ((t * 0.035 + 0.55) % 1.3) - 0.65
    const R = 8.1
    if (ref.current) {
      ref.current.position.set(Math.sin(a) * R, -7.2 + Math.cos(a) * R, -0.6 + Math.sin(t * 0.2) * 0.2)
      // A failing gyroscope makes the craft wobble off its pointing
      const w = wobble ? Math.sin(t * 2.3) * 0.25 : 0
      ref.current.rotation.set(w, safe ? 0 : t * 0.05 + w, -a * 0.9 + w * 0.5)
    }
  })
  return (
    <group ref={ref} scale={0.5}>
      <Ship sel={sel} crewed={crewed} shield={shield} spin={0} />
    </group>
  )
}

export const MissionScene = memo(function MissionScene({ destId, sel, crewed, shield, storm, safe, event, paused }) {
  return (
    <GameCanvas paused={paused} camera={{ position: [0, 1.6, 6.5], fov: 45 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#02040c']} />
      <ambientLight intensity={safe ? 0.08 : 0.15} />
      <directionalLight position={[-6, 4, 5]} intensity={safe ? 1.4 : 2.6} color="#fff4e0" />
      <Stars radius={80} depth={50} count={1800} factor={3.5} fade speed={0.3} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 5, -5]} scale={[10, 3, 1]} />
        <Lightformer intensity={1.2} color="#ffd9a0" position={[5, 1, 3]} rotation-y={-Math.PI / 2} scale={[6, 5, 1]} />
      </Environment>
      <Suspense fallback={null}>
        <World id={destId} />
        {destId === 'europa' && <Jupiter />}
      </Suspense>
      <Orbiting sel={sel} crewed={crewed} shield={shield} safe={safe} wobble={event === 'gyro' || event === 'transistor'} />
      {storm && <Storm />}
      {event === 'micrometeoroid' && <Meteors />}
      {(event === 'dustStorm' || event === 'dustDevil' || event === 'dust') && <DustStorm />}
      {event === 'plume' && <Plume />}
      {(event === 'opportunity' || event === 'shadowIce') && <Beacon color={event === 'shadowIce' ? '#bfe9ff' : '#ffd166'} />}
      {(event === 'faceMars' || event === 'marsDoor' || event === 'phobosMonolith' || event === 'moonLights') && <Beacon color="#ff3b5c" />}
      {event === 'wowSignal' && <SignalPulses />}
      {event === 'blackKnight' && <Knight />}
      {(event === 'delay' || event === 'conjunction' || event === 'earthset') && <SignalPulses />}
      <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={1.1} maxPolarAngle={1.7} minAzimuthAngle={-0.6} maxAzimuthAngle={0.6} />
    </GameCanvas>
  )
})
