## Why

Connect Hermes response output to the avatar speaker/animation path while preserving Hermes as the only response/tool brain.

## What Changes

- Establish the first-wave workstream for **Make Hermes output drive avatar speech**.
- Define a tracer-bullet vertical slice with explicit acceptance criteria.
- Keep secrets local and preserve existing fallback behavior while the slice is built.
- Feed findings back into `PRD-LIVEKIT.md` as implementation details become known.

## Capabilities

### New Capabilities

- `hermes-avatar-audio-handoff`: A vertical slice relays Hermes final text or TTS artifact to the Runway/LiveKit path, renders matching captions, and documents the canonical audio route to avoid echo.

### Modified Capabilities

- Future changes may integrate with adjacent LiveKit/Runway/Discord capabilities, but this proposal scopes the named slice first.

## Impact

- Primary reference: `PRD-LIVEKIT.md` section 24.
- Related local Hermes source: `vendor/hermes-agent-livekit/` and `vendor/hermes-agent-pr3894/`.
- Related current web MVP: `app/`, `src/runway/`, and README docs.
- No credentials or secret values may be committed.
