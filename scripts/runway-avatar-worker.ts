export type WorkerEnv = {
  RUNWAYML_API_SECRET?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
  LIVEKIT_URL?: string;
  LIVEKIT_ROOM?: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateWorkerEnv(env: WorkerEnv): ValidationResult {
  const errors: string[] = [];

  if (!env.RUNWAYML_API_SECRET) {
    errors.push('RUNWAYML_API_SECRET is required');
  }

  if (!env.LIVEKIT_API_KEY) {
    errors.push('LIVEKIT_API_KEY is required');
  }

  if (!env.LIVEKIT_API_SECRET) {
    errors.push('LIVEKIT_API_SECRET is required');
  }

  if (!env.LIVEKIT_URL) {
    errors.push('LIVEKIT_URL is required');
  }

  if (!env.LIVEKIT_ROOM) {
    errors.push('LIVEKIT_ROOM is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export type WorkerConfig = {
  avatarId: string;
  roomName: string;
  maxDuration: number;
};

export type WorkerResult = {
  started: boolean;
  error?: string;
};

export async function startAvatarWorker(config: WorkerConfig): Promise<WorkerResult> {
  const { avatarId, roomName, maxDuration } = config;

  if (!avatarId) {
    throw new Error('avatarId is required');
  }

  if (!roomName) {
    throw new Error('roomName is required');
  }

  // TODO: Implement actual avatar worker startup
  // This would:
  // 1. Join the LiveKit room
  // 2. Start a Runway AvatarSession
  // 3. Publish avatar video to the room
  // 4. Handle cleanup and TTL

  console.log(`[Avatar Worker] Starting with avatar ${avatarId} in room ${roomName}`);
  console.log(`[Avatar Worker] Max duration: ${maxDuration}ms`);

  // Set up SIGINT/SIGTERM handlers for graceful shutdown
  process.on('SIGINT', () => {
    console.log('[Avatar Worker] Received SIGINT, shutting down gracefully...');
    // TODO: Implement cleanup
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('[Avatar Worker] Received SIGTERM, shutting down gracefully...');
    // TODO: Implement cleanup
    process.exit(0);
  });

  // Set up TTL timeout
  const ttlTimeout = setTimeout(() => {
    console.log(`[Avatar Worker] Max duration ${maxDuration}ms reached, shutting down...`);
    // TODO: Implement cleanup
    process.exit(0);
  }, maxDuration);

  // Mock implementation for tracer bullet
  return {
    started: true,
  };
}
