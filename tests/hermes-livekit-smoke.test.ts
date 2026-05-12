import { existsSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkHermesLiveKitSmoke } from '../scripts/hermes-livekit-smoke';

const hermesVendor = join(process.cwd(), 'vendor/hermes-agent-livekit');
const vendorPresent = existsSync(hermesVendor);

describe('checkHermesLiveKitSmoke', () => {
  beforeEach(() => {
    // Unit-safe: smoke logic only checks presence of vars, not credential validity.
    vi.stubEnv('LIVEKIT_API_KEY', 'unit-test-key');
    vi.stubEnv('LIVEKIT_API_SECRET', 'unit-test-secret');
    vi.stubEnv('LIVEKIT_URL', 'wss://unit.test.example');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it.skipIf(!vendorPresent)('checks Hermes LiveKit imports', async () => {
    const result = await checkHermesLiveKitSmoke();
    expect(result.hermesImportsValid).toBe(true);
  });

  it.skipIf(!vendorPresent)('returns overall pass status when all checks pass', async () => {
    const result = await checkHermesLiveKitSmoke();
    expect(result.pass).toBe(true);
  });
});
