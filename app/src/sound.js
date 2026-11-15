// All game sounds are synthesized with the Web Audio API: no audio files to download.
let ctx = null
let master = null
let hum = null
let muted = (() => { try { return localStorage.getItem('stella-muted') === '1' } catch { return false } })()

function audio() {
  if (!ctx) {
    if (typeof window === 'undefined') return null // tests run in Node
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.6
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export const isMuted = () => muted
export function setMuted(v) {
  muted = v
  try { localStorage.setItem('stella-muted', v ? '1' : '0') } catch { /* private mode */ }
  if (master) master.gain.value = v ? 0 : 0.6
}

// Short tone with an envelope
function tone(freq, dur, { type = 'sine', vol = 0.2, slide = 0, delay = 0 } = {}) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.05)
}

// Filtered white noise (rumble, hiss)
function noise(dur, { freq = 400, q = 0.7, vol = 0.3, type = 'lowpass', delay = 0, attack = 0.05 } = {}) {
  const a = audio()
  if (!a) return null
  const t = a.currentTime + delay
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = a.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + attack)
  g.gain.linearRampToValueAtTime(0, t + dur)
  src.connect(f).connect(g).connect(master)
  src.start(t)
  return { src, gain: g }
}

export const sfx = {
  click: () => tone(1400, 0.05, { type: 'triangle', vol: 0.08 }),
  select: () => { tone(660, 0.07, { type: 'triangle', vol: 0.1 }); tone(990, 0.09, { type: 'triangle', vol: 0.08, delay: 0.05 }) },
  beep: () => tone(880, 0.12, { type: 'square', vol: 0.06 }),
  go: () => { tone(523, 0.12, { vol: 0.15 }); tone(784, 0.18, { vol: 0.15, delay: 0.1 }) },
  nogo: () => tone(196, 0.3, { type: 'sawtooth', vol: 0.08 }),
  // Morning chime for a new day
  day: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, { vol: 0.09, delay: i * 0.09 })) },
  page: () => noise(0.25, { freq: 3000, type: 'bandpass', q: 0.8, vol: 0.12, attack: 0.02 }),
  alarm: () => { for (let i = 0; i < 3; i++) tone(880, 0.22, { type: 'square', vol: 0.06, slide: -300, delay: i * 0.28 }) },
  repair: () => { for (let i = 0; i < 4; i++) noise(0.06, { freq: 2500, type: 'bandpass', q: 3, vol: 0.2, delay: i * 0.12, attack: 0.005 }) },
  good: () => { tone(659, 0.15, { vol: 0.12 }); tone(988, 0.3, { vol: 0.12, delay: 0.12 }) },
  // Rocket launch: deep rumble that builds and fades
  liftoff: () => { noise(9, { freq: 140, vol: 0.55, attack: 1.2 }); noise(6, { freq: 900, vol: 0.12, attack: 0.8, type: 'bandpass' }) },
}

// Low hum of the life-support fans while inside the ship
export function startHum() {
  const a = audio()
  if (!a || hum) return
  const o = a.createOscillator()
  const o2 = a.createOscillator()
  const g = a.createGain()
  o.type = 'sawtooth'
  o.frequency.value = 55
  o2.type = 'sine'
  o2.frequency.value = 110.5
  const f = a.createBiquadFilter()
  f.type = 'lowpass'
  f.frequency.value = 180
  g.gain.value = 0.035
  o.connect(f)
  o2.connect(f)
  f.connect(g).connect(master)
  o.start()
  o2.start()
  hum = { o, o2, g }
}
export function stopHum() {
  if (!hum) return
  hum.o.stop()
  hum.o2.stop()
  hum = null
}

// Any button press clicks (installed once at startup)
export function installClicks() {
  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('button, select, label')
    if (el && !el.disabled) sfx.click()
  }, true)
}
