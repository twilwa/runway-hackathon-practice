export interface AgentEvent {
  type: string;
  timestamp: number;
  data: unknown;
}

export async function captureHermesLiveKitEvents(): Promise<AgentEvent[]> {
  // TODO: Implement actual event capture from gateway output
  // For now, return mock events that will be replaced with real implementation
  
  return [
    {
      type: 'thinking',
      timestamp: Date.now(),
      data: { thought: 'Processing user input...' },
    },
    {
      type: 'speaking',
      timestamp: Date.now(),
      data: { text: 'Hello there!' },
    },
  ];
}

export function parseAgentEvent(raw: string): AgentEvent {
  const match = raw.match(/^(agent:|hermes\.)(\w+)\s+(.*)$/);
  if (!match) {
    throw new Error(`Invalid event format: ${raw}`);
  }

  const [, prefix, type, dataStr] = match;
  let data: unknown;
  
  try {
    data = JSON.parse(dataStr);
  } catch {
    data = { raw: dataStr };
  }

  return {
    type,
    timestamp: Date.now(),
    data,
  };
}
