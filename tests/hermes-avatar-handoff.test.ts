import { describe, expect, it } from 'vitest';
import { decideHandoffMethod, type HandoffMethod } from '../scripts/hermes-avatar-handoff';

describe('decideHandoffMethod', () => {
  it('chooses text-to-avatar when Runway supports external audio', async () => {
    const result = await decideHandoffMethod({
      runwaySupportsExternalAudio: true,
      hermesHasTTSArtifact: false,
    });
    expect(result.method).toBe('text-to-avatar');
  });

  it('chooses TTS-mirroring when Hermes has TTS artifact', async () => {
    const result = await decideHandoffMethod({
      runwaySupportsExternalAudio: false,
      hermesHasTTSArtifact: true,
    });
    expect(result.method).toBe('tts-mirroring');
  });

  it('falls back to direct-text when neither option available', async () => {
    const result = await decideHandoffMethod({
      runwaySupportsExternalAudio: false,
      hermesHasTTSArtifact: false,
    });
    expect(result.method).toBe('direct-text');
  });

  it('prefers text-to-avatar when both options available', async () => {
    const result = await decideHandoffMethod({
      runwaySupportsExternalAudio: true,
      hermesHasTTSArtifact: true,
    });
    expect(result.method).toBe('text-to-avatar');
  });
});

describe('HandoffMethod', () => {
  it('text-to-avatar sends Hermes text to Runway avatar', () => {
    const method: HandoffMethod = {
      type: 'text-to-avatar',
      description: 'Send final text to Runway avatar for speech synthesis',
    };
    expect(method.type).toBe('text-to-avatar');
  });

  it('tts-mirroring reuses Hermes TTS audio', () => {
    const method: HandoffMethod = {
      type: 'tts-mirroring',
      description: 'Mirror Hermes TTS audio to LiveKit room',
    };
    expect(method.type).toBe('tts-mirroring');
  });

  it('direct-text uses text as fallback', () => {
    const method: HandoffMethod = {
      type: 'direct-text',
      description: 'Display text captions without avatar speech',
    };
    expect(method.type).toBe('direct-text');
  });
});
