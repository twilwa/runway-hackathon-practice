import { describe, expect, it } from 'vitest';
import { validateWorkerEnv, startAvatarWorker } from '../scripts/runway-avatar-worker';

describe('validateWorkerEnv', () => {
  it('validates required environment variables', () => {
    const result = validateWorkerEnv({
      RUNWAYML_API_SECRET: 'test-secret',
      LIVEKIT_API_KEY: 'test-key',
      LIVEKIT_API_SECRET: 'test-lk-secret',
      LIVEKIT_URL: 'wss://test.livekit.cloud',
      LIVEKIT_ROOM: 'test-room',
    });
    expect(result.valid).toBe(true);
  });

  it('fails when RUNWAYML_API_SECRET is missing', () => {
    const result = validateWorkerEnv({
      RUNWAYML_API_SECRET: '',
      LIVEKIT_API_KEY: 'test-key',
      LIVEKIT_API_SECRET: 'test-lk-secret',
      LIVEKIT_URL: 'wss://test.livekit.cloud',
      LIVEKIT_ROOM: 'test-room',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('RUNWAYML_API_SECRET is required');
  });

  it('fails when LiveKit variables are missing', () => {
    const result = validateWorkerEnv({
      RUNWAYML_API_SECRET: 'test-secret',
      LIVEKIT_API_KEY: '',
      LIVEKIT_API_SECRET: '',
      LIVEKIT_URL: '',
      LIVEKIT_ROOM: '',
    });
    expect(result.valid).toBe(false);
  });
});

describe('startAvatarWorker', () => {
  it('starts the avatar worker with valid config', async () => {
    const result = await startAvatarWorker({
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
      roomName: 'test-room',
      maxDuration: 300000, // 5 minutes
    });
    expect(result.started).toBe(true);
  });

  it('throws error when avatarId is missing', async () => {
    await expect(startAvatarWorker({
      avatarId: '',
      roomName: 'test-room',
      maxDuration: 300000,
    })).rejects.toThrow('avatarId is required');
  });
});
