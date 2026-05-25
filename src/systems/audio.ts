import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export type GameSound =
  | 'shoot'       // cannon fire
  | 'pop'         // crystal gem shatters
  | 'combo'       // royal trumpet arpeggio
  | 'explosion'   // power-up magical blast
  | 'button'      // coin/bell tap
  | 'victory'     // level-complete royal fanfare
  | 'gameOver'    // defeat descending horn
  | 'swap'        // bubble swap whoosh
  | 'levelStart'; // battle drum roll + trumpet call

// ── Singleton AudioContext ────────────────────────────────────────────────────
let _actx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!_actx) _actx = new Ctor();
  if (_actx.state === 'suspended') _actx.resume().catch(() => {});
  return _actx;
}

// ── Primitive builders ────────────────────────────────────────────────────────

function mkOsc(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  freqEnd: number | null,
  t0: number,
  t1: number,
  gainPeak: number,
  dest: AudioNode,
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (freqEnd !== null) {
    o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t1);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gainPeak, t0 + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);
  o.connect(g);
  g.connect(dest);
  o.start(t0);
  o.stop(t1 + 0.02);
}

function mkNoise(
  ctx: AudioContext,
  t0: number,
  t1: number,
  gainPeak: number,
  filterHz: number | null,
  dest: AudioNode,
) {
  const len = Math.max(1, Math.ceil((t1 - t0) * ctx.sampleRate));
  const buf  = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainPeak, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);
  if (filterHz !== null) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterHz;
    src.connect(f);
    f.connect(g);
  } else {
    src.connect(g);
  }
  g.connect(dest);
  src.start(t0);
  src.stop(t1 + 0.02);
}

function mkBrass(
  ctx: AudioContext,
  freq: number,
  t0: number,
  dur: number,
  gainPeak: number,
  dest: AudioNode,
) {
  const o    = ctx.createOscillator();
  const filt = ctx.createBiquadFilter();
  const g    = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.value = freq;
  filt.type = 'lowpass';
  filt.frequency.value = 2400;
  filt.Q.value = 2;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(gainPeak, t0 + 0.014);
  g.gain.setValueAtTime(gainPeak * 0.85, t0 + dur - 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.02);
  o.connect(filt);
  filt.connect(g);
  g.connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.04);
}

// ── Kingdom Sound Synthesisers ────────────────────────────────────────────────

