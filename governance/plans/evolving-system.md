# Plan: a design system that proposes its own changes (not started)

**Status:** planned, not built. Approved for planning on 2026-10-03; building waits for a go-ahead.
**Will become:** D-035 when built.

## Goal

Natural notices how it is used and **proposes** changes, and the organisation decides:

- **Rule of three.** When the same hand-built pattern appears in 3 or more places across 2 or more teams, Natural
  researches it and recommends the cheapest fix, which is usually *not* a new component.
- **Retirement with consent.** When a component has been unused everywhere for 24 months, Natural asks whether it
  can retire it. Two approvals: deprecate, then remove at least one release later.
- **Nothing merges without people.** Every accepted or declined proposal is logged in `DECISIONS.md`.

## Shaped by community feedback

Two comments on the LinkedIn post shaped this plan. Points 1–3 came from the first, 4–8 from the second.

1. **Similarity can't rely on layer names.** In Figma a composition can be named anything, so patterns are compared
   by what they are made of, with a similarity score, not by name or an exact match.
2. **"Unused" needs a definition, and Figma isn't the source of truth.** A component missing from Figma can still
   ship in the product. Usage is a matrix across sources, and **the live product is authoritative**.
3. **The organisation decides; the design system team holds the quality bar.** Proposals go to the teams whose
   products contain the pattern, and their sign-off decides whether it becomes a component. The design system team
   reviews quality (accessibility, tokens, API consistency); it doesn't decide what deserves to be a component.
4. **Usage rules alone create a review bottleneck.** Triage, not a stream of tickets: one ranked monthly digest,
   weak candidates dropped automatically, reviewer load tracked.
5. **A new component is rarely the answer.** A solution ladder: better docs → a prop or variant → a documented
   pattern → a new component, in that order.
6. **Someone has to own it.** No owner, no component.
7. **Others may already be working on it.** Check work in flight and connect the teams before anything is built.
8. **Impact matters.** Priority weighs reach, teams affected, business weight (set by the organisation) and risk.

## How it works

### 1. Consumers registry
`governance/consumers.json`: each product that uses Natural, with its repository, live URLs, Figma files and
**owning team** (GitHub team or CODEOWNERS). Everything below reads from it.

### 2. Usage matrix (weekly, kept as history)
| Source | Shows | How |
|---|---|---|
| **Live product** (authoritative) | Shipped and rendered | Every Natural component renders `data-nds="<Component>"`; a weekly crawl of the live URLs counts renders |
| **Code** | Imported by a product | Scan consumer repos; resolve components by import source, not local alias |
| **Figma** | Still designed with | Instance counts in the listed files (REST API with a read-only `FIGMA_TOKEN`; library analytics are Enterprise-only) |

Saved monthly as `governance/usage/<yyyy-mm>.json`. Each component gets a status:
**in product** (never retired, whatever Figma says) · **design only** (flag for a conversation) ·
**code only** (designers stopped using it: check the Figma version) · **unused everywhere**.

### 3. Pattern finder (similarity, not names)
Figma signals: main-component keys of the instances inside (stable even if renamed), node types and nesting,
auto-layout direction and child order, bound variables (tokens), relative proportions, and a rendered-image
comparison (perceptual hash or image embedding).
Code signals: JSX tree resolved by import source, prop names (not values), token usage, and a Playwright render
compared by screenshot and layout.
Each pair gets a weighted score; similar patterns are clustered. A cluster is a **candidate** at 3+ members from 2+
teams or files. A Figma cluster that matches a code cluster is the strongest evidence. Every candidate explains its
score, e.g. "92% similar: same 3 Natural components, same tokens, same layout; screenshots attached."

### 4. Triage: the solution ladder, work in flight, priority
For each candidate, before anyone is asked to review it:
1. **Solution ladder.** The agent works up from the cheapest fix and stops at the first that fits:
   (a) an existing component as is: the gap is docs or examples → a docs proposal;
   (b) an existing component plus a prop or variant → an enhancement proposal;
   (c) a documented pattern (recipe) built from existing parts → a pattern proposal;
   (d) a new component, only when (a)–(c) don't fit, with the reasons written down.
   It uses what the MCP server already knows (`list_components`, `get_component`, `review_plan`).
2. **Work in flight.** Search open issues and pull requests, the Figma Proposals page and consumer-repo branches for
   related efforts; link them and introduce the teams instead of proposing a duplicate.
3. **Priority score.** Reach (live renders from the crawl) × teams affected × business weight (a tier per product in
   `consumers.json`, set by the organisation) × risk (e.g. hand-built copies failing accessibility checks).
4. **Monthly digest.** One ranked issue. Only the top few become full proposals; the rest wait with their reasons and
   reappear only if the evidence grows. Reviewer time per proposal is tracked; if the queue grows, thresholds rise.

