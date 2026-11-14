import { memo, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'

// NASA-style spacecraft the player builds. Each selected part appears attached to the bus;
// missing critical systems show as red wireframe "ghosts".
const n = (sel, id) => sel[id] || 0

// ---------- Procedural textures (drawn once) ----------
// Crinkled gold multi-layer insulation (MLI), the "foil" seen on real probes
function mliTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = '#808080'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256
    const y = Math.random() * 256
    const len = 6 + Math.random() * 26
    const a = Math.random() * Math.PI
    g.strokeStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
    g.lineWidth = 1 + Math.random() * 2
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    g.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 2)
  return t
}
// Solar cells with silver interconnects
function cellTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#0b1e52'
  g.fillRect(0, 0, 256, 128)
  for (let x = 0; x < 16; x++)
    for (let y = 0; y < 8; y++) {
      const grd = g.createLinearGradient(x * 16, y * 16, x * 16 + 16, y * 16 + 16)
      grd.addColorStop(0, '#1d3f9a')
      grd.addColorStop(1, '#0f2766')
      g.fillStyle = grd
      g.fillRect(x * 16 + 1, y * 16 + 1, 14, 14)
    }
  g.strokeStyle = 'rgba(200,215,240,0.6)'
  g.lineWidth = 1
  for (let x = 0; x <= 256; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke() }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function useMaterials() {
  return useMemo(() => {
    const mli = mliTexture()
    const cells = cellTexture()
    return {
      gold: new THREE.MeshStandardMaterial({ color: '#d9a441', metalness: 0.85, roughness: 0.32, bumpMap: mli, bumpScale: 0.6 }),
      silverMli: new THREE.MeshStandardMaterial({ color: '#cfd6e0', metalness: 0.9, roughness: 0.3, bumpMap: mli, bumpScale: 0.5 }),
      white: new THREE.MeshStandardMaterial({ color: '#eef1f6', metalness: 0.05, roughness: 0.55 }),
      radiator: new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.1, roughness: 0.25 }),
      steel: new THREE.MeshStandardMaterial({ color: '#9aa4b5', metalness: 0.9, roughness: 0.28 }),
      dark: new THREE.MeshStandardMaterial({ color: '#2b3140', metalness: 0.6, roughness: 0.45 }),
      titanium: new THREE.MeshStandardMaterial({ color: '#b8bec9', metalness: 0.95, roughness: 0.22 }),
      cells: new THREE.MeshStandardMaterial({ map: cells, metalness: 0.5, roughness: 0.2, emissive: '#06122e', emissiveIntensity: 0.4 }),
      cellsBack: new THREE.MeshStandardMaterial({ color: '#d7dbe2', metalness: 0.3, roughness: 0.6 }),
      frame: new THREE.MeshStandardMaterial({ color: '#c8ced8', metalness: 0.8, roughness: 0.3 }),
      heatShield: new THREE.MeshStandardMaterial({ color: '#5b3a24', metalness: 0.1, roughness: 0.9 }),
      lens: new THREE.MeshStandardMaterial({ color: '#0b1124', metalness: 1, roughness: 0.05 }),
    }
  }, [])
}

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

// Solar wing: boom, yoke and panels with cells on the front and white backing
function SolarWing({ m, angle, index, xl }) {
  const panels = xl ? 5 : 2
  const pw = 0.62
  const start = 0.85 + index * (panels * (pw + 0.04) + 0.15)
  return (
    <Appear rotation={[0, 0, angle]}>
      <mesh position={[start - 0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.steel}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
      </mesh>
      {Array.from({ length: panels }).map((_, k) => {
        const x = start + k * (pw + 0.04) + pw / 2
        return (
          <group key={k} position={[x, 0, 0]}>
            <mesh material={m.frame}><boxGeometry args={[pw + 0.02, 0.035, (xl ? 1.15 : 0.82) + 0.02]} /></mesh>
            <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, 0]} material={m.cells}><planeGeometry args={[pw, xl ? 1.15 : 0.82]} /></mesh>
            <mesh position={[0, -0.019, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.cellsBack}><planeGeometry args={[pw, xl ? 1.15 : 0.82]} /></mesh>
          </group>
        )
      })}
    </Appear>
  )
}

