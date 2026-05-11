# Hermes LiveKit Event Contract

This document describes the event contract for Hermes LiveKit transport events.

## Event Format

Events are emitted by the Hermes gateway in the following format:

```
agent:<event_type> <json_payload>
```

or

```
hermes.<event_type> <json_payload>
```

## Event Types

### agent:thinking

Emitted when Hermes is processing a user input.

**Example:**
```
agent:thinking {"thought": "Processing user input..."}
```

**Payload:**
```typescript
{
  thought: string;
}
```

### agent:speaking

Emitted when Hermes is generating or speaking a response.

**Example:**
```
agent:speaking {"text": "Hello there!"}
```

**Payload:**
```typescript
{
  text: string;
}
```

### agent:tool

Emitted when Hermes calls a tool.

**Example:**
```
agent:tool {"name": "search", "args": {"query": "test"}}
```

**Payload:**
```typescript
{
  name: string;
  args: Record<string, unknown>;
}
```

### hermes.lifecycle

Emitted when Hermes lifecycle state changes.

**Example:**
```
hermes.lifecycle {"state": "ready"}
```

**Payload:**
```typescript
{
  state: 'ready' | 'processing' | 'speaking' | 'idle';
}
```

## Parsed Event Structure

When parsed, events have the following structure:

```typescript
interface AgentEvent {
  type: string;      // The event type (e.g., "thinking", "speaking", "tool")
  timestamp: number; // Unix timestamp in milliseconds
  data: unknown;     // The parsed JSON payload
}
```

## Usage

### Parsing Events

```typescript
import { parseAgentEvent } from '../scripts/hermes-livekit-events';

const raw = 'agent:thinking {"thought": "Processing..."}';
const event = parseAgentEvent(raw);
console.log(event);
// { type: 'thinking', timestamp: 1715321234567, data: { thought: 'Processing...' } }
```

### Capturing Events

```typescript
import { captureHermesLiveKitEvents } from '../scripts/hermes-livekit-events';

const events = await captureHermesLiveKitEvents();
events.forEach(event => {
  console.log(`${event.type}:`, event.data);
});
```

## Consumer Expectations

Web overlays and other consumers should:

1. **Parse events in real-time** as they arrive from the gateway
2. **Display lifecycle state** (thinking, speaking, idle) to show Hermes activity
3. **Render captions** from `agent:speaking` events
4. **Show tool calls** from `agent:tool` events for transparency
5. **Handle malformed events** gracefully (fallback to raw string)

## Future Extensions

Additional event types may be added as the Hermes LiveKit integration evolves:
- `agent:caption` - Pre-formatted caption text
- `hermes.error` - Error states and recovery
- `hermes.audio` - Audio metadata for TTS playback
