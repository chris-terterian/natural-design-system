# Governance

How the Natural Design System changes, who decides, and how quality is enforced. Written for a team even though today there's one owner, so it scales without a rewrite.

| Read this for… | See |
|---|---|
| What the system looks and sounds like | [`DESIGN.md`](DESIGN.md) |
| Why things are the way they are | [`DECISIONS.md`](DECISIONS.md) |
| What changed, by version | [`CHANGELOG.md`](CHANGELOG.md) |
| Component status (single source) | [`governance/components.json`](governance/components.json), shown in Storybook → *Governance / Component status* and on the Figma **Governance** page |
| Allowed accessibility exceptions | [`governance/a11y-exceptions.json`](governance/a11y-exceptions.json) |

---

## 1. Principles

1. **Code is the source of truth.** Tokens and components live in this repo. Figma mirrors them, and Storybook shows them. When they disagree, the repo wins and the others are fixed.
2. **Accessibility blocks, it doesn't advise.** WCAG 2.2 AA is a gate on every push, not a review comment.
3. **Reuse before you invent.** New work nests existing components (Button, Badge, Icon Button…) before creating new ones.
4. **Decisions are written down.** If a choice would surprise someone later, it goes in `DECISIONS.md` with its reason.
5. **Honest status.** "Beta" with listed gaps beats a "Stable" label that isn't true.
6. **Automate the boring checks.** People review judgement; scripts check consistency.

---

## 2. Roles & decision rights

| Role | Who today | Can | Must |
|---|---|---|---|
| **Owner** | Repository owner (@chris-terterian) | Approve proposals, merges, releases and deprecations; change this policy | Review every change before it ships; keep the registry and decision log current |
| **Contributor** | Future designers and developers | Propose changes, open pull requests, add to the Proposals page | Follow the contribution flow and checklist; never publish to the live pages directly |
| **Claude Code** (AI agent) | Assistant in the repo and Figma | Build changes in code and Figma, export the Figma snapshot, run all checks, draft docs | Read `DESIGN.md` and this file first; refresh the Figma snapshot after any Figma change; **ask the owner before any commit or push**; never mark something Stable on its own |

**Decisions need the owner's approval for:** new components, token collections or modes; breaking changes; status changes; new accessibility exceptions; releases.

---

## 3. Where things live

| Artifact | Home | Notes |
|---|---|---|
| Tokens | `tokens/figma-variables.json` → `npm run tokens` → `src/styles/tokens.css` | Mirrors Figma variables 1:1, including modes |
| Components | `src/components/<Name>/` (`.tsx`, `.css`, `.stories.tsx`) | One folder per registry entry |
| Specs | `DESIGN.md` §6 | Same template for every component |
| Figma | *Natural Design System* file | One page per component family, plus **Governance** and **Proposals** |
| Live docs | Storybook on GitHub Pages | Deployed only when every gate passes |

---

## 4. How changes happen

### Change tiers

| Tier | Examples | Path |
|---|---|---|
| **Fix** | Wrong token value, copy typo, a11y bug, broken link | Fix in code and Figma → gates pass → owner approves → ship as a **patch** |
| **Enhancement** | New variant, state or prop (e.g. Button Loading) | Short written proposal → build in both → review checklist → owner approves → ship as a **minor** |
| **New** | New component, token collection, mode or pattern | Proposal on the Figma **Proposals** page → owner approves the idea → design → code + story + spec → full review → ship as **Beta** in a **minor** |

### Contribution flow (enhancement and new)