// High-gain antenna: parabolic dish, rim, feed struts and subreflector
function Dish({ m, size = 1 }) {
  const geo = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 16; i++) {
      const r = (i / 16) * 0.6
      pts.push(new THREE.Vector2(r, (r * r) / 1.1))
    }
    return new THREE.LatheGeometry(pts, 48)
  }, [])
  return (
    <group scale={size}>
      <mesh geometry={geo} material={m.white} />
      <mesh position={[0, 0.327, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.frame}><torusGeometry args={[0.6, 0.012, 8, 48]} /></mesh>
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[Math.cos((k * Math.PI * 2) / 3) * 0.2, 0.42, Math.sin((k * Math.PI * 2) / 3) * 0.2]} rotation={[Math.sin((k * Math.PI * 2) / 3) * 0.55, 0, -Math.cos((k * Math.PI * 2) / 3) * 0.55]} material={m.steel}>
          <cylinderGeometry args={[0.008, 0.008, 0.5, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.62, 0]} material={m.white}><cylinderGeometry args={[0.07, 0.04, 0.05, 20]} /></mesh>
      <mesh position={[0, -0.12, 0]} material={m.steel}><cylinderGeometry args={[0.04, 0.05, 0.25, 12]} /></mesh>
    </group>
  )
}

// Small thruster clusters on the bus corners (reaction control system)
function RcsQuad({ m, position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh material={m.dark}><boxGeometry args={[0.12, 0.12, 0.08]} /></mesh>
      {[[0.07, 0, 0, 0, 0, -Math.PI / 2], [-0.07, 0, 0, 0, 0, Math.PI / 2], [0, 0.07, 0, 0, 0, 0], [0, -0.07, 0, Math.PI, 0, 0]].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], p[2]]} rotation={[p[3], p[4], p[5]]} material={m.steel}>
          <cylinderGeometry args={[0.012, 0.025, 0.05, 10]} />
        </mesh>
      ))}
    </group>
  )
}

