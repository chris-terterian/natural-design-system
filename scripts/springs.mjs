// Spring presets (D-037). A spring is defined physically (mass, stiffness, damping, like Figma's custom spring and
// SwiftUI / Compose springs) and compiled here for the web: CSS has no native spring, so it becomes a `linear()`
// easing sampled from the simulation, plus the time it takes to settle, which is the duration to use with it.
// One definition, the same feel in Figma prototypes and code. Used by scripts/build-tokens.mjs and the governance check.

/** Simulate a unit spring from 0 to 1 and return its CSS easing and settle time (ms). */
export function compileSpring({ mass = 1, stiffness, damping }, { points = 48 } = {}) {
  const dt = 1 / 2000;
  let x = 0, v = 0, t = 0;
  const trace = [[0, 0]];
  // Settled: within 0.3% of the target (sub-pixel on a toggle) and nearly still, held for 20ms so a crossing doesn't count.
  let still = 0;
  while (t < 5) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt; x += v * dt; t += dt;
    trace.push([t, x]);
    still = Math.abs(x - 1) < 0.003 && Math.abs(v) < 0.05 ? still + dt : 0;
    if (still >= 0.02) break;
  }
  const settle = t - still;
  const sample = (time) => { const i = Math.min(trace.length - 1, Math.round(time / dt)); return trace[i][1]; };
  const values = Array.from({ length: points + 1 }, (_, i) => (i === 0 ? 0 : i === points ? 1 : sample((settle * i) / points)));
  const easing = `linear(${values.map((n) => +n.toFixed(3)).join(', ')})`;
  const peak = Math.max(...trace.map(([, y]) => y));
  return { easing, duration: Math.round((settle * 1000) / 10) * 10, overshoot: +(Math.max(0, peak - 1) * 100).toFixed(1) };
}
