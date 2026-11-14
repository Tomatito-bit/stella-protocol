import { memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

// 3D spacecraft that the player builds: each selected part appears attached to the bus.
// Missing critical systems show as red wireframe "ghosts" so the player sees what to add.
const n = (sel, id) => sel[id] || 0

const GOLD = { color: '#e0b04c', metalness: 0.35, roughness: 0.3, emissive: '#3a2600', emissiveIntensity: 0.25 }
const WHITE = { color: '#e5e9f2', metalness: 0.2, roughness: 0.5 }
const STEEL = { color: '#8e99ad', metalness: 0.8, roughness: 0.3 }
const DARK = { color: '#2a3245', metalness: 0.5, roughness: 0.5 }

// New parts grow in instead of popping
function Appear({ children, ...props }) {
  const ref = useRef()
  useFrame((_, dt) => {
    const g = ref.current
    if (g && g.scale.x < 1) g.scale.setScalar(Math.min(1, g.scale.x + dt * 4))
  })
  return <group ref={ref} scale={0.01} {...props}>{children}</group>
}

function Ghost({ children, ...props }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.material.opacity = 0.35 + Math.sin(clock.getElapsedTime() * 4) * 0.2
  })
  return (
    <mesh ref={ref} {...props}>
      {children}
      <meshBasicMaterial color="#f87171" wireframe transparent />
    </mesh>
  )
}

function SolarWing({ side, index, xl }) {
  const len = xl ? 3.2 : 1.1
  const x = side * (0.9 + index * 1.2 + len / 2)
  return (
    <Appear position={[0, xl ? -0.25 : 0.15, 0]}>
      <mesh position={[side * (0.75 + index * 1.2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4 + index * 0.1, 8]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
      <mesh position={[x, 0, 0]}>
        <boxGeometry args={[len, 0.04, xl ? 1.1 : 0.75]} />
        <meshStandardMaterial color="#1b3a8a" metalness={0.6} roughness={0.25} emissive="#0b1d4a" />
      </mesh>
      <mesh position={[x, 0.025, 0]}>
        <boxGeometry args={[len, 0.005, 0.02]} />
        <meshStandardMaterial color="#9fb3d9" />
      </mesh>
    </Appear>
  )
}

function Dish() {
  const geo = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const r = (i / 12) * 0.55
      pts.push(new THREE.Vector2(r, r * r * 0.9))
    }
    return new THREE.LatheGeometry(pts, 40)
  }, [])
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial {...WHITE} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
        <meshStandardMaterial {...STEEL} />
      </mesh>
    </group>
  )
}

