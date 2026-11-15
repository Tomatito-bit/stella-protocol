// Original score for Stella Protocol, synthesized live with the Web Audio API (no audio files).
// Style: cinematic space organ — pipe-organ stops, a cathedral reverb, slowly growing ostinatos
// and a ticking clock. All melodies and progressions here are original.
import { audioOut } from './sound'

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12)
// A natural minor, plus a few colours (MIDI numbers)
const A2 = 45, C3 = 48, D3 = 50, E3 = 52, F3 = 53, G3 = 55, A3 = 57, B3 = 59, C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72, D5 = 74, E5 = 76

// ---------- Cathedral reverb (synthetic impulse response, built once) ----------
let room = null
function reverb(c, out) {
  if (room && room.ctx === c) return room
  const len = Math.floor(c.sampleRate * 5.5)
  const ir = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2)
  }
  const conv = c.createConvolver()
  conv.buffer = ir
  const wet = c.createGain()
  wet.gain.value = 0.55
  conv.connect(wet).connect(out)
  room = { ctx: c, input: conv }
  return room
}

// ---------- Instruments ----------
// Pipe organ: several stops (8', 4', 2 2/3', 2', 16') summed, slow speech, long release
const STOPS = [[1, 1], [2, 0.5], [3, 0.22], [4, 0.18], [0.5, 0.35]]
function organ(c, dry, wet, midi, t, dur, vol = 0.05, attack = 0.35) {
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + attack)
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur - 0.05))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.4)
  const tone = c.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 2400
  g.connect(tone)
  tone.connect(dry)
  tone.connect(wet)
  STOPS.forEach(([mult, level], i) => {
    const o = c.createOscillator()
    o.type = i === 0 ? 'triangle' : 'sine'
    o.frequency.value = hz(midi) * mult
    o.detune.value = (i % 2 ? 3 : -3)
    const lg = c.createGain()
    lg.gain.value = level
    o.connect(lg).connect(g)
    o.start(t)
    o.stop(t + dur + 1.6)
  })
}
// Soft high arpeggio "glass" voice for the ostinato
function glass(c, dry, wet, midi, t, vol = 0.03) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = 'sine'
  o.frequency.value = hz(midi)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1)
  o.connect(g)
  g.connect(dry)
  g.connect(wet)
  o.start(t)
  o.stop(t + 1.2)
}
// Clock tick: a tiny filtered click
function tick(c, out, t, vol = 0.06, high = true) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * 0.03), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length / 6))
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = high ? 3200 : 2200
  f.Q.value = 6
  const g = c.createGain()
  g.gain.value = vol
  src.connect(f).connect(g).connect(out)
  src.start(t)
}
// Deep drum hit (timpani / taiko)
function drum(c, dry, wet, t, vol = 0.35, midi = A2 - 12) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.frequency.setValueAtTime(hz(midi) * 1.6, t)
  o.frequency.exponentialRampToValueAtTime(hz(midi), t + 0.15)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
  o.connect(g)
  g.connect(dry)
  g.connect(wet)
  o.start(t)
  o.stop(t + 1.5)
}

// ---------- Tracks (step = one 8th note) ----------
// Chords are bass + voicing; each track loops its progression and grows layer by layer
const TRACKS = {
  // Home and menus: lonely organ chords and a slow clock — "looking at Earth from the window"
  calm: {
    bpm: 66, len: 64,
    play(c, dry, wet, step, t, spb) {
      const bar = Math.floor(step / 8) % 8
      const s = step % 8
      const prog = [[A2, [A3, C4, E4]], [F3 - 12, [A3, C4, F4]], [C3, [G3, C4, E4]], [G3 - 12, [G3, B3, D4]], [A2, [A3, C4, E4]], [D3, [A3, D4, F4]], [F3 - 12, [A3, C4, F4]], [E3 - 12, [G3, B3, E4]]]
      const [bass, v] = prog[bar]
      if (s === 0) { organ(c, dry, wet, bass, t, spb * 8, 0.035, 0.8); v.forEach((n) => organ(c, dry, wet, n, t, spb * 8, 0.018, 0.9)) }
      if (s % 2 === 0) tick(c, dry, t, 0.035, s === 0)
      // a sparse, rising glass motif in the second half of the loop
      if (Math.floor(step / 64) % 2 === 1 && (s === 0 || s === 3 || s === 6)) glass(c, dry, wet, v[(s / 3) % 3] + 12, t, 0.02)
    },
  },
  // Mission days: the organ ostinato — two alternating notes over a pedal, gathering stops as it loops
  mission: {
    bpm: 84, len: 64,
    play(c, dry, wet, step, t, spb) {
      const bar = Math.floor(step / 8) % 8
      const s = step % 8
      const loop = Math.floor(step / 64)
      const prog = [[A2, [E4, A4]], [A2, [E4, B4]], [F3 - 12, [F4, A4]], [F3 - 12, [E4, A4]], [C3, [E4, G4]], [C3, [D4, G4]], [G3 - 12, [D4, B4]], [E3 - 12, [E4, B4]]]
      const [bass, pair] = prog[bar]
      if (s === 0) organ(c, dry, wet, bass, t, spb * 8, 0.032, 0.6)
      organ(c, dry, wet, pair[s % 2], t, spb * 0.9, 0.012 + Math.min(loop, 3) * 0.004, 0.05)
      if (loop >= 1 && s === 0) organ(c, dry, wet, pair[1] + 12, t, spb * 8, 0.01, 1.2)
      if (s % 2 === 0) tick(c, dry, t, 0.028, s === 0)
    },
  },
  // Events: urgent and brave — faster pulse, low drums, organ swells pushing upward
  tense: {
    bpm: 112, len: 32,
    play(c, dry, wet, step, t, spb) {
      const bar = Math.floor(step / 8) % 4
      const s = step % 8
      const prog = [[A2, [A3, C4, E4], [E5, C5]], [F3 - 12, [A3, C4, F4], [F4 + 12, C5]], [D3 - 12, [A3, D4, F4], [D5, A4]], [E3 - 12, [B3, E4, G4 + 1], [E5, B4]]]
      const [bass, chord, top] = prog[bar]
      organ(c, dry, wet, bass, t, spb * 0.8, 0.03, 0.02) // driving pedal 8ths
      if (s === 0) chord.forEach((n) => organ(c, dry, wet, n, t, spb * 8, 0.016, 0.25))
      organ(c, dry, wet, top[s % 2], t, spb * 0.7, 0.012, 0.02)
      if (s === 0 || s === 3 || s === 6) drum(c, dry, wet, t, s === 0 ? 0.32 : 0.18)
      if (bar === 3 && s >= 4) drum(c, dry, wet, t, 0.12 + (s - 4) * 0.05, A2)
      tick(c, dry, t, 0.03, s % 2 === 0)
    },
  },
  // Launch: everything builds — organ pedal swelling, drums accelerating
  launch: {
    bpm: 96, len: 64,
    play(c, dry, wet, step, t, spb) {
      const bar = Math.floor(step / 8) % 8
      const s = step % 8
      const v = [[A3, E4], [A3, E4], [A3, F4], [A3, F4], [C4, G4], [C4, G4], [B3, E4 + 1], [B3, E4 + 1]][bar]
      if (s === 0) { organ(c, dry, wet, A2 - (bar >= 6 ? 0 : 0), t, spb * 8, 0.03 + bar * 0.003, 0.5); v.forEach((n) => organ(c, dry, wet, n, t, spb * 8, 0.014 + bar * 0.002, 0.6)) }
      const every = bar < 2 ? 8 : bar < 4 ? 4 : bar < 6 ? 2 : 1
      if (s % every === 0) drum(c, dry, wet, t, 0.12 + bar * 0.03)
      if (s % 2 === 0) tick(c, dry, t, 0.03, s === 0)
      if (bar >= 4) glass(c, dry, wet, [A4, C5, E5, A4][s % 4] + (bar >= 6 ? 12 : 0), t, 0.015)
    },
  },
}
TRACKS.menu = TRACKS.calm

