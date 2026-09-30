# Decision log

Short records of *why* the Natural Design System is the way it is. Each entry: context, decision, consequences. New entries go at the bottom; superseded ones stay, marked **Superseded by D-xxx**.

| ID | Decision | Date | Status |
|---|---|---|---|
| D-001 | The repo is the source of truth; Figma mirrors it | 2026-09-27 | Accepted |
| D-002 | WCAG 2.2 AA is a blocking gate | 2026-09-27 | Accepted |
| D-003 | Primitives + component tokens, named identically in Figma and code | 2026-09-27 | Accepted |
| D-004 | "Add to Bag", never "cart" | 2026-09-27 | Accepted |
| D-005 | Shared parts are separate, nested components | 2026-09-27 | Accepted |
| D-006 | Brand name is "Natural"; the logo is the wordmark only | 2026-09-28 | Accepted |
| D-007 | Component breakpoints use container queries; type uses the viewport | 2026-09-28 | Accepted |
| D-008 | Light badges only on white surfaces | 2026-09-28 | Accepted |
| D-009 | Loading is a state; Full width is instance sizing | 2026-09-28 | Accepted |
| D-010 | Toggle thumb has no check mark | 2026-09-28 | Accepted |
| D-011 | Product rows: 4 across on desktop, 2 per row on mobile | 2026-09-28 | Accepted |
| D-012 | Product Card keyboard order: title before actions | 2026-09-28 | Accepted |
| D-013 | Responsive typography via variable modes | 2026-09-28 | Accepted |
| D-014 | Stay in 0.x; governance ships as v0.2.0 | 2026-09-28 | Accepted |
| D-015 | Navigation menus use the disclosure pattern, opened by click | 2026-09-28 | Accepted |
| D-016 | All 11 components promoted to Stable | 2026-09-28 | Accepted |
| D-017 | Figma parity is a blocking check via an MCP-exported snapshot | 2026-09-28 | Accepted |
| D-018 | Pin the toolchain CI installs with | 2026-09-28 | Accepted |
| D-019 | validate_file: a pre-commit guardrail for tokens, naming and link text | 2026-09-28 | Accepted |
| D-020 | Story UI is a local drafting tool, not part of the published system | 2026-09-28 | Accepted |

---

### D-001: The repo is the source of truth; Figma mirrors it
**Context.** Designs and code drift when each can change independently.
**Decision.** Tokens and components are defined in the repo. Figma variables and components mirror them one-to-one; Storybook renders the repo.
**Consequences.** Changes land in code and Figma together; a parity check (count and value of every variable, per mode) runs before each release.

### D-002: WCAG 2.2 AA is a blocking gate
**Context.** Advisory accessibility checks get ignored under deadline pressure.
**Decision.** Every story is scanned with axe on every push, and a violation blocks the deploy. The only way through is a registered exception with a WCAG basis.
**Consequences.** One exception exists today (EX-001: disabled field text, which WCAG exempts).

### D-003: Primitives + component tokens, named identically in Figma and code
**Context.** Designers and developers need to point at the same thing.
**Decision.** Two layers: primitives (`color/brown/200`), hidden from Figma pickers, and component tokens (`button/primary/bg/default`) that alias them. The Figma name maps directly to the CSS variable (`--nds-button-primary-bg-default`).
**Consequences.** Re-theming is a primitive or alias change, not a component edit.

### D-004: "Add to Bag", never "cart"
**Context.** One Product Card variant was hand-edited to "Add to Cart" while the rest said "Add to Bag".
**Decision.** "Add to Bag" is the only purchase label, listed in the `DESIGN.md` UI vocabulary.
**Consequences.** Mixed wording is a review-checklist failure.

### D-005: Shared parts are separate, nested components
**Context.** The Product Card's badge was first drawn inside the card, so its words and colours couldn't change.
**Decision.** Any part used in more than one place (Badge, Button, Wishlist Button, Icon Button, Spinner) is its own component, nested as an exposed instance.
**Consequences.** One change updates every use; the card's badge tokens were removed in favour of Badge's.

### D-006: Brand name is "Natural"; the logo is the wordmark only
**Context.** The logo read "natural goods" and its accessible name was "Natural Goods — home".
**Decision.** The brand is **Natural**. The logo is the wordmark "natural"; the accessible name is "Natural — home".
**Consequences.** The Logo's descriptor layer and property were removed in Figma and code.

