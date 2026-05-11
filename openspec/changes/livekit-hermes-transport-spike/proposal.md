## Why

Prove Hermes can run from the vendored PR #3894 tree as a LiveKit voice participant before adding Runway media.

## What Changes

- Establish the first-wave workstream for **Validate PR #3894 Hermes LiveKit transport**.
- Define a tracer-bullet vertical slice with explicit acceptance criteria.
- Keep secrets local and preserve existing fallback behavior while the slice is built.
- Feed findings back into `LIVEKIT-PRD.md` as implementation details become known.

## Capabilities

### New Capabilities

- `livekit-hermes-transport`: Hermes joins LiveKit, receives user audio, runs STT and the normal agent/tool loop, publishes TTS audio back, and emits documented lifecycle events.

### Modified Capabilities

- Future changes may integrate with adjacent LiveKit/Runway/Discord capabilities, but this proposal scopes the named slice first.

## Impact

- Primary reference: `LIVEKIT-PRD.md` section 24.
- Related local Hermes source: `vendor/hermes-agent-livekit/` and `vendor/hermes-agent-pr3894/`.
- Related current web MVP: `app/`, `src/runway/`, and README docs.
- No credentials or secret values may be committed.
