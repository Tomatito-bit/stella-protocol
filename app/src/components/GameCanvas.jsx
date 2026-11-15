import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'

// Every 3D view in the game goes through this canvas:
// - resolution adapts to the device: it starts at most at 1.5× and drops on its own if frames get slow
// - `paused` stops drawing entirely (e.g. while the logbook covers the scene)
const MAX_DPR = 1.5
const MIN_DPR = 0.6

export function GameCanvas({ paused = false, children, ...props }) {
  const [dpr, setDpr] = useState(() => Math.min(MAX_DPR, (typeof window !== 'undefined' && window.devicePixelRatio) || 1))
  return (
    <Canvas {...props} dpr={dpr} frameloop={paused ? 'never' : 'always'}>
      <PerformanceMonitor
        flipflops={4}
        onDecline={() => setDpr((d) => Math.max(MIN_DPR, Math.round((d - 0.25) * 100) / 100))}
        onIncline={() => setDpr((d) => Math.min(MAX_DPR, Math.round((d + 0.15) * 100) / 100))}
        onFallback={() => setDpr(MIN_DPR)}
      />
      {children}
    </Canvas>
  )
}