function Ship({ sel, crewed, shield }) {
  const m = useMaterials()
  const root = useRef()
  useFrame((_, dt) => {
    if (root.current) root.current.rotation.y += dt * 0.12
  })
  const tanks = n(sel, 'tank')
  const engines = n(sel, 'engine')
  const solar = n(sel, 'solar')
  const solarxl = n(sel, 'solarxl')
  const rtg = n(sel, 'rtg')
  const instruments = ['camera', 'spectrometer', 'radar', 'magnetometer', 'drill'].filter((id) => n(sel, id))
  const bus = crewed ? m.white : shield >= 2 ? m.silverMli : m.gold
  // Crewed ships put solar wings in an X like Orion; probes put them left and right
  const wingAngles = crewed ? [0.6, Math.PI - 0.6, Math.PI + 0.6, -0.6] : [0, Math.PI]

  return (
    <group ref={root} position={[0, 0.25, 0]}>
      {/* Octagonal bus (service module) with white radiator panels */}
      <mesh rotation={[0, Math.PI / 8, 0]} material={bus}><cylinderGeometry args={[0.7, 0.7, 1.1, 8]} /></mesh>
      <mesh position={[0, 0.56, 0]} rotation={[0, Math.PI / 8, 0]} material={m.frame}><cylinderGeometry args={[0.71, 0.71, 0.03, 8]} /></mesh>
      <mesh position={[0, -0.56, 0]} rotation={[0, Math.PI / 8, 0]} material={m.frame}><cylinderGeometry args={[0.71, 0.71, 0.03, 8]} /></mesh>
      {[Math.PI / 2, -Math.PI / 2].map((a) => (
        <mesh key={a} position={[Math.cos(a) * 0.67, 0, Math.sin(a) * 0.67]} rotation={[0, -a + Math.PI / 2, 0]} material={m.radiator}>
          <boxGeometry args={[0.5, 0.8, 0.02]} />
        </mesh>
      ))}
      {crewed && <mesh position={[0, 0.2, 0]} rotation={[0, Math.PI / 8, 0]} material={m.gold}><cylinderGeometry args={[0.705, 0.705, 0.18, 8]} /></mesh>}
      {shield > 0 && (
        <Appear>
          <mesh rotation={[0, Math.PI / 8, 0]}>
            <cylinderGeometry args={[0.72 + shield * 0.03, 0.72 + shield * 0.03, 1.12, 8, 1, true]} />
            <meshStandardMaterial color="#d9dee7" metalness={0.95} roughness={0.2} transparent opacity={0.25} side={THREE.DoubleSide} />
          </mesh>
        </Appear>
      )}
      {/* Star trackers and RCS thruster clusters */}
      <mesh position={[-0.35, 0.6, 0.45]} rotation={[0.5, 0, 0.3]} material={m.dark}><cylinderGeometry args={[0.05, 0.06, 0.16, 12]} /></mesh>
      <mesh position={[-0.2, 0.6, 0.5]} rotation={[0.5, 0, 0.1]} material={m.dark}><cylinderGeometry args={[0.05, 0.06, 0.16, 12]} /></mesh>
      {[0, 1, 2, 3].map((k) => {
        const a = Math.PI / 4 + (k * Math.PI) / 2
        return <RcsQuad key={k} m={m} position={[Math.cos(a) * 0.72, 0.42, Math.sin(a) * 0.72]} rotation={[0, -a, 0]} />
      })}

      {/* Crew capsule: Orion-style cone with a darker heat shield and windows */}
      {crewed && (
        <Appear position={[0, 1.02, 0]}>
          <mesh position={[0, -0.47, 0]} material={m.heatShield}><cylinderGeometry args={[0.74, 0.74, 0.06, 40]} /></mesh>
          <mesh material={m.white}><cylinderGeometry args={[0.3, 0.72, 0.9, 40]} /></mesh>
          <mesh position={[0, 0.5, 0]} material={m.steel}><cylinderGeometry args={[0.22, 0.28, 0.12, 24]} /></mesh>
          {[-0.35, 0.35].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.53, 0.05, Math.cos(a) * 0.53]} rotation={[0.48, a, 0]} material={m.lens}>
              <boxGeometry args={[0.13, 0.1, 0.01]} />
            </mesh>
          ))}
        </Appear>
      )}

      {/* Power: solar wings, giant arrays and finned nuclear generators */}
      {Array.from({ length: solar }).map((_, i) => (
        <SolarWing key={`s${i}`} m={m} angle={wingAngles[i % wingAngles.length]} index={Math.floor(i / wingAngles.length)} />
      ))}
      {Array.from({ length: solarxl }).map((_, i) => <SolarWing key={`x${i}`} m={m} angle={i % 2 ? 0 : Math.PI} index={0} xl />)}
      {Array.from({ length: rtg }).map((_, i) => (
        <Appear key={`r${i}`} position={[0, -0.5, 0]} rotation={[0, i ? 2.4 : -0.7, 0]}>
          <group rotation={[0, 0, -0.6]}>
            <mesh position={[0.75, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.steel}><cylinderGeometry args={[0.025, 0.025, 0.7, 8]} /></mesh>
            <mesh position={[1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.dark}><cylinderGeometry args={[0.12, 0.12, 0.5, 16]} /></mesh>
            {Array.from({ length: 8 }).map((_, k) => (
              <mesh key={k} position={[1.2, 0, 0]} rotation={[(k * Math.PI) / 4, 0, 0]} material={m.dark}>
                <boxGeometry args={[0.46, 0.4, 0.015]} />
              </mesh>
            ))}
          </group>
        </Appear>
      ))}
      {Array.from({ length: n(sel, 'battery') }).map((_, i) => (
        <Appear key={`b${i}`} position={[0.62, -0.2 + i * 0.2, -0.3]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={m.dark}><boxGeometry args={[0.2, 0.14, 0.08]} /></mesh>
        </Appear>
      ))}

      {/* Instruments on a scan platform at the front */}
      {instruments.length > 0 && (
        <mesh position={[0, -0.15, 0.72]} material={m.dark}><boxGeometry args={[0.95, 0.5, 0.06]} /></mesh>
      )}
      {instruments.map((id, i) => (
        <Appear key={id} position={[-0.32 + (i % 3) * 0.32, 0.0 - Math.floor(i / 3) * 0.28, 0.8]}>
          {id === 'radar' ? (
            <mesh rotation={[0, 0, Math.PI / 2]} material={m.white}><boxGeometry args={[0.06, 0.28, 0.06]} /></mesh>
          ) : id === 'magnetometer' ? (
            <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} material={m.steel}><cylinderGeometry args={[0.012, 0.012, 0.7, 6]} /></mesh>
          ) : (
            <>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={m.dark}><cylinderGeometry args={[0.08, 0.1, 0.16, 20]} /></mesh>
              <mesh position={[0, 0, 0.085]} material={m.lens}><circleGeometry args={[0.06, 20]} /></mesh>
            </>
          )}
        </Appear>
      ))}

      {/* Communications */}
      {n(sel, 'hga') > 0 && <Appear position={[0, 0.62, -0.25]} rotation={[-0.35, 0, 0]}><Dish m={m} /></Appear>}
      {n(sel, 'hga') > 1 && <Appear position={[0.45, 0.6, 0.1]} rotation={[-0.2, 0, -0.5]}><Dish m={m} size={0.55} /></Appear>}
      {n(sel, 'lga') > 0 && (
        <Appear position={[0.45, 0.56, 0.35]}>
          <mesh position={[0, 0.2, 0]} material={m.steel}><cylinderGeometry args={[0.012, 0.012, 0.4, 6]} /></mesh>
          <mesh position={[0, 0.43, 0]} material={m.white}><coneGeometry args={[0.06, 0.1, 16]} /></mesh>
        </Appear>
      )}

      {/* Life support modules, supplies, medical bay and spares */}
      {Array.from({ length: n(sel, 'eclss') }).map((_, i) => (
        <Appear key={`e${i}`} position={[i ? 0.5 : -0.5, -0.1, i ? -0.55 : -0.55]} rotation={[0, 0, Math.PI / 2]}>
          <mesh material={m.white}><capsuleGeometry args={[0.16, 0.25, 8, 20]} /></mesh>
          <mesh material={m.gold}><cylinderGeometry args={[0.165, 0.165, 0.08, 20]} /></mesh>
        </Appear>
      ))}
      {Array.from({ length: n(sel, 'supplies') }).map((_, i) => (
        <Appear key={`f${i}`} position={[-0.72, -0.35 + i * 0.22, 0.15]} rotation={[0, Math.PI / 8, 0]}>
          <mesh material={m.silverMli}><boxGeometry args={[0.16, 0.18, 0.3]} /></mesh>
        </Appear>
      ))}
      {n(sel, 'medkit') > 0 && (
        <Appear position={[-0.72, 0.35, -0.2]}>
          <mesh material={m.white}><boxGeometry args={[0.14, 0.2, 0.2]} /></mesh>
          <mesh position={[-0.075, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.12, 0.035]} /><meshBasicMaterial color="#dc2626" /></mesh>
          <mesh position={[-0.075, 0, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[0.035, 0.12]} /><meshBasicMaterial color="#dc2626" /></mesh>
        </Appear>
      )}
      {Array.from({ length: n(sel, 'spares') }).map((_, i) => (
        <Appear key={`p${i}`} position={[0.2 - i * 0.25, -0.62, 0.55]}>
          <mesh material={m.dark}><boxGeometry args={[0.2, 0.1, 0.14]} /></mesh>
        </Appear>
      ))}

      {/* Spherical titanium propellant tanks under the bus, engine bells below */}
      {tanks > 0 && <mesh position={[0, -0.7, 0]} material={m.frame}><cylinderGeometry args={[0.55, 0.62, 0.1, 8]} /></mesh>}
      {Array.from({ length: tanks }).map((_, i) => {
        const a = (i / Math.max(1, tanks)) * Math.PI * 2 + 0.4
        const r = tanks === 1 ? 0 : 0.36
        return (
          <Appear key={`t${i}`} position={[Math.cos(a) * r, -0.92, Math.sin(a) * r]}>
            <mesh material={m.titanium}><sphereGeometry args={[0.21, 32, 24]} /></mesh>
          </Appear>
        )
      })}
      {Array.from({ length: engines }).map((_, i) => (
        <Appear key={`g${i}`} position={[engines === 1 ? 0 : i ? 0.25 : -0.25, tanks ? -1.25 : -0.85, 0]}>
          <Bell m={m} />
        </Appear>
      ))}

      {/* Ghosts for missing critical systems */}
      {!engines && <Ghost position={[0, -1.25, 0]} rotation={[Math.PI, 0, 0]}><cylinderGeometry args={[0.07, 0.24, 0.42, 12, 1, true]} /></Ghost>}
      {!solar && !solarxl && !rtg && <Ghost position={[-1.5, 0, 0]}><boxGeometry args={[1.25, 0.04, 0.82]} /></Ghost>}
      {!n(sel, 'hga') && !n(sel, 'lga') && <Ghost position={[0, 0.9, -0.25]}><sphereGeometry args={[0.45, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></Ghost>}
      {crewed && !n(sel, 'eclss') && <Ghost position={[-0.5, -0.1, -0.55]} rotation={[0, 0, Math.PI / 2]}><capsuleGeometry args={[0.16, 0.25, 4, 8]} /></Ghost>}
    </group>
  )
}

// Engine bell: outer nozzle shape, glowing throat and a gold thermal blanket at the top
function Bell({ m }) {
  const geo = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 14; i++) {
      const t = i / 14
      pts.push(new THREE.Vector2(0.06 + Math.pow(t, 1.6) * 0.2, -t * 0.42))
    }
    return new THREE.LatheGeometry(pts, 36)
  }, [])
  return (
    <group>
      <mesh position={[0, 0.06, 0]} material={m.gold}><cylinderGeometry args={[0.1, 0.1, 0.12, 20]} /></mesh>
      <mesh geometry={geo}><meshStandardMaterial color="#3b3f4a" metalness={0.85} roughness={0.35} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.05, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.06, 20]} /><meshBasicMaterial color="#ff9b4a" /></mesh>
    </group>
  )
}

export const Ship3D = memo(function Ship3D({ sel, crewed, shield }) {
  return (
    <Canvas camera={{ position: [4.6, 2.3, 5.8], fov: 40 }} dpr={[1, 2]} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}>
      <color attach="background" args={['#040817']} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 4, 3]} intensity={2.8} color="#fff6e6" />
      <directionalLight position={[-4, -2, -3]} intensity={0.45} color="#8ab4ff" />
      <Stars radius={50} depth={30} count={1800} factor={3} fade />
      {/* Studio light panels so foil and metal reflect like in real photos */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={3} position={[0, 5, -5]} scale={[10, 3, 1]} />
        <Lightformer intensity={1.6} color="#9fd8ff" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 5, 1]} />
        <Lightformer intensity={2} color="#ffd9a0" position={[5, 1, 3]} rotation-y={-Math.PI / 2} scale={[6, 5, 1]} />
        <Lightformer intensity={0.6} position={[0, -5, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
      </Environment>
      <Ship sel={sel} crewed={crewed} shield={shield} />
      <ContactShadows position={[0, -1.75, 0]} opacity={0.3} scale={9} blur={2.5} far={3} />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={11} />
    </Canvas>
  )
})
