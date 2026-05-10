# runway-avatar-discord-companion

Add a paired browser UI for a Runway Character avatar usable alongside Hermes Discord voice calls.

## Why

Hermes can already participate in Discord voice as an audio assistant, but the Discord gateway does not provide a low-risk live video/screen-share path. Runway Characters provide a browser/WebRTC avatar experience. A local browser companion page gives us an MVP that can be screen-shared into Discord while Hermes joins/listens/speaks through the existing voice stack.

## Scope

- Create a minimal Next.js/Bun app in this repo.
- Add a server-only Runway realtime session endpoint; never expose API keys to the browser.
- Render the created Hermes Runway avatar in a browser page via `@runwayml/avatars-react`.
- Add visible MVP guidance/debug state for Discord screen sharing.
- Add smoke tests around the server-side session lifecycle helper.

## Non-goals

- No Discord bot-controlled live camera/screen-share automation in this change.
- No raw Runway WebRTC media bridge into Discord.
- No production auth/multi-user deployment hardening beyond keeping the API key server-side.

## Acceptance criteria

- `bun test` passes.
- `bun run build` passes.
- `/api/avatar/session` creates, polls, consumes, and returns one-time WebRTC credentials without returning secrets.
- The root page can start a Runway avatar call for avatar `6824a3e0-f37f-455a-b1d4-3140111a83bf`.
- `.env.example` documents required env without real secrets.
