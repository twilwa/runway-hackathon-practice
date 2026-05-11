import { describe, expect, it } from 'vitest';
import { processHermesToAvatarSpeech, type SpeechResult } from '../scripts/hermes-avatar-speech';

describe('processHermesToAvatarSpeech', () => {
  it('processes Hermes final text to avatar speech', async () => {
    const result = await processHermesToAvatarSpeech({
      hermesText: 'Hello, how can I help you today?',
      method: 'text-to-avatar',
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
    });
    expect(result.success).toBe(true);
    expect(result.caption).toBe('Hello, how can I help you today?');
  });

  it('handles tool calls in the same turn', async () => {
    const result = await processHermesToAvatarSpeech({
      hermesText: 'Let me check that for you.',
      method: 'text-to-avatar',
      avatarId: '6824a3e0-f37f-455a-b1d4-3140111a83bf',
      toolCalls: [{ name: 'search', result: 'Found 3 results' }],
    });
    expect(result.success).toBe(true);
    expect(result.toolCallsProcessed).toBe(1);
  });

  it('returns error when avatarId is missing', async () => {
    await expect(processHermesToAvatarSpeech({
      hermesText: 'Hello',
      method: 'text-to-avatar',
      avatarId: '',
    })).rejects.toThrow('avatarId is required');
  });
});
