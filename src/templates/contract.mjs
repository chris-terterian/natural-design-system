// Template and slot contracts (D-038). Plain JavaScript so the renderer, the MCP server and
// scripts/check-templates.mjs share one implementation. The contract itself is governance/templates.json.

const present = (v) => !(v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0));
const itemCount = (s) => (Array.isArray(s?.props?.products) ? s.props.products.length : 0);

/**
 * Checks a composition against the contract and resolves personalised fallbacks.
 * @returns {{ valid: boolean, errors: Issue[], warnings: Issue[], resolved: object | null }}
 */
export function validateComposition(contract, composition) {
  const errors = [];
  const warnings = [];
  const err = (slot, index, rule, message) => errors.push({ slot, index, rule, message });
  const warn = (slot, index, rule, message) => warnings.push({ slot, index, rule, message });

  const template = contract.templates?.[composition?.template];
  if (!template) {
    err(null, null, 'template', `Unknown template "${composition?.template}". Use one of: ${Object.keys(contract.templates).join(', ')}.`);
    return { valid: false, errors, warnings, resolved: null };
  }
  const slots = composition.slots ?? {};
  const known = new Set(template.slots.map((s) => s.id));
  for (const id of Object.keys(slots)) {
    if (!known.has(id)) err(id, null, 'slot', `The ${template.name} template has no "${id}" slot. Slots: ${[...known].join(', ')}.`);
  }

  let personalisedCount = 0;
  const resolvedSlots = {};

  for (const slot of template.slots) {
    const sections = Array.isArray(slots[slot.id]) ? slots[slot.id] : [];
    if (sections.length < slot.min) err(slot.id, null, 'min', `"${slot.id}" needs at least ${slot.min} section${slot.min === 1 ? '' : 's'}; it has ${sections.length}.`);
    if (sections.length > slot.max) err(slot.id, null, 'max', `"${slot.id}" takes at most ${slot.max} section${slot.max === 1 ? '' : 's'}; it has ${sections.length}.`);

    const resolved = [];
    sections.forEach((section, i) => {
      const kind = section?.kind;
      const def = contract.sections[kind];
      if (!def) { err(slot.id, i, 'kind', `Unknown section kind "${kind}".`); return; }
      if (!slot.accepts.includes(kind)) { err(slot.id, i, 'accepts', `"${slot.id}" accepts ${slot.accepts.join(' or ')}, not ${kind}.`); return; }
      for (const key of def.requires ?? []) {
        if (key === 'alt' ? typeof section.props?.alt !== 'string' : !present(section.props?.[key])) {
          err(slot.id, i, 'requires', `${kind} needs "${key}"${key === 'alt' ? ' (use "" for a decorative image)' : ''}.`);
        }
      }

      let out = section;
      if (def.needsSource) {
        const source = contract.sources[section.source];
        if (!source) { err(slot.id, i, 'source', `${kind} needs a known source (${Object.keys(contract.sources).join(', ')}); got "${section.source}".`); return; }
        const n = itemCount(section);
        if (def.maxItems && n > def.maxItems) err(slot.id, i, 'max-items', `${kind} shows at most ${def.maxItems} products; it has ${n}.`);
        if (source.personalized) {
          personalisedCount += 1;
          const rules = contract.personalization;
          if (rules.requiresReason && !present(section.reason)) err(slot.id, i, 'reason', `Personalised rows need a reason the shopper can read, e.g. "Because you viewed the Woven Rush Basket".`);
          const fb = section.fallback;
          if (rules.requiresFallback && !fb) {
            err(slot.id, i, 'fallback', `Personalised rows need a fallback for shoppers with no history (source ${rules.fallbackSources.join(', ')}).`);
          } else if (fb) {
            if (!rules.fallbackSources.includes(fb.source)) err(slot.id, i, 'fallback', `A fallback must come from ${rules.fallbackSources.join(', ')}, not "${fb.source}".`);
            const fbCount = Array.isArray(fb.products) ? fb.products.length : 0;
            if (def.minItems && fbCount < def.minItems) err(slot.id, i, 'fallback', `The fallback needs at least ${def.minItems} products; it has ${fbCount}.`);
            if (def.minItems && n < def.minItems) {
              warn(slot.id, i, 'fallback-used', `Only ${n} personalised product${n === 1 ? '' : 's'}, so the ${fb.source} fallback shows instead.`);
              out = { ...section, source: fb.source, reason: undefined, usedFallback: true, props: { ...section.props, title: fb.title ?? section.props?.title, products: fb.products } };
            }
          }
        } else if (def.minItems && n < def.minItems) {
          err(slot.id, i, 'min-items', `${kind} needs at least ${def.minItems} products; it has ${n}.`);
        }
      }
      resolved.push(out);
    });

    for (const rule of slot.rules ?? []) {
      const kinds = resolved.map((s) => s.kind);
      if (rule.type === 'requires' && kinds.filter((k) => k === rule.kind).length < rule.min) err(slot.id, null, 'requires-kind', rule.reason);
      if (rule.type === 'first' && kinds.length && kinds[0] !== rule.kind) err(slot.id, 0, 'first', rule.reason);
      if (rule.type === 'no-adjacent') kinds.forEach((k, i) => { if (i && k === rule.kind && kinds[i - 1] === rule.kind) err(slot.id, i, 'no-adjacent', rule.reason); });
      if (rule.type === 'max-kind' && kinds.filter((k) => k === rule.kind).length > rule.max) err(slot.id, null, 'max-kind', rule.reason);
      if (rule.type === 'sources') sections.forEach((s, i) => { if (s?.source && !rule.allow.includes(s.source)) err(slot.id, i, 'sources', `${rule.reason} "${s.source}" isn't allowed here.`); });
    }
    resolvedSlots[slot.id] = resolved;
  }

  const maxP = contract.personalization?.maxPerPage;
  if (maxP != null && personalisedCount > maxP) err(null, null, 'personalised-max', `A page shows at most ${maxP} personalised rows; this one has ${personalisedCount}.`);

  const valid = errors.length === 0;
  return { valid, errors, warnings, resolved: valid ? { template: composition.template, slots: resolvedSlots } : null };
}

/** The slots of a template in render order, with their layout hints. */
export function templateSlots(contract, templateId) {
  return contract.templates?.[templateId]?.slots ?? [];
}

/** Replaces "@name" product lists in example compositions with lists from a lookup table. */
export function expandProductRefs(value, products) {
  if (typeof value === 'string' && value.startsWith('@')) return products[value.slice(1)] ?? [];
  if (Array.isArray(value)) return value.map((v) => expandProductRefs(v, products));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, expandProductRefs(v, products)]));
  return value;
}
