import { describe, expect, it } from 'vitest';
import { createLiveKitViewerToken } from '../src/livekit/token';

describe('createLiveKitViewerToken', () => {
  it('creates a viewer token for a LiveKit room', async () => {
    const result = await createLiveKitViewerToken({
      roomName: 'test-room',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      participantName: 'viewer',
    });
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('roomName');
    expect(result.roomName).toBe('test-room');
  });

  it('throws error when API key is missing', async () => {
    await expect(createLiveKitViewerToken({
      roomName: 'test-room',
      apiKey: '',
      apiSecret: 'test-secret',
      participantName: 'viewer',
    })).rejects.toThrow('LIVEKIT_API_KEY is required');
  });

  it('throws error when API secret is missing', async () => {
    await expect(createLiveKitViewerToken({
      roomName: 'test-room',
      apiKey: 'test-key',
      apiSecret: '',
      participantName: 'viewer',
    })).rejects.toThrow('LIVEKIT_API_SECRET is required');
  });

  it('throws error when room name is missing', async () => {
    await expect(createLiveKitViewerToken({
      roomName: '',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      participantName: 'viewer',
    })).rejects.toThrow('roomName is required');
  });
});