function Ship({ sel, crewed, shield }) {
  const root = useRef()
  useFrame((_, dt) => {
    if (root.current) root.current.rotation.y += dt * 0.15
  })
  const tanks = n(sel, 'tank')
  const engines = n(sel, 'engine')
  const solar = n(sel, 'solar')
  const solarxl = n(sel, 'solarxl')
  const rtg = n(sel, 'rtg')
  const instruments = ['camera', 'spectrometer', 'radar', 'magnetometer', 'drill'].filter((id) => n(sel, id))
  const instColor = { camera: '#38bdf8', spectrometer: '#c084fc', radar: '#fbbf24', magnetometer: '#4ade80', drill: '#fb923c' }

  return (
    <group ref={root} position={[0, 0.2, 0]}>
      {/* Bus wrapped in gold insulation; shielding adds a silver shell */}
      <mesh>
        <boxGeometry args={[1.2, 1.1, 1.2]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {shield > 0 && (
        <Appear>
          <mesh>
            <boxGeometry args={[1.22 + shield * 0.06, 1.12 + shield * 0.06, 1.22 + shield * 0.06]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.25} transparent opacity={0.35} />
          </mesh>
        </Appear>
      )}

      {/* Crew capsule on top */}
      {crewed && (
        <Appear position={[0, 1.0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.32, 0.62, 0.8, 32]} />
            <meshStandardMaterial {...WHITE} />
          </mesh>
          <mesh position={[0, 0.1, 0.5]} rotation={[0.45, 0, 0]}>
            <circleGeometry args={[0.1, 24]} />
            <meshStandardMaterial color="#0b1124" emissive="#5ad1ff" emissiveIntensity={0.6} />
          </mesh>
        </Appear>
      )}

      {/* Power */}
      {Array.from({ length: solar }).map((_, i) => <SolarWing key={`s${i}`} side={i % 2 ? 1 : -1} index={Math.floor(i / 2)} />)}
      {Array.from({ length: solarxl }).map((_, i) => <SolarWing key={`x${i}`} side={i % 2 ? 1 : -1} index={0} xl />)}
      {Array.from({ length: rtg }).map((_, i) => (
        <Appear key={`r${i}`} position={[-0.6, -0.55, i ? 0.4 : -0.4]} rotation={[0, 0, -0.7]}>
          <mesh position={[0, -0.35, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
            <meshStandardMaterial {...STEEL} />
          </mesh>
          <mesh position={[0, -0.8, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.45, 8]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[0, -0.8, 0]} rotation={[0, (k * Math.PI) / 4, 0]}>
              <boxGeometry args={[0.42, 0.4, 0.02]} />
              <meshStandardMaterial {...DARK} />
            </mesh>
          ))}
        </Appear>
      ))}
      {Array.from({ length: n(sel, 'battery') }).map((_, i) => (
        <Appear key={`b${i}`} position={[-0.35 + i * 0.25, 0.4, 0.62]}>
          <mesh><boxGeometry args={[0.18, 0.18, 0.06]} /><meshStandardMaterial color="#22c55e" emissive="#14532d" /></mesh>
        </Appear>
      ))}

      {/* Instruments on the front face */}
      {instruments.map((id, i) => (
        <Appear key={id} position={[-0.35 + (i % 3) * 0.35, -0.05 - Math.floor(i / 3) * 0.32, 0.65]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.16, 16]} />
            <meshStandardMaterial {...DARK} />
          </mesh>
          <mesh position={[0, 0, 0.085]}>
            <circleGeometry args={[0.07, 20]} />
            <meshStandardMaterial color={instColor[id]} emissive={instColor[id]} emissiveIntensity={0.8} />
          </mesh>
        </Appear>
      ))}

      {/* Communications */}
      {n(sel, 'hga') > 0 && <Appear position={[0.25, 0.75, -0.3]} rotation={[-0.5, 0, 0.3]}><Dish /></Appear>}
      {n(sel, 'hga') > 1 && <Appear position={[-0.35, 0.75, -0.35]} rotation={[-0.5, 0, -0.3]} scale={0.7}><Dish /></Appear>}
      {n(sel, 'lga') > 0 && (
        <Appear position={[0.45, 0.55, 0.45]}>
          <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[0.015, 0.015, 0.5, 6]} /><meshStandardMaterial {...STEEL} /></mesh>
          <mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.05, 12, 12]} /><meshStandardMaterial {...WHITE} /></mesh>
        </Appear>
      )}

      {/* Life support modules, supplies, medical bay and spares */}
      {Array.from({ length: n(sel, 'eclss') }).map((_, i) => (
        <Appear key={`e${i}`} position={[0, -0.05, i ? 0.8 : -0.8]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh><capsuleGeometry args={[0.22, 0.35, 8, 16]} /><meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.4} /></mesh>
        </Appear>
      ))}
      {Array.from({ length: n(sel, 'supplies') }).map((_, i) => (
        <Appear key={`f${i}`} position={[0.75, -0.35 + i * 0.25, -0.35]}>
          <mesh><boxGeometry args={[0.28, 0.22, 0.28]} /><meshStandardMaterial color="#a16207" roughness={0.8} /></mesh>
        </Appear>
      ))}
      {n(sel, 'medkit') > 0 && (
        <Appear position={[0.75, 0.35, 0.3]}>
          <mesh><boxGeometry args={[0.26, 0.26, 0.26]} /><meshStandardMaterial {...WHITE} /></mesh>
          <mesh position={[0.135, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.16, 0.05]} /><meshBasicMaterial color="#ef4444" /></mesh>
          <mesh position={[0.135, 0, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[0.05, 0.16]} /><meshBasicMaterial color="#ef4444" /></mesh>
        </Appear>
      )}
      {Array.from({ length: n(sel, 'spares') }).map((_, i) => (
        <Appear key={`p${i}`} position={[0.75, -0.35, 0.3 - i * 0.3]}>
          <mesh><boxGeometry args={[0.24, 0.2, 0.24]} /><meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} /></mesh>
        </Appear>
      ))}

      {/* Propellant tanks around the lower bus, engines underneath */}
      {Array.from({ length: tanks }).map((_, i) => {
        const a = (i / Math.max(1, tanks)) * Math.PI * 2 + 0.4
        return (
          <Appear key={`t${i}`} position={[Math.cos(a) * 0.45, -0.85, Math.sin(a) * 0.45]}>
            <mesh><capsuleGeometry args={[0.17, 0.25, 8, 16]} /><meshStandardMaterial color="#f1f5f9" metalness={0.3} roughness={0.35} /></mesh>
          </Appear>
        )
      })}
      {Array.from({ length: engines }).map((_, i) => (
        <Appear key={`g${i}`} position={[engines === 1 ? 0 : i ? 0.28 : -0.28, -1.25, 0]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.26, 0.45, 24, 1, true]} />
            <meshStandardMaterial {...DARK} side={THREE.DoubleSide} />
          </mesh>
        </Appear>
      ))}

      {/* Ghosts for missing critical systems */}
      {!engines && <Ghost position={[0, -1.25, 0]} rotation={[Math.PI, 0, 0]}><cylinderGeometry args={[0.08, 0.26, 0.45, 12, 1, true]} /></Ghost>}
      {!solar && !solarxl && !rtg && <Ghost position={[-1.6, 0.15, 0]}><boxGeometry args={[1.1, 0.04, 0.75]} /></Ghost>}
      {!n(sel, 'hga') && !n(sel, 'lga') && <Ghost position={[0.25, 1.0, -0.3]}><sphereGeometry args={[0.35, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2]} /></Ghost>}
      {crewed && !n(sel, 'eclss') && <Ghost position={[0, -0.05, -0.8]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.22, 0.35, 4, 8]} /></Ghost>}
    </group>
  )
}

export const Ship3D = memo(function Ship3D({ sel, crewed, shield }) {
  return (
    <Canvas camera={{ position: [4.4, 2.2, 5.6], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#050a1c']} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 3]} intensity={2.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#8ab4ff" />
      <Stars radius={50} depth={30} count={1500} factor={3} fade />
      {/* Studio light panels so metal and gold foil reflect nicely */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.5} position={[0, 5, -5]} scale={[10, 3, 1]} />
        <Lightformer intensity={1.5} color="#9fd8ff" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 5, 1]} />
        <Lightformer intensity={1.8} color="#ffd9a0" position={[5, 1, 3]} rotation-y={-Math.PI / 2} scale={[6, 5, 1]} />
      </Environment>
      <Ship sel={sel} crewed={crewed} shield={shield} />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.35} scale={8} blur={2.5} far={3} />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={10} />
    </Canvas>
  )
})
