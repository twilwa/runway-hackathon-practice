/**
 * Hermes LiveKit event payload fixtures
 * 
 * These fixtures are derived from the contracts in docs/contracts/session-event-config.md
 * and can be used for testing the web-stage overlay parser before real PR #3894 payloads
 * are captured from LiveKit.
 */

export const hermesThinkingEvent = {
  type: "agent:thinking",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: "2026-05-11T02:00:00Z",
  data: {
    status: "thinking"
  }
} as const;

export const hermesSpeakingEvent = {
  type: "agent:speaking",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: "2026-05-11T02:00:05Z",
  data: {
    status: "speaking",
    text: "Hello, I'm your avatar assistant."
  }
} as const;

export const hermesToolUseEvent = {
  type: "agent:tool_use",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: "2026-05-11T02:00:10Z",
  data: {
    tool_name: "search",
    status: "started"
  }
} as const;

export const hermesToolUseCompletedEvent = {
  type: "agent:tool_use",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: "2026-05-11T02:00:15Z",
  data: {
    tool_name: "search",
    status: "completed",
    result: "Found 3 relevant results"
  }
} as const;

export const hermesResponseEvent = {
  type: "agent:response",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: "2026-05-11T02:00:20Z",
  data: {
    text: "Based on my search, here are the results...",
    final: true
  }
} as const;

export const hermesTranscriptionEvent = {
  type: "hermes:transcription",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: "2026-05-11T02:00:25Z",
  data: {
    text: "Can you help me with something?",
    is_final: true,
    participant_id: "user-123"
  }
} as const;

export const hermesCaptionEvent = {
  type: "hermes:caption",
  session_id: "123e4567-e89b-12d3-a456-426614174000",
  timestamp: "2026-05-11T02:00:30Z",
  data: {
    text: "Based on my search, here are the results",
    duration_ms: 2500
  }
} as const;

// Event stream fixture for testing state transitions
export const hermesEventStream = [
  hermesThinkingEvent,
  hermesToolUseEvent,
  hermesToolUseCompletedEvent,
  hermesSpeakingEvent,
  hermesResponseEvent,
  hermesCaptionEvent
] as const;

// Type guards for runtime validation
export function isHermesEvent(event: unknown): event is {
  type: string;
  session_id: string;
  timestamp: string;
  data: Record<string, unknown>;
} {
  return (
    typeof event === "object" &&
    event !== null &&
    "type" in event &&
    "session_id" in event &&
    "timestamp" in event &&
    "data" in event
  );
}

export function isAgentThinkingEvent(event: unknown): event is typeof hermesThinkingEvent {
  return isHermesEvent(event) && event.type === "agent:thinking";
}

export function isAgentSpeakingEvent(event: unknown): event is typeof hermesSpeakingEvent {
  return isHermesEvent(event) && event.type === "agent:speaking";
}

export function isAgentToolUseEvent(event: unknown): event is typeof hermesToolUseEvent {
  return isHermesEvent(event) && event.type === "agent:tool_use";
}

export function isAgentResponseEvent(event: unknown): event is typeof hermesResponseEvent {
  return isHermesEvent(event) && event.type === "agent:response";
}

export function isHermesTranscriptionEvent(event: unknown): event is typeof hermesTranscriptionEvent {
  return isHermesEvent(event) && event.type === "hermes:transcription";
}

export function isHermesCaptionEvent(event: unknown): event is typeof hermesCaptionEvent {
  return isHermesEvent(event) && event.type === "hermes:caption";
}
