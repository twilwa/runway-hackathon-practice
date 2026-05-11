import { describe, expect, it } from 'vitest';
import { runHermesLiveKitGateway } from '../scripts/hermes-livekit-gateway';

describe('runHermesLiveKitGateway', () => {
  it('starts Hermes gateway from vendored PR tree', async () => {
    const result = await runHermesLiveKitGateway({
      roomId: 'test-room',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      liveKitUrl: 'wss://test.livekit.cloud',
    });
    expect(result.started).toBe(true);
  });

  it('verifies participant join to LiveKit room', async () => {
    const result = await runHermesLiveKitGateway({
      roomId: 'test-room',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      liveKitUrl: 'wss://test.livekit.cloud',
    });
    expect(result.participantJoined).toBe(true);
  });

  it('verifies speech transcription works', async () => {
    const result = await runHermesLiveKitGateway({
      roomId: 'test-room',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      liveKitUrl: 'wss://test.livekit.cloud',
    });
    expect(result.speechTranscription).toBe(true);
  });

  it('verifies Hermes response and TTS playback', async () => {
    const result = await runHermesLiveKitGateway({
      roomId: 'test-room',
      apiKey: 'test-key',
      apiSecret: 'test-secret',
      liveKitUrl: 'wss://test.livekit.cloud',
    });
    expect(result.hermesResponse).toBe(true);
    expect(result.ttsPlayback).toBe(true);
  });
});
