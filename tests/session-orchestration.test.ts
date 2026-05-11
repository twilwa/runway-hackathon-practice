import { describe, expect, it } from 'vitest';
import { startSession, stopSession, getSessionStatus, type SessionState } from '../scripts/session-orchestration';

describe('startSession', () => {
  it('creates a new session with LiveKit room', async () => {
    const result = await startSession({
      roomName: 'test-session',
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
    });
    expect(result.sessionId).toBeDefined();
    expect(result.roomName).toBe('test-session');
    expect(result.webStageUrl).toContain('/livekit-room');
  });

  it('throws error when roomName is missing', async () => {
    await expect(startSession({
      roomName: '',
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
    })).rejects.toThrow('roomName is required');
  });
});

describe('getSessionStatus', () => {
  it('returns status for an active session', async () => {
    const session = await startSession({
      roomName: 'test-session',
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
    });
    
    const status = await getSessionStatus(session.sessionId);
    expect(status).toBeDefined();
    expect(status.state).toBe('running');
  });

  it('returns error for non-existent session', async () => {
    await expect(getSessionStatus('non-existent')).rejects.toThrow('Session not found');
  });
});

describe('stopSession', () => {
  it('stops an active session and cleans up', async () => {
    const session = await startSession({
      roomName: 'test-session',
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
    });
    
    const result = await stopSession(session.sessionId);
    expect(result.success).toBe(true);
    expect(result.cleanedUp).toBe(true);
  });

  it('handles stopping already stopped session gracefully', async () => {
    const session = await startSession({
      roomName: 'test-session',
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
    });
    
    await stopSession(session.sessionId);
    const result = await stopSession(session.sessionId);
    expect(result.success).toBe(true); // Should be idempotent
  });
});
