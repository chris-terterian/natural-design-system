# Natural Design System

A natural goods e-commerce design system: React + TypeScript components, design tokens and Storybook, kept in step with the Figma file **Natural Design System** (`84MjZXozBoKCvf9lwIU5pu`).

**Live Storybook:** https://chris-terterian.github.io/natural-design-system/

All components target **WCAG 2.2 AA**. Contrast ratios for every state are documented in Figma next to each component.

## Getting started

```bash
npm install
npm run storybook        # http://localhost:6007
```

| Script | What it does |
|---|---|
| `npm run tokens` | Regenerates `src/styles/tokens.css` from `tokens/figma-variables.json` |
| `npm run storybook` | Tokens + Storybook dev server on port 6007 |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |
| `npm run build` | Library build to `dist/` (ES module + CSS + types) |
| `npm run typecheck` | TypeScript check |
| `npm run figma:sync-script` | Prints the Figma variable sync script with current tokens inlined |

## Components

| Component | Figma node | Notes |
|---|---|---|
| `Badge` | `2:171` | Tone: Dark / Light / Sale / Success / Outline; used inside ProductCard |
| `Button` | `1:202` | Primary / Secondary, left/right/both icons, 5 states |
| `TextField`, `TextArea` | `1:498` | 8 states incl. error, success, read-only; textarea counter |
| `Radio`, `RadioGroup` | `1:637` | Fieldset + legend, group-level error |
| `WishlistButton` | `1:815` | `aria-pressed` toggle; filled vs outline heart |
| `ProductCard` | `1:968` | Default / Sale / Sold out; nested wishlist + CTA |

Every story links to its Figma component in the **Design** panel. Each component has an **All Variants** story laid out the same way as its Figma variant grid. `forceState` props show hover/pressed/focus without interaction; they're for documentation only.

## Tokens

`tokens/figma-variables.json` mirrors the Figma variable collections one-to-one:

- **Primitives**: raw values (`color/brown/200`, `space/12`, …). They're hidden from Figma pickers.
- **Badge, Button, Input, Radio, Product Card**: semantic tokens that alias primitives.

A Figma variable `button/primary/bg/default` becomes the CSS custom property `--nds-button-primary-bg-default: var(--nds-color-brown-200)`.

## Keeping code and Figma in sync

The repo is the source of truth. A change flows like this:

1. **Edit** tokens in `tokens/figma-variables.json` and/or component code in `src/`.
2. **Review** it in Storybook, then run `npm run tokens` and check the stories.
3. **Figma**:
   - **Variables**: run the output of `npm run figma:sync-script` in the Figma file through the figma-console Desktop Bridge. It creates and updates variables and reports any that exist only in Figma. It never deletes.
   - **Component changes** (new variants, layout): apply them to the matching Figma component set, then check with a screenshot.
4. **GitHub**: commit and push once both look right.

Figma desktop must be open with the Desktop Bridge plugin running for step 3.

## Using the library

```tsx
import { Button, ProductCard } from 'natural-design-system';
import 'natural-design-system/styles.css';
```

Load **Inter** (400/600/700) in your app, or override `--nds-font-family`.
