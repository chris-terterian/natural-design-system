// Colour changes through the token system (D-033). Turns a request such as "make the sale colour darker" (typed or
// spoken) into token edits, never raw hex in components or Figma:
//   - a Color role is re-pointed to a primitive ("fg/sale" → "color/red/700"), or to a new primitive when the
//     requested hex isn't in the palette (roles alias primitives directly, D-030);
//   - a colour primitive gets a new value, which moves every role that aliases it.
// Every proposal re-checks the contrast pairs the system promises (DESIGN.md §4.2) before and after, and blocks any
// pair that would drop below its WCAG 2.2 AA threshold. Applying needs the proposal id the person approved, so what
// gets written is exactly what was read back to them.
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

const roleHex = (all, role) => { const t = all.Color[role]; const p = t?.alias ? all.Primitives[t.alias] : t; return p?.value?.slice(0, 7).toUpperCase(); };
const family = (name) => name.match(/^color\/([a-z]+)\//)?.[1];
const step = (name) => Number(name.match(/\/(\d+)$/)?.[1]);
const familySteps = (all, fam) => Object.keys(all.Primitives).filter((k) => family(k) === fam && Number.isFinite(step(k))).sort((a, b) => step(a) - step(b));

/** Normalise one requested change against the current tokens. Throws with a fix when it can't be done. */
const resolve = (all, { token, to, primitiveName }) => {
  const name = token.trim().replace(/^--nds-/, '').replace(/^(fg|bg|border|accent|control|focus|shadow)-/, '$1/');
  if (all.Color[name]) {
    const current = all.Color[name].alias;
    if (/^(darker|lighter)$/i.test(to)) {
      const steps = familySteps(all, family(current)); const i = steps.indexOf(current);
      const next = steps[i + (/darker/i.test(to) ? 1 : -1)];
      if (!next) throw new Error(`${name} is already the ${/darker/i.test(to) ? 'darkest' : 'lightest'} step of ${family(current)} (${current}). Give a hex value instead.`);
      return { kind: 'realias', token: name, from: current, to: next };
    }
    if (all.Primitives[to]?.type === 'COLOR') return { kind: 'realias', token: name, from: current, to };
    const hex = hexOf(to);
    if (!hex) throw new Error(`"${to}" isn't a colour. Use a hex value, a colour primitive (color/brown/700) or "darker" / "lighter".`);
    const existing = Object.keys(all.Primitives).find((k) => all.Primitives[k].type === 'COLOR' && all.Primitives[k].value.toUpperCase() === hex);
    if (existing) return { kind: 'realias', token: name, from: current, to: existing };
    // New primitive: the name the person gave, or the role's current family, stepped by where its lightness falls.
    let newName = primitiveName;
    if (newName && !/^color\/[a-z]+\/\d+$/.test(newName)) throw new Error(`"${newName}" isn't a primitive name like color/clay/600 (no dots: Figma variable names can't contain them).`);
    if (newName && all.Primitives[newName]) throw new Error(`${newName} already exists (${all.Primitives[newName].value}). Pick another name, or re-point to it without a hex.`);
    if (!newName) {
      const fam = family(current); const steps = familySteps(all, fam);
      const lighter = steps.filter((k) => lum(all.Primitives[k].value) > lum(hex)).pop();
      const darker = steps.find((k) => lum(all.Primitives[k].value) < lum(hex));
      const lo = lighter ? step(lighter) : 0; const hi = darker ? step(darker) : step(lighter) + 200;
      const n = [Math.round((lo + hi) / 100) * 50, Math.round((lo + hi) / 50) * 25, Math.round((lo + hi) / 2)].find((x) => x > lo && x < hi && !all.Primitives[`color/${fam}/${x}`]);
      newName = n ? `color/${fam}/${n}` : null;
      if (!newName) throw new Error(`No free step between ${lighter} and ${darker} for ${hex}. Give a name with primitiveName (color/<family>/<step>).`);
    }
    return { kind: 'realias', token: name, from: current, to: newName, newPrimitive: { name: newName, value: hex } };
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
    if (c.newPrimitive) next.Primitives[c.newPrimitive.name] = { type: 'COLOR', value: c.newPrimitive.value };
    if (c.kind === 'realias') next.Color[c.token] = { ...next.Color[c.token], alias: c.to };
    else next.Primitives[c.token] = { ...next.Primitives[c.token], value: c.to };
  }
  return next;
};

/** What a change would do: the edits, every role it moves, and the contrast before / after. */
export const proposeColorChange = (all, requested) => {
  const changes = requested.map((r) => resolve(all, r));
  const next = applyTo(all, changes);
  const moved = Object.keys(all.Color).filter((r) => roleHex(all, r) !== roleHex(next, r)).map((r) => ({ role: r, from: roleHex(all, r), to: roleHex(next, r) }));
  const affected = new Set(moved.map((m) => m.role));
  const contrast = PAIRS.filter((p) => affected.has(p.foreground) || affected.has(p.background)).map((p) => {
    const before = ratio(roleHex(all, p.foreground), roleHex(all, p.background));
    const after = ratio(roleHex(next, p.foreground), roleHex(next, p.background));
    return { ...p, before: `${before}:1`, after: `${after}:1`, pass: after >= p.min, regression: before >= p.min && after < p.min };
  });
  const blocked = contrast.filter((c) => !c.pass);
  const id = createHash('sha256').update(JSON.stringify({ changes, base: createHash('sha256').update(JSON.stringify(all)).digest('hex') })).digest('hex').slice(0, 10);
  const say = [
    changes.map((c) => (c.kind === 'realias' ? `${c.token} moves from ${c.from} to ${c.to}${c.newPrimitive ? ` (a new primitive, ${c.newPrimitive.value})` : ''}` : `${c.token} changes from ${c.from} to ${c.to}`)).join('; ') + '.',
    moved.length > 1 || changes.some((c) => c.kind === 'value') ? `That recolours ${moved.length} role${moved.length === 1 ? '' : 's'}: ${moved.map((m) => m.role).join(', ')}.` : '',
    blocked.length ? `It can't be applied: ${blocked.map((b) => `${b.foreground} on ${b.background} would be ${b.after}, under ${b.min}:1`).join('; ')}.` : `Every affected pairing still passes WCAG AA${contrast.length ? ` (lowest ${contrast.map((c) => c.after).sort((a, b) => parseFloat(a) - parseFloat(b))[0]})` : ''}. Shall I apply it?`,
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
const P = col('Primitives'), C = col('Color');
const done = [];
for (const c of CHANGES) {
  if (c.newPrimitive && !inCol(P, c.newPrimitive.name)) {
    const v = figma.variables.createVariable(c.newPrimitive.name, P, 'COLOR');
    v.scopes = []; // primitives stay hidden (D-030)
    v.setValueForMode(P.modes[0].modeId, rgba(c.newPrimitive.value));
    vars.push(v); done.push('created ' + c.newPrimitive.name);
  }
  if (c.kind === 'realias') {
    const role = inCol(C, c.token), target = inCol(P, c.to);
    if (!role || !target) throw new Error('Not found: ' + (role ? c.to : c.token));
    for (const m of C.modes) role.setValueForMode(m.modeId, { type: 'VARIABLE_ALIAS', id: target.id });
    done.push(c.token + ' → ' + c.to);
  } else {
    const v = inCol(P, c.token);
    if (!v) throw new Error('Not found: ' + c.token);
    v.setValueForMode(P.modes[0].modeId, rgba(c.to));
    done.push(c.token + ' = ' + c.to);
  }
}
return { done };
`;
