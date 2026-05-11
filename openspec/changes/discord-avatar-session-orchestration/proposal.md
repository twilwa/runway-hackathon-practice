## Why

Provide operator/Discord-facing controls for creating, linking, stopping, and resetting embodied Hermes avatar sessions.

## What Changes

- Establish the first-wave workstream for **Orchestrate Discord demo sessions**.
- Define a tracer-bullet vertical slice with explicit acceptance criteria.
- Keep secrets local and preserve existing fallback behavior while the slice is built.
- Feed findings back into `PRD-LIVEKIT.md` as implementation details become known.

## Capabilities

### New Capabilities

- `discord-avatar-session-orchestration`: A session lifecycle path creates/identifies a LiveKit room, provides a web stage URL, supervises Hermes/avatar worker processes when feasible, and keeps manual Discord screen-share as the visual handoff.

### Modified Capabilities

- Future changes may integrate with adjacent LiveKit/Runway/Discord capabilities, but this proposal scopes the named slice first.

## Impact

- Primary reference: `PRD-LIVEKIT.md` section 24.
- Related local Hermes source: `vendor/hermes-agent-livekit/` and `vendor/hermes-agent-pr3894/`.
- Related current web MVP: `app/`, `src/runway/`, and README docs.
- No credentials or secret values may be committed.