### D-007: Component breakpoints use container queries; type uses the viewport
**Context.** Headers and product rows get placed in containers of different widths; body text should track the device.
**Decision.** Navigation Menu and Product Row switch layouts by their own width (container query at 768px). The type scale switches by viewport (media query at 768px), or by `data-nds-mode`.
**Consequences.** Components adapt wherever they're placed; Storybook can show both modes side by side. One catch (fixed in 0.3.1): a modal like the Mobile Menu opens over the whole viewport, not the container, so it's capped at 480px (`nav/mobile-menu/max-width`) to stay phone-shaped when a narrow header sits in a wide window.

### D-008: Light badges only on white surfaces
**Context.** The Light badge's fill (`#EFE6DB`) matched the product image backdrop, so the pill disappeared.
**Decision.** On product imagery use Dark, Sale or Outline; Light is for white surfaces. "Handmade" on cards uses Dark.
**Consequences.** Added to the Badge Do / Don't.

### D-009: Loading is a state; Full width is instance sizing
**Context.** `Loading` and `Full width` booleans were added to the Figma Button but weren't connected to any layer and didn't exist in code. Figma booleans can only show or hide layers.
**Decision.** Loading is a `State=Loading` variant (spinner centred, label kept invisible so width holds). Full width is done by setting the instance to Fill container; code has a `fullWidth` prop. Unwired properties are not allowed.
**Consequences.** The Figma hygiene rule "no unwired properties" in `GOVERNANCE.md`.

### D-010: Toggle thumb has no check mark
**Context.** The first Toggle showed a white check mark on the thumb when on.
**Decision.** Removed at the owner's request. On and off still differ without colour: thumb position (left or right) plus the filled sand track and darker border.
**Consequences.** The Check Mark icon and the `toggle/check` token were deleted.

### D-011: Product rows: 4 across on desktop, 2 per row on mobile
**Context.** Three cards across a 375px screen are about 104px wide, narrower than the Add to Bag button, and titles wrap badly.
**Decision.** 4 columns at 768px and wider; 2 per row below, with the same 4 products wrapping to two rows. Cards fill their column and keep 4:5 imagery.
**Consequences.** Product rows should hold 4 (or a multiple of 4) products.

### D-012: Product Card keyboard order: title before actions
**Context.** In the card's markup, the Wishlist Button came before the title link, so keyboard and screen reader users met "Add to wishlist" before knowing which product it was.
**Decision.** The wishlist moves after the title in the markup and stays visually top-right over the image (positioned by CSS). Tab order: title → wishlist → Add to Bag.
**Consequences.** Implemented in 0.2.0; verified by test (same 12px position, new order).

### D-013: Responsive typography via variable modes
**Context.** Headers and paragraph copy must look the same on content and category pages and stay readable on desktop and mobile.
**Decision.** One Typography collection with **Desktop** and **Mobile** modes (H1–H4, Paragraph Large / Default / Small, Caption, spacing, measure), with Figma text styles bound to it. Component UI text keeps fixed sizes.
**Consequences.** The token format, build and Figma sync gained mode support; the Product Row title moved onto Heading/H3.

### D-014: Stay in 0.x; governance ships as v0.2.0
**Context.** The system is a learning and showcase project, not yet in production use.
**Decision.** Stay in 0.x until real photography, image guidelines and the modal form exist and the Beta components reach Stable. Everything shipped so far is v0.1.0; the governance release is v0.2.0.
**Consequences.** In 0.x, breaking changes bump the minor version.

### D-015: Navigation menus use the disclosure pattern, opened by click
**Context.** Shop and Collections showed chevrons without menus. Building the menus meant choosing between an ARIA `menu` (application-style, arrow-key driven) and the disclosure pattern (a button that shows a region of links), and between hover and click to open.
**Decision.** Disclosure pattern: each menu item is a `<button aria-expanded aria-controls>` that shows a Nav Dropdown of ordinary links. It opens on click / Enter / Space, never on hover alone; Escape, clicking outside, or opening another menu closes it. On mobile the same data drives a Submenu level in the Mobile Menu, with a Back button that restores focus.
**Consequences.** Site navigation stays ordinary links that screen readers list and Tab reaches, with no arrow-key model to learn. Hover-open can be added later as an enhancement on top of click, never instead of it.

