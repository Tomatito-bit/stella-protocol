import { Suspense, memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { crewById } from '../data/crew'
import { crewPlaces, SPOT_ROOM } from '../logic/crewPlaces'
import { useT } from '../i18n'

// Top-down deck of the spacecraft (modeled in Blender: assets/modelos/stella_protocol.blend).
// Rooms, doors and spots are named nodes, so astronauts walk door → corridor → door between rooms.
useGLTF.preload('/models/deck.glb')
useGLTF.preload('/models/astronaut.glb')

const ROOM_NAMES = {
  Bridge: { es: 'CABINA', en: 'BRIDGE' }, Lab: { es: 'LABORATORIO', en: 'LAB' }, Medbay: { es: 'ENFERMERÍA', en: 'MEDBAY' },
  Quarters: { es: 'DORMITORIO', en: 'QUARTERS' }, Galley: { es: 'COMEDOR', en: 'GALLEY' }, LifeSupport: { es: 'SOPORTE VITAL', en: 'LIFE SUPPORT' },
  Airlock: { es: 'ESCLUSA', en: 'AIRLOCK' }, Engines: { es: 'MOTORES', en: 'ENGINES' },
}
const NO_MEDBAY = { es: 'SIN ENFERMERÍA', en: 'NO MEDBAY' }
const WALK = 2.2 // metres per second (a little faster than real life so it reads from above)

function useNodes(scene) {
  return useMemo(() => {
    const n = {}
    scene.updateMatrixWorld(true)
    scene.traverse((o) => { if (/^(Spot_|Bed_|Shelter|Room_|Door_|Hall_)/.test(o.name)) n[o.name] = o.getWorldPosition(new THREE.Vector3()) })
    return n
  }, [scene])
}

// Painted room name on the floor
function RoomLabel({ text, at }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 96
    const g = c.getContext('2d')
    g.font = '700 54px Orbitron, "Space Grotesk", sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillStyle = 'rgba(255,255,255,0.55)'
    g.fillText(text, 256, 50)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [text])
  return (
    <mesh position={[at.x, 0.03, at.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.4, 0.64]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

// Route between two spots: leave through the room door, walk the corridor, enter the other door
function route(nodes, fromSpot, toSpot, offset) {
  const a = SPOT_ROOM[fromSpot]
  const b = SPOT_ROOM[toSpot]
  const end = nodes[toSpot].clone().add(new THREE.Vector3(offset[0], 0, offset[1]))
  if (!a || a === b) return [end]
  return [nodes[`Door_${a}`], nodes[`Hall_${a}`], nodes[`Hall_${b}`], nodes[`Door_${b}`], end].filter(Boolean).map((v) => v.clone())
}

function Astronaut({ place, nodes }) {
  const { scene } = useGLTF('/models/astronaut.glb')
  const info = crewById[place.id]
  const model = useMemo(() => {
    const m = scene.clone(true)
    m.traverse((o) => {
      if (o.isMesh && o.material && o.material.name === 'Accent') {
        const mat = o.material.clone()
        mat.color.set(info.color)
        mat.emissive = new THREE.Color(info.color)
        mat.emissiveIntensity = 0.35
        o.material = mat
      }
    })
    return m
  }, [scene, info.color])
  const root = useRef()
  const joints = useRef(null)
  const path = useRef([])
  const current = useRef(place.spot)
  const phase = info.name.length

  useFrame(({ clock }, dt) => {
    const g = root.current
    if (!g) return
    if (!joints.current) { const j = {}; model.traverse((o) => { j[o.name] = o }); joints.current = j }
    // New destination: plan a walk through the corridor
    if (current.current !== place.spot) {
      path.current = route(nodes, current.current, place.spot, place.offset)
      current.current = place.spot
    }
    const t = clock.getElapsedTime() + phase
    const next = path.current[0]
    let walking = false
    if (next) {
      const d = new THREE.Vector3(next.x - g.position.x, 0, next.z - g.position.z)
      const dist = d.length()
      if (dist < 0.08) path.current.shift()
      else {
        walking = true
        g.position.add(d.normalize().multiplyScalar(Math.min(dist, WALK * dt)))
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.atan2(d.x, d.z), 0.25)
      }
    }
    if (!walking) {
      const face = place.mode === 'argue' ? (place.offset[0] < 0 ? Math.PI / 2 : -Math.PI / 2) : place.mode === 'sleep' ? Math.PI : Math.PI * 0.9
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, face, 0.08)
    }
    const J = joints.current
    const s = Math.sin
    const set = (name, x, z = 0) => { const o = J[name]; if (o) { o.rotation.x = x; o.rotation.z = z } }
    if (walking) {
      const w = t * 9
      set('HipL', -s(w) * 0.55); set('HipR', s(w) * 0.55)
      set('KneeL', Math.max(0, s(w + 1.2)) * 0.8); set('KneeR', Math.max(0, -s(w + 1.2)) * 0.8)
      set('ShoulderL', s(w) * 0.5); set('ShoulderR', -s(w) * 0.5); set('ElbowL', -0.35); set('ElbowR', -0.35); set('Head', 0)
    } else if (place.mode === 'work') {
      set('HipL', 0); set('HipR', 0); set('KneeL', 0); set('KneeR', 0)
      set('ShoulderL', -1.0 + s(t * 2.2) * 0.2, 0.1); set('ShoulderR', -0.9 + s(t * 2.6 + 1) * 0.2, -0.1)
      set('ElbowL', -0.7 + s(t * 3) * 0.15); set('ElbowR', -0.8); set('Head', 0.2 + s(t * 0.8) * 0.06)
    } else if (place.mode === 'argue') {
      set('HipL', 0); set('HipR', 0); set('KneeL', 0); set('KneeR', 0)
      set('ShoulderL', -0.7 + s(t * 6) * 0.5, 0.35); set('ShoulderR', -0.3 + s(t * 5) * 0.2, -0.25)
      set('ElbowL', -1.0); set('ElbowR', -0.5); set('Head', s(t * 4) * 0.15)
    } else if (place.mode === 'sleep') {
      set('HipL', 0); set('HipR', 0); set('KneeL', 0.1); set('KneeR', 0.1)
      set('ShoulderL', 0.05, 0.2); set('ShoulderR', 0.05, -0.2); set('ElbowL', -0.2); set('ElbowR', -0.2); set('Head', 0)
    } else {
      set('HipL', 0); set('HipR', 0); set('KneeL', 0); set('KneeR', 0)
      set('ShoulderL', s(t) * 0.06, 0.12); set('ShoulderR', -s(t) * 0.06, -0.12); set('ElbowL', -0.2); set('ElbowR', -0.2); set('Head', s(t * 0.7) * 0.12)
    }
    // Sleeping astronauts lie on their bunk; others stand on the deck
    const lying = !walking && place.mode === 'sleep'
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, lying ? -Math.PI / 2 : 0, 0.15)
    g.position.y = THREE.MathUtils.lerp(g.position.y, lying ? 0.55 : walking ? Math.abs(s(t * 9)) * 0.05 : 0, 0.2)
  })

  const start = nodes[place.spot]
  return (
    <group ref={root} position={start ? [start.x + place.offset[0], 0, start.z + place.offset[1]] : [0, 0, 0]} scale={1.35}>
      <primitive object={model} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.42, 32]} />
        <meshBasicMaterial color={info.color} transparent opacity={0.85} />
      </mesh>
    </group>
  )
}

