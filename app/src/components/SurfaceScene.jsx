import { Suspense, memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GameCanvas } from './GameCanvas'

// Surface view: the planet's ground with the exploration vehicles (official NASA 3D models,
// lightened in Blender): Perseverance-style rover, Ingenuity helicopter, Apollo lander on the Moon.

const MAPS = { moon: '/textures/moon.jpg', mars: '/textures/mars.jpg' }
const SKY = { mars: '#c99a76', moon: '#03040a' }
const LOOP = 13 // radius of the rover's drive loop (m)

// Smooth rolling hills (deterministic, so the rover can sit exactly on the ground)
const hill = (x, z) => Math.sin(x * 0.11) * Math.cos(z * 0.09) * 1.4 + Math.sin(x * 0.27 + z * 0.19) * 0.45 + Math.cos(z * 0.33 - x * 0.07) * 0.3
const groundY = (x, z) => {
  const r = Math.hypot(x, z / 0.65)
  const road = Math.exp(-((r - LOOP) ** 2) / 10) // the rover's track is a little flatter
  return hill(x, z) * (1 - 0.6 * road)
}

function Ground({ destId }) {
  const map = useTexture(MAPS[destId], (t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(5, 5)
    t.colorSpace = THREE.SRGBColorSpace
  })
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(140, 140, 110, 110)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, groundY(p.getX(i), p.getZ(i)))
    g.computeVertexNormals()
    return g
  }, [])
  return <mesh geometry={geo}><meshStandardMaterial map={map} roughness={1} color={destId === 'mars' ? '#e3b08a' : '#b9b9b9'} /></mesh>
}

function Rover({ stuck, slow, onPose }) {
  const { scene } = useGLTF('/models/rover.glb')
  const model = useMemo(() => scene.clone(true), [scene])
  const ref = useRef()
  const a = useRef(0)
  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    if (!stuck) a.current += dt * (slow ? 0.025 : 0.07)
    const t = a.current
    const x = Math.cos(t) * LOOP
    const z = Math.sin(t) * LOOP * 0.65
    const nx = Math.cos(t + 0.05) * LOOP
    const nz = Math.sin(t + 0.05) * LOOP * 0.65
    g.position.set(x, groundY(x, z) + (stuck ? -0.25 : 0), z)
    g.rotation.y = Math.atan2(nx - x, nz - z)
    // a little bounce over the rocks, or a helpless shake when stuck
    g.rotation.z = stuck ? Math.sin(performance.now() / 90) * 0.02 : Math.sin(t * 40) * 0.01
    if (onPose) onPose(g.position)
  })
  return <group ref={ref}><primitive object={model} /></group>
}

// Ingenuity flies figure-eights above the rover, rotors spinning in opposite directions
function Helicopter({ target }) {
  const { scene } = useGLTF('/models/ingenuity.glb')
  const model = useMemo(() => scene.clone(true), [scene])
  const rotors = useRef(null)
  const ref = useRef()
  useFrame(({ clock }, dt) => {
    const t = clock.getElapsedTime()
    if (!rotors.current) { const r = []; model.traverse((o) => { if (/^Rotor/.test(o.name)) r.push(o) }); rotors.current = r }
    rotors.current.forEach((r, i) => { r.rotation.y += dt * (i % 2 ? -40 : 40) })
    const g = ref.current
    if (!g || !target.current) return
    const p = target.current
    g.position.set(p.x + Math.sin(t * 0.5) * 6, p.y + 5 + Math.sin(t * 1.3) * 0.6, p.z + Math.sin(t) * 3)
    g.rotation.z = Math.sin(t * 0.5) * 0.12
  })
  return <group ref={ref} scale={1.6}><primitive object={model} /></group>
}

function Lander() {
  const { scene } = useGLTF('/models/lander.glb')
  const model = useMemo(() => scene.clone(true), [scene])
  return <primitive object={model} position={[-4, groundY(-4, -2) - 0.2, -2]} rotation={[0, 0.6, 0]} scale={0.9} />
}