### D-016: All 11 components promoted to Stable
**Context.** Four components were Beta: Product Card (keyboard order and placeholder imagery), Product Row (Figma row heights set by hand), Navigation Menu (chevrons without menus) and Typography (no display size or page grid).
**Decision.** The two real gaps were fixed (D-012 keyboard order; D-015 dropdowns and submenus). The rest weren't defects in the components: photography is content, a display size and page grid are future additions, and row heights are a Figma tooling limit the code doesn't share. Those moved to the roadmap or into the spec as documented limitations. Every component now meets the Stable criteria in `GOVERNANCE.md` §5.
**Consequences.** The registry, Storybook tags, the Storybook Governance page and the Figma Governance page show 11 Stable. Future work (photography, display type, page grid) arrives as enhancements, not as gaps in shipped components.

### D-017: Figma parity is a blocking check via an MCP-exported snapshot
**Context.** Parity was first listed as a manual pre-release step because Figma's server-side Variables API needs an Enterprise plan. But the Figma MCP (figma-console and Figma's own MCP) can read the live file wherever Figma is open, which is how parity had been checked by hand all along.
**Decision.** Split parity in two. An export script, run through the MCP, writes `governance/figma-snapshot.json`: every variable per mode, the structure of every component the code links to, and text-style bindings. `npm run check:parity` compares that snapshot with the repo and blocks CI on any difference, including unwired component properties (D-009) and name drift.
**Consequences.** Drift from code changes is caught automatically. Edits made in Figma after the last snapshot aren't, so the snapshot is refreshed with every Figma or token change and before every release, and its timestamp shows how current it is. Verified by simulating three kinds of drift, each caught.

