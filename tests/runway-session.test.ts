import { describe, expect, it } from 'vitest';
import {
  createRunwaySessionCredentials,
  type FetchLike,
} from '../src/runway/session';

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  });
}

describe('createRunwaySessionCredentials', () => {
  it('creates, polls, consumes, and normalizes realtime credentials without leaking api secrets', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchLike: FetchLike = async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/v1/realtime_sessions') && init?.method === 'POST') {
        return jsonResponse({ id: 'session_123' });
      }
      if (String(url).endsWith('/v1/realtime_sessions/session_123') && init?.method === 'GET') {
        return jsonResponse({ status: 'READY', sessionKey: 'session_key_abc' });
      }
      if (String(url).endsWith('/v1/realtime_sessions/session_123/consume') && init?.method === 'POST') {
        return jsonResponse({ url: 'wss://runway.example/session', token: 'rtc_token', roomName: 'room_1' });
      }
      throw new Error(`Unexpected request: ${init?.method} ${url}`);
    };

    const result = await createRunwaySessionCredentials({
      avatarId: 'avatar_123',
      apiSecret: 'key_should_not_escape',
      baseUrl: 'https://api.dev.runwayml.com',
      fetchLike,
      pollIntervalMs: 0,
      maxPolls: 2,
    });

    expect(result).toEqual({
      sessionId: 'session_123',
      serverUrl: 'wss://runway.example/session',
      url: 'wss://runway.example/session',
      token: 'rtc_token',
      roomName: 'room_1',
    });
    expect(JSON.stringify(result)).not.toContain('key_should_not_escape');
    expect(calls[0].init?.body).toBe(JSON.stringify({
      model: 'gwm1_avatars',
      avatar: { type: 'custom', avatarId: 'avatar_123' },
    }));
    expect(calls[0].init?.headers).toMatchObject({
      Authorization: 'Bearer key_should_not_escape',
      'X-Runway-Version': '2024-11-06',
      'Content-Type': 'application/json',
    });
    expect(calls[2].init?.headers).toMatchObject({
      Authorization: 'Bearer session_key_abc',
      'X-Runway-Version': '2024-11-06',
      'Content-Type': 'application/json',
    });
    expect(calls[2].init?.body).toBe('{}');
  });

  it('throws a useful error when the session fails', async () => {
    const fetchLike: FetchLike = async (url, init) => {
      if (String(url).endsWith('/v1/realtime_sessions') && init?.method === 'POST') {
        return jsonResponse({ id: 'session_failed' });
      }
      if (String(url).endsWith('/v1/realtime_sessions/session_failed') && init?.method === 'GET') {
        return jsonResponse({ status: 'FAILED', failure: { message: 'no capacity' } });
      }
      throw new Error(`Unexpected request: ${init?.method} ${url}`);
    };

    await expect(createRunwaySessionCredentials({
      avatarId: 'avatar_123',
      apiSecret: 'key_secret',
      baseUrl: 'https://api.dev.runwayml.com',
      fetchLike,
      pollIntervalMs: 0,
      maxPolls: 1,
    })).rejects.toThrow('Runway session failed: no capacity');
  });
});
