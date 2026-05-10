## Context

This repository is a Bun-managed Next.js App Router project for a Runway
hackathon MVP. The current app pairs Hermes's existing Discord voice behavior
with a browser-hosted Runway Character avatar that you can screen-share into a
Discord call.

The browser cannot receive the Runway API secret. The app therefore uses a
server-side route to create a one-time Runway realtime session, wait for it to
be ready, consume it with the session key, and return only WebRTC connection
credentials to the client.

## Goals / Non-Goals

**Goals:**

- Keep the Runway API secret server-side.
- Provide a single local page that shows setup state, the configured avatar ID,
  and a start or reconnect control.
- Create fresh one-time Runway credentials for each avatar call attempt.
- Preserve Hermes's existing Discord audio path and use Discord screen sharing
  for the visual handoff.
- Validate the Runway session helper with deterministic unit tests.

**Non-Goals:**

- Automate Discord bot video, camera, or screen-share controls.
- Bridge raw Runway WebRTC media into Discord.
- Add production multi-user authentication, persistence, rate limiting, or
  deployment hardening beyond keeping secrets server-side.

## Decisions

- Use Next.js App Router with a Node.js route handler for session creation.
  This keeps the server boundary explicit and avoids exposing secret-bearing
  Runway requests to the browser. A separate backend service was not chosen
  because the MVP only needs one local server endpoint.
- Use `@runwayml/avatars-react` on the client for the avatar call UI. This
  avoids reimplementing WebRTC setup and matches Runway's browser companion
  integration model.
- Keep Runway session lifecycle logic in `src/runway/session.ts`. This makes the
  create, poll, consume, normalize, and error-handling path testable without
  booting Next.js or calling the network.
- Resolve the avatar ID from the request body, then `NEXT_PUBLIC_RUNWAY_AVATAR_ID`,
  then the existing Hermes avatar UUID. This supports local overrides while
  keeping a working default for the hackathon demo.
- Resolve the API secret from `RUNWAYML_API_SECRET`, with `RUNWAY_SKILLS_API_SECRET`
  retained as a local compatibility fallback. Neither value is returned to the
  client.

## Risks / Trade-offs

- Runway realtime sessions are short-lived and one-time use → The UI exposes a
  reconnect control that creates fresh credentials.
- The API route currently returns upstream error messages with status 500 → This
  is acceptable for local MVP debugging but must be refined before production.
- No production auth or rate limiting exists → The app is intended for local
  use, not public deployment.
- The client relies on the Runway React SDK's `connectUrl` contract → Keep the
  API response shape aligned with the SDK by returning both `serverUrl` and
  `url` aliases.

## Migration Plan

1. Install dependencies with `bun install`.
2. Copy `.env.example` to `.env.local` and configure `RUNWAYML_API_SECRET`.
3. Run `bun test`, `bun run typecheck`, and `bun run build`.
4. Start the app with `bun run dev`, open `http://localhost:3000`, and
   screen-share the browser window into Discord.

Rollback is local: stop the Next.js dev server and remove the local environment
file if the companion is not needed.

## Open Questions

- Whether a future production version needs authentication, session quotas, or
  per-user avatar selection.
- Whether Hermes should eventually coordinate visual state with the browser
  companion, rather than relying on manual Discord screen sharing.