// Dust kicked up behind the wheels (or a big cloud when stuck)
function Dust({ target, stuck, color }) {
  const N = 90
  const ref = useRef()
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); return g }, [])
  const life = useRef(Array.from({ length: N }, (_, i) => ({ t: i / N, ox: 0, oz: 0, y: 0 })))
  useFrame((_, dt) => {
    if (!ref.current || !target.current) return
    const attr = ref.current.geometry.attributes.position
    const p = target.current
    life.current.forEach((d, i) => {
      d.t += dt * (stuck ? 0.9 : 0.5)
      if (d.t > 1) { d.t = 0; d.ox = p.x + (Math.random() - 0.5) * 2.4; d.oz = p.z + (Math.random() - 0.5) * 2.4; d.y = p.y }
      attr.setXYZ(i, d.ox, d.y + d.t * (stuck ? 2.5 : 1.2), d.oz)
    })
    attr.needsUpdate = true
  })
  return <points ref={ref} geometry={geo}><pointsMaterial color={color} size={stuck ? 0.5 : 0.28} transparent opacity={0.5} depthWrite={false} /></points>
}

// Something worth a look: a glowing ring on the ground
function Marker({ target, color, pit }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current || !target.current) return
    const p = target.current
    ref.current.position.set(p.x + 3, groundY(p.x + 3, p.z + 2) + 0.05, p.z + 2)
    const k = (clock.getElapsedTime() * 0.8) % 1
    ref.current.children[0].scale.setScalar(0.6 + k * 1.6)
    ref.current.children[0].material.opacity = 1 - k
  })
  return (
    <group ref={ref}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.8, 0.95, 40]} /><meshBasicMaterial color={color} transparent toneMapped={false} /></mesh>
      {pit
        ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[1.6, 32]} /><meshBasicMaterial color="#050505" /></mesh>
        : <mesh position={[0, 0.3, 0]}><dodecahedronGeometry args={[0.45, 0]} /><meshStandardMaterial color="#9c4a32" roughness={0.9} flatShading /></mesh>}
    </group>
  )
}

function Follow({ target }) {
  const look = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, clock }) => {
    if (!target.current) return
    const p = target.current
    const a = clock.getElapsedTime() * 0.05
    camera.position.lerp(new THREE.Vector3(p.x + Math.cos(a) * 9, p.y + 5.5, p.z + Math.sin(a) * 9 + 4), 0.04)
    look.lerp(p, 0.1)
    camera.lookAt(look.x, look.y + 1, look.z)
  })
  return null
}

export const SurfaceScene = memo(function SurfaceScene({ destId, heli, stuck, event, paused }) {
  const pose = useRef(null)
  const setPose = (p) => { pose.current = p }
  const mars = destId === 'mars'
  const storm = event === 'surfaceStorm'
  return (
    <GameCanvas paused={paused} camera={{ position: [18, 8, 14], fov: 50, far: 400 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={[SKY[destId] || '#000']} />
      <fog attach="fog" args={[mars ? '#c99a76' : '#03040a', storm ? 6 : mars ? 30 : 60, storm ? 35 : mars ? 120 : 200]} />
      {!mars && <Stars radius={150} depth={40} count={1500} factor={4} fade />}
      <hemisphereLight args={[mars ? '#ffe2c8' : '#cfd8ff', mars ? '#5a3020' : '#111', mars ? 0.9 : 0.35]} />
      <directionalLight position={mars ? [20, 25, 10] : [30, 10, -10]} intensity={mars ? 2.2 : 3} color={mars ? '#ffd8b0' : '#ffffff'} />
      <Suspense fallback={null}>
        <Ground destId={destId} />
        <Rover stuck={stuck} slow={event === 'regolithJam'} onPose={setPose} />
        {mars && heli && <Helicopter target={pose} />}
        {!mars && <Lander />}
      </Suspense>
      <Dust target={pose} stuck={stuck || storm} color={mars ? '#d79a6a' : '#9a9a9a'} />
      {event === 'leopardRock' && <Marker target={pose} color="#ffd166" />}
      {event === 'lavaTube' && <Marker target={pose} color="#5ad1ff" pit />}
      <Follow target={pose} />
    </GameCanvas>
  )
})
