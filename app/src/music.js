// Game music, composed in code and synthesized live with the Web Audio API (no audio files).
// A small step sequencer schedules notes a little ahead of time; tracks crossfade when the mood changes.
import { audioOut } from './sound'

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12)
const N = { D2: 38, F2: 41, G2: 43, A2: 45, Bb2: 46, C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, Bb3: 58, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, Bb4: 70, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81 }

// ---------- Instruments ----------
function env(c, g, t, a, peak, d, sustain = 0.0001) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d)
}
function voice(c, out, type, f, t, dur, vol, cutoff = 2000, detune = 0) {
  const o = c.createOscillator()
  const flt = c.createBiquadFilter()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  o.detune.value = detune
  flt.type = 'lowpass'
  flt.frequency.value = cutoff
  o.connect(flt).connect(g).connect(out)
  return { o, flt, g, start: () => { o.start(t); o.stop(t + dur + 0.6) } }
}
const I = {
  // Soft evolving pad (two detuned saws per note)
  pad(c, out, notes, t, dur, vol = 0.05) {
    notes.forEach((n) => [-7, 7].forEach((det) => {
      const v = voice(c, out, 'sawtooth', hz(n), t, dur, vol, 900, det)
      v.g.gain.setValueAtTime(0.0001, t)
      v.g.gain.linearRampToValueAtTime(vol, t + dur * 0.35)
      v.g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.4)
      v.start()
    }))
  },
  pluck(c, out, n, t, vol = 0.07) {
    const v = voice(c, out, 'triangle', hz(n), t, 0.6, vol, 3000)
    env(c, v.g, t, 0.005, vol, 0.55)
    v.start()
  },
  bass(c, out, n, t, dur, vol = 0.12) {
    const v = voice(c, out, 'sawtooth', hz(n), t, dur, vol, 320)
    env(c, v.g, t, 0.01, vol, dur * 0.9, vol * 0.3)
    v.start()
  },
  // Brass-like lead: filter opens on each note
  brass(c, out, n, t, dur, vol = 0.07) {
    ;[-6, 6].forEach((det) => {
      const v = voice(c, out, 'sawtooth', hz(n), t, dur, vol, 500, det)
      v.flt.frequency.setValueAtTime(500, t)
      v.flt.frequency.linearRampToValueAtTime(2600, t + 0.08)
      v.flt.frequency.linearRampToValueAtTime(1400, t + dur)
      v.g.gain.setValueAtTime(0.0001, t)
      v.g.gain.linearRampToValueAtTime(vol, t + 0.05)
      v.g.gain.setValueAtTime(vol, t + dur * 0.8)
      v.g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.15)
      v.start()
    })
  },
  kick(c, out, t, vol = 0.5) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.setValueAtTime(130, t)
    o.frequency.exponentialRampToValueAtTime(42, t + 0.18)
    env(c, g, t, 0.003, vol, 0.3)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 0.4)
  },
  noise(c, out, t, dur, type, freq, vol) {
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = c.createBufferSource()
    src.buffer = buf
    const f = c.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    const g = c.createGain()
    env(c, g, t, 0.002, vol, dur)
    src.connect(f).connect(g).connect(out)
    src.start(t)
  },
  snare(c, out, t, vol = 0.22) { I.noise(c, out, t, 0.18, 'bandpass', 1800, vol); I.kick(c, out, t, 0.08) },
  hat(c, out, t, vol = 0.05) { I.noise(c, out, t, 0.04, 'highpass', 7000, vol) },
  timpani(c, out, n, t, vol = 0.3) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.frequency.setValueAtTime(hz(n) * 1.08, t)
    o.frequency.exponentialRampToValueAtTime(hz(n), t + 0.12)
    env(c, g, t, 0.004, vol, 0.9)
    o.connect(g).connect(out)
    o.start(t)
    o.stop(t + 1.2)
  },
}

