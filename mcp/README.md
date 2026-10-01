# Natural MCP server

The Natural Design System as tools for AI agents. One install gives Claude, Cursor or any MCP client the components,
specs, tokens and brand rules, **and the same checks the repo enforces**, so an agent can prove its work before a person
reviews it. Everything is read live from this repo, so the server can't drift from the system it describes (D-031).

## Install (no clone needed)

[![npm](https://img.shields.io/npm/v/natural-design-system)](https://www.npmjs.com/package/natural-design-system)

Needs Node 20+. One command registers the server with **Claude Desktop, Cursor and Claude Code** (whichever you have):

```bash
npx -y natural-design-system setup
```

Then restart Claude Desktop / Cursor. Options: name one app (`setup claude-desktop`, `setup cursor`, `setup claude-code`),
preview with `--dry-run`, undo with `--remove`, run GitHub `main` instead of the npm release with
`--source github:chris-terterian/natural-design-system`.

**Why a setup command.** Apps opened from the Dock or Start menu don't get your terminal's PATH, so a config that just
says `"command": "npx"` fails there with `spawn npx ENOENT` (it works in a terminal, which is why it's confusing). Setup
writes absolute paths to `npx` and Node (the stable ones, such as `/opt/homebrew/bin`, so Node upgrades don't break it),
uses `cmd /c npx` on Windows, merges with your existing config and keeps a timestamped backup. The first start downloads
the server; later starts are cached.

<details><summary>Configure by hand instead</summary>

**Claude Code:** `claude mcp add natural --scope user -- npx -y -p natural-design-system natural-mcp`

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`, Windows `%APPDATA%\Claude\…`) or **Cursor** (`~/.cursor/mcp.json`). Use the full path from `which npx` (Windows: `"command": "cmd", "args": ["/c", "npx", …]`):
```json
{
  "mcpServers": {
    "natural": {
      "command": "/opt/homebrew/bin/npx",
      "args": ["-y", "-p", "natural-design-system", "natural-mcp"],
      "env": { "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" }
    }
  }
}
```

**From GitHub `main`:** replace `natural-design-system` with `github:chris-terterian/natural-design-system`. **From a clone:** `npm install`, `npm run mcp`.
</details>

Try it: ask your agent to *"use the natural server's build_page prompt to build a gift guide with three picks under $50"*.

## Tools

| Tool | Answers |
|---|---|
| `list_components` | Every component, status, exports, Figma and Storybook links |
| `get_component` | Full spec (props ↔ Figma properties, tokens, do / don't, keyboard and screen reader) plus the TypeScript props |
| `get_guidelines` | Brand, voice, foundations, token architecture, patterns, accessibility |
| `get_tokens` · `find_token` | Tokens by tier; "which token for this hex in a border?" or "secondary text" → the role |
| `validate_code` | The pre-commit guardrail on code the agent wrote, with a fix for every finding |
| `check_contrast` | WCAG ratio and AA / AAA for hex values or roles |
| `propose_color_change` · `apply_color_change` | Colour changes by voice or text through the tokens, contrast-gated, then mirrored to Figma (below) |

## Change colours by voice

Say it to Claude (Claude Desktop and the mobile app have a mic button; in Claude Code, macOS Dictation, Fn twice, works
anywhere): *"make the sale price a bit darker"*, *"use a warmer sand for the primary button"*. Use the `recolor`
prompt (or `/recolor` in Claude Code inside the repo).

| Step | Tool | What it guarantees |
|---|---|---|
| Understand | `get_tokens`, DESIGN.md §4.2 | The request becomes a **token** change: a Color role re-pointed (`fg/sale` → `color/clay/600`) or a primitive retuned. Never hex on a layer |
| Read back | `propose_color_change` | Every role that moves, and the contrast before / after for each pairing the system promises. A change that would break WCAG AA is **blocked**, with the failing pair named. `say` is a one-breath read-back for voice |
| Approve | (the person) | Nothing is written without a clear yes. The approval is tied to a `proposalId`, so what's applied is exactly what was read back |
| Apply | `apply_color_change` | Writes the tokens, regenerates CSS and DESIGN.md, returns a Figma script that changes only those variables (scoped per collection) |
| Mirror | Figma MCP `use_figma` | Figma's variables update, so every component bound to the role recolours |
| Prove | snapshot + `npm run check` | Parity confirms Figma and code agree; then a pull request for review |

`propose_color_change` works from npm; `apply_color_change` needs a clone, because it edits the repo.

## Checkpoints: stop drift where it starts

AI work drifts a little at every step: an invented component here, a hex value there, "Add to cart" instead of
"Add to Bag". Instead of catching all of it in review, the work is split into small steps, and each ends at a
checkpoint that must pass before the next begins. The `build_page` prompt walks an agent through them.

| # | Checkpoint | Tool | Stops |
|---|---|---|---|
| 0 | Anchor | `get_system_fingerprint` | Working from a stale idea of the system: version + hash of tokens, registry and spec |
| 1 | Plan | `review_plan` | Invented components, hidden primitives, unapproved new parts; flags Beta parts and their gaps |
| 2 | Structure | `validate_code` (TSX) | Naming, raw values in markup, placeholder link text |
| 3 | Style | `validate_code` (CSS) | Hardcoded values, token-tier violations |
| 4 | Content | `check_copy` | "cart", Title Case, ALL CAPS, placeholder copy, vague link or alt text |
| 5 | Accessibility | `check_contrast` + guardrail warnings | Contrast below 4.5:1 (3:1 large), missing names or alt |
| 6 | Final gate | `run_checkpoints` | Re-runs 0–5 in order and stops at the first failure; if the system changed since checkpoint 0, the work is re-checked against the new one |

Passing checkpoint 6 means **ready for a person to review**, never merged automatically. The pull request then runs
the full CI gates again.

## Proof

- `npm run check:mcp` (also in CI): starts the server like an agent would and checks that every tool answers
  correctly and that each checkpoint both **catches** drift and **passes** good work.
- `npm run mcp:demo`: a Gift guide section built through the checkpoints. Attempt 1 drifts and is stopped at the plan
  (an invented component) and at style (hex and px values, each with its fix). Attempt 2 (`examples/gift-guide/`)
  passes all six.
- Colour changes: the smoke test checks that a darker step is found, a 2.11:1 border is blocked, retuning a primitive
  moves every role on it, an unapproved proposal can't be applied, and the Figma script targets the Primitives
  variable even when another collection has one with the same name.
