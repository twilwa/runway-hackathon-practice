# Prompt for M1 Implementation Agent

You are working in:

```text
/Users/anon/Projects/runway-hackathon-practice
```

Your task is to finish **ONLY M1**:

```text
M1 = LiveKit Hermes transport tracer bullet
```

Do **not** claim M2/M3/M4/M5. Do **not** build mock Runway avatar workers, fake browser participants, or aspirational docs. M1 is complete only when Hermes PR #3894's LiveKit gateway path is verified against a real LiveKit room.

## Important context

- Hermes should remain the brain/source of truth.
- Runway avatar/web stage work is deferred until M1 is actually green.
- There is a vendored Hermes LiveKit PR copy at:

  ```text
  vendor/hermes-agent-livekit/
  ```

- There is also a portable PR package at:

  ```text
  vendor/hermes-agent-pr3894/
  ```

- PR #3894 adds Hermes LiveKit support in Python, including:
  - `gateway/platforms/livekit.py`
  - `Platform.LIVEKIT`
  - LiveKit audio receive
  - Hermes STT/agent loop/TTS
  - data-channel lifecycle events

- Do not print or commit secrets. If showing env output, redact values as `[REDACTED]`.
- Expected env names:
  - `LIVEKIT_URL`
  - `LIVEKIT_API_KEY`
  - `LIVEKIT_API_SECRET`
  - `LIVEKIT_ROOM`
  - `RUNWAYML_API_SECRET` may exist but is not needed for M1 unless a later step explicitly needs it.

## First: fix current route import path regressions

Before doing M1, fix the current route import path regressions so the app can build again.

Known broken imports:

1. `app/api/livekit/viewer-token/route.ts` currently imports:

   ```ts
   ../../../src/livekit/token
   ```

   Correct this import path. From `app/api/livekit/viewer-token/route.ts` to `src/livekit/token.ts`, the relative path should likely be:

   ```ts
   ../../../../src/livekit/token
   ```

   Or use a proper `tsconfig` path alias if already configured.

2. `app/api/session/route.ts` currently imports:

   ```ts
   ../../scripts/session-orchestration
   ```

   Correct this import path. From `app/api/session/route.ts` to `scripts/session-orchestration.ts`, the relative path should likely be:

   ```ts
   ../../../scripts/session-orchestration
   ```

   Or move server orchestration code under `src/` and import from there.

The user already fixed `tsconfig` vendor/scratchpad exclusion, but verify that:

```bash
bun run typecheck
```

no longer typechecks:

- `vendor/hermes-agent-livekit/`
- `scratchpad/hermes-livekit-pr3894-origin-main-worktree/`

If it still does, fix `tsconfig` excludes.

## Scope for this task

### 1. Stabilize repo verification enough that unrelated TypeScript scaffolding does not block M1

- Fix the route import paths above.
- Run:

  ```bash
  bun run typecheck
  bun run build
  ```

- If tests still include fake LiveKit integration tests that spawn Hermes with fake credentials, mark those tests as integration-only/skip by default or rewrite them so unit tests do not spawn real gateway processes.
- Do not spend time implementing M2/M3 mock functionality.

### 2. Create a real M1 smoke runner for Hermes LiveKit

Preferred deliverable:

```text
scripts/m1-hermes-livekit-smoke.sh
```

or equivalent Python script.

The smoke runner should:

- Fail fast if required LiveKit env vars are missing.
- Redact all secret values in logs.
- Start the vendored Hermes gateway from `vendor/hermes-agent-livekit/` with LiveKit enabled.
- Use an isolated profile/env if needed so it does not collide with the user's already-running Hermes gateway.
- Avoid clobbering the user's main Hermes gateway.
- Use a unique `LIVEKIT_ROOM` if not provided, e.g. `hermes-m1-smoke-$timestamp`.
- Clearly print:
  - room name
  - gateway process PID
  - where logs are stored
  - how to join/check the room
- Clean up child processes on exit.
- Support a timeout.

### 3. Prove Hermes actually connects to LiveKit

Minimum acceptance:

- Hermes LiveKit gateway starts without import/dependency errors.
- It connects to the configured LiveKit room.
- A participant can join the room.
- Gateway logs or LiveKit APIs show the Hermes participant/session is present.
- The smoke runner exits nonzero on failure.

Better acceptance:

- Join as a test participant.
- Publish or simulate audio into the room.
- Confirm Hermes receives audio and produces at least one of:
  - user transcript event
  - thinking-start event
  - speaking-start event
  - agent transcript event
  - TTS/audio output

### 4. Capture the actual data event contract from PR #3894

Inspect `vendor/hermes-agent-livekit/gateway/platforms/livekit.py` and document the exact event names/payload shapes actually emitted.

Do not invent new names.

Expected event names likely include things like:

- `agent:user-transcript`
- `agent:thinking-start`
- `agent:speaking-start`
- `agent:speaking-stop`
- `agent:agent-transcript`

But verify from code and/or logs.

Write the result to:

```text
docs/hermes-livekit-event-contract.md
```

Mark it as either:

- `verified from PR #3894 code`, or
- `verified from runtime smoke`,

based on what you actually verify.

### 5. Update task tracking honestly

If M1 is truly complete:

- Mark only the relevant M1 `br` tasks complete.
- Do not close M2/M3/M4/M5.
- Do not mark OpenSpec tasks complete unless their acceptance criteria were actually met.

Relevant M1 tasks include:

- `br-ej0`
- `br-ej0.1`
- `br-ej0.2`
- `br-ej0.3`
- `br-ej0.1.1` if the review gap is fixed.

### 6. Verification commands to run before final handoff

From `/Users/anon/Projects/runway-hackathon-practice`:

```bash
bun run typecheck
bun run build
```

Then run your M1 smoke command with real LiveKit env vars loaded from the user's environment/profile, without printing secrets.

If `bun test` is not fully green because later-milestone mock tests are bad, document that clearly and either:

- skip/quarantine those tests as integration-only, or
- narrow the test command to M1-safe tests and explain why.

## Final response format

- State whether M1 is complete: yes/no.
- Include exact commands run.
- Include exact files changed.
- Include evidence:
  - log snippets with secrets redacted
  - room name
  - event names observed or verified
- Include what remains for M2.
- Do not claim Runway avatar integration or Discord operator flow is done.
