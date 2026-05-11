import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

export interface SmokeCheckResult {
  pythonAvailable: boolean;
  ffmpegAvailable: boolean;
  liveKitEnvValid: boolean;
  hermesImportsValid: boolean;
  pass: boolean;
}

export async function checkHermesLiveKitSmoke(): Promise<SmokeCheckResult> {
  const pythonAvailable = checkPython();
  const ffmpegAvailable = checkFfmpeg();
  const liveKitEnvValid = checkLiveKitEnv();
  const hermesImportsValid = checkHermesImports();

  const pass = pythonAvailable && ffmpegAvailable && liveKitEnvValid && hermesImportsValid;

  return {
    pythonAvailable,
    ffmpegAvailable,
    liveKitEnvValid,
    hermesImportsValid,
    pass,
  };
}

function checkPython(): boolean {
  try {
    execSync('python3 --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkFfmpeg(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function checkLiveKitEnv(): boolean {
  // Check for required LiveKit environment variables
  const requiredVars = ['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'LIVEKIT_URL'];
  return requiredVars.every(envVar => process.env[envVar] !== undefined);
}

function checkHermesImports(): boolean {
  try {
    // Check if the Hermes LiveKit vendor directory exists
    const hermesPath = join(process.cwd(), 'vendor/hermes-agent-livekit');
    return existsSync(hermesPath);
  } catch {
    return false;
  }
}
