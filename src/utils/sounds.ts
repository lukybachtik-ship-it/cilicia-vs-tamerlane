// ── Web Audio API sound effects (no external files) ────────────────────────
// AudioContext is lazy-created on first use to comply with autoplay policy.

let _ctx: AudioContext | null = null;

function ctx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tone(
  freq: number,
  type: OscillatorType,
  duration: number,
  gainPeak: number,
  delay = 0,
): void {
  const ac = ctx();
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  const now = ac.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(g);
  g.connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.01);
}

function noise(duration: number, gainPeak: number, delay = 0, highpass = 400): void {
  const ac = ctx();
  const bufLen = Math.ceil(ac.sampleRate * duration);
  const buf    = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

  const src = ac.createBufferSource();
  src.buffer = buf;

  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;

  const g   = ac.createGain();
  const now = ac.currentTime + delay;
  g.gain.setValueAtTime(gainPeak, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter);
  filter.connect(g);
  g.connect(ac.destination);
  src.start(now);
  src.stop(now + duration + 0.01);
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Soft click — unit selected */
export function playSelectSound(): void {
  tone(520, 'sine', 0.08, 0.12);
  tone(780, 'sine', 0.05, 0.06, 0.02);
}

/** Whoosh — unit moved to new hex */
export function playMoveSound(): void {
  const ac = ctx();
  const osc = ac.createOscillator();
  const g   = ac.createGain();
  const now = ac.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
  g.gain.setValueAtTime(0.12, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  osc.connect(g);
  g.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.2);

  noise(0.12, 0.04, 0, 1200);
}

/** Sharp strike — attacker lunges */
export function playAttackSound(): void {
  tone(160, 'sawtooth', 0.12, 0.22);
  noise(0.08, 0.15, 0, 800);
}

/** Deep impact thud — defender is hit */
export function playHitSound(): void {
  tone(90, 'triangle', 0.25, 0.35);
  tone(55, 'sine',     0.3,  0.2,  0.03);
  noise(0.18, 0.25, 0, 120);
}

/** Two-tone chime — turn ends */
export function playEndTurnSound(): void {
  tone(660, 'sine', 0.22, 0.15);
  tone(880, 'sine', 0.22, 0.12, 0.12);
}
