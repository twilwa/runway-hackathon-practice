## Why

Hermes can already join Discord voice as an audio assistant, but Discord does
not provide a low-risk live video path for this MVP. A local Runway Character
browser companion lets you screen-share a visual avatar into Discord while
keeping Hermes's existing voice flow unchanged.

## What Changes

- Add a local Next.js browser companion for the Hermes Runway avatar.
- Add a server-only session broker that creates, polls, consumes, and returns
  Runway realtime avatar session credentials.
- Render the Runway avatar through `@runwayml/avatars-react` with visible
  reconnect, status, and Discord screen-share guidance.
- Document local environment requirements and validation commands.
- Add smoke coverage for the server-side Runway session lifecycle helper.

## Capabilities

### New Capabilities

- `runway-avatar-companion`: Local browser companion, server-side Runway
  realtime session brokering, configuration, and MVP Discord handoff behavior.

### Modified Capabilities

None.

## Impact

- `app/page.tsx` renders the local companion UI and starts Runway avatar calls.
- `app/api/avatar/session/route.ts` exposes the server-only session endpoint.
- `src/runway/session.ts` owns Runway realtime session lifecycle behavior.
- `tests/runway-session.test.ts` verifies credential creation and failure
  handling without calling the network.
- `.env.example`, `README.md`, `package.json`, `bun.lock`, `tsconfig.json`, and
  `vitest.config.ts` define local setup, dependencies, and checks.
