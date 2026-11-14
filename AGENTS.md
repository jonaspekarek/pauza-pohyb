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
- App state lives in a local store (`src/lib/pauza/store.ts`, useSyncExternalStore + localStorage) with a fixed pre-hydration snapshot; there is no backend because the prototype keeps all data on-device for privacy.
- Pure limit/bonus/streak rules live in `src/lib/pauza/logic.ts` with tests beside them, so they stay testable without the UI.
- Usage data goes through the `UsageProvider` interface (`src/lib/pauza/usage-provider.ts`); the web build only ships the simulated provider, so a native Android/iOS shell can plug in real, permission-gated usage later.
- Camera pose detection (MediaPipe) is dynamically imported only after the user turns the camera on, so no camera code or model loads in the background.
