# Natural Design System

A natural goods e-commerce design system: React + TypeScript components, design tokens and Storybook, kept in step with the Figma file **Natural Design System** (`84MjZXozBoKCvf9lwIU5pu`).

**Live Storybook:** https://chris-terterian.github.io/natural-design-system/

**Governance:** [GOVERNANCE.md](GOVERNANCE.md) · [DECISIONS.md](DECISIONS.md) · [CHANGELOG.md](CHANGELOG.md) (v0.9.0)

**Design guidelines:** [DESIGN.md](DESIGN.md) covers the brand, voice, foundations, components and e-commerce patterns.

All components target **WCAG 2.2 AA**. Contrast ratios for every state are documented in Figma next to each component.

## Getting started

```bash
npm install
npm run storybook        # http://localhost:6007
```

| Script | What it does |
|---|---|
| `npm run tokens` | Regenerates `src/styles/tokens.css` and the `DESIGN.md` token front matter from `tokens/figma-variables.json` |
| `npm run storybook` | Tokens + Storybook dev server on port 6007 |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |
| `npm run build` | Library build to `dist/` (ES module + CSS + types) |
| `npm run typecheck` | TypeScript check |
| `npm run validate_file -- <files> \| --staged \| --all` | The validate_file guardrail (also runs as a pre-commit hook): blocks hardcoded values, broken naming, placeholder link text; fix suggestion for every finding |
| `npm run check` | All quality gates: typecheck, governance, parity, Storybook build, accessibility (the same gates CI runs before deploying) |
| `npm run check:governance` | Registry ↔ stories ↔ Figma links ↔ DESIGN.md specs; tokens resolve and generated files are current |
| `npm run check:parity` | Figma ↔ code parity against `governance/figma-snapshot.json` (variables per mode, linked components, unwired properties, text styles) |
| `npm run figma:snapshot-script -- <part>` | Prints the Figma export script (`variables-1`, `variables-2`, `structure`) to run through the Figma MCP |
| `npm run figma:snapshot-save -- <files>` | Merges the three export results into `governance/figma-snapshot.json` |
| `npm run check:a11y` | axe (WCAG 2.2 AA) on every story in the built Storybook, minus registered exceptions |
| `npm run figma:sync-script` | Prints the Figma variable sync script with current tokens inlined |

## AI story drafting (Story UI, local only)

Generate Storybook stories from a prompt, built only from this system's components:

```bash
# once: put your Anthropic key in .env (gitignored)
#   ANTHROPIC_API_KEY=sk-ant-…
npx story-ui check          # confirms the install; names anything to fix
npm run storybook-with-ui   # Storybook (6007) + Story UI server (4001)
```

Open `http://localhost:6007/?path=/workspace/`. Generated stories are drafts in `src/stories/generated/` (gitignored); keeping one means promoting it into `src/components/` through the contribution flow in `GOVERNANCE.md`. The published Storybook doesn't include Story UI.

## Storybook MCP (AI agents, local only)

`@storybook/addon-mcp` serves `http://localhost:6007/mcp` while `npm run storybook` is running. It gives an AI agent the system as Storybook documents it: the component list, props, stories and usage notes. `.mcp.json` registers it for Claude Code (approve it once when Claude Code asks). Together with the Figma MCP, one request like "make the Figma Product Row match Storybook" can be read from Storybook and applied in Figma, then proved by `npm run check:parity`. Nothing syncs by itself: a code change on GitHub never edits Figma, and the parity gate blocks the deploy until Figma matches (D-023).

## Components

| Component | Figma node | Notes |
|---|---|---|
| `Badge` | `2:171` | Tone: Dark / Light / Sale / Success / Outline; used inside ProductCard |
| `Button` | `1:202` | Primary / Secondary, left/right/both icons, 6 states incl. Loading; `fullWidth` |
| `Spinner` | `64:50` | Loading indicator used by Button |
| `TextField`, `TextArea` | `1:498` | 8 states incl. error, success, read-only; textarea counter |
| `NavigationMenu`, `MobileMenu` | `61:134`, `61:135` | Desktop/mobile header (container query at 768px), modal mobile menu |
| `Logo` | `153:822` | The "natural" wordmark linking home; Default / Focus; nested in both menus |
| `NavLink`, `IconButton`, `MenuItem` | `60:88`, `60:69`, `60:107` | Navigation building blocks; IconButton count uses Badge |
| `DateField` | `1:498` | Input Type=Date: typed MM/DD/YYYY + calendar button opening the Calendar |
| `Calendar`, `CalendarDay` | `196:580`, `195:65` | Single date or range; ARIA grid keyboard support (Beta) |
| `ImageBlock` | `212:29` | Hero, Banner, Half-page imagery; full bleed, placeholder until a photo is set (Beta) |
| `Toggle` | `67:360` | On/off switch (`role="switch"`), label + description |
| `Radio`, `RadioGroup` | `1:637` | Fieldset + legend, group-level error |
| `WishlistButton` | `1:815` | `aria-pressed` toggle; filled vs outline heart |
| `Heading`, `Text` | `76:5` | Content type scale: H1–H4, Paragraph Large / Default / Small, Caption; Desktop / Mobile modes |
| `ProductRow` | `73:210` | Titled row: 4 cards desktop, 2 per row mobile (container query); `showButtons` off by default |
| `ProductCard` | `1:968` | Default / Sale / Sold out; nested wishlist + CTA |

Every story links to its Figma component in the **Design** panel. Each component has an **All Variants** story laid out the same way as its Figma variant grid. `forceState` props show hover/pressed/focus without interaction; they're for documentation only.

## Tokens

`tokens/figma-variables.json` mirrors the Figma variable collections one-to-one:

- **Primitives**: raw values (`color/brown/200`, `space/12`, …). They're hidden from Figma pickers.
- **Badge, Button, Input, Navigation, Radio, Toggle, Product Card, Product Row**: semantic tokens that alias primitives.
- **Typography**: the content type scale, with **Desktop** and **Mobile** modes (mobile applies below 768px, or force it with `data-nds-mode="mobile"`).

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