// ---------- Tracks: each step is a 16th note ----------
const TRACKS = {
  // Calm space ambience: A minor → F → C → G, slow pad and a sparse arpeggio
  calm: {
    bpm: 72, bars: 4,
    play(c, out, step, t, spb) {
      const bar = Math.floor(step / 16) % 4
      const s = step % 16
      const chords = [[N.A3, N.C4, N.E4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4], [N.G3, N.Bb3, N.D4]]
      const ch = chords[bar]
      if (s === 0) { I.pad(c, out, ch, t, spb * 16 * 0.98, 0.035); I.bass(c, out, ch[0] - 12, t, spb * 14, 0.06) }
      if (s % 3 === 0) I.pluck(c, out, ch[(s / 3) % 3] + 12, t, 0.035)
    },
  },
  // Risky but brave: D minor epic progression, driving drums, ostinato bass, brass motif
  tense: {
    bpm: 104, bars: 4,
    play(c, out, step, t, spb) {
      const bar = Math.floor(step / 16) % 4
      const s = step % 16
      const roots = [N.D2, N.Bb2 - 12, N.F2, N.C3 - 12]
      const chords = [[N.D4, N.F4, N.A4], [N.Bb3, N.D4, N.F4], [N.F3, N.A3, N.C4], [N.C4, N.E4, N.G4]]
      if (s === 0) I.pad(c, out, chords[bar], t, spb * 16 * 0.95, 0.03)
      if (s % 2 === 0) I.bass(c, out, roots[bar] + 12, t, spb * 1.6, 0.11)
      if (s === 0 || s === 8 || s === 10) I.kick(c, out, t, 0.45)
      if (s === 4 || s === 12) I.snare(c, out, t)
      if (s % 2 === 1) I.hat(c, out, t)
      if (bar === 3 && s >= 12) I.timpani(c, out, N.D3 - 12, t, 0.18)
      // Heroic motif: D–A–F–G | A … on bars 1 and 3
      const motif = { 0: [N.D5, 3], 4: [N.A4, 2], 6: [N.F5, 2], 8: [N.G5, 4], 12: [N.A5, 4] }
      if ((bar === 0 || bar === 2) && motif[s]) I.brass(c, out, motif[s][0], t, spb * motif[s][1], 0.05)
      if (bar === 1 && s === 0) I.brass(c, out, N.F5, t, spb * 8, 0.045)
      if (bar === 3 && s === 0) I.brass(c, out, N.E5, t, spb * 8, 0.045)
    },
  },
  // Launch: timpani roll that grows, rising pad
  launch: {
    bpm: 96, bars: 4,
    play(c, out, step, t, spb) {
      const bar = Math.floor(step / 16) % 4
      const s = step % 16
      if (s === 0) I.pad(c, out, [[N.D4, N.A4], [N.E4, N.A4], [N.F4, N.C5], [N.G4, N.D5]][bar], t, spb * 16, 0.04)
      if (s % (bar < 2 ? 4 : 2) === 0) I.timpani(c, out, N.D3 - 12, t, 0.12 + bar * 0.05)
      if (s === 0) I.kick(c, out, t, 0.3)
    },
  },
}

let state = null // { name, gain, step, next, timer }

function schedule(st, c) {
  const tr = TRACKS[st.name]
  const spb = 60 / tr.bpm / 4
  while (st.next < c.currentTime + 0.25) {
    tr.play(c, st.gain, st.step, st.next, spb)
    st.step += 1
    st.next += spb
  }
}

// Switch to a track (crossfades); null stops the music
export function playMusic(name) {
  const a = audioOut()
  if (!a) return
  if (state && state.name === name) return
  const { ctx: c, out } = a
  if (state) {
    const old = state
    old.gain.gain.cancelScheduledValues(c.currentTime)
    old.gain.gain.setValueAtTime(old.gain.gain.value, c.currentTime)
    old.gain.gain.linearRampToValueAtTime(0.0001, c.currentTime + 1.2)
    clearInterval(old.timer)
    setTimeout(() => old.gain.disconnect(), 1600)
    state = null
  }
  if (!name || !TRACKS[name]) return
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, c.currentTime)
  gain.gain.linearRampToValueAtTime(0.55, c.currentTime + 1.5)
  gain.connect(out)
  const st = { name, gain, step: 0, next: c.currentTime + 0.1 }
  st.timer = setInterval(() => schedule(st, c), 60)
  schedule(st, c)
  state = st
}

// Short end-of-mission stinger
export function playStinger(win) {
  const a = audioOut()
  if (!a) return
  playMusic(null)
  const { ctx: c, out } = a
  const t = c.currentTime + 0.1
  const g = c.createGain()
  g.gain.value = 0.6
  g.connect(out)
  if (win) {
    ;[N.C4, N.E4, N.G4, N.C5].forEach((n, i) => I.brass(c, g, n, t + i * 0.18, i === 3 ? 1.6 : 0.2, 0.06))
    I.pad(c, g, [N.C4, N.E4, N.G4], t + 0.54, 2.5, 0.04)
    I.timpani(c, g, N.C3 - 12, t + 0.54, 0.3)
  } else {
    ;[N.A4, N.F4, N.D4, N.A3].forEach((n, i) => I.brass(c, g, n, t + i * 0.45, i === 3 ? 2.2 : 0.4, 0.045))
    I.pad(c, g, [N.D3, N.F3, N.A3], t + 1.35, 3, 0.035)
  }
}
