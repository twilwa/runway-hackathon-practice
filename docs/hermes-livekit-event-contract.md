# Hermes LiveKit data-channel event contract (PR #3894)

**Verification:** `verified from PR #3894 code` — derived from
`vendor/hermes-agent-livekit/gateway/platforms/livekit.py` (`_publish_agent_event` and call sites).
Runtime smoke can add a second line `verified from runtime smoke` once `scripts/m1-hermes-livekit-smoke.sh`
has been executed against a real LiveKit project.

## Wire format (authoritative)

Hermes publishes **JSON** on the LiveKit **data channel** using `local_participant.publish_data` with **no topic**
(default / empty topic). Each message is UTF-8 JSON:

```json
{
  "type": "<event_type>",
  "payload": { }
}
```

- `type` is the full string sent from Python (for example `agent:user-transcript`).
- `payload` is an object; when omitted in code it becomes `{}`.

This is **not** the `agent:<name> <json>` log-line format; that format appears only in helper/tests in this repo.

## Assistant / UI lifecycle (`agent:*`)

| `type` | When emitted | `payload` keys (from code) |
|--------|----------------|----------------------------|
| `agent:listening-start` | Participant speech detected / buffering | `identity` (string) |
| `agent:listening-stop` | End of listening segment or cleanup | `identity` (string) |
| `agent:user-transcript` | After STT returns non-empty text | `transcript`, `final` (boolean), `identity` |
| `agent:thinking-start` | Immediately before `handle_message` / LLM turn | `{}` (no second argument in call) |
| `agent:agent-transcript` | After assistant text is sent on `hermes-chat` topic | `transcript`, `final` |
| `agent:speaking-start` | Before TTS PCM frames are streamed to the room | `{}` |
| `agent:speaking-stop` | After TTS playback, or on error path before return | `{}` |

## Separate channel: `hermes-chat`

`send()` publishes **raw text bytes** (not the JSON envelope above) with `topic="hermes-chat"` for chat-style clients.
The same `send` path then emits `agent:agent-transcript` as a mirror for conversation UIs.

## Consumer notes

1. Parse incoming `DataPacket` / data messages as JSON when possible; require `type` + `payload`.
2. Treat unknown `type` values as forward-compatible (ignore or log).
3. Do not assume `agent:thinking` / `agent:speaking` / `agent:tool` strings — they are **not** emitted by this LiveKit adapter in the vendored tree; tests that used those names were illustrative only.

## Source references

Implementation: `vendor/hermes-agent-livekit/gateway/platforms/livekit.py` — `async def _publish_agent_event` (JSON envelope + `publish_data`).
