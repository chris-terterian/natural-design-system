# Natural Design System: working notes

- **Read `DESIGN.md` first.** It is the brand, voice, foundations, component and pattern brief for Natural; its front matter lists every token (value, alias, CSS variable). Keep it current when components or tokens change (§6 component specs, §10 changelog); `npm run tokens` regenerates its front matter.

- Repo is the source of truth; Figma file "Natural Design System" (key `84MjZXozBoKCvf9lwIU5pu`) mirrors it via the figma-console MCP (Desktop Bridge).
- Change flow: edit code/tokens → verify in Storybook (port 6007) → update Figma (variables via `npm run figma:sync-script` output in `figma_execute`; component changes by hand + screenshot) → **ask the user before committing/pushing** to GitHub (`main`).
- Keep `tokens/figma-variables.json` names identical to Figma variable names. Figma variable names cannot contain `.` (use `1-5`, not `1.5`).
- Every component story: title `Components/<Figma component name>`, `parameters: figma(FIGMA_NODES.x)`, plus an `AllVariants` story laid out like the Figma grid (State columns, variant rows, labelled).
- Accessibility bar: WCAG 2.2 AA. Text ≥4.5:1, UI boundaries/focus ≥3:1, targets ≥24px, states never conveyed by colour alone. Disabled text is intentionally below 4.5:1 (WCAG-exempt).
- Figma pages: Buttons, Input Fields, Radio Buttons, Product Cards, Tags (Badge 2:171), Navigation Menu (section 59:42), Toggles (Toggle 67:360), Product Rows (Product Row 73:210); still empty: Images, Text, Modal Form.
- The figma-console Desktop Bridge drops often. The official Figma MCP (`use_figma`, load the figma-use skill first) edits the same file without the plugin; prefer it when the bridge is down.
- Shared pieces are their own components and nested as exposed instances (Button in ProductCard CTA, WishlistButton, Badge). Don't hand-build a sub-element inside another component.
