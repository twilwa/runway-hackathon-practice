import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export interface GatewayConfig {
  roomId: string;
  apiKey: string;
  apiSecret: string;
  liveKitUrl: string;
}

export interface GatewayResult {
  started: boolean;
  participantJoined: boolean;
  speechTranscription: boolean;
  hermesResponse: boolean;
  ttsPlayback: boolean;
}

export async function runHermesLiveKitGateway(config: GatewayConfig): Promise<GatewayResult> {
  const hermesPath = join(process.cwd(), 'vendor/hermes-agent-livekit');

  if (!existsSync(hermesPath)) {
    throw new Error('Hermes LiveKit vendor directory not found. Run materialize-livekit-worktree.sh first.');
  }

  // Set environment variables for LiveKit
  const env = {
    ...process.env,
    LIVEKIT_API_KEY: config.apiKey,
    LIVEKIT_API_SECRET: config.apiSecret,
    LIVEKIT_URL: config.liveKitUrl,
    LIVEKIT_ROOM: config.roomId,
  };

  // Start the Hermes gateway from the vendored PR tree
  // The gateway is expected to be at vendor/hermes-agent-livekit/gateway/run.py
  const gatewayProcess = spawn('python3', ['gateway/run.py'], {
    cwd: hermesPath,
    env,
    stdio: 'pipe',
  });

  let started = false;
  let participantJoined = false;
  let speechTranscription = false;
  let hermesResponse = false;
  let ttsPlayback = false;

  // Monitor stdout for gateway lifecycle events
  gatewayProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('[Hermes Gateway]', output);

    // Parse output for key events
    if (output.includes('Connected to LiveKit')) {
      started = true;
    }
    if (output.includes('Participant joined')) {
      participantJoined = true;
    }
    if (output.includes('Speech transcribed')) {
      speechTranscription = true;
    }
    if (output.includes('Hermes response')) {
      hermesResponse = true;
    }
    if (output.includes('TTS playback')) {
      ttsPlayback = true;
    }
  });

  gatewayProcess.stderr.on('data', (data) => {
    console.error('[Hermes Gateway Error]', data.toString());
  });

  // Wait a reasonable time for the gateway to start and connect
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Cleanup: kill the gateway process
  gatewayProcess.kill();

  return {
    started,
    participantJoined,
    speechTranscription,
    hermesResponse,
    ttsPlayback,
  };
}
