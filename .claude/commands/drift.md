---
description: Find and fix drift between code, Figma and the quality gates, then open a pull request for review (D-032)
---

You are reconciling the Natural design system. Code is the source of truth; Figma mirrors it (CLAUDE.md, D-023).
This is the local half of the drift bot: CI can't read Figma variables on the Professional plan, so Figma-side
drift is fixed here, through the Figma MCP. Extra context from the user: $ARGUMENTS

Stop and report at each checkpoint before moving on. Never merge, never push to `main`, never use `--no-verify`.

1. **Anchor.** `git switch main && git pull`. Read CLAUDE.md, GOVERNANCE.md §4 and §6. If the drift issue is open
   (`gh issue list --label drift`), read it.
2. **Refresh the Figma snapshot.** Load the figma-use skill. For each part (`variables-1`, `variables-2`,
   `structure`): `npm run figma:snapshot-script -- <part>`, run the output with `use_figma` on file
   `84MjZXozBoKCvf9lwIU5pu`, save each result as JSON in the scratchpad, then `npm run figma:snapshot-save -- <3 files>`.
3. **Detect.** `node scripts/drift-check.mjs --fix --out drift` and read `drift/report.md`.
   Checkpoint: show the user the table.
4. **Use the verdicts, don't guess the direction.** The report's "Which side moved" table (D-034) compares code now,
   code when the snapshot was last committed, and Figma now (the snapshot you just refreshed, still uncommitted):
   - **Figma is behind** (code changed): update Figma to match code. Variables: `npm run figma:sync-script` run via
     `use_figma`. Components: edit by hand, screenshot before and after.
   - **Figma changed** (code didn't): a design decision. Recommend adopting it in code (tokens, regenerate; for a
     colour, `propose_color_change` first and never adopt one that fails AA), and **ask the user**: adopt or revert Figma.
   - **Both changed**: show the user all three values and ask which wins. Never pick.
   - **Unknown** (no git history) and component / text-style findings: inspect both sides, then ask.
   Checkpoint: list each finding with its verdict and the proposed action, and wait for the user's go-ahead.
5. **Fix code drift** using the report's fix suggestions and the `natural` MCP server (find_token, validate_code,
   check_contrast, run_checkpoints). Don't loosen rules, add `validate-ignore` or a11y exceptions to make a gate pass.
6. **Prove it.** Refresh the snapshot again (step 2), then `npm run check`. Every gate must pass.
7. **Pull request.** `git switch -c drift/<yyyy-mm-dd>`, commit (CHANGELOG entry if anything user-visible changed).
   **Ask the user before pushing.** Then `gh pr create` with what drifted, which direction each finding was resolved,
   before/after screenshots for Figma edits, the final drift-check table, and "Closes #<drift issue>".
