# Changelog

All notable changes to the Natural Design System. Format: [Keep a Changelog](https://keepachangelog.com); versioning: [semver](https://semver.org), in 0.x per `GOVERNANCE.md` §7 (breaking changes bump the minor version).

## [0.2.1] – 2026-09-28

### Fixed
- CI install: `package-lock.json` regenerated (optional `@emnapi/*` entries were out of sync after adding Playwright) and CI moved to Node 24 so it uses the same npm (11) as local development. v0.2.0's CI run stopped at `npm ci`, before any quality gate ran, so nothing was deployed.

## [0.2.0] – 2026-09-28

### Added
- **Governance:** `GOVERNANCE.md` (principles, roles, change tiers, lifecycle, quality gates, versioning, Figma hygiene), `DECISIONS.md` (D-001 – D-017) and this changelog.
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
