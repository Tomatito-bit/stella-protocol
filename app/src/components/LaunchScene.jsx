import { Suspense, memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, useTexture, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Ship } from './Ship3D'
import { T } from '../logic/launch'

// Rocket look per launcher: superheavy is SLS-like (orange core + 2 white boosters)
const ROCKETS = {
  medium: { core: '#eef1f6', h: 7, r: 0.42, boosters: 0, band: '#1f2937' },
  heavy: { core: '#eef1f6', h: 8.5, r: 0.48, boosters: 2, band: '#1f2937' },
  superheavy: { core: '#d9772b', h: 10, r: 0.6, boosters: 2, band: '#f1f5f9' },
}

// Soft round smoke sprite drawn once
function useSmokeTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64)
    grd.addColorStop(0, 'rgba(255,255,255,0.9)')
    grd.addColorStop(0.5, 'rgba(230,230,235,0.45)')
    grd.addColorStop(1, 'rgba(230,230,235,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [])
}

// Clock shared by every part of the scene (seconds since the screen opened)
function useClock(start) {
  return () => (performance.now() - start.current) / 1000
}

function Flame({ scale = 1 }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.set(scale, scale * (1 + Math.sin(clock.getElapsedTime() * 40) * 0.12), scale)
  })
  return (
    <group ref={ref}>
      <mesh position={[0, -1.1, 0]}><coneGeometry args={[0.32, 2.2, 16, 1, true]} /><meshBasicMaterial color="#ffb347" transparent opacity={0.85} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh position={[0, -0.7, 0]}><coneGeometry args={[0.18, 1.3, 16, 1, true]} /><meshBasicMaterial color="#fff6d6" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  )
}

function Booster({ x, h, start }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(() => {
    const t = now()
    const g = ref.current
    if (!g) return
    if (t > T.boosters) {
      const k = t - T.boosters
      g.position.set(x + Math.sign(x) * k * 1.4, -k * k * 1.2, 0)
      g.rotation.z = -Math.sign(x) * k * 0.6
    }
  })
  return (
    <group ref={ref} position={[x, 0, 0]}>
      <mesh position={[0, h * 0.42, 0]}><cylinderGeometry args={[0.28, 0.28, h * 0.8, 24]} /><meshStandardMaterial color="#f1f5f9" roughness={0.5} /></mesh>
      <mesh position={[0, h * 0.86, 0]}><coneGeometry args={[0.28, 0.6, 24]} /><meshStandardMaterial color="#f1f5f9" roughness={0.5} /></mesh>
      <mesh position={[0, h * 0.02 - 0.15, 0]}><cylinderGeometry args={[0.18, 0.3, 0.35, 16, 1, true]} /><meshStandardMaterial color="#374151" metalness={0.7} side={THREE.DoubleSide} /></mesh>
    </group>
  )
}

