// Colour changes through the token system (D-033). Turns a request such as "make the sale colour darker" (typed or
// spoken) into token edits, never raw hex in components or Figma:
//   - a Color role is re-pointed to another palette step ("fg/sale" → "palette/danger/300"), in one Color mode;
//   - a colour primitive gets a new value, which moves every palette step (in every brand) and role that uses it.
// Every proposal re-checks the contrast pairs the system promises (DESIGN.md §4.2) before and after, in every brand
// and Color mode, and blocks any pair that would drop below its WCAG 2.2 AA threshold. Applying needs the proposal id
// the person approved, so what gets written is exactly what was read back to them.
// Tiers (D-030, D-035, D-036): Primitives → Brand (palette steps; modes Natural, Tide) → Color (roles; modes Light,
// Dark). A role points at a palette step, so a change applies to every brand alike. A colour that isn't in the
// palette can't go on one role: it becomes a palette step, which every brand must define (GOVERNANCE.md §4).
import { createHash } from 'node:crypto';

const hexOf = (s) => { const m = String(s).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i); if (!m) return null; const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]; return `#${h.toUpperCase()}`; };
const lum = (hex) => { const n = parseInt(hex.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255].map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };

// The pairings the system relies on (DESIGN.md §4.2). Text 4.5:1, non-text UI 3:1 (WCAG 1.4.3, 1.4.11).
// fg/disabled, fg/decorative, border/muted and border/disabled are exempt or decorative, so they aren't gated.
const TEXT_ON_PAGE = ['fg/default', 'fg/muted', 'fg/subtle', 'fg/danger', 'fg/sale', 'fg/success'];
export const PAIRS = [
  ...TEXT_ON_PAGE.map((fg) => [fg, 'bg/default', 4.5]),
  ...['fg/default', 'fg/muted'].flatMap((fg) => [[fg, 'bg/subtle', 4.5], [fg, 'bg/muted', 4.5]]),
  ...['bg/emphasis', 'bg/sale-emphasis', 'bg/success-emphasis'].map((bg) => ['fg/on-emphasis', bg, 4.5]),
  ...['accent/bg', 'accent/bg-hover', 'accent/bg-pressed', 'control/bg-hover', 'control/bg-pressed'].map((bg) => ['fg/default', bg, 4.5]),
  ...['border/default', 'border/hover', 'border/strong', 'border/danger', 'border/success', 'focus/ring'].map((fg) => [fg, 'bg/default', 3]),
].map(([foreground, background, min]) => ({ foreground, background, min }));

