# Hermes LiveKit Transport Spike

This document describes how to use the Hermes LiveKit transport spike for the hackathon.

## Prerequisites

1. **Materialize the Hermes LiveKit worktree:**
   ```bash
   bash vendor/hermes-agent-pr3894/scripts/materialize-livekit-worktree.sh
   ```

2. **Install dependencies:**
   - Python 3 and [uv](https://github.com/astral-sh/uv) (recommended)
   - In the vendored tree, install Hermes **with the LiveKit extra** (pulls `livekit` / `livekit-api`):
     ```bash
     cd vendor/hermes-agent-livekit && uv sync --extra livekit
     ```
   - ffmpeg
   - LiveKit credentials

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your LiveKit credentials
   ```

   Required variables:
   - `LIVEKIT_API_KEY`: Your LiveKit API key
   - `LIVEKIT_API_SECRET`: Your LiveKit API secret
   - `LIVEKIT_URL`: Your LiveKit server URL (e.g., `wss://livekit.example.com`)
   - `LIVEKIT_ROOM`: The LiveKit room name to join

## Running the Hermes Gateway

### Option 1: Using the bash script

```bash
bash scripts/start-hermes-livekit.sh
```

### Option 2: Manual execution

```bash
cd vendor/hermes-agent-livekit
python3 gateway/run.py
```

## M1 smoke runner (real LiveKit)

End-to-end operator check. The script **loads `.env.local` then `.env` from the repo root** (same convention as Next.js), so you do not need to `export` variables manually. Nothing secret is echoed (only `[SET]` / `[MISSING]` for keys).

```bash
bash scripts/m1-hermes-livekit-smoke.sh
```

The gateway process uses `vendor/hermes-agent-livekit/.venv/bin/python` when that venv exists (after `uv sync --extra livekit`).

Optional: `M1_SMOKE_RUN_SECS` (default 45) controls how long the gateway stays up before the script stops it. Logs go under `scratchpad/m1-smoke-logs/` unless `M1_SMOKE_LOG_DIR` is set. Hermes config is isolated under `scratchpad/m1-smoke-hermes-config/` via `HERMES_CONFIG_DIR` unless you override it.

## Smoke Check

Run the smoke check to verify dependencies:

```bash
bun test tests/hermes-livekit-smoke.test.ts
```

Or programmatically:

```typescript
import { checkHermesLiveKitSmoke } from './scripts/hermes-livekit-smoke';

const result = await checkHermesLiveKitSmoke();
console.log(result);
```

## Expected Behavior

When the Hermes gateway starts successfully:

1. It connects to the configured LiveKit room
2. It joins as a participant
3. It transcribes incoming speech from the room
4. It processes the transcription through the Hermes agent/tool loop
5. It generates TTS audio for the response
6. It publishes the TTS audio back to the LiveKit room

## Troubleshooting

**Hermes vendor directory not found:**
- Run the materialization script: `bash vendor/hermes-agent-pr3894/scripts/materialize-livekit-worktree.sh`

**Python not found:**
- Install Python 3: `brew install python3` (macOS) or use your system package manager

**ffmpeg not found:**
- Install ffmpeg: `brew install ffmpeg` (macOS) or use your system package manager

**LiveKit connection failed:**
- Verify your LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL are correct
- Ensure the LiveKit room exists and you have permission to join

## Next Steps

- Event contract: `docs/hermes-livekit-event-contract.md`
- M2: Build the LiveKit avatar web stage
