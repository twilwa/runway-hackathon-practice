## Context

Provide operator/Discord-facing controls for creating, linking, stopping, and resetting embodied Hermes avatar sessions.

The intended hackathon architecture is Hermes-as-brain, LiveKit-as-media-room, Runway-as-avatar-speaker, and Discord-as-collaboration/control surface. This workstream should produce a narrow, testable tracer bullet rather than a broad refactor.

## Goals / Non-Goals

**Goals:**

- Deliver the vertical slice for **Orchestrate Discord demo sessions**.
- Keep Hermes as the source of truth for reasoning, tool use, and final responses.
- Preserve a local fallback path so the demo can continue if this slice fails.
- Add docs or scripts that make the slice repeatable by another operator.

**Non-Goals:**

- Production multi-tenant hardening.
- Discord-native video/camera automation.
- Committing API secrets or long-lived tokens.
- Perfect lip-sync or production latency unless explicitly called out by the slice.

## Decisions

- Build tracer bullets in dependency order: transport -> web stage -> avatar worker -> handoff -> orchestration.
- Prefer explicit session IDs/room names over hidden global state.
- Treat captions/status/context congruence as part of correctness, not polish.
- Use manual Discord screen-share for MVP visuals.

## Risks / Trade-offs

- LiveKit, Runway, and Hermes voice each have their own lifecycle; partial failures must be visible and recoverable.
- External services require credentials and may incur usage/cost; setup and cleanup must be explicit.
- The unmerged Hermes PR may drift; keep the portable patch metadata up to date if refreshed.

## Migration Plan

1. Start from the previous completed slice and verify its smoke path.
2. Implement the smallest behavior needed for this slice.
3. Run local tests/build checks plus a manual smoke if external credentials are needed.
4. Update docs with run, stop, and fallback instructions.

Rollback: stop any local processes created by the slice and use the prior completed fallback path.

## Open Questions

- Which pieces must live in the hackathon Next.js repo versus the vendored Hermes PR tree?
- Which command should become the final one-button demo launcher?