### 5. Proposal flow
- Issue: evidence (where, screenshots, score and reasons, similar existing components), the ladder rung chosen and
  why the cheaper rungs don't fit, related work in flight, and the priority score. Labelled `proposal`.
- **No owner, no component.** Approval needs a team that commits to owning it (an `owner` field in the registry).
  Without one, the outcome stays at rung (c), a documented pattern.
- **Reviewers:** the owning teams of the products that contain the pattern. **Approval:** sign-off from at least
  2 of those teams (configurable) **plus** the design system team's quality review.
- Draft pull request by the agent, through Natural's checkpoints: component, story, spec, registry entry with status
  **Proposed**, built only from Natural components and tokens. Approved and merged → **Beta** (GOVERNANCE.md §5).
  The Figma component is built locally with `/evolve` (Figma MCP; CI can't write Figma).
- **Declined:** the fingerprint is stored in `governance/declined.json` and not proposed again unless the evidence
  grows substantially.

### 6. Retirement flow
Only **unused everywhere for 24 months** (live product, code and Figma) starts it. The issue shows the full usage
history. Every team that ever used the component is notified; **any team can object with a reason**, which pauses it.
Approval 1 → deprecate (registry, `@deprecated`, Figma strikethrough label, CHANGELOG). Approval 2, at least one
release later → remove (a breaking change: minor in 0.x, major from 1.0).

### 7. Guardrails
Never merges or publishes. At most 2 proposals a week. Thresholds (3 places, 2 teams, 24 months, similarity cut-off,
approvals needed) and the quality bar live in a config file owned by the organisation; changing them goes through
review. Every decision is logged.

## The intelligence layer: earned, not assumed

No company has a layer that can *decide* what should become a component, and this plan doesn't pretend to build one.
What can be built is a layer that **assembles the context a design systems team gathers by hand, recommends, and
proves how often its recommendations match people's decisions**, before anyone relies on it.

1. **System graph (context).** One queryable map built from the repo and the scans: components ↔ tokens ↔ owners ↔
   consumers ↔ usage ↔ open issues ↔ decisions. Served through the MCP server (e.g. `get_context(candidate)`), so the
   agent reasons over facts, not guesses.
2. **Precedent (memory).** The decision log is the training data. 34 decisions already record what was chosen and why
   (D-022 chose a variant over a new component; D-021 split Logo out because it was reused). For each candidate the
   agent retrieves similar past decisions and cites them: "like D-022, a variant fits."
3. **Shadow mode (trust).** For the first months the layer runs silently: it writes its recommendation, people decide
   as usual, and the two are compared. A public scorecard reports agreement (e.g. "matched the team's decision in
   78% of 40 cases; disagreed mostly on business priority").
4. **Promotion by evidence.** It moves from shadow → digest → drafting pull requests only when agreement passes a bar
   the organisation sets, and drops back if it falls. Every disagreement is reviewed and becomes new precedent.
5. **Ask for the data the org has; don't infer it.** Business weight comes from the organisation (analytics, revenue
   tiers), not from the model.

**What it is:** a research and triage assistant whose accuracy is measured. **What it isn't:** an authority.

## Build order
1. `data-nds` attribute on every component (with a test that each one renders it) and the consumers registry.
2. Usage matrix: live-site crawl first (authoritative), then code scan, then Figma; monthly history.
3. Retirement flow, tested with a short threshold on a test component.
4. Pattern finder, Figma and code signals, with tests for renamed layers, aliased imports and look-alikes built differently.
5. Triage: solution ladder, work in flight, priority score, monthly digest.
6. Intelligence layer in **shadow mode**: system graph, precedent retrieval, agreement scorecard.
7. Proposal flow with team-based review and owners, promoted out of shadow mode only by evidence; `/evolve` for
   Figma, D-035, GOVERNANCE.md §2 and §5 updates, CHANGELOG.

## Open decisions
- **First consumer:** a small demo storefront in this repo, or a separate repository (closer to how real teams use a
  design system). A seeded pattern used 3 times makes the trigger demonstrable.
- **Similarity cut-off and weights:** start conservative (high threshold), tune with real data.
- **Live-site crawl:** which URLs, how often, and respecting robots and rate limits.
- **Collaboration:** the first commenter is working on code-side similarity; compare approaches before building step 4.
- **Agreement bar** for leaving shadow mode, and how many decisions are needed before the scorecard means anything.
- **Business weights:** who in the organisation sets them, and from which data.

## Limits to state honestly
- Natural has no real consumers yet, so the triggers need a seeded demo until products adopt it.
- "24 months unused" needs history; the clock starts with the first usage snapshot.
- Figma usage on the Professional plan means scanning listed files, not organisation-wide analytics.