1. **Propose.** Describe the problem, where it appears in the store, and what already exists that almost solves it. New ideas go on the Figma **Proposals** page (Figma Professional has no branching, so the Proposals page is the sandbox).
2. **Approve the idea.** The owner accepts, redirects to an existing component, or declines, and logs non-obvious calls in `DECISIONS.md`.
3. **Design in Figma.** Variant grid with State columns and labelled rows; every fill, stroke, size and type bound to variables; contrast noted; nest existing components as exposed instances.
4. **Build in code.** Tokens first, then component, styles (tokens only) and stories (Figma link, All Variants, status tag).
5. **Document.** A `DESIGN.md` §6 spec (properties, layout, states, Do/Don't, keyboard & screen reader), plus a registry entry.
6. **Verify.** Refresh the Figma snapshot, then `npm run check` locally (typecheck, governance, parity, build, accessibility), then compare Figma ↔ code visually.
7. **Approve & ship.** The owner reviews, the change merges, the version is bumped, and `CHANGELOG.md` gets an entry.

### Review checklist

- [ ] Solves a real store need; nothing existing already does it
- [ ] Figma and code share names, variants, properties and token values
- [ ] Every Figma property is wired to a layer and exists in code (no decorative switches)
- [ ] Tokens only: no raw values in CSS, no unbound fills in Figma
- [ ] WCAG 2.2 AA: contrast, never colour alone, 44px targets, keyboard, screen reader names
- [ ] Voice follows `DESIGN.md` §2 (UI vocabulary: "Add to Bag", sentence case)
- [ ] Spec, story, registry entry and changelog updated

---

### AI agents (Natural MCP server)

Agents build with the Natural MCP server (D-031) and follow its checkpoints: anchor to the current system, then plan, structure, style, content and accessibility, each verified before the next step.

- **No pull request without a passing final gate.** Include the `run_checkpoints` report (it names the system version and hash it was checked against).
- **Agents never merge or publish.** A pass means ready for a person to review the rendered result, keyboard and screen-reader behaviour and the copy; CI then runs every gate again.
- **New parts aren't invented in code.** `review_plan` rejects components the system doesn't have; they go through the Proposal flow (§4).
- **Colour changes by voice or text** (D-033) go through `propose_color_change` → a spoken or written yes → `apply_color_change` → Figma via the Figma MCP → parity → pull request. A contrast regression can't be applied; approval is tied to the proposal id.
- **The drift bot follows the same rules** (§6, D-032): it opens pull requests and issues, and a person merges.

### AI-generated stories (Story UI)

[Story UI](https://github.com/southleft/story-ui) generates stories from prompts, using only this system's components and the rules in `story-ui-considerations.md` (it also reads generated copies of `DESIGN.md` and the tokens in `story-ui-docs/`).

- **Drafts, not system.** Generated stories land in `src/stories/generated/`, which is gitignored and never published. They're exploration, like the Figma Proposals page.
- **Promotion goes through the flow.** To keep a generated pattern, a person moves it into `src/components/` as a proposal (§4). From there every gate applies: validate_file, governance, parity, accessibility.
- **Local only.** Story UI needs its own server and an API key, so it runs only on `localhost`. The published Storybook never includes it (D-020).
- **Keys stay local.** The provider key lives in `.env`, which is gitignored. Never paste it into docs, issues or chat.

## 5. Component lifecycle

| Status | Meaning | To enter it |
|---|---|---|
| **Proposed** | Accepted for exploration | Proposal approved; lives on the Figma Proposals page |
| **In progress** | Being designed and built | Owner has assigned it |
| **Beta** | Usable; known gaps listed; API may change in a minor | In Figma + code + story + spec; passes all gates; gaps written in the registry `notes` |
| **Stable** | Complete and dependable | Beta criteria + no open gaps + used in at least one pattern or page + owner sign-off |
| **Deprecated** | Still works; don't use in new work | Replacement named; removal version set; `@deprecated` in code; strikethrough label in Figma |

Status appears in three places, all fed from `governance/components.json`: the Storybook tag (`status:beta`), the Storybook *Governance* page, and the Figma **Governance** page and component descriptions. The governance check fails if a story's tag disagrees with the registry.

**Deprecation policy:** a deprecated component stays for at least one minor release (in 0.x) or one major release (from 1.0), with its replacement documented in `DECISIONS.md` and `CHANGELOG.md`. Removal is a breaking change.

---

## 6. Quality gates

Run on every push to `main` by `.github/workflows/storybook-pages.yml`. **Any failure blocks the Storybook deploy**, so the live site only ever shows a passing system.

| Gate | Command | Blocks | Checks |
|---|---|---|---|
| Typecheck | `npm run typecheck` | ✅ | TypeScript compiles |
| **validate_file** | `npm run validate_file -- --all` (and the pre-commit hook) | ✅ | Hardcoded values, broken naming and placeholder link text block; other static accessibility issues warn. Every finding comes with a fix suggestion |
| Governance | `npm run check:governance` | ✅ | Tokens resolve; generated `tokens.css` and `DESIGN.md` front matter are current; every component is registered with a valid status, matching story tag, Figma node and `DESIGN.md` spec |
| Build | `npm run build-storybook` | ✅ | Every story builds |
| Contrast | `npm run check:contrast` | ✅ | Every pairing DESIGN.md §4.2 promises (24: text 4.5:1, UI 3:1) passes in every brand × Color mode (Natural, Tide × Light, Dark) |
| Accessibility | `npm run check:a11y` | ✅ | axe (WCAG 2.0 / 2.1 / 2.2, A + AA) on every story in every brand × theme; only registered exceptions pass |
| Figma ↔ code parity | `npm run check:parity` | ✅ | Every variable matches per mode, both directions; every Figma node the code links to exists with the registry name; no unwired component properties; text styles bound to Typography variables. Compares against `governance/figma-snapshot.json`, which is exported from the live file through the Figma MCP |

Pull requests to `main` run the same gates without deploying. Run everything locally with `npm run check`.

### Drift bot

`.github/workflows/drift-bot.yml` (D-032) turns any failure into a reviewed fix instead of a red badge.

| When | What it does |
|---|---|
| A gates run on `main` fails, every night, or on demand | `scripts/drift-check.mjs --fix` runs **every** gate (it doesn't stop at the first failure), applies the safe deterministic fixes (regenerating files from the tokens), checks whether Figma was edited after the parity snapshot (with the `FIGMA_TOKEN` secret), and files or updates one **Drift detected** issue (label `drift`) |
| Code drift remains | An agent (Claude Code in GitHub Actions, with the Natural MCP server) fixes it, re-runs the check and opens a pull request that references the issue. Needs the `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` secret; without it the issue is the hand-off |
| Figma ↔ code disagreement | Each difference gets a **direction** (D-034), from code now vs code when the snapshot was last committed vs Figma: **Figma behind** → a person runs `/drift`, which updates Figma through the Figma MCP. **Figma changed** (code didn't) → a design decision: the bot opens a pull request adopting it in code (colours contrast-checked), and a person approves it or reverts Figma. **Both changed** → a person decides, seeing all three values. Nothing is ever overwritten on a guess |
| Everything passes again | The issue closes itself |
| A person adds the `drift` label to an issue | Runs detect and fix on demand |

**Guardrails.** The bot never merges, never pushes to `main`, never publishes and never uses `--no-verify`. It works from a report it generates itself, never from issue text. It may not loosen a rule, add `validate-ignore` or an accessibility exception, or edit the Figma snapshot to make a gate pass. Pull requests opened with the workflow token don't start other workflows, so the bot's pull request body includes its own final check; a person closes and reopens it (or pushes a commit) so the gates run before merging.

### validate_file guardrail (pre-commit)

Runs on every `git commit` (a Git hook in `.githooks/`, installed automatically by `npm install`) against the **staged** files, and in CI against **all** files so a skipped hook can't sneak anything through.

| Blocks the commit | Examples | Suggested fix |
|---|---|---|
| **Hardcoded values** | `#3B2A1E`, `rgb(…)`, `padding: 18px` in component CSS; colours or sizes in component inline styles | The role for that property (a colour in `border` suggests `border/*`, in `background` `bg/*` or `control/*`), or the public scale step (`var(--nds-space-12)`) |
| **Token tiers** (D-030) | A component using a hidden primitive (`--nds-color-brown-900`, `--nds-font-size-14`), or another component's one-off token | The roles that alias that primitive (e.g. `var(--nds-fg-default)`); a new role or Component token through §4 |
| **Broken naming** | Classes outside `nds-block__element--modifier`; unknown `--nds-*` tokens (typo-matched); token names with `.`, the wrong collection prefix, or a collection outside the six tiers; non-PascalCase components; story titles that don't match Figma; undocumented breakpoints | The corrected name, or "did you mean…" |
| **Placeholder link text** | "click here", "read more", "learn more", "link" | Say where the link goes (WCAG 2.4.4) |

**Warns** (doesn't block): removed focus outlines, `<img>` without `alt`, click handlers on non-interactive elements, positive `tabIndex`, icon buttons without a name.

**Exceptions** go inline with a reason, on the same line or the line above: `/* validate-ignore <rule>: <why> */`. An ignore without a reason is itself an error. Today's exceptions: the visually-hidden technique (`1px`), and the product card link's outline (the card draws the ring). Story and governance-page layout scaffolding is exempt from the hardcoded-value rule; placeholder link text and naming still apply there. Never commit with `--no-verify`; CI runs the same check.

### Figma parity snapshot

CI can't open Figma: there's no desktop app or logged-in user on a build server, and Figma's server-side Variables API needs an Enterprise plan. So parity runs in two halves:

1. **Export, wherever Figma is reachable** (your machine or a Claude Code session). `npm run figma:snapshot-script -- variables-1 | variables-2 | structure` prints three small plugin scripts. Run each through the Figma MCP (figma-console `figma_execute` or Figma's `use_figma`), then merge the results with `npm run figma:snapshot-save -- <3 files>` into `governance/figma-snapshot.json` and commit it.
2. **Compare, everywhere including CI** (blocking). `npm run check:parity` fails on any difference and names it.

**Rule:** refresh the snapshot in the same change as any Figma or token edit, and always before a release. The snapshot records when it was taken; a snapshot older than the latest Figma edit can't catch that edit.

### Accessibility exceptions register

An exception is allowed only when WCAG itself allows it (for example, inactive components are exempt from contrast). Each entry in `governance/a11y-exceptions.json` has an ID, the axe rule, a CSS selector that limits where it applies, the WCAG basis, an owner and a review date. Adding one needs owner approval and a `DECISIONS.md` entry.

---

## 7. Versioning & releases

The system follows [semantic versioning](https://semver.org) and **stays in 0.x** until the remaining foundations exist (real photography, image guidelines, the modal form) and the Beta components reach Stable.

| Change | 0.x (now) | From 1.0 |
|---|---|---|
| Breaking (removed export, renamed prop or token, changed default) | **minor** (0.2 → 0.3) | major |
| New component, variant, prop or token | **minor** | minor |
| Fix, doc or a11y repair with no API change | **patch** (0.2.0 → 0.2.1) | patch |

**Release steps**
1. `npm run check` passes locally (it starts with `check:install`, which installs the lock file with CI's exact npm). When dependencies change, regenerate the lock file with that npm: `npx npm@11.19.0 install`.
2. Figma snapshot refreshed and `npm run check:parity` passes.
3. Bump `package.json`, then add a dated, versioned entry to `CHANGELOG.md` (Added / Changed / Removed / Fixed).
4. Owner approves; commit, push, and tag `vX.Y.Z`.
5. Figma: publish the library with the same version in the release notes (available on Professional).

---

## 8. Figma hygiene

- **Proposals page** for experiments. Never edit live component pages to try an idea.
- **No unwired properties.** A boolean or variant that doesn't change a layer, or doesn't exist in code, isn't allowed (see D-009).
- **Bind everything:** fills, strokes, radius, spacing, sizes and type use variables or text styles.
- **Labelled grids:** State columns and variant rows on every component page, with a status badge next to the page title.
- **Don't detach** library components in designs; request a variant instead.
- **Modes, not copies:** responsive typography switches by frame mode (Desktop / Mobile), never by duplicating text layers.

---

## 9. Cadence

| When | What |
|---|---|
| Every change | Contribution flow + gates |
| Every release | Review exceptions register, Beta notes and parity |
| Quarterly (once there's a team) | Status review: promote, deprecate, or remove; check for detached instances and one-off styles in product files |
