# Changelog

All notable changes to the Natural Design System. Format: [Keep a Changelog](https://keepachangelog.com); versioning: [semver](https://semver.org), in 0.x per `GOVERNANCE.md` §7 (breaking changes bump the minor version).

## [0.16.0] – 2026-10-06

### Added
- **Dark mode** (D-035, DESIGN.md §4.2.1). The Color collection has **Light** and **Dark** modes in Figma and code; all 32 roles have a Dark value, over 7 new primitives (`brown/925 · 950 · 975`, `red/300`, `green/300`, `brown/975-a40 · a60`). Components are unchanged.
- `data-nds-theme="dark"` applies Dark to any element; `"system"` follows the OS; `"light"` makes a light island. Light stays the default. Constants `--nds-<role>--light` / `--dark` for explicit use.
- Storybook **Theme** switch in the toolbar (`?globals=theme:dark` in story URLs).
- `npm run check:contrast` (in `npm run check`, CI and the drift bot): every pairing DESIGN.md §4.2 promises passes WCAG AA in every Color mode.
- The accessibility gate runs every story in Light and Dark (107 stories × 2).
- MCP: `check_contrast` reports every mode (`mode` to choose the main one); `propose_color_change` takes a `mode` and re-checks contrast in all modes; `run_checkpoints` requires every pairing to pass in every mode.
- Figma: Colors page **Light and Dark** section (both columns from the same bound frames, components in both modes, the new primitives) and the category page in Dark on Desktop Example.
- **Tide, a second brand** (D-036, DESIGN.md §4.2.2): a **Brand** collection (modes Natural, Tide) of 25 palette steps between Primitives and Color; roles point at palette steps, so every brand works in Light and Dark. 21 Tide primitives (`sea/*`, `mist/*`), Natural's scale re-hued in OKLCH at the same lightness. `data-nds-brand="tide"`; Storybook **Brand** switch; `check:contrast` and the a11y gate run all four brand × theme combinations; `check_contrast` takes a `brand`.
- Figma: Brand collection; Colors page **Brands** section (palette per brand, components in all four combinations); category page in Tide Light and Tide Dark.

### Changed (breaking)
- **Removed the 0.14.0 deprecated token aliases** (`tokens-deprecated.css`), as announced in 0.14.0 and 0.15.0. The map stays in `tokens/migrations/0.14.0-semantic-tokens.json`.
- **Color roles now point at Brand palette steps** (`fg/default` → `palette/neutral/900`), not primitives. CSS variable names and values are unchanged for Natural. `propose_color_change` re-points roles to palette steps and refuses a one-off hex (`primitiveName` removed).
- **Typography colour tokens retired**: `text/color/heading`, `text/color/paragraph` → `fg/default`; `text/color/muted` → `fg/muted` (same Light values). Aliases remain until 0.17.0, but they resolve on `:root` and don't follow a theme set on a subtree. Governance now fails on any colour token outside the Color collection.

### Fixed
- Page text and background (`global.css`) and several story wrappers used colour primitives instead of roles, so they couldn't follow a theme.
- Figma: four component properties added outside the contribution flow were removed (Calendar *Show Week Numbers*, *Disabled*, *Has Footer Actions*; Logo *Href/URL*). Three weren't wired to any layer (D-009); the weekday row they toggled stays visible, as in code. Found by the parity snapshot refresh.

## [0.15.4] – 2026-10-02

### Added
- **Parity tells which side moved** (D-034). Each Figma ↔ code variable difference is compared with the code as it was when the snapshot was last committed: **Figma behind** (code changed: update Figma with `/drift`), **Figma changed** (a design decision: the drift bot opens a pull request adopting it in code, contrast-checked, for a person to approve or revert in Figma), **both changed** (a person decides) or **unknown** (no git history, so no guess). Shown in `check:parity` output, `--json` for tools, and a "Which side moved" table in the drift report.
- `npm run test:parity-direction` (in `npm run check` and CI): proves every verdict in a throwaway clone with real history.

### Changed
- CI checks out full git history, which the direction check needs. `/drift` and the drift bot act on the verdicts instead of judging the direction themselves.

## [0.15.3] – 2026-10-01

### Added
- **Change colours by voice** (D-033): say *"make the sale price a bit darker"* to Claude and it changes the design tokens, reads the change back with its contrast impact, and after a yes updates the code and the Figma variables. MCP tools `propose_color_change` (role or primitive, hex / primitive / "darker" / "lighter", contrast before and after on the 24 pairings in DESIGN.md §4.2, blocks anything under WCAG AA) and `apply_color_change` (needs the approved `proposalId`; writes tokens, regenerates, returns the Figma script), prompt `recolor`, and `/recolor` in Claude Code.
- Smoke test covers the colour tools and runs the generated Figma script against a stand-in for Figma's variables API.

## [0.15.2] – 2026-10-01

### Added
- **Published to npm:** `npm install natural-design-system` ([npmjs.com/package/natural-design-system](https://www.npmjs.com/package/natural-design-system)).
- **Drift bot** (D-032): when any quality gate fails or Figma and code disagree, it files a *Drift detected* issue and opens a pull request with the fix for a person to review. `.github/workflows/drift-bot.yml` (after failed runs on `main`, nightly, on demand, or the `drift` label), `scripts/drift-check.mjs` / `npm run drift` (every gate without stopping, safe fixes, Figma-edited check with `FIGMA_TOKEN`), and the `/drift` command in Claude Code for Figma-side drift.
- README badges (npm, quality gates, drift bot).

### Changed
- The MCP server installs from npm by default: `npx -y natural-design-system setup` (`--source github:chris-terterian/natural-design-system` for GitHub `main`).
- Pull requests to `main` run the quality gates (no deploy).

### Fixed
- The package no longer ships type files for the local Story UI workspace (`dist/stories`).

## [0.15.1] – 2026-09-30

### Fixed
- **The Natural MCP server runs without cloning the repo:** `npx -y github:chris-terterian/natural-design-system` (Claude Code: `claude mcp add natural -- npx -y github:chris-terterian/natural-design-system`). The package now ships the server and what it reads (DESIGN.md, tokens, registry, Figma map, component sources, the validator), and `@modelcontextprotocol/sdk` and `zod` are runtime dependencies. Verified from an empty folder via the GitHub path and via a packed tarball (the npm path).
- `npm publish` rebuilds `dist/` first (`prepublishOnly`), which had gone stale (it was missing the ten newest components), and runs the MCP smoke test.
- `prepare` only installs the git hooks inside a git checkout.
- **`setup` command** for Claude Desktop, Cursor and Claude Code: `npx -y github:chris-terterian/natural-design-system setup`. Writes absolute npx / Node paths (apps opened from the Dock don't get the terminal PATH, so a bare `"command": "npx"` fails with `spawn npx ENOENT`), prefers stable links over versioned Homebrew paths, handles Windows (`cmd /c`), merges with existing config and keeps a backup; `--dry-run`, `--remove`. Proven: in a Dock-like environment the bare config fails with ENOENT and the written one passes the smoke test; Claude Code reports the server Connected.
- `check:mcp` can test an installed copy (`NATURAL_MCP_COMMAND`, `NATURAL_MCP_ENV`).
- `engines.node >= 20`, repository and keywords for npm.

## [0.15.0] – 2026-09-30

### Added
- **Natural MCP server** (D-031, `mcp/`): `npm run mcp`, registered for Claude Code as `natural`. Tools: `list_components`, `get_component`, `get_guidelines`, `get_tokens`, `find_token`, `validate_code`, `check_contrast`. Resources: DESIGN.md and the tokens. Prompt: `build_page`.
- **Checkpoints against drift:** `get_system_fingerprint` (0 anchor), `review_plan` (1), `validate_code` (2 structure, 3 style), `check_copy` (4 content), `check_contrast` (5 accessibility) and `run_checkpoints` (6: all gates in order, stops at the first failure, re-checks if the system changed). Agents stop at each checkpoint; a pass means ready for human review.
- `npm run check:mcp` (in `npm run check` and CI) and `npm run mcp:demo` (a drifted attempt stopped, a fixed Gift guide section passing).
- GOVERNANCE.md: AI agents section (no pull request without a passing final gate; agents never merge).

### Changed
- validate_file is also a library (`validateSource`), shared by the pre-commit hook, CI and the MCP server. Fix suggestions only offer a component's own one-off tokens.
- The deprecated token aliases (0.14.0) are now removed in **0.16.0**, so this release stays additive.

## [0.14.0] – 2026-09-30

### Changed (breaking: token names)
- **Tiered token architecture** (D-030, DESIGN.md §5). Per-component collections are replaced by roles: **Color** (`fg/*`, `bg/*`, `border/*`, `accent/*`, `control/*`, `focus/ring`, `shadow/float`; mode Light), **Dimension** (`size/control`, `size/target-min`, `size/icon-*`, `focus/ring-width|offset|radius`), **Layout** (`layout/page-margin`, `layout/gutter`, `layout/section`, `layout/header-height`; Desktop / Mobile modes), **Typography** (+ `ui/title|body|button|label|small`), and **Component** (41 one-offs). Space, radius and border width are the public scale.
- 569 → 212 variables, 600 → 297 values, 18 → 6 collections, in Figma and code. Components now reference roles, e.g. `var(--nds-fg-muted)` instead of `var(--nds-input-text-helper)`.
- Responsive twins (`*-mobile`) are gone: moded tokens have `--nds-<token>--desktop` / `--mobile` constants for container queries, and Mobile variants in Figma set the Layout and Component modes.
- Three disabled states consolidated into their roles: secondary-button disabled text taupe/400 → taupe/500 (contrast 2.45 → 3.29), its border taupe/200 → taupe/300, and the disabled slider fill taupe/400 → taupe/500.
- Figma: scopes restrict pickers to the right roles; colour and type primitives are hidden. Colors page now leads with the 32 roles; Spacing page counts real bindings per step.

### Added
- `tokens/migrations/0.14.0-semantic-tokens.json`: every retired token and its replacement.
- validate_file rules `tier-primitive` and `tier-component`; role-aware fix suggestions; unknown collections rejected.

### Deprecated
- The retired component-scoped CSS variables (412) still resolve through `src/styles/tokens-deprecated.css`. **Removed in 0.15.0.** To migrate, replace each with its `to` from the migration map (use the `--mobile` constant where the map says `"mode": "mobile"`).

## [0.13.0] – 2026-09-30

### Fixed
- **Bag count badge** is a full circle again: in Figma the Actions / Bar / Leading frames clipped the badge where it overhangs the 44px Icon Button, and in both Figma and code it was a 26 × 22 oval pill. It is now 20 × 20 for one digit (`nav/count-size`, `nav/count-padding-x` 6) and grows into a pill for two or more; the header frames no longer clip it.

### Added
- **Cart Drawer** (Beta, D-029): `CartDrawer`, a modal `<dialog>` sidebar (480 wide) with Cart Lines, subtotal, Check out and Continue shopping; empty state. Figma component 248:77 on the Cart page. Cart Drawer collection (18 tokens).
- **Desktop category page** (Figma Desktop Example page, 249:2): built only from system instances; prototype where the Bag button opens the drawer (Bag-open frame 250:465, Smart Animate) and Close, Continue shopping or the backdrop close it. Storybook: Cart Drawer › In a category page, with the drawer working.

## [0.12.0] – 2026-09-30

### Added
- **Cart Line** (Beta, D-028): `CartLine` (an `<li>`): image, title link, SKU, price (sale price + struck-through compare price), Remove. Figma Cart page: Cart Line 245:707 (Breakpoint × Status) and an example bag, Desktop and Mobile. Cart Line collection (31 tokens); primitives `size/90`, `size/96`.
- **Text Button** (Beta): `TextButton`, an underlined text-style button for small actions; Figma 245:658 (4 states). Text Button collection (11 tokens).
- Compact component breakpoint: 479 / 480px on the component's own width (DESIGN.md §4.4), allowed by validate_file.

## [0.11.0] – 2026-09-30

### Added
- **Slider** (Beta, D-027): `Slider` in code (native range input, optional number field, `formatValue` for `aria-valuetext`). Figma Slider page: Slider (239:2732, Field = None / Start / End / Top / Bottom × State), Slider Thumb (239:655, 5 states), Slider Input (239:665, 4 states). Slider token collection (40 tokens).
- **Range Slider** (Beta): two thumbs for a from–to range, `RangeSlider` in code (two native range inputs on one track, thumbs never cross); Figma Range Slider (242:722, Field = None / Sides / Top / Bottom × State).

### Fixed
- validate_file: the focus-outline rule now honours `validate-ignore a11y-focus: <reason>`.

### Governance
- a11y exception **EX-002**: disabled Slider / Range Slider text (group label, "to") is WCAG-exempt inactive UI, like EX-001 for fields.

## [0.10.1] – 2026-09-30

### Changed
- Product Card: the name, meta and price have 12px side padding (`card/info-padding-x`, new token), so they line up with the badge and the wishlist button. On mobile some meta lines now wrap; the Figma Product Row (Mobile, Show buttons=True) row heights were re-equalised to 370.375.

### Added
- Figma **Icons** page: the 16 icon source components moved here from the Buttons, Input Fields, Product Cards and Navigation pages (instances stay linked), each with its code export, size, stroke and usage; component descriptions name the code export.
- Figma **Spacing** page: the `space/*` scale with bound bars, token usage counts and typical uses, plus a Button, Product Card and Input annotated with their padding and gap tokens.

## [0.10.0] – 2026-09-30

### Added
- **Footer** (Beta, D-026): `Footer`, `FooterColumn` and `FooterLink` in code; Figma Footer page with Footer (221:136, Desktop / Mobile), Footer Column (223:116, Mode = Static / Collapsed / Expanded), Footer Link (221:16, Size × State) and a "Shop open" example. Three link columns (Shop, About, Help), Logo, copyright and legal links. On mobile the columns are collapsible sections (`aria-expanded`), closed by default: 356px instead of 840px. Footer token collection (36 tokens).

## [0.9.0] – 2026-09-30

### Added
- **Image Block** (Beta, D-025): Hero, Banner and Half-page imagery at Desktop and Mobile sizes. Figma: Images page, component set 212:29 (6 variants, Show placeholder), labelled grid and a Half-page-with-copy example. Code: `ImageBlock` (`type`, `src`, required `alt`, Half-page `children`), container query at 768px. Image Block token collection (8 tokens) and primitives `size/360`, `size/375`, `size/720`.
- Figma **Colors** page: all 19 primitives with role, contrast on white and ink, and token usage, plus the text/background pairings the components use.
- Figma **Grid** page: grid styles Grid/Desktop (12 columns, 40 margin, 24 gutter) and Grid/Mobile (4 columns, 16 margin, 16 gutter), bound to the Product Row tokens, with drawn overlays showing cards on 3 of 12 and 2 of 4 columns.

## [0.8.0] – 2026-09-29

### Added
- **Calendar** (Beta, D-024): `Calendar` (Mode = Single / Range) and `CalendarDay` (10 states + Today). ARIA grid keyboard support; disabled days stay focusable; always 6 weeks. Figma page "Calendar" with both sets (196:580, 195:65), labelled grids and a delivery-date example. Calendar token collection (32 tokens).
- **Date Field**: Input Type=Date in Figma (8 states) and `DateField` in code. Type MM/DD/YYYY or open the Calendar from the 24px calendar button (dialog pattern, Escape closes, focus returns). `formatDate` / `parseDate` helpers. Stories: Date, Date (open), and a Date row in All Variants.
- `CalendarIcon`; Figma Icon/Calendar. Input tokens `input/icon-button/*`, `input/icon-button-size`, `input/icon-button-radius`, `input/popover-gap`.

### Fixed
- validate_file now checks token prefixes for Logo (missed in 0.5.0) and Calendar.
- Input's keyboard focus ring now reacts only to its own input, so a button inside the field draws a single ring.

## [0.7.1] – 2026-09-29

### Fixed
- The accessibility gate crashed in CI with "Axe is already running" (v0.7.0 didn't deploy): after the Storybook 10.6.1 update, the a11y addon's own scan can still be running when the gate starts. The gate now waits for it and retries. No accessibility findings changed.

## [0.7.0] – 2026-09-29

### Added
- **Storybook MCP** (`@storybook/addon-mcp`, D-023): `http://localhost:6007/mcp` on the dev server gives AI agents the components, props and stories; `.mcp.json` registers it for Claude Code. Not part of the published Storybook.

### Changed
- Storybook packages updated to 10.6.1 (required by the addon).

## [0.6.0] – 2026-09-29

### Added
- Product Row **Show buttons** (D-022): `showButtons` in code, a True/False variant (shown as a toggle) in Figma. New `WithButtons` story; All Variants shows both settings at both breakpoints.

### Changed
- Product Row cards no longer show Add to Bag / Notify me by default, matching most stores. Pass `showButtons` to bring them back. Figma example rows were switched to the new default.
- `ProductRow` `products` no longer take `showCta`; the row decides.

## [0.5.0] – 2026-09-28

### Added
- **Logo** is its own component (D-021): `src/components/Logo`, story `Components/Logo` (Default, Focus, All Variants, Clear Space), Figma page and component set `153:822` (State = Default / Focus), registry entry (Stable).
- Logo token collection: `logo/color`, `logo/font-size`, `logo/line-height`, `logo/letter-spacing`, `logo/focus-ring`, `logo/focus-ring-width`, `logo/focus-ring-offset`, `logo/radius`.
- validate_file flags hardcoded `em` / `rem` lengths, not only `px`.

### Changed
- Navigation Menu and Mobile Menu nest the Logo component; the Logo story moved out of Navigation Menu.
- Logo letter-spacing is tokenized (`letter-spacing/tight`, −0.5px; was −0.02em).

### Removed
- `nav/logo`, `nav/font-size/logo`, `nav/line-height/logo` (replaced by the Logo collection).

## [0.4.0] – 2026-09-28

### Added
- **Story UI** (`@tpitre/story-ui` 5.21.2) for AI-assisted story drafting, local development only (D-020): `npm run storybook-with-ui` starts Storybook and the Story UI server; the workspace opens at `?path=/workspace/`. Requires an Anthropic key in `.env` (gitignored).
- `story-ui-considerations.md`: the system's rules for the AI (components, tokens, voice, "Add to Bag", link text, WCAG 2.2 AA).
- `story-ui-docs/`: generated copies of `DESIGN.md` and the tokens, refreshed by `npm run tokens` and checked by the governance gate.
- GOVERNANCE.md: policy for AI-generated stories (drafts until promoted through the contribution flow).

### Changed
- Storybook's story globs are explicit (`src/components`, `src/governance`); Story UI's pages load only in local dev, and its toolbar only on `localhost`.

### Fixed
- Story UI's generated `voice/canvas/componentRegistry.ts` had escaped template literals that failed the typecheck.

## [0.3.1] – 2026-09-28

### Fixed
- **Mobile Menu took the full page width** when the header was narrow because of its container but the window was wide (e.g. the Storybook "Mobile" story on a desktop screen): the modal opens over the whole viewport. It's now full screen on phones and a left-anchored sheet capped at 480px on wider screens (new token `nav/mobile-menu/max-width` → `size/480`, in code and Figma).
- The current section (Shop) lost its indicator in the mobile menu after submenu items became buttons; it's back, with `aria-current="true"`.

### Changed
- Storybook: the Navigation Menu "Mobile" story opens at a 375 × 812 phone viewport; a new "Mobile — narrow container, wide window" story shows the 480px sheet.

## [0.3.0] – 2026-09-28

### Added
- **validate_file guardrail** (D-019): a pre-commit hook (`.githooks/pre-commit`, installed by `npm install`) and CI step that blocks hardcoded values, broken naming and placeholder link text, warns on other static accessibility issues, and prints a fix suggestion for every finding. `npm run validate_file -- <files> | --staged | --all`.
- 20 tokens for values that were hardcoded: `*/focus-ring-offset` for Button, Input, Toggle, Product Card, Wishlist and Navigation; `wishlist/shadow/{color,y,blur}`; `nav/backdrop`, `nav/count-offset-top`, `nav/link/underline-offset`, `nav/dropdown/group-width`, `nav/submenu/group-padding-{top,bottom}`; primitives `color/brown/900-a16`, `color/brown/900-a40`, `size/200`, `elevation/float/{y,blur}`. Created in Figma too; the wishlist shadow is bound to them.
- Alpha colours (8-digit hex) in the token pipeline, Figma sync and snapshot export.

### Changed
- Nav link hover underline offset: 3px → 4px (nearest spacing step).
- Mobile Menu's documentation-only preview size moved from component CSS into its stories.
- Nav Link stories use real labels ("Journal", "Shop") instead of the placeholder "Link".

## [0.2.2] – 2026-09-28

### Fixed
- CI install, properly this time: v0.2.1's CI still stopped at `npm ci`. Root cause: the lock file was generated with npm 11.6 locally, while CI's Node 24 ships npm 11.19, which is stricter about optional `@emnapi/*` packages. The lock file is regenerated with npm 11.19, CI is pinned to Node 24.21.0 (npm 11.19.0), and install scripts are reviewed explicitly (`allowScripts`: esbuild approved; fsevents, a Mac-only package with a prebuilt binary, denied).

### Added
- `npm run check:install`: verifies the lock file installs with CI's exact npm; part of `npm run check` (D-018).

## [0.2.1] – 2026-09-28

### Fixed
- CI install: `package-lock.json` regenerated (optional `@emnapi/*` entries were out of sync after adding Playwright) and CI moved to Node 24 so it uses the same npm (11) as local development. v0.2.0's CI run stopped at `npm ci`, before any quality gate ran, so nothing was deployed.

## [0.2.0] – 2026-09-28

### Added
- **Governance:** `GOVERNANCE.md` (principles, roles, change tiers, lifecycle, quality gates, versioning, Figma hygiene), `DECISIONS.md` (D-001 – D-020) and this changelog.
- **Component registry** (`governance/components.json`): the single source of component status: all 11 components Stable at release.
- **Blocking quality gates** in CI: governance check (`npm run check:governance`) and accessibility gate (`npm run check:a11y`, axe on every story). Storybook only deploys when all gates pass.
- **Figma ↔ code parity gate** (`npm run check:parity`, D-017): compares a committed snapshot of the live Figma file (every variable per mode, linked component structure, text-style bindings), exported through the Figma MCP, with the repo. Blocking in CI.
- **Accessibility exceptions register** (`governance/a11y-exceptions.json`) with EX-001: disabled field text.
- Storybook **Governance / Component status** page and `status:*` tags on every component.
- Figma **Governance** and **Proposals** pages; a status badge on every component page.
- **Navigation dropdowns** (D-015): `NavMenuButton` (disclosure button, Nav Link State=Open), `NavDropdown` and `NavGroup` for Shop and Collections; mobile **Submenu** level in `MobileMenu` with Back; `ChevronLeftIcon`; nine `nav/dropdown/*` / `nav/group-title/*` / `nav/link/bg/open` tokens.

### Changed
- **All 11 components are Stable** (D-016).
- Product Card: the wishlist follows the title in keyboard order; its visual position is unchanged (D-012).
- `MenuItem` with `hasSubmenu` renders a `<button>` and takes `onOpenSubmenu` instead of `href` (breaking in 0.x → minor).
- `NavItem.hasMenu` is deprecated in favour of `NavItem.menu`.
- `DESIGN.md` points to `CHANGELOG.md` for version history and to `GOVERNANCE.md` for process.

## [0.1.0] – 2026-09-27 to 2026-09-28

First public version: tokens, components, Storybook and `DESIGN.md`.

### Added
- Tokens mirrored from Figma variables (Primitives + Button, Input, Radio, Toggle, Product Card, Product Row, Badge, Navigation, Typography), with a generated CSS build and a Figma sync script.
- Components: Button (with Loading and full width), Spinner, Badge, Text Field, Text Area, Radio, Radio Group, Toggle, Wishlist Button, Product Card, Product Row, Navigation Menu, Mobile Menu, Nav Link, Icon Button, Menu Item, Logo, Heading, Text.
- Responsive type scale with Desktop / Mobile variable modes and Figma text styles.
- `DESIGN.md`: brand, voice, foundations, styles, full component specs, accessibility standard.
- Storybook deployed to GitHub Pages on every push.

### Changed
- Product Card CTA reads "Add to Bag"; the logo is "natural" only; Menu Item submenu is off by default; Product Card media keeps 4:5 and fills its column.

### Removed
- Toggle check mark (`CheckMarkIcon`, `toggle/check`); `card/media-height`; Product Row title tokens (replaced by Heading/H3).