// Room names sit just inside the door, where furniture doesn't cover them
function labelSpot(nodes, room) {
  const c = nodes[`Room_${room}`]
  const d = nodes[`Door_${room}`]
  return d ? c.clone().lerp(d, 0.72) : c
}

// The deck reflects the spacecraft the player designed: engines, solar wings, lab racks,
// medical bay, life-support tanks and shielding all follow the parts that were chosen.
function fitToDesign(source, sel, shield) {
  const scene = source.clone(true)
  const n = (id) => sel[id] || 0
  // Blender adds .001 to repeated names and three.js drops the dot (LabRack0.001 → LabRack0001)
  const base = (name) => name.replace(/\.?\d{3}$/, '')
  const show = {
    Nacelle1: n('engine') >= 2, NacelleRing1: n('engine') >= 2, Nozzle1: n('engine') >= 2, Exhaust1: n('engine') >= 2,
    Wing0: n('solar') + n('solarxl') > 0, Wing1: n('solar') + n('solarxl') > 0, WingNeon0: n('solar') + n('solarxl') > 0, WingNeon1: n('solar') + n('solarxl') > 0,
    Reactor1: n('rtg') > 0 || n('engine') >= 2, ReactorGlow1: n('rtg') > 0 || n('engine') >= 2,
    MedBed0: n('medkit') > 0, MedBed1: n('medkit') > 0, MedPillow0: n('medkit') > 0, MedPillow1: n('medkit') > 0,
    MedCabinet: n('medkit') > 0, MedCrossH: n('medkit') > 0, MedCrossV: n('medkit') > 0,
    Scrubber: n('eclss') > 0, ScrubberLed: n('eclss') > 0,
  }
  const instruments = ['camera', 'spectrometer', 'radar', 'magnetometer', 'drill'].filter((id) => n(id)).length
  for (let i = 0; i < 3; i++) { show[`LabRack${i}`] = i < instruments; show[`LabRackLed${i}`] = i < instruments }
  const tanks = Math.min(3, n('eclss') + n('supplies'))
  for (let i = 0; i < 3; i++) show[`WaterTank${i}`] = i < tanks
  scene.traverse((o) => {
    const k = base(o.name)
    if (k in show) o.visible = show[k]
    // Solar wings get real cells; heavy shielding turns the hull silver
    if (o.isMesh && (k === 'Wing0' || k === 'Wing1')) o.material = new THREE.MeshStandardMaterial({ color: '#1d3f9a', metalness: 0.6, roughness: 0.25, emissive: '#081a44' })
    if (o.isMesh && k === 'ShipBody' && shield >= 2) o.material = new THREE.MeshStandardMaterial({ color: '#c9d1dc', metalness: 0.9, roughness: 0.25 })
  })
  return scene
}

