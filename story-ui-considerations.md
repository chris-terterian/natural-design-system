# Story UI AI Considerations: Natural Design System

Rules for how the AI must use the Natural Design System when generating stories. The full brief is
`story-ui-docs/guidelines/natural-design-system.md` (a generated copy of `DESIGN.md`); tokens are in
`story-ui-docs/tokens/tokens.json`. When the two disagree with a guess, the docs win.

## Component Library Details

**Library Name**: Natural Design System
**Import Path**: `../..` (the package root, `src/index.ts`)

Allowed additional imports: none. Use only what the package root exports:
`Button, Badge, TextField, TextArea, Radio, RadioGroup, Toggle, WishlistButton, ProductCard, ProductRow,
NavigationMenu, MobileMenu, NavLink, NavMenuButton, NavDropdown, NavGroup, IconButton, MenuItem, Logo,
Spinner, Heading, Text` and the icons (`PlusIcon, ArrowRightIcon, SearchIcon, BagIcon, HeartIcon, …`).

## Core Principles

- **Let the material lead.** Calm, quiet layouts: whitespace and photography carry the page. No gradients, gloss, heavy shadows or decorative illustration.
- **Reuse before you invent.** Compose existing components; never recreate a button, badge, card or field with raw HTML and CSS.
- **Accessible by default.** Every story must meet WCAG 2.2 AA; the repo's accessibility gate will reject it otherwise.

## Component Usage Rules

### Layout Components
- Use plain `div`s with CSS grid or flex for layout only. Page and section headings use `Heading`; body copy uses `Text` inside a `div className="nds-prose"`.
- Product listings use `ProductRow` (4 across on desktop, 2 per row on mobile) or a grid of `ProductCard`s. Always give rows 4 products.
- Site chrome uses `NavigationMenu`; never build a custom header.

### Spacing and Sizing
- Use the system's CSS variables only (`var(--nds-…)`), never raw px, hex or rgb values. For layout gaps use `var(--nds-space-*)` steps: 4, 8, 12, 16, 24, 32, 48.
- Don't invent font sizes. Headings: `Heading level={1–4}`; paragraphs: `Text variant="paragraph-lg" | "paragraph" | "paragraph-sm" | "caption"`.

### Typography
- Sentence case everywhere: "New arrivals", "Order preferences".
- One `Heading level={1}` per page; don't skip levels.
- Prices `$38`, measurements `120 × 35 × 45 cm`, details separated by ` · `.

### Colors
- Never set colours directly. Component colours come from their own tokens; for surrounding layout use `var(--nds-color-white)` backgrounds and `var(--nds-text-color-*)` for any text outside components.

## Content and voice

- Natural sells nature-based goods (split log benches, river clay cups, woven rush baskets, basalt mortars). Use realistic products like these, never "Product name" or lorem ipsum.
- Voice: craft-aware and grounded; name material, process and time. Buttons, errors and forms stay plain.
- UI vocabulary: **Add to Bag** (never "cart"), **Sold out** + **Notify me**, badges **New · Handmade · One of a kind · Sale · Sold out · In stock**.
- Link text says where it goes: "View all cups", "Read the care guide". Never "click here", "read more" or "learn more".

## Accessibility (blocking in this repo)

- Buttons for actions, links for navigation. Icon-only controls need `label` / `aria-label` with context.
- Every image needs `alt` (material first) or `alt=""` if decorative.
- Don't remove focus outlines; don't use colour alone to convey state.

## Output

- Stories go to `src/stories/generated/` as drafts. A draft becomes part of the system only when a person promotes it into `src/components/` through the contribution flow in `GOVERNANCE.md`, where every quality gate applies.
