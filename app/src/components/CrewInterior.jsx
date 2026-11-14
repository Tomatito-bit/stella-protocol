import { Suspense, memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF } from '@react-three/drei'
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

function Deck({ places }) {
  const { L } = useT()
  const { scene } = useGLTF('/models/deck.glb')
  const nodes = useNodes(scene)
  return (
    <>
      <primitive object={scene} />
      {Object.entries(ROOM_NAMES).map(([room, name]) => nodes[`Room_${room}`] && <RoomLabel key={room} text={L(name)} at={labelSpot(nodes, room)} />)}
      {places.map((p) => <Astronaut key={p.id} place={p} nodes={nodes} />)}
    </>
  )
}

export const CrewInterior = memo(function CrewInterior({ crew, plan, event }) {
  const places = crewPlaces(crew, { plan, event })
  const alarm = event === 'solarStorm' || event === 'radiationBelt' || event === 'co2' || event === 'panic'
  return (
    <Canvas camera={{ position: [0, 21, 11], fov: 42 }} dpr={[1, 2]} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#02040c']} />
      <ambientLight intensity={0.9} />
      <hemisphereLight args={['#e6eeff', '#202638', 0.8]} />
      <directionalLight position={[4, 12, 6]} intensity={1.8} />
      {alarm && <AlarmLight />}
      <Suspense fallback={null}>
        <Deck places={places} />
      </Suspense>
      <OrbitControls target={[0, 0, 0]} enablePan={false} minDistance={12} maxDistance={32} minPolarAngle={0.15} maxPolarAngle={0.9} />
    </Canvas>
  )
})

// Red rotating alarm glow during emergencies
function AlarmLight() {
  const ref = useRef()
  useFrame(({ clock }) => { if (ref.current) ref.current.intensity = 6 + Math.sin(clock.getElapsedTime() * 6) * 5 })
  return <pointLight ref={ref} position={[0, 4, 0]} distance={30} color="#ff3030" />
}
