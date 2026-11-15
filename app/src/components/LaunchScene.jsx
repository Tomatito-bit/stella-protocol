import { Suspense, memo, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { GameCanvas } from './GameCanvas'
import { Stars, useTexture, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { Ship } from './Ship3D'
import { T } from '../logic/launch'
import { earthMaterial, atmosphereMaterial, bakeEarth } from './earthShaders'

// Cinematic launch: dawn at a coastal launch complex, ascent until the sky turns black and
// Earth's curve appears below, then the cruise to the destination.

// Rocket look per launcher: superheavy is SLS-like (orange core + 2 white boosters)
const ROCKETS = {
  medium: { core: '#eef1f6', h: 7, r: 0.42, boosters: 0, band: '#1f2937' },
  heavy: { core: '#eef1f6', h: 8.5, r: 0.48, boosters: 2, band: '#1f2937' },
  superheavy: { core: '#d9772b', h: 10, r: 0.6, boosters: 2, band: '#f1f5f9' },
}
const SUN = new THREE.Vector3(-0.75, 0.12, -0.65).normalize() // low dawn sun over the sea
const EARTH_R = 140
// Camera cut: from the beach to high above the planet
const CUT = 9.6

// Where the rocket is at time t (its base); everything else follows this path
const pathAt = (t) => {
  const s = Math.max(0, t - T.liftoff)
  return { x: -s * s * 0.12, y: s * s * 0.9, s } // leans away from the tower (tower is on +x)
}
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k) }
const hash = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x) }

function useClock(start) {
  return () => (performance.now() - start.current) / 1000
}

// Radial sprite textures drawn once (smoke puff and hot glow)
function useSprite(stops) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grd = g.createRadialGradient(64, 64, 2, 64, 64, 64)
    stops.forEach(([o, col]) => grd.addColorStop(o, col))
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  }, [stops])
}
const SMOKE = [[0, 'rgba(255,255,255,0.95)'], [0.45, 'rgba(235,232,236,0.5)'], [1, 'rgba(230,230,235,0)']]
const GLOW = [[0, 'rgba(255,255,240,1)'], [0.2, 'rgba(255,200,110,0.8)'], [0.55, 'rgba(255,120,40,0.25)'], [1, 'rgba(255,80,0,0)']]

