# Natural Design System

A natural goods e-commerce design system: React + TypeScript components, design tokens and Storybook, kept in step with the Figma file **Natural Design System** (`84MjZXozBoKCvf9lwIU5pu`).

[![npm](https://img.shields.io/npm/v/natural-design-system)](https://www.npmjs.com/package/natural-design-system) [![Quality gates](https://github.com/chris-terterian/natural-design-system/actions/workflows/storybook-pages.yml/badge.svg)](https://github.com/chris-terterian/natural-design-system/actions/workflows/storybook-pages.yml) [![Drift bot](https://github.com/chris-terterian/natural-design-system/actions/workflows/drift-bot.yml/badge.svg)](https://github.com/chris-terterian/natural-design-system/actions/workflows/drift-bot.yml)

**Live Storybook:** https://chris-terterian.github.io/natural-design-system/

**Two brands, Light and Dark:** every component in Natural and **Tide** (a coastal store), each in Light and Dark, from the same tokens: four combinations, all WCAG AA. Set `data-nds-brand="tide"` and `data-nds-theme="dark"` (or `"system"`) on the page; Storybook has Brand and Theme switches in the toolbar.

**Install:** `npm install natural-design-system`, then `import { Button } from 'natural-design-system'` and `import 'natural-design-system/styles.css'`.

**Governance:** [GOVERNANCE.md](GOVERNANCE.md) · [DECISIONS.md](DECISIONS.md) · [CHANGELOG.md](CHANGELOG.md) (v0.16.0)

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
| `npm run test:parity-direction` | Proves parity tells which side moved: code changed → Figma behind, Figma changed → design decision, both → conflict, no history → unknown |
| `npm run drift` | Every gate, without stopping at the first failure, plus whether Figma was edited since the snapshot (with `FIGMA_TOKEN`); writes `drift/report.md`. `-- --fix` applies the safe fixes first, `-- --skip-a11y` skips the slow gates |
| `npm run check:contrast` | Every promised colour pairing passes WCAG AA in every brand × theme (Natural, Tide × Light, Dark) |
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
| `Footer`, `FooterColumn`, `FooterLink` | `221:136`, `223:116`, `221:16` | Three link columns (collapsible on mobile), copyright and legal links (Beta) |
| `Slider`, `RangeSlider` | `239:2732`, `242:722` | One value, or a from–to range with two thumbs; number fields at the start, end, sides, above or below (Beta) |
| `CartDrawer` | `248:77` | The bag as a sidebar from the Bag button: lines, subtotal, Check out (Beta) |
| `CartLine`, `TextButton` | `245:707`, `245:658` | One product in the bag (image, title, SKU, price, Remove); underlined text button for small actions (Beta) |
| `Toggle` | `67:360` | On/off switch (`role="switch"`), label + description |
| `Radio`, `RadioGroup` | `1:637` | Fieldset + legend, group-level error |
| `WishlistButton` | `1:815` | `aria-pressed` toggle; filled vs outline heart |
| `Heading`, `Text` | `76:5` | Content type scale: H1–H4, Paragraph Large / Default / Small, Caption; Desktop / Mobile modes |
| `ProductRow` | `73:210` | Titled row: 4 cards desktop, 2 per row mobile (container query); `showButtons` off by default |
| `ProductCard` | `1:968` | Default / Sale / Sold out; nested wishlist + CTA |

Every story links to its Figma component in the **Design** panel. Each component has an **All Variants** story laid out the same way as its Figma variant grid. `forceState` props show hover/pressed/focus without interaction; they're for documentation only.

## Build with AI (Natural MCP server)

No clone needed: `npx -y natural-design-system setup` registers it with Claude Desktop, Cursor and Claude Code (absolute paths, so it works from the Dock too). The MCP server gives AI agents the system: components and specs, tokens by tier, brand and accessibility rules, and the repo's own checks (`validate_code`, `check_contrast`, `check_copy`). Agents work through **checkpoints** (anchor → plan → structure → style → content → accessibility → final gate), so drift is stopped at the step where it happens. `npm run mcp:demo` shows a drifted attempt being stopped and a fixed one passing; `npm run check:mcp` proves it in CI. Details: [`mcp/README.md`](mcp/README.md).

## Change colours by voice

Say *"make the sale price a bit darker"* to Claude (voice in Claude Desktop or the mobile app, or dictation in Claude Code) and it changes the **design tokens**, not a layer: the role is re-pointed or the primitive retuned, the contrast of every affected pairing is read back, anything below WCAG AA is blocked, and only after a yes are the tokens written and the Figma variables updated, so every component using that colour changes in Figma and code together. Tools `propose_color_change` / `apply_color_change`, prompt `recolor`, and `/recolor` in Claude Code (D-033, [`mcp/README.md`](mcp/README.md#change-colours-by-voice)).

## Drift bot

When **any** quality gate fails, or **Figma and code disagree**, the drift bot (D-032, `.github/workflows/drift-bot.yml`) files one *Drift detected* issue with the full report and opens a **pull request with the fix**. A person reviews and merges; the bot never merges, never pushes to `main` and never publishes.

- **Detect:** after every failed run on `main`, nightly, or on demand, `scripts/drift-check.mjs` runs every gate (it keeps going after a failure, so the report is complete), applies the safe deterministic fixes and says who can fix each failure. The issue closes itself when everything is green again.
- **Fix code drift:** an agent (Claude Code in GitHub Actions) fixes the code with the report's fix suggestions and the Natural MCP server's checkpoints, re-runs the gates and opens the pull request. It may not loosen a rule, add an exception or touch the Figma snapshot to make a gate pass.
- **Which side is wrong?** The bot doesn't guess. Each Figma ↔ code difference is compared with the code as it was when the snapshot was last taken: if the code moved, Figma is behind and `/drift` updates Figma through the Figma MCP; if Figma moved, it's a design decision, and the bot opens a pull request adopting it in code for a person to approve (or revert in Figma); if both moved, a person decides (D-034).

Run the check yourself: `npm run drift` (add `-- --skip-a11y` for a fast pass).

## Tokens

`tokens/figma-variables.json` mirrors the Figma variable collections one-to-one:

| Tier | Collection | Modes | Variables | Examples |
|---|---|---|---|---|
| 1 | **Primitives** | — | 114 | `color/brown/900`, `space/12`, `radius/8` (space, radius and border width are the public scale; the rest stays behind the tiers) |
| 2 | **Brand** | Natural · Tide | 25 | `palette/neutral/900`, `palette/quiet/200` (each brand's colour family; roles point here) |
| 2 | **Color** | Light, Dark | 32 | `fg/muted`, `bg/emphasis`, `border/hover`, `accent/bg`, `focus/ring` |
| 2 | **Dimension** | — | 9 | `size/control`, `size/target-min`, `focus/ring-width` |
| 3 | **Layout** | Desktop · Mobile | 4 | `layout/page-margin`, `layout/gutter`, `layout/section` |
| 3 | **Typography** | Desktop · Mobile | 37 | `text/h1/font-size`, `ui/label/font-size` |
| 4 | **Component** | Desktop · Mobile | 41 | `card/width`, `calendar/day/size` (one-off decisions only) |

A Figma variable `fg/muted` is the CSS custom property `--nds-fg-muted: var(--nds-color-brown-800)`. Moded tokens also have `--desktop` / `--mobile` constants for container queries. Components may only use tiers 2–4 and the public scale; validate_file enforces it. Architecture, rules and the decision procedure for new tokens: DESIGN.md §5 and D-030. The 0.14.0 migration map is in `tokens/migrations/`.

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
