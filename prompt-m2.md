# Prompt for M2 Implementation Agent

You are working in:

```text
/Users/anon/Projects/runway-hackathon-practice
```

Your task is to finish **ONLY M2**:

```text
M2 = Lightweight TypeScript LiveKit web stage tracer bullet
```

Do **not** claim M3/M4/M5. Do **not** implement Runway avatar workers, Hermes-to-avatar speech handoff, Discord operator orchestration, or fake/demo-only backends. M2 is complete only when a browser page joins a real LiveKit room and renders real participant/track/data-channel state from the M1 Hermes LiveKit room.

## Current verified baseline

M1 has runtime evidence from `scripts/m1-hermes-livekit-smoke.sh`:

```text
LiveKit Server API preflight: ok
[Livekit] 1 participant(s) already in 'hermes-test-room', joining
[Livekit] Connected to room 'hermes-test-room' at wss://hermes-vlyqjygb.livekit.cloud
[Livekit] Disconnected
```

Important nuance: prior participant logs may contain stale `401 invalid token` lines because earlier versions appended to reused log files. Do not treat stale appended lines as current failure if the current run shows `joined room=...` and Hermes connected. The script should truncate per-run logs; verify that before relying on logs.

## Architecture decision

- Python owns Hermes/LiveKit backend integration and future Runway worker orchestration.
- TypeScript owns only the lightweight browser stage and small frontend-adjacent API glue.
- Keep TypeScript scope narrow: LiveKit viewer token, browser room join, real track rendering, status/caption overlays.

## Required environment

The app should read these from `.env.local` or server env:

```text
LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
LIVEKIT_ROOM
NEXT_PUBLIC_LIVEKIT_URL
```

If `NEXT_PUBLIC_LIVEKIT_URL` is missing, derive the public URL from server `LIVEKIT_URL` in bootstrap/token responses rather than exposing secrets.

Never print or commit secret values.

## Prerequisite cleanup

1. Verify these imports still build:

```ts
app/api/livekit/viewer-token/route.ts
app/api/session/route.ts
```

Expected import fixes from previous review:

```ts
// app/api/livekit/viewer-token/route.ts
import { createLiveKitViewerToken } from '../../../../src/livekit/token';

// app/api/session/route.ts
import { ... } from '../../../scripts/session-orchestration';
```

If these are still broken, fix them first.

2. Run:

```bash
bun run typecheck
bun run build
```

Do not proceed to M2 feature claims until those pass or until unrelated later-milestone tests are explicitly quarantined with explanation.

## M2 deliverables

### 1. Replace mock viewer token generation with real LiveKit JWTs

Current problem:

```text
src/livekit/token.ts returns mock_jwt_token_...
```

Implement real token generation. Preferred choices:

- Use official LiveKit server SDK for Node if adding dependency is acceptable:

  ```bash
  bun add livekit-server-sdk livekit-client
  ```

- Or manually sign LiveKit-compatible JWTs only if dependency churn is explicitly undesirable. Prefer official SDK.

Token requirements:

- identity: unique viewer identity, e.g. `viewer-${crypto.randomUUID()}` or sanitized supplied participant name plus suffix.
- name: human readable viewer name.
- grants:
  - `roomJoin: true`
  - `room: roomName`
  - subscribe allowed
  - publish not required for viewer by default
- TTL: short, e.g. 10-30 minutes.

API route:

```text
POST /api/livekit/viewer-token
```

should return:

```json
{
  "token": "...",
  "roomName": "hermes-test-room",
  "url": "wss://...livekit.cloud",
  "participantIdentity": "viewer-..."
}
```

Do not return API key or API secret.

### 2. Replace simulated LiveKit page with real browser connection

Current problem:

```text
app/livekit-room/page.tsx simulates connection/participants and says TODO to use LiveKit client SDK.
```

Implement a real client-side page that:

- Requests `/api/livekit/viewer-token`.
- Connects to the returned LiveKit URL and room using `livekit-client` or `@livekit/components-react`.
- Shows connection state: connecting / connected / reconnecting / disconnected / failed.
- Lists real participants by identity/name.
- Subscribes to real audio/video tracks.
- Renders video tracks when present.
- Shows a useful empty-room state when only the viewer is present.
- Subscribes to LiveKit data-channel messages and displays recent Hermes event names/payload previews.

Do not simulate participants as acceptance evidence. Mocking may be used in unit tests only if the production page uses real LiveKit APIs.

### 3. Add a minimal M2 smoke path

Add a practical smoke flow, for example:

```bash
# Terminal A: start M1 Hermes LiveKit smoke long enough to keep room active
M1_SMOKE_RUN_SECS=120 bash scripts/m1-hermes-livekit-smoke.sh

# Terminal B: start Next app
bun run dev

# Browser: open
http://localhost:3000/livekit-room?roomName=hermes-test-room
```

Acceptance evidence should include:

- Browser page connects to the same real room.
- Browser shows the synthetic participant and/or Hermes participant from M1.
- Browser receives real track/participant events.
- If Hermes emits data-channel events during the run, page shows them.
- Screenshot or text evidence from browser/devtools is acceptable.

### 4. Tests

Add/adjust tests that verify real behavior boundaries without requiring external LiveKit for unit tests:

- Token helper rejects missing key/secret/room.
- Token helper returns a non-mock JWT-like string and includes room/identity/url metadata.
- Viewer-token API route does not leak API secret.
- LiveKit page/component renders connection states and participants using injectable/mocked LiveKit client abstractions.

Do **not** keep tests that pass because `mock_jwt_token_*` exists.

Run at minimum:

```bash
bun test tests/livekit-viewer-token.test.ts
bun run typecheck
bun run build
```

If the full test suite still fails due to later-milestone mock tests, report that honestly and do not claim full-suite green.

### 5. Docs and tracking

Update:

```text
docs/hermes-livekit-usage.md
```

with M2 browser stage instructions.

Update `br` honestly:

- Close/update only M2 tasks actually satisfied, likely:
  - `br-phk`
  - `br-phk.1`
  - `br-phk.2`
  - `br-phk.3`
  - review gap `br-phk.1.1` if fixed
- Do not close M3/M4/M5.
- Do not mark OpenSpec tasks complete unless actual acceptance criteria passed.

## Verification before final response

Run:

```bash
bun test tests/livekit-viewer-token.test.ts
bun run typecheck
bun run build
```

Then run a real-room manual smoke with M1 active:

```bash
M1_SMOKE_RUN_SECS=120 bash scripts/m1-hermes-livekit-smoke.sh
bun run dev
# open /livekit-room?roomName=hermes-test-room
```

Final response must include:

- M2 complete: yes/no.
- Exact files changed.
- Exact commands run and pass/fail status.
- Real LiveKit room name used.
- Evidence that the browser joined the real room.
- Screenshot path or redacted browser/devtools/log evidence if available.
- Remaining gaps for M3.

## Non-goals

Do not implement or claim:

- Runway `AvatarSession` worker.
- Avatar video track from Runway.
- Hermes final text to avatar speech.
- Discord `/avatar start/stop` orchestration.
- Production auth/multi-tenant hardening.

Those belong to M3-M5.
