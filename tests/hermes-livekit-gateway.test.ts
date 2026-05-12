import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';
import { runHermesLiveKitGateway } from '../scripts/hermes-livekit-gateway';

const integrationEnabled = process.env.HERMES_LIVEKIT_GATEWAY_INTEGRATION === '1';
const hermesVendorPath = join(process.cwd(), 'vendor/hermes-agent-livekit');
const vendorPresent = existsSync(hermesVendorPath);

describe('runHermesLiveKitGateway', () => {
  it('exports a callable gateway runner', () => {
    expect(typeof runHermesLiveKitGateway).toBe('function');
  });

  it.skipIf(vendorPresent)('fails fast when vendored Hermes tree is missing', async () => {
    await expect(
      runHermesLiveKitGateway({
        roomId: 'test-room',
        apiKey: 'test-key',
        apiSecret: 'test-secret',
        liveKitUrl: 'wss://test.livekit.cloud',
      })
    ).rejects.toThrow(/Hermes LiveKit vendor directory not found/);
  });

  describe.skipIf(!integrationEnabled)('integration (set HERMES_LIVEKIT_GATEWAY_INTEGRATION=1)', () => {
    it('starts Hermes gateway from vendored PR tree with real credentials', async () => {
      const result = await runHermesLiveKitGateway({
        roomId: process.env.LIVEKIT_ROOM ?? 'integration-test-room',
        apiKey: process.env.LIVEKIT_API_KEY ?? '',
        apiSecret: process.env.LIVEKIT_API_SECRET ?? '',
        liveKitUrl: process.env.LIVEKIT_URL ?? 'wss://test.livekit.cloud',
      });
      expect(result.started).toBe(true);
    });
  });
});
