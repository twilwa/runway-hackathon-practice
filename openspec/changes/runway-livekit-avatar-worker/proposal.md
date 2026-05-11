## Why

Start the existing Hermes Runway Character avatar as a LiveKit participant with clean startup and teardown.

## What Changes

- Establish the first-wave workstream for **Add Runway avatar LiveKit worker**.
- Define a tracer-bullet vertical slice with explicit acceptance criteria.
- Keep secrets local and preserve existing fallback behavior while the slice is built.
- Feed findings back into `PRD-LIVEKIT.md` as implementation details become known.

## Capabilities

### New Capabilities

- `runway-livekit-avatar-worker`: A separate worker joins the room, starts a Runway AvatarSession with avatar 6824a3e0-f37f-455a-b1d4-3140111a83bf, publishes avatar video, and enforces cleanup/TTL.

### Modified Capabilities

- Future changes may integrate with adjacent LiveKit/Runway/Discord capabilities, but this proposal scopes the named slice first.

## Impact

- Primary reference: `PRD-LIVEKIT.md` section 24.
- Related local Hermes source: `vendor/hermes-agent-livekit/` and `vendor/hermes-agent-pr3894/`.
- Related current web MVP: `app/`, `src/runway/`, and README docs.
- No credentials or secret values may be committed.
