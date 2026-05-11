import { describe, expect, it } from 'vitest';
import { captureHermesLiveKitEvents, parseAgentEvent, type AgentEvent } from '../scripts/hermes-livekit-events';

describe('captureHermesLiveKitEvents', () => {
  it('captures agent:* events from gateway output', async () => {
    const events = await captureHermesLiveKitEvents();
    expect(events).toBeInstanceOf(Array);
    expect(events.length).toBeGreaterThan(0);
  });

  it('each event has required fields', async () => {
    const events = await captureHermesLiveKitEvents();
    events.forEach((event: AgentEvent) => {
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('data');
    });
  });
});

describe('parseAgentEvent', () => {
  it('parses agent:thinking events', () => {
    const raw = 'agent:thinking {"thought": "Processing user input..."}';
    const parsed = parseAgentEvent(raw);
    expect(parsed.type).toBe('thinking');
    expect(parsed.data).toEqual({ thought: 'Processing user input...' });
  });

  it('parses agent:speaking events', () => {
    const raw = 'agent:speaking {"text": "Hello there!"}';
    const parsed = parseAgentEvent(raw);
    expect(parsed.type).toBe('speaking');
    expect(parsed.data).toEqual({ text: 'Hello there!' });
  });

  it('parses agent:tool events', () => {
    const raw = 'agent:tool {"name": "search", "args": {"query": "test"}}';
    const parsed = parseAgentEvent(raw);
    expect(parsed.type).toBe('tool');
    expect(parsed.data).toEqual({ name: 'search', args: { query: 'test' } });
  });

  it('parses hermes.* events', () => {
    const raw = 'hermes.lifecycle {"state": "ready"}';
    const parsed = parseAgentEvent(raw);
    expect(parsed.type).toBe('lifecycle');
    expect(parsed.data).toEqual({ state: 'ready' });
  });
});