### D-018: Pin the toolchain CI installs with
**Context.** v0.2.0 and v0.2.1 both failed CI at `npm ci`, before any quality gate ran. The lock file was generated with npm 11.6 locally; CI's Node 24 ships npm 11.19, which is stricter about optional `@emnapi/*` packages. The first fix (moving CI to Node 24) guessed at the cause; reproducing CI's exact npm locally found it.
**Decision.** CI is pinned to Node 24.21.0 (npm 11.19.0). The lock file is generated with that npm, and `npm run check:install` verifies it locally with that exact version before any push. Install scripts are reviewed explicitly (`allowScripts`: esbuild approved; fsevents denied, since it's Mac-only and ships a prebuilt binary).
**Consequences.** Upgrading Node or npm in CI is a deliberate change: bump the pin, regenerate the lock file, run `check:install`. Lesson recorded: reproduce the failing environment before fixing.

### D-019: validate_file, a pre-commit guardrail for tokens, naming and link text
**Context.** The gates in CI catch problems after a push. Hardcoded values and naming slips are cheapest to fix at the moment they're written, with the right token named for you.
**Decision.** A Git pre-commit hook runs `validate_file` on staged files; CI runs it on all files. It blocks hardcoded values, broken naming and placeholder link text, warns on other static accessibility issues, and prints a context-aware fix for every finding (the component token for that property, a typo match for unknown tokens, the corrected name). Exceptions are inline `validate-ignore` comments that must carry a reason.
**Consequences.** Its first run found 30 real issues in the shipped system: focus-ring gaps, the wishlist shadow, the menu backdrop and navigation spacing were hardcoded. They became 20 new tokens in code and Figma (with the shadow bound live in Figma). One visible change: the nav link underline offset moved from 3px to 4px, the nearest step on the spacing scale.

### D-028: Cart Line from existing parts, a Text Button, and a compact component breakpoint
**Context.** The bag needs one line per product: image, title, SKU, price and Remove, on desktop and mobile. Remove is an action, and the system had no understated button.
**Decision.** **Cart Line** reuses Image/Placeholder and the Product Card type styles. Remove is a new, reusable **Text Button** (a real button, underlined, 24px), named with its product. Cart Line goes compact below **480px of its own width** instead of the 768px page breakpoint: a line always sits in a column (720 on desktop), where the page breakpoint would wrongly shrink it. The validator's allowed breakpoints now include 479 / 480 for such components.
**Consequences.** Beta until quantity, variant details and the bag summary are designed. Figma and code match to the pixel (168 / 122 tall).

### D-027: Slider on a native range input, with an optional number field
**Context.** Filters and product options need a range control (max price, bench length). Custom sliders built from divs need a full ARIA slider implementation to be accessible; the field placement varies by layout.
**Decision.** Code uses `<input type="range">`, styled through the thumb and track pseudo-elements, so keyboard and screen-reader support come from the browser. One **Slider** component with Field = None / Start / End / Top / Bottom (DOM order matches visual order), built from **Slider Thumb** and **Slider Input**. The value is shown by the thumb (ink ring) and the ink fill, so the sand rail is allowed below 3:1. Focus draws a ring around the thumb, not the 44px hit area.
**Range Slider** (two thumbs) is its own set with Field = None / Sides / Top / Bottom: in code two native range inputs share one track, with only their thumbs taking pointer events, so each keeps browser keyboard support; the thumbs never cross, and where they overlap the one that can still move is on top.
**Consequences.** Beta while tick marks and captions are open. While building it, the validator's focus-outline rule turned out to ignore `validate-ignore` comments; it now honours them, and still flags a bare `outline: none`.

### D-026: Footer, with collapsible sections on mobile
**Context.** Pages had no footer. Three link columns stacked on a phone made the footer 840px tall, most of it links few people need at that moment.
**Decision.** A **Footer** built from two new pieces, **Footer Column** and **Footer Link**, plus the existing Logo, on a sand background. On mobile each column's heading becomes a disclosure button (`aria-expanded`, 44px target), closed by default, so the footer is 356px until someone opens a section. Footer Column has Mode = Static / Collapsed / Expanded in Figma. In code, both headings are rendered and the container query shows one, so desktop never gets a do-nothing button and mobile links in a closed section are out of the tab order. Legal links get 4px padding so every target is at least 24px.
**Consequences.** Beta until newsletter sign-up and social links are decided. Figma and code match to the pixel at both breakpoints (368 / 356 / 520 open), because the dividers take no space in either.

### D-025: Image Block, one component for site imagery (Beta)
**Context.** Pages need a hero, banners between sections, and half-page images beside copy, each at Desktop and Mobile sizes. Separate one-off frames per page would drift in size and crop.
**Decision.** One component, **Image Block**, with Type (Hero, Banner, Half-page) × Breakpoint (Desktop, Mobile). Heights are tokens in a new Image Block collection (Hero 640 / 480, Banner 360 / 200, Half-page 720 / 375), plus three primitives (`size/360`, `size/375`, `size/720`). Photos fill and crop to cover. Half-page is half the row and square on desktop, full width above its copy on mobile; in code the copy is `children`, so the pairing can't be rebuilt differently each time. `alt` is required (`""` for decorative).
**Consequences.** Beta until real photography exists and art direction (`<picture>` crops per breakpoint) is decided. Text over images is left out on purpose: its contrast can't be guaranteed across photos.

### D-024: Calendar (Beta) and Date Field, built on the Button palette
**Context.** Delivery dates, workshop bookings and pickup windows need a date picker. It has to meet WCAG 2.2 AA, match the calm Button palette, and fit the Figma ↔ code rules.
**Decision.** Two new pieces, each its own component: **Calendar Day** (10 states, Day text, Today boolean) and **Calendar** (Mode=Single / Range) built from Calendar Days and the existing Icon Button. The code follows the ARIA grid pattern (one tab stop, arrow keys, Home / End, Page Up / Down) with `aria-disabled` so arrow keys can move past unavailable days. Never colour alone: selected is a filled circle plus a bold number, the range band has a 4.95:1 edge, today is a dot, disabled days are struck through. Always 6 weeks, Monday first, so the height doesn't jump. The **Date Field** is Input Type=Date (not a separate component): same label, states and messages as Text Field, plus a 24px calendar button that opens the Calendar as a dialog, following the ARIA date picker dialog pattern. Typing MM/DD/YYYY always works.
**Consequences.** Calendar ships as **Beta** per the contribution rules, with its gaps listed in the registry: no range preview on hover, ranges may span disabled days, one month at a time. Date Field joins the Stable Input. New tokens: the Calendar collection (32) and 5 Input tokens for the button and popover. Building it showed the validator's prefix map had missed Logo (v0.5.0); Logo and Calendar are now checked.

### D-023: Storybook MCP for agents; code-to-Figma stays a request, not an automatic sync
**Context.** The goal was to change a colour in code on GitHub and have Figma update by itself. Neither Storybook MCP nor Story UI writes to Figma: Storybook MCP lets an agent read Storybook, and Story UI drafts stories. An automatic GitHub-to-Figma sync would need Figma's API for writing variables, which is Enterprise-only; this file is on Professional.
**Decision.** Install `@storybook/addon-mcp` (dev server only, registered for Claude Code in `.mcp.json`) so an agent reads components, props and stories the way Storybook documents them, and applies matching changes through the Figma MCP when asked. The parity gate stays the safety net: a token or property changed in code alone blocks the deploy until Figma matches. Storybook packages moved to 10.6.1, which the addon requires.
**Consequences.** Code to Figma is one request to an agent, not zero. Fully automatic sync is possible later with Figma Enterprise (a GitHub Action posting variable changes, then the parity check), or semi-automatic with a Figma plugin that pulls the tokens from GitHub. The published Storybook is unchanged; it has no server to host the MCP.

### D-022: Product Row hides buttons by default
**Context.** Every card in a Product Row showed Add to Bag. Most e-commerce rows don't: they're for browsing, and a product like a log bench needs a finish or size chosen on the product page before it can go in the bag. Buttons on every card also add 4–8 tab stops per row.
**Decision.** Product Row gets **Show buttons**, off by default, set per row (not per card) so a row always looks consistent. In code it is `showButtons` (the row overrides each card's `showCta`). In Figma a Product Row property can't reach inside its nested Product Cards (Figma blocks property references on instance sublayers), so it is a **True/False variant** that Figma shows as a toggle, with the cards' Show CTA set in each variant. Standalone Product Card keeps its button on by default.
**Consequences.** This changes the default look but not the API contract (`showButtons` is new and optional), so it's a minor release in 0.x and Product Row stays Stable. Existing rows in the Figma file (Typography page examples) were switched to Show buttons = False. The Figma set now has 4 variants (Breakpoint × Show buttons).

### D-021: Logo is its own component
**Context.** The wordmark was defined inside Navigation (a `Logo` export, `nav/logo` tokens, a story under Navigation Menu). Brand marks get reused outside the header (footer, emails, checkout), and CLAUDE.md says shared pieces are their own components.
**Decision.** `Logo` moved to `src/components/Logo` with its own Logo token collection (8 tokens, replacing `nav/logo`, `nav/font-size/logo`, `nav/line-height/logo`), a Figma page and a component set with State = Default / Focus. Navigation imports it; the package root still exports `Logo`, so nothing breaks for consumers. It stays **Stable**: same markup, same accessible name, same look.
**Consequences.** The letter-spacing became a token (`letter-spacing/tight`, −0.5px, was −0.02em ≈ −0.48px). That hardcoded `em` value slipped past validate_file, which only checked `px`; it now flags `em`/`rem` lengths too.

### D-020: Story UI is a local drafting tool, not part of the published system
**Context.** Story UI (`@tpitre/story-ui`) generates Storybook stories from prompts using the system's own components. It needs a local server and an AI provider key, and it adds its workspace to Storybook.
**Decision.** It runs only in local development: its toolbar and workspace load on `localhost`, and `storybook build` (GitHub Pages) leaves its pages out. Generated stories are gitignored drafts; keeping one means promoting it into `src/components/` through the contribution flow, where every gate applies. Its own source (`src/stories/StoryUI*`) is third-party tool code, excluded from validate_file like `node_modules`. It learns the system from `story-ui-considerations.md` (rules) and generated copies of `DESIGN.md` and the tokens (`story-ui-docs/`, refreshed by `npm run tokens` and checked by the governance gate).
**Consequences.** The public Storybook stays a clean showcase with nothing that can't connect; AI output can never bypass governance. Installing it surfaced two issues that were fixed: `init` added dependencies without updating the lock file (caught by `check:install`, D-018), and one generated file had escaped template literals that failed the typecheck (fixed locally; worth reporting upstream).
