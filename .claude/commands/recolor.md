---
description: Change colours by voice or text through the design tokens, then mirror to Figma (D-033)
argument-hint: what to change, e.g. "make the sale price a bit darker"
---

Colour change request (may be dictated, so allow for misheard words): $ARGUMENTS

Use the `natural` MCP server's **recolor** workflow. Colours change only through tokens (code is the source of truth),
never as hex in components or Figma layers. Keep replies short enough to be read aloud.

1. **Map to tokens.** `get_tokens({ collection: "Color" })` and DESIGN.md §4.2 say which role does what. Prefer re-pointing
   one role; retune a primitive only when the person means the whole palette step. Ambiguous? Ask one short question.
2. **Propose.** `propose_color_change`. Read its `say` back word for word. Blocked → offer the nearest passing value
   (`check_contrast`) and propose again.
3. **Wait for a clear yes.** Anything else is not a yes.
4. **Apply.** `apply_color_change` with the same changes and the `proposalId`.
5. **Figma.** Load the figma-use skill, run the returned `figma.script` with `use_figma` on `84MjZXozBoKCvf9lwIU5pu`,
   confirm every change is in `done`, and screenshot an affected component (Colors page 210:341 and one component that
   uses the role).
6. **Prove it.** Refresh the parity snapshot (`npm run figma:snapshot-script -- variables-1|variables-2|structure` via
   `use_figma`, `npm run figma:snapshot-save`), update the DESIGN.md §4.2 row, add a CHANGELOG entry, `npm run check`.
7. **Hand over.** Say what changed in one sentence and ask before committing / opening a pull request. Never merge.
