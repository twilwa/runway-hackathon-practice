# LiveKit Avatar Companion - Shared Contracts

This document defines shared contracts for session lifecycle, event payloads, and configuration keys derived from the active OpenSpec changes. These contracts enable parallel development without requiring external service calls.

## Session Contract

### Session Record Fields

- **session_id**: UUID - Unique identifier for the avatar session
- **room_name**: string - LiveKit room identifier (format: `avatar-{session_id}`)
- **avatar_id**: UUID - Runway Character avatar UUID (default: `6824a3e0-f37f-455a-b1d4-3140111a83bf`)
- **state**: enum - `initializing`, `ready`, `active`, `stopping`, `stopped`, `failed`
- **created_at**: timestamp - ISO 8601 datetime
- **updated_at**: timestamp - ISO 8601 datetime
- **expires_at**: timestamp (optional) - TTL for session cleanup

### Session Lifecycle States

1. **initializing**: Session record created, room not yet joined
2. **ready**: Room joined, avatar worker starting, web stage URL available
3. **active**: Hermes brain responding, avatar publishing video, overlays rendering
4. **stopping**: Graceful shutdown in progress
5. **stopped**: Clean shutdown complete
6. **failed**: Error state with error_message populated

## Event Payload Contracts

### Hermes Lifecycle Events (`agent:*`)

#### `agent:thinking`

```json
{
  "type": "agent:thinking",
  "session_id": "uuid",
  "timestamp": "iso8601",
  "data": {
    "status": "thinking"
  }
}
```

#### `agent:speaking`

```json
{
  "type": "agent:speaking",
  "session_id": "uuid",
  "timestamp": "iso8601",
  "data": {
    "status": "speaking",
    "text": "string (optional)"
  }
}
```

#### `agent:tool_use`

```json
{
  "type": "agent:tool_use",
  "session_id": "uuid",
  "timestamp": "iso8601",
  "data": {
    "tool_name": "string",
    "status": "started|completed|failed",
    "result": "string (optional)"
  }
}
```

#### `agent:response`

```json
{
  "type": "agent:response",
  "session_id": "uuid",
  "timestamp": "iso8601",
  "data": {
    "text": "string",
    "final": true
  }
}
```

### LiveKit Data Events (`hermes.*`)

#### `hermes:transcription`

```json
{
  "type": "hermes:transcription",
  "session_id": "uuid",
  "timestamp": "iso8601",
  "data": {
    "text": "string",
    "is_final": boolean,
    "participant_id": "string"
  }
}
```

#### `hermes:caption`

```json
{
  "type": "hermes:caption",
  "session_id": "uuid",
  "timestamp": "iso8601",
  "data": {
    "text": "string",
    "duration_ms": number
  }
}
```

## Configuration Keys

### Required Environment Variables

| Key | Purpose | Format | Secret |
|-----|---------|--------|--------|
| `LIVEKIT_API_KEY` | LiveKit server authentication | `key:secret` | Yes |
| `LIVEKIT_API_SECRET` | LiveKit server authentication | string | Yes |
| `LIVEKIT_URL` | LiveKit server WebSocket URL | `wss://...` | No |
| `RUNWAYML_API_SECRET` | Runway avatar session authentication | string | Yes |
| `RUNWAY_AVATAR_ID` | Runway Character avatar UUID | UUID | No |

### Optional Environment Variables

| Key | Purpose | Default |
|-----|---------|---------|
| `SESSION_TTL_SECONDS` | Max session duration before auto-stop | `300` |
| `ROOM_PREFIX` | LiveKit room name prefix | `avatar-` |
| `LOG_LEVEL` | Logging verbosity | `info` |

### Local Development Keys

| Key | Purpose | Format |
|-----|---------|--------|
| `NEXT_PUBLIC_RUNWAY_AVATAR_ID` | Client-side avatar ID (MVP only) | UUID |

## Audio Routing Contract

### Canonical Audio Path

1. **Hermes STT** → LiveKit room audio track
2. **Hermes TTS** → LiveKit room audio track
3. **Runway avatar speech** → LiveKit video participant audio track
4. **Discord audio** → Separate Discord voice channel (not LiveKit)

### Echo Avoidance Rules

- Discord bot must **not** publish audio to LiveKit room
- LiveKit room audio must **not** be routed back to Discord
- Only one TTS source should be active at a time (Hermes OR Runway, not both)
- Web stage should mute local audio when avatar is speaking

## Derived From

- `openspec/changes/livekit-hermes-transport-spike/`
- `openspec/changes/livekit-avatar-web-stage/`
- `openspec/changes/runway-livekit-avatar-worker/`
- `openspec/changes/hermes-avatar-audio-handoff/`
- `openspec/changes/discord-avatar-session-orchestration/`
