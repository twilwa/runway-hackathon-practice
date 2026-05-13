import {
  parseAgentEvent,
  type AgentEvent,
} from "../../scripts/hermes-livekit-events";

export type DataLogEntry = {
  id: string;
  receivedAt: number;
  topic?: string;
  preview: string;
  participantIdentity?: string;
  parsedAgent?: Pick<AgentEvent, "type" | "data">;
};

export type AppendDataLogOptions = {
  participantIdentity?: string;
  topic?: string;
  maxPreviewLen?: number;
  maxEntries?: number;
};

function tryParseAgentLine(
  line: string,
): Pick<AgentEvent, "type" | "data"> | undefined {
  const trimmed = line.trim();
  if (!/^(agent:|hermes\.)/.test(trimmed)) {
    return undefined;
  }
  try {
    const ev = parseAgentEvent(trimmed);
    return { type: ev.type, data: ev.data };
  } catch {
    return undefined;
  }
}

function buildPreview(
  decoded: string,
  parsed: Pick<AgentEvent, "type" | "data"> | undefined,
  maxLen: number,
): string {
  if (parsed) {
    const base = `${parsed.type} ${JSON.stringify(parsed.data)}`;
    return truncatePreview(base, maxLen);
  }
  return truncatePreview(decoded, maxLen);
}

function truncatePreview(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen)}...`;
}

function createDataLogEntryId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `data-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Append one LiveKit data-channel payload to an immutable log (new array returned).
 */
export function appendDataChannelLogEntry(
  previous: DataLogEntry[],
  payload: Uint8Array,
  options: AppendDataLogOptions = {},
): DataLogEntry[] {
  const maxPreviewLen = options.maxPreviewLen ?? 280;
  const maxEntries = options.maxEntries ?? 50;

  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(payload);
  const parsed = tryParseAgentLine(decoded);
  const preview = buildPreview(decoded, parsed, maxPreviewLen);

  const entry: DataLogEntry = {
    id: createDataLogEntryId(),
    receivedAt: Date.now(),
    topic: options.topic,
    participantIdentity: options.participantIdentity,
    preview,
    parsedAgent: parsed,
  };

  return [...previous, entry].slice(-maxEntries);
}