// The rocket stack. The first stage falls away at MECO and the fairing opens to show the spacecraft.
function Rocket({ kind, sel, crewed, shield, start }) {
  const r = ROCKETS[kind] || ROCKETS.heavy
  const rocket = useRef()
  const stage1 = useRef()
  const fairL = useRef()
  const fairR = useRef()
  const now = useClock(start)
  useFrame(() => {
    const t = now()
    if (rocket.current) {
      const s = Math.max(0, t - T.liftoff)
      rocket.current.position.y = s * s * 0.9
      rocket.current.rotation.z = -Math.min(0.5, s * 0.05) // gravity turn
      rocket.current.position.x = s * s * 0.12
    }
    if (stage1.current && t > T.meco) {
      const k = t - T.meco
      stage1.current.position.y = -k * k * 2.5
      stage1.current.rotation.x = k * 0.3
    }
    if (t > T.fairing) {
      const k = Math.min(2, t - T.fairing)
      if (fairL.current) { fairL.current.position.x = -k * 1.2; fairL.current.rotation.z = k * 0.8 }
      if (fairR.current) { fairR.current.position.x = k * 1.2; fairR.current.rotation.z = -k * 0.8 }
    }
  })
  const h1 = r.h * 0.62
  const h2 = r.h * 0.22
  return (
    <group ref={rocket}>
      {/* First stage (core) */}
      <group ref={stage1}>
        <mesh position={[0, h1 / 2, 0]}><cylinderGeometry args={[r.r, r.r, h1, 32]} /><meshStandardMaterial color={r.core} roughness={0.55} /></mesh>
        <mesh position={[0, h1 * 0.15, 0]}><cylinderGeometry args={[r.r + 0.005, r.r + 0.005, 0.12, 32]} /><meshStandardMaterial color={r.band} /></mesh>
        {[-0.22, 0, 0.22].map((x) => (
          <mesh key={x} position={[x * r.r * 2.2, -0.2, 0]}><cylinderGeometry args={[0.1, 0.18, 0.4, 14, 1, true]} /><meshStandardMaterial color="#374151" metalness={0.7} side={THREE.DoubleSide} /></mesh>
        ))}
        <FlameWhen start={start} until={T.meco} y={-0.35} scale={r.r * 2.2} />
        {r.boosters > 0 && [-1, 1].map((s) => <Booster key={s} x={s * (r.r + 0.3)} h={h1} start={start} />)}
      </group>
      {/* Upper stage */}
      <mesh position={[0, h1 + h2 / 2, 0]}><cylinderGeometry args={[r.r * 0.85, r.r, h2, 32]} /><meshStandardMaterial color="#e5e7eb" roughness={0.45} /></mesh>
      <FlameWhenAfter start={start} from={T.meco + 0.4} until={T.fairing + 1} y={h1 - 0.1} scale={r.r * 1.2} />
      {/* Payload: the player's spacecraft, inside the fairing */}
      <group position={[0, h1 + h2 + 0.9, 0]} scale={0.38}>
        <Ship sel={sel} crewed={crewed} shield={shield} spin={0} />
      </group>
      {/* Fairing halves */}
      <group position={[0, h1 + h2, 0]}>
        <mesh ref={fairL} position={[0, 0, 0]}><cylinderGeometry args={[r.r * 0.9, r.r * 0.85, 2.2, 32, 1, true, 0, Math.PI]} /><meshStandardMaterial color="#f8fafc" side={THREE.DoubleSide} roughness={0.4} /></mesh>
        <mesh ref={fairR} position={[0, 0, 0]}><cylinderGeometry args={[r.r * 0.9, r.r * 0.85, 2.2, 32, 1, true, Math.PI, Math.PI]} /><meshStandardMaterial color="#f8fafc" side={THREE.DoubleSide} roughness={0.4} /></mesh>
      </group>
    </group>
  )
}

function FlameWhen({ start, until, y, scale }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(() => { if (ref.current) { const t = now(); ref.current.visible = t > T.ignition && t < until } })
  return <group ref={ref} position={[0, y, 0]} visible={false}><Flame scale={scale} /></group>
}
function FlameWhenAfter({ start, from, until, y, scale }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(() => { if (ref.current) { const t = now(); ref.current.visible = t > from && t < until } })
  return <group ref={ref} position={[0, y, 0]} visible={false}><Flame scale={scale} /></group>
}

// Launch pad with tower and a big rolling smoke cloud at ignition
function Pad({ start }) {
  const tex = useSmokeTexture()
  const N = 140
  const mesh = useRef()
  const now = useClock(start)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => { const h = (k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }; return { a: h(1) * Math.PI * 2, v: 0.6 + h(2) * 1.6, born: T.ignition - 0.3 + h(3) * 4, s: 0.6 + h(4) * 1.2 } }), [])
  useFrame(({ camera }) => {
    const t = now()
    seeds.forEach((p, i) => {
      const age = t - p.born
      if (age < 0) dummy.scale.setScalar(0.0001)
      else {
        dummy.position.set(Math.cos(p.a) * age * p.v * 1.6, 0.3 + age * 0.35, Math.sin(p.a) * age * p.v * 0.8)
        dummy.scale.setScalar(p.s * (1 + age * 0.9))
      }
      dummy.quaternion.copy(camera.quaternion)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group>
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[60, 48]} /><meshStandardMaterial color="#3b4252" roughness={1} /></mesh>
      <mesh position={[0, -0.45, 0]}><cylinderGeometry args={[2.2, 2.6, 0.3, 24]} /><meshStandardMaterial color="#6b7280" roughness={0.9} /></mesh>
      {/* Service tower */}
      <group position={[2.1, 0, 0]}>
        <mesh position={[0, 4.5, 0]}><boxGeometry args={[0.7, 10, 0.7]} /><meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.5} wireframe /></mesh>
        <mesh position={[0, 9.8, 0]}><boxGeometry args={[0.9, 0.3, 0.9]} /><meshStandardMaterial color="#dc2626" /></mesh>
      </group>
      <instancedMesh ref={mesh} args={[null, null, N]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} color="#e8e8ee" />
      </instancedMesh>
    </group>
  )
}

