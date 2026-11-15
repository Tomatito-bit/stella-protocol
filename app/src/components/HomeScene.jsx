import { memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { earthMaterial, cloudMaterial, atmosphereMaterial } from './earthShaders'

// Home screen: Earth seen from the Astraea's observation deck, with the Sun rising over the limb.
const SUN = new THREE.Vector3(0.65, 0.5, -0.55).normalize()
const EARTH_POS = [0, -30.5, -26]
const R = 30
const SUN_POS = [16, 1.6, -48]

function Earth() {
  const earth = useRef()
  const clouds = useRef()
  const uni = useMemo(() => ({
    earth: { sunDir: { value: SUN } },
    clouds: { sunDir: { value: SUN }, time: { value: 0 } },
    air: { sunDir: { value: SUN } },
  }), [])
  useFrame(({ clock }, dt) => {
    if (earth.current) earth.current.rotation.y += dt * 0.012
    if (clouds.current) {
      clouds.current.rotation.y += dt * 0.017
      clouds.current.material.uniforms.time.value = clock.getElapsedTime()
    }
  })
  return (
    <group position={EARTH_POS} rotation={[-0.75, 0, 0.08]}>
      <mesh ref={earth}>
        <sphereGeometry args={[R, 160, 160]} />
        <shaderMaterial args={[{ ...earthMaterial, uniforms: uni.earth }]} />
      </mesh>
      <mesh ref={clouds}>
        <sphereGeometry args={[R * 1.008, 160, 160]} />
        <shaderMaterial args={[{ ...cloudMaterial, uniforms: uni.clouds, transparent: true, depthWrite: false }]} />
      </mesh>
      <mesh scale={1.05}>
        <sphereGeometry args={[R, 96, 96]} />
        <shaderMaterial args={[{ ...atmosphereMaterial, uniforms: uni.air, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }]} />
      </mesh>
    </group>
  )
}

// Glowing Sun made from a generated radial gradient (no image files)
function Sun() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    grad.addColorStop(0, 'rgba(255,255,240,1)')
    grad.addColorStop(0.08, 'rgba(255,230,170,1)')
    grad.addColorStop(0.25, 'rgba(255,150,50,0.55)')
    grad.addColorStop(0.6, 'rgba(255,90,20,0.12)')
    grad.addColorStop(1, 'rgba(255,60,0,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])
  const ref = useRef()
  useFrame(({ clock }) => { if (ref.current) ref.current.scale.setScalar(13 + Math.sin(clock.getElapsedTime() * 1.3) * 0.4) })
  return (
    <group position={SUN_POS}>
      <sprite ref={ref}><spriteMaterial map={tex} blending={THREE.AdditiveBlending} depthWrite={false} transparent /></sprite>
      <sprite scale={[40, 1.2, 1]}><spriteMaterial map={tex} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.5} /></sprite>
    </group>
  )
}

// The camera drifts slightly, and follows the mouse a little for parallax
function Drift() {
  useFrame(({ camera, clock, pointer }) => {
    const t = clock.getElapsedTime()
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.35 + Math.sin(t * 0.15) * 0.2, 0.03)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.2 + Math.sin(t * 0.21) * 0.1, 0.03)
    camera.lookAt(0, -1.2, -15)
  })
  return null
}

export const HomeScene = memo(function HomeScene() {
  return (
    <Canvas camera={{ position: [0, 0, 0], fov: 55 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={['#02030a']} />
      <Stars radius={120} depth={60} count={4000} factor={4} fade speed={0.4} />
      <Sun />
      <Earth />
      <Drift />
    </Canvas>
  )
})
