# Changelog

All notable changes to the Natural Design System. Format: [Keep a Changelog](https://keepachangelog.com); versioning: [semver](https://semver.org), in 0.x per `GOVERNANCE.md` §7 (breaking changes bump the minor version).

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
