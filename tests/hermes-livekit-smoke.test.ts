import { describe, expect, it } from 'vitest';
import { checkHermesLiveKitSmoke } from '../scripts/hermes-livekit-smoke';

describe('checkHermesLiveKitSmoke', () => {
  it('checks Python availability', async () => {
    const result = await checkHermesLiveKitSmoke();
    expect(result.pythonAvailable).toBe(true);
  });

  it('checks ffmpeg availability', async () => {
    const result = await checkHermesLiveKitSmoke();
    expect(result.ffmpegAvailable).toBe(true);
  });

  it('checks LiveKit environment variables', async () => {
    const result = await checkHermesLiveKitSmoke();
    expect(result.liveKitEnvValid).toBe(true);
  });

  it('checks Hermes LiveKit imports', async () => {
    const result = await checkHermesLiveKitSmoke();
    expect(result.hermesImportsValid).toBe(true);
  });

  it('returns overall pass status when all checks pass', async () => {
    const result = await checkHermesLiveKitSmoke();
    expect(result.pass).toBe(true);
  });
});
