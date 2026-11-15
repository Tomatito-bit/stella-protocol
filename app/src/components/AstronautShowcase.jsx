import { Suspense, memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, Stars, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { dressAstronaut } from './dressAstronaut'

// Character-select showcase: the Blender astronaut tinted in the character's colour,
// standing on a glowing platform and greeting the player.
useGLTF.preload('/models/astronaut.glb')

function Figure({ person, pose }) {
  const { scene } = useGLTF('/models/astronaut.glb')
  const model = useMemo(() => dressAstronaut(scene, person), [scene, person])
  const root = useRef()
  const joints = useRef(null)
  useFrame(({ clock }) => {
    if (!joints.current) { const j = {}; model.traverse((o) => { j[o.name] = o }); joints.current = j }
    const J = joints.current
    const t = clock.getElapsedTime()
    const s = Math.sin
    const set = (n, x, z = 0) => { if (J[n]) { J[n].rotation.x = x; J[n].rotation.z = z } }
    if (root.current) root.current.rotation.y = -0.35 + s(t * 0.5) * 0.35
    // Each style greets differently: wave, thumbs-up, look around, open arms
    if (pose === 'bold') { set('ShoulderR', -2.6 + s(t * 6) * 0.25, -0.3); set('ElbowR', -0.6); set('ShoulderL', 0.1, 0.15) }
    else if (pose === 'science') { set('ShoulderL', -0.7, 0.35); set('ElbowL', -1.2); set('ShoulderR', -0.3, -0.25); set('ElbowR', -0.5); set('Head', 0.12 + s(t * 1.5) * 0.06) }
    else if (pose === 'diplomat') { set('ShoulderL', -0.5, 0.9 + s(t * 2) * 0.1); set('ShoulderR', -0.5, -0.9 - s(t * 2) * 0.1); set('ElbowL', -0.3); set('ElbowR', -0.3) }
    else { set('ShoulderR', -0.2, -0.15); set('ShoulderL', -0.2, 0.15); set('ElbowL', -1.6); set('ElbowR', -1.6); set('Head', s(t * 0.8) * 0.1) }
    if (pose !== 'science') set('Head', s(t * 0.9) * 0.08)
    model.position.y = s(t * 1.4) * 0.02
  })
  return <group ref={root}><primitive object={model} /></group>
}

function Platform({ color }) {
  const ring = useRef()
  useFrame(({ clock }) => { if (ring.current) ring.current.rotation.z = clock.getElapsedTime() * 0.6 })
  return (
    <group>
      <mesh position={[0, -0.06, 0]}><cylinderGeometry args={[0.9, 1.0, 0.12, 64]} /><meshStandardMaterial color="#1a2238" metalness={0.8} roughness={0.3} /></mesh>
      <mesh ref={ring} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.86, 64, 1, 0, Math.PI * 1.6]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.3, 0.8]} color={color} intensity={4} distance={4} />
    </group>
  )
}

export const AstronautShowcase = memo(function AstronautShowcase({ person, pose }) {
  const color = person.color
  return (
    <Canvas camera={{ position: [0, 1.15, 4.7], fov: 36 }} dpr={[1, 2]} gl={{ toneMapping: THREE.ACESFilmicToneMapping }} onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 3]} intensity={2.4} />
      <directionalLight position={[-3, 2, -2]} intensity={1.2} color={color} />
      <Stars radius={40} depth={20} count={1200} factor={2.5} fade />
      <Suspense fallback={null}>
        <Figure person={person} pose={pose} />
      </Suspense>
      <Platform color={color} />
      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={3} blur={2} far={2} />
    </Canvas>
  )
})
