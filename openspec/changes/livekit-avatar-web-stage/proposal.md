## Why

Replace the direct-only browser MVP with a LiveKit viewer surface that can render room tracks plus Hermes status/caption events.

## What Changes

- Establish the first-wave workstream for **Build LiveKit avatar web stage**.
- Define a tracer-bullet vertical slice with explicit acceptance criteria.
- Keep secrets local and preserve existing fallback behavior while the slice is built.
- Feed findings back into `PRD-LIVEKIT.md` as implementation details become known.

## Capabilities

### New Capabilities

- `livekit-avatar-web-stage`: Browser obtains short-lived viewer tokens, joins a room, displays participants/tracks, and renders Hermes lifecycle overlays while retaining the direct Runway fallback.

### Modified Capabilities

- Future changes may integrate with adjacent LiveKit/Runway/Discord capabilities, but this proposal scopes the named slice first.

## Impact

- Primary reference: `PRD-LIVEKIT.md` section 24.
- Related local Hermes source: `vendor/hermes-agent-livekit/` and `vendor/hermes-agent-pr3894/`.
- Related current web MVP: `app/`, `src/runway/`, and README docs.
- No credentials or secret values may be committed.
