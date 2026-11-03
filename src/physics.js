// Teaching model: a normalized loaded parallel resonator and constant-drop
// peak detector. No inferred transfer from generator voltage to tank voltage.
export const NOMINAL = Object.freeze({ turns: 75, diameterMM: 50, lengthMM: 25, rOhm: 15000, cNF: 3.3 });
export function inductanceUH(n = 75, d = 50, l = 25) { return d * d * n * n / (457 * d + 1016 * l); }
export function resonanceHz(lUH, cPF) { return 1 / (2 * Math.PI * Math.sqrt(lUH * 1e-6 * cPF * 1e-12)); }
export function capacitancePF(lUH, fHz) { return 1e12 / ((2 * Math.PI * fHz) ** 2 * lUH * 1e-6); }
export function response(f, f0, q) {
  const x = q * (f / f0 - f0 / f);
  return { re: 1 / (1 + x * x), im: -x / (1 + x * x), magnitude: 1 / Math.sqrt(1 + x * x) };
}
export function bandwidth(f0, q) {
  const root = Math.sqrt(4 + 1 / (q * q));
  return { low: f0 * (root - 1 / q) / 2, high: f0 * (root + 1 / q) / 2, width: f0 / q };
}
export function detectorTrace({ carrier = 819000, f0 = carrier, q = 40, amplitude = 0.8, depth = 0, audio = 1000, drop = 0.25, cNF = 3.3, rOhm = 15000, duration = depth ? 0.002 : 0.000012, samplesPerCycle = 64 } = {}) {
  const tau = rOhm * cNF * 1e-9;
  const dt = 1 / (carrier * samplesPerCycle);
  // Settle for >= 12 RC, plus 3 audio periods for the AM example.
  const warmup = Math.max(12 * tau, depth ? 3 / audio : 0);
  const count = Math.ceil((warmup + duration) / dt);
  const h = response(carrier, f0, q);
  const lo = response(carrier - audio, f0, q), hi = response(carrier + audio, f0, q);
  const decay = Math.exp(-dt / tau);
  const stride = Math.max(1, Math.floor(duration / dt / 1600));
  const points = []; let held = 0, sum = 0, min = Infinity, max = -Infinity, n = 0;
  for (let i = 0; i <= count; i++) {
    const t = i * dt - warmup;
    const phase = 2 * Math.PI * carrier * t;
    const side = 2 * Math.PI * audio * t;
    const sample = z => z.re * Math.cos(phase) - z.im * Math.sin(phase);
    const lower = lo.re * Math.cos(phase - side) - lo.im * Math.sin(phase - side);
    const upper = hi.re * Math.cos(phase + side) - hi.im * Math.sin(phase + side);
    const vin = amplitude * (sample(h) + depth * 0.5 * (lower + upper));
    held = Math.max(0, vin - drop, held * decay);
    if (t >= 0) {
      sum += held; n++; min = Math.min(min, held); max = Math.max(max, held);
      if (i % stride === 0) {
        const er = h.re + depth * 0.5 * ((lo.re + hi.re) * Math.cos(side) + (lo.im - hi.im) * Math.sin(side));
        const ei = h.im + depth * 0.5 * ((lo.im + hi.im) * Math.cos(side) + (hi.re - lo.re) * Math.sin(side));
        points.push({ t, input: vin, output: held, envelope: amplitude * Math.hypot(er, ei) });
      }
    }
  }
  return { points, mean: sum / n, ripple: max - min, tau, dt, duration, peak: amplitude * h.magnitude };
}