// Dawn sky dome that darkens to black space as the rocket climbs
function Sky({ start }) {
  const ref = useRef()
  const now = useClock(start)
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { sunDir: { value: SUN }, dark: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `
      uniform vec3 sunDir; uniform float dark; varying vec3 vDir;
      void main(){
        float h = vDir.y;
        vec3 zenith = vec3(0.10, 0.22, 0.48);
        vec3 mid = vec3(0.45, 0.55, 0.78);
        vec3 horizon = vec3(1.0, 0.62, 0.38);
        vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.18, h));
        col = mix(col, zenith, smoothstep(0.18, 0.75, h));
        float s = max(dot(normalize(vDir), sunDir), 0.0);
        col += vec3(1.0, 0.5, 0.2) * pow(s, 14.0) * 0.4 + vec3(1.0, 0.92, 0.75) * pow(s, 900.0) * 1.6;
        col = mix(col, vec3(0.03, 0.08, 0.2) * smoothstep(-0.1, 0.3, -h + 0.25) + vec3(0.004), dark);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }), [])
  useFrame(({ camera }) => {
    const t = now()
    const { y } = pathAt(t)
    mat.uniforms.dark.value = t >= CUT ? 1 : smooth(10, 60, y)
    if (ref.current) { ref.current.position.copy(camera.position); ref.current.visible = t < T.transfer }
  })
  return <mesh ref={ref} material={mat}><sphereGeometry args={[400, 48, 32]} /></mesh>
}

// Coastal launch complex: sea, beach, pad, lattice tower with access arm, floodlights
function Complex({ start }) {
  const arm = useRef()
  const beacons = useRef()
  const now = useClock(start)
  const glow = useSprite(GLOW)
  useFrame(({ clock }) => {
    const t = now()
    if (arm.current) arm.current.rotation.y = -smooth(T.ignition - 3, T.ignition - 1, t) * 1.5 // crew access arm swings away well before ignition
    beacons.current?.children.forEach((b, i) => { b.material.opacity = Math.sin(clock.getElapsedTime() * 3 + i) > 0 ? 1 : 0.15 })
  })
  const lattice = useMemo(() => {
    const parts = []
    for (let y = 0; y < 11; y += 1) {
      parts.push([0, y, 0.38, 0.8, 0.05, 0.05], [0, y, -0.38, 0.8, 0.05, 0.05], [0.38, y, 0, 0.05, 0.05, 0.8], [-0.38, y, 0, 0.05, 0.05, 0.8])
      parts.push([0, y + 0.5, 0.38, 1.05, 0.04, 0.04, 0.9], [0.38, y + 0.5, 0, 0.04, 0.04, 1.05, 0, 0.9])
    }
    return parts
  }, [])
  return (
    <group>
      {/* Sea and beach */}
      <mesh position={[0, -0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[380, 64]} /><meshStandardMaterial color="#3a6f96" metalness={0.35} roughness={0.28} /></mesh>
      <mesh position={[0, -0.6, 2]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[24, 48]} /><meshStandardMaterial color="#cdb489" roughness={1} /></mesh>
      <mesh position={[0, -0.58, 2]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[11, 48]} /><meshStandardMaterial color="#6f7a6a" roughness={1} /></mesh>
      {/* Pad and flame trench */}
      <mesh position={[0, -0.4, 0]}><cylinderGeometry args={[2.4, 2.9, 0.4, 32]} /><meshStandardMaterial color="#8b8f97" roughness={0.9} /></mesh>
      <mesh position={[0, -0.18, 0]}><boxGeometry args={[3.2, 0.12, 3.2]} /><meshStandardMaterial color="#5b616b" roughness={0.8} /></mesh>
      {/* Lattice service tower */}
      <group position={[3.3, -0.1, 0]}>
        {[[0.38, 0.38], [-0.38, 0.38], [0.38, -0.38], [-0.38, -0.38]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 5.6, z]}><boxGeometry args={[0.09, 11.5, 0.09]} /><meshStandardMaterial color="#b4472f" metalness={0.5} roughness={0.5} /></mesh>
        ))}
        {lattice.map(([x, y, z, w, h, d, rz = 0, ry = 0], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[0, ry, rz]}><boxGeometry args={[w, h, d]} /><meshStandardMaterial color="#c4573a" metalness={0.5} roughness={0.5} /></mesh>
        ))}
        <mesh position={[0, 11.6, 0]}><cylinderGeometry args={[0.04, 0.04, 1.6, 6]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
        {/* Crew access arm */}
        <group ref={arm} position={[-0.38, 8.2, 0]}>
          <mesh position={[-0.6, 0, 0]}><boxGeometry args={[1.2, 0.35, 0.45]} /><meshStandardMaterial color="#d6d9de" metalness={0.4} roughness={0.5} /></mesh>
        </group>
        <group ref={beacons}>
          {[11.3, 6.5].map((y) => <mesh key={y} position={[0, y, 0.45]}><sphereGeometry args={[0.09, 10, 10]} /><meshBasicMaterial color="#ff2a2a" transparent toneMapped={false} /></mesh>)}
        </group>
      </group>
      {/* Water tower and floodlight poles */}
      <group position={[-7, 0, -6]}>
        <mesh position={[0, 2.5, 0]}><cylinderGeometry args={[0.08, 0.08, 5, 6]} /><meshStandardMaterial color="#9ca3af" /></mesh>
        <mesh position={[0, 5.4, 0]}><sphereGeometry args={[0.9, 20, 16]} /><meshStandardMaterial color="#e5e7eb" roughness={0.5} /></mesh>
      </group>
      {[[-4, -3], [4.5, -4.5], [-3.5, 5]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 2.5, 0]}><cylinderGeometry args={[0.05, 0.07, 5, 6]} /><meshStandardMaterial color="#6b7280" /></mesh>
          <sprite position={[0, 5.1, 0]} scale={[1.3, 1.3, 1]}><spriteMaterial map={glow} color="#fff3d6" blending={THREE.AdditiveBlending} depthWrite={false} transparent /></sprite>
        </group>
      ))}
    </group>
  )
}

// Engine plume: white-hot core, orange body, shock diamonds and a big glow; widens as the air thins
function Plume({ scale = 1, start }) {
  const ref = useRef()
  const glow = useSprite(GLOW)
  const now = useClock(start)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const alt = start ? pathAt(now()).y : 0
    const widen = 1 + smooth(5, 70, alt) * 1.8
    if (ref.current) ref.current.scale.set(scale * widen, scale * (1 + Math.sin(t * 45) * 0.08) * (1 + smooth(5, 70, alt) * 0.6), scale * widen)
  })
  return (
    <group ref={ref}>
      <mesh position={[0, -1.6, 0]}><coneGeometry args={[0.42, 3.2, 20, 1, true]} /><meshBasicMaterial color="#ff8a2b" transparent opacity={0.7} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      <mesh position={[0, -1.0, 0]}><coneGeometry args={[0.24, 2.0, 20, 1, true]} /><meshBasicMaterial color="#ffe0a3" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {[0.55, 1.05, 1.5].map((y, i) => (
        <mesh key={y} position={[0, -y, 0]} scale={[1, 1.6, 1]}><sphereGeometry args={[0.1 - i * 0.02, 10, 10]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      ))}
      <sprite position={[0, -0.6, 0]} scale={[3.2, 3.2, 1]}><spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent /></sprite>
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
      <mesh position={[0, h * 0.25, 0]}><cylinderGeometry args={[0.285, 0.285, 0.1, 24]} /><meshStandardMaterial color="#111827" /></mesh>
      <mesh position={[0, h * 0.02 - 0.15, 0]}><cylinderGeometry args={[0.18, 0.3, 0.35, 16, 1, true]} /><meshStandardMaterial color="#374151" metalness={0.7} side={THREE.DoubleSide} /></mesh>
      <BoosterFlame start={start} />
    </group>
  )
}
function BoosterFlame({ start }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(() => { if (ref.current) { const t = now(); ref.current.visible = t > T.ignition && t < T.boosters } })
  return <group ref={ref} position={[0, -0.35, 0]} visible={false}><Plume scale={0.7} start={start} /></group>
}

// The rocket stack. The first stage falls away at MECO and the fairing opens to show the spacecraft.
function Rocket({ kind, sel, crewed, shield, start }) {
  const r = ROCKETS[kind] || ROCKETS.heavy
  const rocket = useRef()
  const stage1 = useRef()
  const fairL = useRef()
  const fairR = useRef()
  const light = useRef()
  const now = useClock(start)
  useFrame(({ clock }) => {
    const t = now()
    const p = pathAt(t)
    if (rocket.current) {
      rocket.current.position.set(p.x, p.y, 0)
      rocket.current.rotation.z = Math.min(0.5, p.s * 0.05) // gravity turn, away from the tower
    }
    if (light.current) light.current.intensity = t > T.ignition && t < T.meco ? 60 + Math.sin(clock.getElapsedTime() * 30) * 15 : 0
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
      <pointLight ref={light} position={[0, -1.5, 1]} color="#ff9a40" distance={30} intensity={0} />
      <group ref={stage1}>
        <mesh position={[0, h1 / 2, 0]}><cylinderGeometry args={[r.r, r.r, h1, 40]} /><meshStandardMaterial color={r.core} roughness={0.55} /></mesh>
        {[0.15, 0.55, 0.92].map((f) => <mesh key={f} position={[0, h1 * f, 0]}><cylinderGeometry args={[r.r + 0.006, r.r + 0.006, 0.08, 40]} /><meshStandardMaterial color={r.band} /></mesh>)}
        {[-0.22, 0, 0.22].map((x) => (
          <mesh key={x} position={[x * r.r * 2.2, -0.2, 0]}><cylinderGeometry args={[0.1, 0.18, 0.4, 14, 1, true]} /><meshStandardMaterial color="#374151" metalness={0.7} side={THREE.DoubleSide} /></mesh>
        ))}
        <ShowBetween start={start} from={T.ignition} until={T.meco} y={-0.35}><Plume scale={r.r * 2.2} start={start} /></ShowBetween>
        {r.boosters > 0 && [-1, 1].map((s) => <Booster key={s} x={s * (r.r + 0.3)} h={h1} start={start} />)}
      </group>
      <mesh position={[0, h1 + h2 / 2, 0]}><cylinderGeometry args={[r.r * 0.85, r.r, h2, 40]} /><meshStandardMaterial color="#e5e7eb" roughness={0.45} /></mesh>
      <ShowBetween start={start} from={T.meco + 0.4} until={T.fairing + 1.5} y={h1 - 0.1}><Plume scale={r.r * 1.2} start={start} /></ShowBetween>
      <group position={[0, h1 + h2 + 0.9, 0]} scale={0.38}>
        <Ship sel={sel} crewed={crewed} shield={shield} spin={0} />
      </group>
      <group position={[0, h1 + h2, 0]}>
        <mesh ref={fairL}><cylinderGeometry args={[r.r * 0.9, r.r * 0.85, 2.2, 32, 1, true, 0, Math.PI]} /><meshStandardMaterial color="#f8fafc" side={THREE.DoubleSide} roughness={0.4} /></mesh>
        <mesh ref={fairR}><cylinderGeometry args={[r.r * 0.9, r.r * 0.85, 2.2, 32, 1, true, Math.PI, Math.PI]} /><meshStandardMaterial color="#f8fafc" side={THREE.DoubleSide} roughness={0.4} /></mesh>
        <mesh position={[0, 1.35, 0]}><coneGeometry args={[r.r * 0.9, 0.9, 32]} /><meshStandardMaterial color="#f8fafc" roughness={0.4} /></mesh>
      </group>
    </group>
  )
}

function ShowBetween({ start, from, until, y, children }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(() => { if (ref.current) { const t = now(); ref.current.visible = t > from && t < until } })
  return <group ref={ref} position={[0, y, 0]} visible={false}>{children}</group>
}

// Rolling ground cloud at ignition plus the smoke trail the rocket leaves in the sky
function Smoke({ start }) {
  const tex = useSprite(SMOKE)
  const N = 220
  const GROUND = 100
  const mesh = useRef()
  const now = useClock(start)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => {
    const ground = i < GROUND
    return {
      ground,
      a: hash(i, 1) * Math.PI * 2,
      v: 0.6 + hash(i, 2) * 1.8,
      born: ground ? T.ignition - 0.2 + hash(i, 3) * 4 : T.liftoff + 0.6 + ((i - GROUND) / (N - GROUND)) * (T.meco - T.liftoff),
      s: 0.7 + hash(i, 4) * 1.3,
    }
  }), [])
  useFrame(({ camera }) => {
    const t = now()
    seeds.forEach((p, i) => {
      const age = t - p.born
      if (age < 0 || t > T.transfer || (p.ground && t >= CUT)) dummy.scale.setScalar(0.0001)
      else if (p.ground) {
        dummy.position.set(Math.cos(p.a) * age * p.v * 1.8, 0.2 + age * 0.3, Math.sin(p.a) * age * p.v * 0.9)
        dummy.scale.setScalar(p.s * (1 + age * 1.1))
      } else {
        const at = pathAt(p.born)
        dummy.position.set(at.x + Math.cos(p.a) * age * 0.25, at.y - 1.2 - age * 0.4, Math.sin(p.a) * age * 0.25)
        dummy.scale.setScalar((0.8 + p.s * 0.5) * (1 + age * 0.6) * (1 + at.y * 0.012))
      }
      dummy.quaternion.copy(camera.quaternion)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, N]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} color="#efe7e2" opacity={0.85} />
    </instancedMesh>
  )
}

// High above: Earth's curve and blue atmosphere appear under the rocket
function EarthBelow({ start }) {
  const g = useRef()
  const spin = useRef()
  const now = useClock(start)
  // Seen from above, the planet is lit by the Sun higher in the sky
  const gl = useThree((s) => s.gl)
  const uni = useMemo(() => { const sun = new THREE.Vector3(0.75, 0.35, 0.3).normalize(); const tex = bakeEarth(gl); return { earth: { sunDir: { value: sun }, surface: { value: tex.surface }, extra: { value: tex.extra } }, air: { sunDir: { value: sun } } } }, [gl])
  useFrame((_, dt) => {
    const t = now()
    const p = pathAt(t)
    const a = smooth(CUT, T.transfer, t)
    if (!g.current) return
    g.current.visible = t >= CUT && t < T.transfer
    // The planet drops away below, so its horizon curves more and more
    g.current.position.set(p.x - 30, p.y - EARTH_R - 6 - a * 55, -60)
    if (spin.current) spin.current.rotation.y += dt * 0.01
  })
  return (
    <group ref={g} visible={false} rotation={[-1.25, 0, 0.1]}>
      <mesh ref={spin}><sphereGeometry args={[EARTH_R, 128, 128]} /><shaderMaterial args={[{ ...earthMaterial, uniforms: uni.earth }]} /></mesh>
      <mesh scale={1.035}><sphereGeometry args={[EARTH_R, 64, 64]} /><shaderMaterial args={[{ ...atmosphereMaterial, uniforms: uni.air, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }]} /></mesh>
    </group>
  )
}

// Three camera shots: low angle on the pad, tracking the climb, then a chase shot looking down at Earth
function Director({ start, kind }) {
  const now = useClock(start)
  const look = useMemo(() => new THREE.Vector3(), [])
  const cam = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera }) => {
    const t = now()
    if (t >= T.transfer) return
    const p = pathAt(t)
    const top = kind === 'superheavy' ? 5 : 4
    const shake = t > T.ignition && t < T.maxQ + 1 ? (Math.random() - 0.5) * 0.1 : 0
    // Shot 1 → 2: from a low angle on the beach, rising with the rocket
    const low = new THREE.Vector3(10, 1.2 + p.y * 0.85, 17)
    // Shot 3: behind and above the rocket, looking down past it at the planet
    const chase = new THREE.Vector3(p.x + 9, p.y + 7, 15)
    // Hard cut to the chase shot, then it drifts slowly back to reveal more of the planet
    const k = t >= CUT ? 1 : 0
    chase.add(new THREE.Vector3(0, smooth(CUT, T.transfer, t) * 6, smooth(CUT, T.transfer, t) * 6))
    cam.lerpVectors(low, chase, k)
    camera.position.set(cam.x + shake, cam.y + shake, cam.z)
    look.set(p.x, p.y + top - k * 6, 0)
    camera.lookAt(look)
  })
  return null
}

// Cruise: Earth shrinks behind, the destination grows ahead, then the braking burn
function Cruise({ destId, sel, crewed, shield, start }) {
  const maps = { moon: '/textures/moon.jpg', mars: '/textures/mars.jpg', europa: '/textures/europa.jpg' }
  const map = useTexture(maps[destId])
  const group = useRef()
  const planet = useRef()
  const earth = useRef()
  const ship = useRef()
  const glow = useRef()
  const now = useClock(start)
  const space = useMemo(() => new THREE.Color('#02040c'), [])
  const sunTex = useSprite(GLOW)
  const gl = useThree((s) => s.gl)
  const uni = useMemo(() => { const tex = bakeEarth(gl, 1024); return { earth: { sunDir: { value: new THREE.Vector3(1, 0.3, 0.4).normalize() }, surface: { value: tex.surface }, extra: { value: tex.extra } } } }, [gl])
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
      planet.current.scale.setScalar(0.4 + k * 3.2)
      planet.current.position.set(3 - k * 3, -0.5 - k * 3, -30 + k * 26)
      planet.current.rotation.y += 0.002
    }
    if (earth.current) {
      earth.current.scale.setScalar(Math.max(0.05, 1.6 - k * 1.5))
      earth.current.position.set(-4 - k * 4, 2.5 + k * 1.5, -6 - k * 20)
    }
    if (ship.current) {
      ship.current.position.set(Math.sin(t * 0.8) * 0.15, 0.6 + Math.sin(t * 1.3) * 0.05, 2)
      ship.current.rotation.y = t > T.insertion ? Math.PI : 0 // flips to burn backwards
    }
    if (glow.current) glow.current.visible = t > T.insertion
  })
  return (
    <group ref={group} visible={false}>
      <sprite position={[14, 6, -40]} scale={[16, 16, 1]}><spriteMaterial map={sunTex} blending={THREE.AdditiveBlending} depthWrite={false} transparent /></sprite>
      <mesh ref={earth}><sphereGeometry args={[1, 64, 64]} /><shaderMaterial args={[{ ...earthMaterial, uniforms: uni.earth }]} /></mesh>
      <mesh ref={planet}><sphereGeometry args={[1, 64, 64]} /><meshStandardMaterial map={map} roughness={0.95} /></mesh>
      <group ref={ship} scale={0.45}>
        <Ship sel={sel} crewed={crewed} shield={shield} spin={0} />
        <group ref={glow} position={[0, -2.6, 0]} visible={false}><Plume scale={0.6} /></group>
      </group>
    </group>
  )
}

// Pad, rocket and smoke, hidden once the cruise starts
function LaunchStage({ kind, sel, crewed, shield, start }) {
  const ref = useRef()
  const ground = useRef()
  const now = useClock(start)
  useFrame(() => {
    const t = now()
    if (ref.current) ref.current.visible = t < T.transfer
    if (ground.current) ground.current.visible = t < CUT
  })
  return (
    <group ref={ref}>
      <group ref={ground}><Complex start={start} /></group>
      <Smoke start={start} />
      <Rocket kind={kind} sel={sel} crewed={crewed} shield={shield} start={start} />
    </group>
  )
}

// Stars fade in once the sky turns black
function SpaceStars({ start }) {
  const ref = useRef()
  const now = useClock(start)
  useFrame(({ camera }) => {
    if (!ref.current) return
    ref.current.visible = now() >= CUT
    ref.current.position.copy(camera.position)
  })
  return <group ref={ref} visible={false}><Stars radius={120} depth={60} count={2000} factor={4} fade /></group>
}

// Warm dawn light that turns into harsh white sunlight in space
function Lights({ start }) {
  const sun = useRef()
  const hemi = useRef()
  const now = useClock(start)
  useFrame(() => {
    const t = now()
    const d = t >= CUT ? 1 : smooth(10, 60, pathAt(t).y)
    if (sun.current) sun.current.color.setRGB(1, 0.78 + d * 0.22, 0.6 + d * 0.4)
    if (hemi.current) hemi.current.intensity = 0.9 - d * 0.6
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffd2a8', '#203048', 0.9]} />
      <directionalLight ref={sun} position={[-30, 8, -20]} intensity={2.6} />
      <directionalLight position={[10, 6, 14]} intensity={0.8} color="#9fb8ff" />
    </>
  )
}

export const LaunchScene = memo(function LaunchScene({ kind, destId, sel, crewed, shield, start }) {
  return (
    <GameCanvas camera={{ position: [10, 2, 17], fov: 45, far: 2000 }} gl={{ toneMapping: THREE.ACESFilmicToneMapping }}>
      <color attach="background" args={['#02040c']} />
      <Sky start={start} />
      <Lights start={start} />
      <SpaceStars start={start} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 5, -5]} scale={[10, 3, 1]} />
        <Lightformer intensity={1.4} color="#ffb070" position={[-6, 1, -4]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
      </Environment>
      <EarthBelow start={start} />
      <LaunchStage kind={kind} sel={sel} crewed={crewed} shield={shield} start={start} />
      <Suspense fallback={null}>
        <Cruise destId={destId} sel={sel} crewed={crewed} shield={shield} start={start} />
      </Suspense>
      <Director start={start} kind={kind} />
    </GameCanvas>
  )
})