// 🏰 Cannon fire — realistic layered boom: crack + sub-bass + rumble + pressure wave
function sndShoot(ctx: AudioContext, vol: number) {
  const t   = ctx.currentTime;
  const master = vol * 0.14;

  // DynamicsCompressor for punchy realistic feel
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value      = 6;
  comp.ratio.value     = 8;
  comp.attack.value    = 0.001;
  comp.release.value   = 0.18;
  comp.connect(ctx.destination);

  const mx = ctx.createGain();
  mx.gain.value = master;
  mx.connect(comp);

  // Layer 1: sharp crack — unfiltered white noise, instant attack, 15ms
  {
    const len = Math.ceil(0.015 * ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(2.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    src.connect(g); g.connect(mx);
    src.start(t); src.stop(t + 0.02);
  }

  // Layer 2: sub-bass thud — sine 60→28Hz, slow decay 900ms
  {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(60, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1.8, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g); g.connect(mx);
    o.start(t); o.stop(t + 0.95);
  }

  // Layer 3: low rumble — bandpass noise ~120Hz, long 1.2s tail
  {
    const len = Math.ceil(1.25 * ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 120;
    filt.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(1.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    src.connect(filt); filt.connect(g); g.connect(mx);
    src.start(t); src.stop(t + 1.25);
  }

  // Layer 4: mid pressure wave — lowpass noise ~400Hz, starts 10ms in, 350ms
  {
    const len = Math.ceil(0.36 * ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.8, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.36);
    src.connect(filt); filt.connect(g); g.connect(mx);
    src.start(t + 0.01); src.stop(t + 0.38);
  }
}

// 💎 Crystal gem shatters — bright ping + shimmer
function sndPop(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  const detune = 1 + (Math.random() - 0.5) * 0.08; // slight pitch variety
  mkOsc  (ctx, 'sine', 1380 * detune, null, t, t + 0.20, 0.55, mx);
  mkOsc  (ctx, 'sine', 2060 * detune, null, t, t + 0.13, 0.28, mx);
  mkNoise(ctx,                              t, t + 0.05, 0.30, 3500, mx);
}

// ⚔️ Chain reaction — ascending royal trumpet arpeggio
function sndCombo(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  // C5  E5   G5   C6
  [523, 659, 784, 1047].forEach((freq, i) => {
    mkBrass(ctx, freq, t + i * 0.095, 0.22, 0.60, mx);
  });
}

// 🔥 Power-up blast — charging rise + massive impact + sparkle
function sndExplosion(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  mkOsc  (ctx, 'sine',    200,  1400, t,        t + 0.18, 0.32, mx);
  mkOsc  (ctx, 'sawtooth', 52,  null, t + 0.16, t + 0.70, 0.75, mx);
  mkNoise(ctx,                        t + 0.16, t + 0.72, 1.30, 550, mx);
  mkOsc  (ctx, 'sine',   2600,  null, t + 0.20, t + 0.50, 0.22, mx);
}

// 🪙 Coin / bell tap
function sndButton(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  mkOsc(ctx, 'sine', 900,  null, t, t + 0.14, 0.55, mx);
  mkOsc(ctx, 'sine', 1350, null, t, t + 0.09, 0.22, mx);
}

// 👑 Level-complete royal fanfare — G4 C5 E5 G5 E5 G5 C6 + bell
function sndVictory(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  const melody =   [392, 523, 659, 784, 659, 784, 1047];
  const durs   =   [0.12, 0.12, 0.12, 0.18, 0.10, 0.10, 0.38];
  let cur = t;
  melody.forEach((freq, i) => {
    mkBrass(ctx, freq, cur, durs[i], 0.62, mx);
    cur += durs[i] + 0.025;
  });
  // Victory bell peal
  mkOsc(ctx, 'sine', 1047, null, cur, cur + 0.65, 0.50, mx);
  mkOsc(ctx, 'sine', 1568, null, cur, cur + 0.40, 0.25, mx);
}

// ☠️ Defeat — descending horn G4 F4 Eb4 C4
function sndGameOver(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  const melody = [392, 349, 311, 261];
  const step   = 0.38;
  melody.forEach((freq, i) => {
    const nt = t + i * step;
    const o    = ctx.createOscillator();
    const filt = ctx.createBiquadFilter();
    const g    = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = freq;
    filt.type = 'lowpass';
    filt.frequency.value = 1400;
    filt.Q.value = 4;
    g.gain.setValueAtTime(0.0001, nt);
    g.gain.linearRampToValueAtTime(0.52, nt + 0.022);
    g.gain.setValueAtTime(0.45, nt + step - 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, nt + step);
    o.connect(filt);
    filt.connect(g);
    g.connect(mx);
    o.start(nt);
    o.stop(nt + step + 0.04);
  });
}

// ✨ Bubble swap — magical sparkle whoosh
function sndSwap(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  mkOsc  (ctx, 'sine', 320,  1200, t,        t + 0.22, 0.32, mx);
  mkOsc  (ctx, 'sine', 1800, null, t + 0.08, t + 0.22, 0.14, mx);
  mkNoise(ctx,               t + 0.12, t + 0.24, 0.16, 5000, mx);
}

// 🥁 Battle begins — drum roll + trumpet call
function sndLevelStart(ctx: AudioContext, vol: number) {
  const t  = ctx.currentTime;
  const mx = ctx.createGain();
  mx.gain.value = vol;
  mx.connect(ctx.destination);

  // Drum roll: 6 hits accelerating
  for (let i = 0; i < 6; i++) {
    const nt = t + i * Math.max(0.03, 0.09 - i * 0.01);
    mkNoise(ctx, nt, nt + 0.06, 0.45 + i * 0.07, 480, mx);
    mkOsc  (ctx, 'sawtooth', 80, null, nt, nt + 0.06, 0.35 + i * 0.05, mx);
  }
  // Trumpet call: C5 → G5
  const tc = t + 0.42;
  mkBrass(ctx, 523, tc,        0.22, 0.65, mx);
  mkBrass(ctx, 784, tc + 0.24, 0.38, 0.72, mx);
}

// ── Dispatch table ────────────────────────────────────────────────────────────
const SYNTHS: Record<GameSound, (ctx: AudioContext, vol: number) => void> = {
  shoot:      sndShoot,
  pop:        sndPop,
  combo:      sndCombo,
  explosion:  sndExplosion,
  button:     sndButton,
  victory:    sndVictory,
  gameOver:   sndGameOver,
  swap:       sndSwap,
  levelStart: sndLevelStart,
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useGameAudio() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);

  const play = useCallback((sound: GameSound) => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      if (!ctx) return;
      SYNTHS[sound](ctx, volume * 0.12);
    } catch {
      // Audio is always best-effort — never interrupt gameplay
    }
  }, [soundEnabled, volume]);

  return {
    play,
    soundEnabled,
    musicEnabled,
    volume,
    toggleSound: () => setSoundEnabled(v => !v),
    toggleMusic: () => setMusicEnabled(v => !v),
    setVolume,
  };
}