function Deck({ places, sel, shield }) {
  const { L } = useT()
  const { scene: source } = useGLTF('/models/deck.glb')
  const scene = useMemo(() => fitToDesign(source, sel || {}, shield || 0), [source, sel, shield])
  const nodes = useNodes(scene)
  const hasMed = (sel?.medkit || 0) > 0
  return (
    <>
      <primitive object={scene} />
      {Object.entries(ROOM_NAMES).map(([room, name]) => nodes[`Room_${room}`] && <RoomLabel key={room} text={room === 'Medbay' && !hasMed ? L(NO_MEDBAY) : L(name)} at={labelSpot(nodes, room)} />)}
      {places.map((p) => <Astronaut key={p.id} place={p} nodes={nodes} />)}
    </>
  )
}

export const CrewInterior = memo(function CrewInterior({ crew, plan, event, destId, sel, shield }) {
  const places = crewPlaces(crew, { plan, event })
  const alarm = event === 'solarStorm' || event === 'radiationBelt' || event === 'co2' || event === 'panic'
  return (
    <Canvas camera={{ position: [15, 21, 21], fov: 40 }} dpr={[1, 2]} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#02040c']} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#e6eeff', '#202638', 0.8]} />
      <directionalLight position={[4, 12, 6]} intensity={1.8} />
      <Stars radius={120} depth={60} count={3000} factor={4} fade speed={0.3} />
      {alarm && <AlarmLight />}
      <Suspense fallback={null}>
        <Drift>
          <Deck places={places} sel={sel} shield={shield} />
        </Drift>
        {destId && <WorldBelow destId={destId} />}
      </Suspense>
      <OrbitControls target={[-1, 0, 0]} enablePan={false} minDistance={14} maxDistance={40} minPolarAngle={0.2} maxPolarAngle={1.1} />
    </Canvas>
  )
})

// Red rotating alarm glow during emergencies
function AlarmLight() {
  const ref = useRef()
  useFrame(({ clock }) => { if (ref.current) ref.current.intensity = 6 + Math.sin(clock.getElapsedTime() * 6) * 5 })
  return <pointLight ref={ref} position={[0, 4, 0]} distance={30} color="#ff3030" />
}

// The whole ship floats gently, like it is drifting in orbit
function Drift({ children }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) { ref.current.position.y = Math.sin(t * 0.4) * 0.15; ref.current.rotation.z = Math.sin(t * 0.25) * 0.01 }
  })
  return <group ref={ref}>{children}</group>
}

// The destination world far below the ship
function WorldBelow({ destId }) {
  const map = useTexture(`/textures/${destId}.jpg`)
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.01 })
  return (
    <mesh ref={ref} position={[-6, -48, -30]}>
      <sphereGeometry args={[40, 96, 96]} />
      <meshStandardMaterial map={map} roughness={1} />
    </mesh>
  )
}