// Camera follows the rocket, then sky turns black and the cruise begins
function Director({ start, kind }) {
  const now = useClock(start)
  const sky = useMemo(() => new THREE.Color(), [])
  useFrame(({ camera, scene }) => {
    const t = now()
    const s = Math.max(0, t - T.liftoff)
    const y = Math.min(t, T.transfer) < T.liftoff ? 4 : s * s * 0.9 + 4
    if (t < T.transfer) {
      const shake = t > T.ignition && t < T.maxQ + 1 ? (Math.random() - 0.5) * 0.08 : 0
      camera.position.set(9 + shake, y + 1 + shake, 16)
      camera.lookAt(s * s * 0.12, y + (kind === 'superheavy' ? 3 : 2), 0)
      const k = Math.min(1, s / 8)
      sky.setRGB(0.36 * (1 - k) + 0.01 * k, 0.6 * (1 - k) + 0.02 * k, 0.9 * (1 - k) + 0.05 * k)
      scene.background = sky
    }
  })
  return null
}

// Cruise: Earth falls behind, the destination grows ahead, then the braking burn
function Cruise({ destId, sel, crewed, shield, start }) {
  const maps = { moon: '/textures/moon.jpg', mars: '/textures/mars.jpg', europa: '/textures/europa.jpg' }
  const map = useTexture(maps[destId])
  const group = useRef()
  const planet = useRef()
  const ship = useRef()
  const glow = useRef()
  const now = useClock(start)
  const space = useMemo(() => new THREE.Color('#02040c'), [])
  useFrame(({ camera, scene }) => {
    const t = now()
    const on = t >= T.transfer
    if (group.current) group.current.visible = on
    if (!on) return
    scene.background = space
    const k = Math.min(1, (t - T.transfer) / (T.insertion - T.transfer))
    camera.position.set(0, 1.2, 9)
    camera.lookAt(0, 0, 0)
    if (planet.current) {
      const sc = 0.4 + k * 3.2
      planet.current.scale.setScalar(sc)
      planet.current.position.set(3 - k * 3, -0.5 - k * 3, -30 + k * 26)
      planet.current.rotation.y += 0.002
    }
    if (ship.current) {
      ship.current.position.set(Math.sin(t * 0.8) * 0.15, 0.6 + Math.sin(t * 1.3) * 0.05, 2)
      ship.current.rotation.y = t > T.insertion ? Math.PI : 0 // flips to burn backwards
    }
    if (glow.current) glow.current.visible = t > T.insertion
  })
  return (
    <group ref={group} visible={false}>
      <mesh ref={planet}><sphereGeometry args={[1, 64, 64]} /><meshStandardMaterial map={map} roughness={0.95} /></mesh>
      <group ref={ship} scale={0.45}>
        <Ship sel={sel} crewed={crewed} shield={shield} spin={0} />
        <group ref={glow} position={[0, -2.6, 0]} visible={false}><Flame scale={0.8} /></group>
      </group>
    </group>
  )
}

export const LaunchScene = memo(function LaunchScene({ kind, destId, sel, crewed, shield, start }) {
  return (
    <Canvas camera={{ position: [9, 5, 16], fov: 45 }} dpr={[1, 2]} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 6]} intensity={2.4} />
      <SpaceStars start={start} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 5, -5]} scale={[10, 3, 1]} />
        <Lightformer intensity={1.2} color="#ffd9a0" position={[5, 1, 3]} rotation-y={-Math.PI / 2} scale={[6, 5, 1]} />
      </Environment>
      <LaunchStage kind={kind} sel={sel} crewed={crewed} shield={shield} start={start} />
      <Suspense fallback={null}>
        <Cruise destId={destId} sel={sel} crewed={crewed} shield={shield} start={start} />
      </Suspense>
      <Director start={start} kind={kind} />
    </Canvas>
  )
})

// Pad + rocket, hidden once the cruise starts
function LaunchStage({ kind, sel, crewed, shield, start }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(() => { if (ref.current) ref.current.visible = now() < T.transfer })
  return (
    <group ref={ref}>
      <Pad start={start} />
      <Rocket kind={kind} sel={sel} crewed={crewed} shield={shield} start={start} />
    </group>
  )
}

// Stars only show once the sky turns black (above the atmosphere)
function SpaceStars({ start }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(() => { if (ref.current) ref.current.visible = now() > T.boosters })
  return <group ref={ref} visible={false}><Stars radius={90} depth={40} count={2500} factor={4} fade /></group>
}
