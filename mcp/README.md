# Natural MCP server

The Natural Design System as tools for AI agents. One install gives Claude, Cursor or any MCP client the components,
specs, tokens and brand rules, **and the same checks the repo enforces**, so an agent can prove its work before a person
reviews it. Everything is read live from this repo, so the server can't drift from the system it describes (D-031).

## Install

```bash
npm install          # from the repo root
npm run mcp          # starts the server on stdio
```

- **Claude Code** (in this repo): already registered as `natural` in `.mcp.json`; approve it once.
- **Claude Desktop / Cursor / others:** add a stdio server with command `node` and args `["<path to repo>/mcp/server.mjs"]`.

## Tools

| Tool | Answers |
|---|---|
| `list_components` | Every component, status, exports, Figma and Storybook links |
| `get_component` | Full spec (props ↔ Figma properties, tokens, do / don't, keyboard and screen reader) plus the TypeScript props |
| `get_guidelines` | Brand, voice, foundations, token architecture, patterns, accessibility |
| `get_tokens` · `find_token` | Tokens by tier; "which token for this hex in a border?" or "secondary text" → the role |
| `validate_code` | The pre-commit guardrail on code the agent wrote, with a fix for every finding |
| `check_contrast` | WCAG ratio and AA / AAA for hex values or roles |

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