const modesOf = (col) => { const t = Object.values(col || {})[0]; return t?.modes ? Object.keys(t.modes) : null; };
export const colorModes = (all) => modesOf(all.Color) || ['Light'];
export const brands = (all) => modesOf(all.Brand) || ['Natural'];
export const aliasIn = (t, mode) => (t?.modes ? (t.modes[mode] ?? Object.values(t.modes)[0])?.alias : t?.alias);
/** The primitive behind a palette step (or a primitive itself) in a brand. */
export const primitiveOf = (all, name, brand = brands(all)[0]) => (all.Brand?.[name] ? aliasIn(all.Brand[name], brand) : all.Primitives[name] ? name : null);
const roleHex = (all, role, mode, brand) => all.Primitives[primitiveOf(all, aliasIn(all.Color[role], mode), brand)]?.value?.slice(0, 7).toUpperCase();
/** Hex for a hex string, a Color role (in a mode and brand), a palette step (in a brand) or a colour primitive. */
export const colorOf = (all, s, mode = 'Light', brand = brands(all)[0]) => {
  const h = hexOf(s); if (h) return h;
  if (all.Color[s]) return roleHex(all, s, mode, brand) ?? null;
  const p = all.Primitives[primitiveOf(all, s, brand)];
  return p?.type === 'COLOR' ? p.value.slice(0, 7).toUpperCase() : null;
};
export const contrastRatio = ratio;
const family = (slot) => slot.match(/^palette\/([a-z]+)\//)?.[1];
const step = (slot) => Number(slot.match(/\/(\d+)$/)?.[1]);
const familySteps = (all, fam) => Object.keys(all.Brand || {}).filter((k) => family(k) === fam && Number.isFinite(step(k))).sort((a, b) => step(a) - step(b));
/** The palette step that shows this primitive in the default brand. */
const slotFor = (all, prim) => Object.keys(all.Brand || {}).find((k) => aliasIn(all.Brand[k], brands(all)[0]) === prim);

/** Normalise one requested change against the current tokens. Throws with a fix when it can't be done. */
const resolve = (all, { token, to, mode = 'Light' }) => {
  const name = token.trim().replace(/^--nds-/, '').replace(/^(fg|bg|border|accent|control|focus|shadow)-/, '$1/');
  if (all.Color[name]) {
    if (!colorModes(all).includes(mode)) throw new Error(`"${mode}" isn't a Color mode. Modes: ${colorModes(all).join(', ')}.`);
    const current = aliasIn(all.Color[name], mode);
    if (/^(darker|lighter)$/i.test(to)) {
      const steps = familySteps(all, family(current)); const i = steps.indexOf(current);
      const next = steps[i + (/darker/i.test(to) ? 1 : -1)];
      if (!next) throw new Error(`${name} is already the ${/darker/i.test(to) ? 'darkest' : 'lightest'} step of the ${family(current)} palette (${current}). Pick another palette step, or add one (GOVERNANCE.md §4).`);
      return { kind: 'realias', token: name, mode, from: current, to: next };
    }
    if (all.Brand?.[to]) return { kind: 'realias', token: name, mode, from: current, to };
    const prim = all.Primitives[to]?.type === 'COLOR' ? to : (() => { const hex = hexOf(to); return hex && Object.keys(all.Primitives).find((k) => all.Primitives[k].type === 'COLOR' && all.Primitives[k].value.toUpperCase() === hex); })();
    if (!prim && !hexOf(to)) throw new Error(`"${to}" isn't a colour. Use a palette step (palette/neutral/700), a primitive, a hex value, or "darker" / "lighter".`);
    const slot = prim && slotFor(all, prim);
    if (!slot) throw new Error(`${to} isn't a step of the palette. A role can only use palette steps, so every brand (${brands(all).join(', ')}) has a value for it. Add it as a palette step for each brand first (GOVERNANCE.md §4), or pick the nearest step.`);
    return { kind: 'realias', token: name, mode, from: current, to: slot };
  }
  if (all.Primitives[name]?.type === 'COLOR') {
    const hex = hexOf(to);
    if (!hex) throw new Error(`A primitive takes a hex value ("${to}" isn't one). To re-point a role instead, name the role (fg/sale).`);
    const alpha = all.Primitives[name].value.slice(7);
    return { kind: 'value', token: name, from: all.Primitives[name].value, to: hex + alpha };
  }
  throw new Error(`"${token}" isn't a Color role or colour primitive. Roles: ${Object.keys(all.Color).join(', ')}.`);
};

const applyTo = (all, changes) => {
  const next = structuredClone(all);
  for (const c of changes) {
    if (c.kind === 'realias') {
      const t = next.Color[c.token];
      next.Color[c.token] = t.modes ? { ...t, modes: { ...t.modes, [c.mode]: { ...t.modes[c.mode], alias: c.to } } } : { ...t, alias: c.to };
    } else next.Primitives[c.token] = { ...next.Primitives[c.token], value: c.to };
  }
  return next;
};

/** What a change would do: the edits, every role it moves (per brand and mode), and the contrast before / after. */
export const proposeColorChange = (all, requested) => {
  const changes = requested.map((r) => resolve(all, r));
  const next = applyTo(all, changes);
  const modes = colorModes(all), bs = brands(all);
  const combos = bs.flatMap((brand) => modes.map((mode) => ({ brand, mode })));
  const moved = combos.flatMap(({ brand, mode }) => Object.keys(all.Color).filter((r) => roleHex(all, r, mode, brand) !== roleHex(next, r, mode, brand)).map((r) => ({ role: r, brand, mode, from: roleHex(all, r, mode, brand), to: roleHex(next, r, mode, brand) })));
  const contrast = combos.flatMap(({ brand, mode }) => {
    const affected = new Set(moved.filter((x) => x.mode === mode && x.brand === brand).map((x) => x.role));
    return PAIRS.filter((p) => affected.has(p.foreground) || affected.has(p.background)).map((p) => {
      const before = ratio(roleHex(all, p.foreground, mode, brand), roleHex(all, p.background, mode, brand));
      const after = ratio(roleHex(next, p.foreground, mode, brand), roleHex(next, p.background, mode, brand));
      return { ...p, brand, mode, before: `${before}:1`, after: `${after}:1`, pass: after >= p.min, regression: before >= p.min && after < p.min };
    });
  });
  const blocked = contrast.filter((c) => !c.pass);
  const id = createHash('sha256').update(JSON.stringify({ changes, base: createHash('sha256').update(JSON.stringify(all)).digest('hex') })).digest('hex').slice(0, 10);
  const where = (brand, mode) => [bs.length > 1 && brand !== bs[0] ? brand : '', modes.length > 1 && mode !== 'Light' ? `${mode.toLowerCase()} mode` : ''].filter(Boolean).join(' ');
  const inMode = (m) => (modes.length > 1 && m !== 'Light' ? ` in ${m.toLowerCase()} mode` : '');
  const roleList = [...new Set(moved.filter((m) => m.brand === bs[0]).map((m) => `${m.role}${inMode(m.mode)}`))];
  const say = [
    changes.map((c) => (c.kind === 'realias' ? `${c.token}${inMode(c.mode)} moves from ${c.from} to ${c.to}` : `${c.token} changes from ${c.from} to ${c.to}`)).join('; ') + '.',
    roleList.length > 1 || changes.some((c) => c.kind === 'value') ? `That recolours ${roleList.length} role${roleList.length === 1 ? '' : 's'}: ${roleList.join(', ')}.` : '',
    blocked.length ? `It can't be applied: ${blocked.map((b) => `${b.foreground} on ${b.background}${where(b.brand, b.mode) ? ` (${where(b.brand, b.mode)})` : ''} would be ${b.after}, under ${b.min}:1`).join('; ')}.` : `Every affected pairing still passes WCAG AA${bs.length > 1 ? ` in ${bs.join(' and ')}` : ''}${modes.length > 1 ? ', light and dark' : ''}${contrast.length ? ` (lowest ${contrast.map((c) => c.after).sort((a, b) => parseFloat(a) - parseFloat(b))[0]})` : ''}. Shall I apply it?`,
  ].filter(Boolean).join(' ');
  return { proposalId: id, pass: blocked.length === 0, changes, moved, contrast, blocked, say, next };
};

/** Figma plugin script (run with use_figma) that applies exactly these changes. Lookups are scoped per collection. */
export const figmaScriptFor = (changes) => `const CHANGES = ${JSON.stringify(changes)};
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const col = (n) => { const c = cols.find((x) => x.name === n); if (!c) throw new Error('Missing collection ' + n); return c; };
const inCol = (c, name) => vars.find((v) => v.variableCollectionId === c.id && v.name === name);
const rgba = (hex) => { const h = hex.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 }; };
const P = col('Primitives'), B = col('Brand'), C = col('Color');
const done = [];
for (const c of CHANGES) {
  if (c.kind === 'realias') {
    const role = inCol(C, c.token), target = inCol(B, c.to); // roles point at palette steps (Brand collection)
    if (!role || !target) throw new Error('Not found: ' + (role ? c.to : c.token));
    const mode = C.modes.find((m) => m.name === c.mode) || C.modes[0]; // only the mode that was approved
    role.setValueForMode(mode.modeId, { type: 'VARIABLE_ALIAS', id: target.id });
    done.push(c.token + ' (' + mode.name + ') → ' + c.to);
  } else {
    const v = inCol(P, c.token);
    if (!v) throw new Error('Not found: ' + c.token);
    v.setValueForMode(P.modes[0].modeId, rgba(c.to));
    done.push(c.token + ' = ' + c.to);
  }
}
return { done };
`;
