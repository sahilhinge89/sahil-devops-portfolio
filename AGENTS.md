<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- All editable portfolio content (name, links, projects, experience, caption texts) lives in `src/config.ts`; components never hard-code copy. Why: one file for the owner to edit.
- The "Ship it." intro lives in `src/ship-it/` split into `timeline/` (pure TS layout, keyframe script, camera), `state/` (pure TS cargo ownership + Director clock), `models/` (procedural R3F meshes, shared kit), `scene/` (canvas + the single Stepper), `ui/` (stage, captions, Skip/Replay). Why: rules stay testable without React/three.
- Every motion is a pure function of one master clock (`evalFrame(t)`); only `Stepper.tsx` writes transforms each frame. Why: skip/replay/seek stay deterministic.
- Cargo changes owner only through `transfer()` with the `LEGAL` table, driven by `EVENTS` in `timeline/script.ts`; item meshes are positioned from owner anchor × local pose. Why: no teleporting or double ownership.
- The 3D canvas is lazy-loaded behind a WebGL check and an error boundary; the hero copy renders without it. Why: never block the page.
- Dev-only hooks: `window.__shipit.seek(t)` / `.look(...)` and `/?shipit=<t>` freeze the script at a time for screenshots.
- The About terminal uses `react-linux-terminals`; its CSS is not exported, so a copy lives in `src/components/magicui/linux-terminal.css` (min-width relaxed for mobile). Why: package export map blocks the stylesheet.
- Tests: `bunx vitest run src/ship-it` covers ownership rules and script invariants (release support, captions, ship clearance).
