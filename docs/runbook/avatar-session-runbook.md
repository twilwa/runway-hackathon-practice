# Runway Avatar Companion - Operator Runbook

This runbook provides operator-facing procedures for creating, linking, stopping, and resetting embodied Hermes avatar sessions during the hackathon demo.

## Prerequisites

### Environment Setup

1. Clone the repository and install tools:
```bash
./bootstrap.sh
mise install
```

2. Copy environment template and configure secrets:
```bash
cp .env.example .env.local
# Edit .env.local to add:
# - LIVEKIT_API_KEY
# - LIVEKIT_API_SECRET
# - LIVEKIT_URL
# - RUNWAYML_API_SECRET
```

3. Run preflight checks:
```bash
./scripts/preflight.sh
```

### Service Availability

- **LiveKit server**: Must be running and accessible at `LIVEKIT_URL`
- **Runway API**: Must be accessible with valid `RUNWAYML_API_SECRET`
- **Hermes PR #3894**: Vendor tree must be present at `vendor/hermes-agent-pr3894/`
- **Discord**: Bot or operator must have voice channel access

## Session Lifecycle

### Starting a Session

#### Option 1: Local Development (MVP)

1. Start the Next.js dev server:
```bash
bun run dev
```

2. Open http://localhost:3000 in a browser

3. Click "Start / reconnect avatar call"

4. Screen-share the browser window into Discord

5. Use Hermes Discord `/voice join` for audio

#### Option 2: LiveKit Session (M1-M5 Path)

1. Start Hermes gateway from vendored PR tree:
```bash
cd vendor/hermes-agent-pr3894
python -m hermes_gateway --room avatar-session-123
```

2. Start avatar worker:
```bash
bun run worker:avatar --session-id 123e4567-e89b-12d3-a456-426614174000
```

3. Open web stage URL:
```
http://localhost:3000/stage?session=123e4567-e89b-12d3-a456-426614174000
```

4. Screen-share the web stage into Discord

### Session Status

#### Check Session State

Local development:
- Browser UI shows connection status and participant count
- Console logs show Hermes event stream

LiveKit session:
- Web stage displays session state (initializing/ready/active/stopping/failed)
- Hermes events appear as overlays (thinking/speaking/tool-use/captions)

#### Discord Operator Commands

| Command | Purpose |
|---------|---------|
| `/avatar status` | Show current session state and web stage URL |
| `/avatar link` | Get web stage URL for screen-sharing |
| `/avatar stop` | Gracefully stop the current session |

### Stopping a Session

#### Graceful Shutdown

1. Stop Hermes gateway (Ctrl+C or SIGTERM)
2. Stop avatar worker (Ctrl+C or SIGTERM)
3. Close web stage browser tab
4. Verify LiveKit room is empty

#### Forced Shutdown

If graceful shutdown fails:
```bash
# Kill by process name
pkill -f hermes_gateway
pkill -f avatar-worker

# Or by session ID
./scripts/stop-session.sh --session-id 123e4567-e89b-12d3-a456-426614174000
```

## Fallback Matrix

### When M1 (Hermes Transport) Fails

**Symptoms**: Hermes cannot join LiveKit room, STT not working, TTS not publishing

**Fallback**: Use direct Discord voice path only, skip avatar visuals

**Steps**:
1. Stop Hermes gateway
2. Use existing Discord `/voice join` flow
3. Proceed with voice-only demo

### When M2 (Web Stage) Fails

**Symptoms**: Browser cannot join room, viewer token errors, tracks not rendering

**Fallback**: Use MVP direct browser page (localhost:3000) with screen-share

**Steps**:
1. Stop web stage process
2. Start MVP: `bun run dev`
3. Open localhost:3000 and screen-share
4. Use Discord voice for audio

### When M3 (Avatar Worker) Fails

**Symptoms**: Avatar participant not in room, video not publishing, worker crashes

**Fallback**: Use Hermes TTS audio only, skip Runway avatar video

**Steps**:
1. Stop avatar worker
2. Continue with Hermes audio in LiveKit room
3. Use Discord screen-share for any visuals needed

### When M4 (Audio Handoff) Fails

**Symptoms**: Double audio, echo, avatar not speaking when Hermes responds

**Fallback**: Use Hermes TTS audio only, mute avatar audio track

**Steps**:
1. Mute avatar participant audio in web stage
2. Use Hermes TTS as primary audio
3. Document audio routing issue for post-hackathon fix

### When M5 (Orchestration) Fails

**Symptoms**: Session state not tracking, commands not working, cleanup issues

**Fallback**: Manual process management with individual commands

**Steps**:
1. Start each component manually (Hermes, worker, web stage)
2. Track session IDs manually
3. Stop components individually with Ctrl+C

## Troubleshooting

### Common Issues

#### "LIVEKIT_API_KEY format invalid"

**Cause**: Key should be in format `key:secret`

**Fix**: Check `.env.local` and ensure key contains colon separator

#### "Avatar participant not visible in web stage"

**Cause**: Worker may not have joined room or avatar session failed

**Fix**:
1. Check worker logs for errors
2. Verify `RUNWAY_AVATAR_ID` is correct
3. Check Runway API quota/limits

#### "Double audio / echo"

**Cause**: Discord and LiveKit both publishing audio

**Fix**:
1. Mute Discord bot in voice channel
2. Ensure web stage mutes local audio
3. Check audio routing contract in docs/contracts/session-event-config.md

#### "Session stuck in 'initializing' state"

**Cause**: Worker or Hermes gateway failed to start

**Fix**:
1. Check component logs
2. Verify environment variables are set
3. Run `./scripts/preflight.sh` to validate environment

### Logs and Debugging

**Component Logs**:
- Hermes gateway: `vendor/hermes-agent-pr3894/logs/`
- Avatar worker: `logs/avatar-worker.log`
- Web stage: Browser console and Next.js dev server output

**Enable Debug Logging**:
```bash
export LOG_LEVEL=debug
bun run dev
```

## Security Notes

- **Never commit secrets**: `.env.local` and any files with API keys must remain uncommitted
- **Use short-lived tokens**: LiveKit viewer tokens should expire after session
- **Clean up sessions**: Always stop sessions after demo to avoid resource leaks
- **Rotate keys**: After hackathon, rotate any exposed API keys

## Known Limitations

- Discord-native video/camera automation is not supported
- Manual screen-share is required for MVP visuals
- Avatar sessions have ~5 minute TTL (Runway limitation)
- No multi-tenant hardening for production use
- Perfect lip-sync is not guaranteed in MVP

## Post-Demo Cleanup

1. Stop all running processes (Hermes, worker, web stage)
2. Clear LiveKit rooms if admin access available
3. Revoke or rotate exposed API keys
4. Archive session logs for analysis
5. Update this runbook with any discovered issues

## Contact and Support

- **OpenSpec changes**: `openspec/changes/`
- **Contracts**: `docs/contracts/session-event-config.md`
- **Issue tracking**: Use `br` to report blockers or improvements