let state = null

function schedule(st, c) {
  const tr = TRACKS[st.name]
  const spb = 60 / tr.bpm / 2
  while (st.next < c.currentTime + 0.3) {
    tr.play(c, st.dry, st.wet, st.step, st.next, spb)
    st.step += 1
    st.next += spb
  }
}

// Fade a track's dry signal and its reverb send together, then let it go
function fadeOut(st, c, secs = 2) {
  clearInterval(st.timer)
  ;[st.dry, st.wet].forEach((g) => {
    g.gain.cancelScheduledValues(c.currentTime)
    g.gain.setValueAtTime(g.gain.value, c.currentTime)
    g.gain.linearRampToValueAtTime(0.0001, c.currentTime + secs)
  })
  setTimeout(() => { st.dry.disconnect(); st.wet.disconnect() }, (secs + 0.6) * 1000)
}

// Switch to a track (crossfades); null stops the music
export function playMusic(name) {
  const a = audioOut()
  if (!a) return
  if (state && state.name === name) return
  const { ctx: c, out } = a
  if (state) { fadeOut(state, c); state = null }
  if (!name || !TRACKS[name]) return
  // dry signal straight to the master; a separate send into the shared cathedral reverb
  const dry = c.createGain()
  const wet = c.createGain()
  dry.connect(out)
  wet.connect(reverb(c, out).input)
  ;[[dry, 0.7], [wet, 1]].forEach(([g, v]) => { g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.linearRampToValueAtTime(v, c.currentTime + 2.5) })
  const st = { name, dry, wet, step: 0, next: c.currentTime + 0.15 }
  st.timer = setInterval(() => schedule(st, c), 80)
  schedule(st, c)
  state = st
}

// End-of-mission stinger: a rising major organ chord, or a falling minor one
export function playStinger(win) {
  const a = audioOut()
  if (!a) return
  playMusic(null)
  const { ctx: c, out } = a
  const t = c.currentTime + 0.2
  const bus = c.createGain()
  bus.gain.value = 0.8
  bus.connect(out)
  const wet = c.createGain()
  wet.connect(reverb(c, out).input)
  if (win) {
    ;[[A2, [A3, C4 + 1, E4]], [D3, [A3, D4, F4 + 1]], [A2, [A3, C4 + 1, E4, A4]]].forEach(([b, v], i) => {
      organ(c, bus, wet, b, t + i * 1.4, i === 2 ? 4 : 1.4, 0.04, 0.3)
      v.forEach((n) => organ(c, bus, wet, n, t + i * 1.4, i === 2 ? 4 : 1.4, 0.018, 0.3))
    })
    drum(c, bus, wet, t + 2.8, 0.3)
  } else {
    ;[[A2, [A3, C4, E4]], [F3 - 12, [A3, C4, F4]], [E3 - 12, [G3, B3, E4]], [A2, [A3, C4, E4]]].forEach(([b, v], i) => {
      organ(c, bus, wet, b, t + i * 1.6, i === 3 ? 4.5 : 1.6, 0.035, 0.5)
      v.forEach((n) => organ(c, bus, wet, n, t + i * 1.6, i === 3 ? 4.5 : 1.6, 0.014, 0.5))
    })
  }
}
