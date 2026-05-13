// ABOUTME: Starts a Runway avatar participant in an existing LiveKit room.
// ABOUTME: Validates operator config and provides cleanup for Runway realtime sessions.
import {
  createRunwayLiveKitAvatarSession,
  stopRunwayRealtimeSession,
  type FetchLike,
} from "../src/runway/session";

export type WorkerEnv = {
  RUNWAYML_API_SECRET?: string;
  LIVEKIT_API_KEY?: string;
  LIVEKIT_API_SECRET?: string;
  LIVEKIT_URL?: string;
  LIVEKIT_ROOM?: string;
  RUNWAY_AVATAR_ID?: string;
  RUNWAY_PRESET_ID?: string;
  MAX_DURATION_SECONDS?: string;
  RUNWAY_AGENT_IDENTITY?: string;
  RUNWAY_AVATAR_PARTICIPANT_IDENTITY?: string;
  RUNWAY_AVATAR_PARTICIPANT_NAME?: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateWorkerEnv(env: WorkerEnv): ValidationResult {
  const errors: string[] = [];

  if (!env.RUNWAYML_API_SECRET) {
    errors.push("RUNWAYML_API_SECRET is required");
  }

  if (!env.LIVEKIT_API_KEY) {
    errors.push("LIVEKIT_API_KEY is required");
  }

  if (!env.LIVEKIT_API_SECRET) {
    errors.push("LIVEKIT_API_SECRET is required");
  }

  if (!env.LIVEKIT_URL) {
    errors.push("LIVEKIT_URL is required");
  }

  if (!env.LIVEKIT_ROOM) {
    errors.push("LIVEKIT_ROOM is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export type WorkerConfig = {
  avatarId?: string;
  presetId?: string;
  roomName: string;
  maxDurationSeconds: number;
  runwayApiSecret: string;
  liveKitApiKey: string;
  liveKitApiSecret: string;
  liveKitUrl: string;
  agentIdentity?: string;
  avatarParticipantIdentity?: string;
  avatarParticipantName?: string;
  manageLifecycle?: boolean;
  fetchLike?: FetchLike;
};

export type WorkerResult = {
  started: boolean;
  sessionId: string;
  roomName: string;
  avatarParticipantIdentity: string;
  stop: () => Promise<void>;
  error?: string;
};

export async function startAvatarWorker(
  config: WorkerConfig,
): Promise<WorkerResult> {
  const {
    avatarId,
    presetId,
    roomName,
    maxDurationSeconds,
    runwayApiSecret,
    liveKitApiKey,
    liveKitApiSecret,
    liveKitUrl,
    agentIdentity = "hermes-hermes",
    avatarParticipantIdentity = "runway-avatar",
    avatarParticipantName = "Runway Avatar",
    manageLifecycle = true,
    fetchLike,
  } = config;

  if (!roomName) {
    throw new Error("roomName is required");
  }

  const configuredAvatar = avatarId
    ? `avatar ${avatarId}`
    : `preset ${presetId}`;
  console.log(
    `[Avatar Worker] Starting with ${configuredAvatar} in room ${roomName}`,
  );
  console.log(`[Avatar Worker] Max duration: ${maxDurationSeconds}s`);

  const session = await createRunwayLiveKitAvatarSession({
    avatarId,
    presetId,
    apiSecret: runwayApiSecret,
    liveKitApiKey,
    liveKitApiSecret,
    liveKitUrl,
    roomName,
    agentIdentity,
    avatarParticipantIdentity,
    avatarParticipantName,
    maxDurationSeconds,
    fetchLike,
  });

  let stopped = false;
  let ttlTimeout: ReturnType<typeof setTimeout> | undefined;
  const stop = async () => {
    if (stopped) {
      return;
    }
    stopped = true;
    if (ttlTimeout) {
      clearTimeout(ttlTimeout);
    }
    await stopRunwayRealtimeSession({
      sessionId: session.sessionId,
      apiSecret: runwayApiSecret,
      fetchLike,
    });
  };

  if (manageLifecycle) {
    const stopAndExit = (signal: string) => {
      console.log(
        `[Avatar Worker] Received ${signal}, shutting down gracefully...`,
      );
      void stop().finally(() => process.exit(0));
    };
    process.once("SIGINT", () => stopAndExit("SIGINT"));
    process.once("SIGTERM", () => stopAndExit("SIGTERM"));
    ttlTimeout = setTimeout(() => {
      console.log(
        `[Avatar Worker] Max duration ${maxDurationSeconds}s reached, shutting down...`,
      );
      void stop().finally(() => process.exit(0));
    }, maxDurationSeconds * 1000);
  }

  return {
    started: true,
    sessionId: session.sessionId,
    roomName: session.roomName,
    avatarParticipantIdentity: session.avatarParticipantIdentity,
    stop,
  };
}

export async function runAvatarWorkerFromEnv(
  env: WorkerEnv = process.env as WorkerEnv,
  fetchLike?: FetchLike,
): Promise<WorkerResult> {
  const avatarId =
    env.RUNWAY_AVATAR_ID ||
    (env.RUNWAY_PRESET_ID ? undefined : "6824a3e0-f37f-455a-b1d4-3140111a83bf");
  const maxDurationSeconds = Number.parseInt(
    env.MAX_DURATION_SECONDS || "300",
    10,
  );
  return startAvatarWorker({
    avatarId,
    presetId: env.RUNWAY_PRESET_ID,
    roomName: env.LIVEKIT_ROOM || "",
    maxDurationSeconds,
    runwayApiSecret: env.RUNWAYML_API_SECRET || "",
    liveKitApiKey: env.LIVEKIT_API_KEY || "",
    liveKitApiSecret: env.LIVEKIT_API_SECRET || "",
    liveKitUrl: env.LIVEKIT_URL || "",
    agentIdentity: env.RUNWAY_AGENT_IDENTITY || "hermes-hermes",
    avatarParticipantIdentity:
      env.RUNWAY_AVATAR_PARTICIPANT_IDENTITY || "runway-avatar",
    avatarParticipantName:
      env.RUNWAY_AVATAR_PARTICIPANT_NAME || "Runway Avatar",
    fetchLike,
  });
}

if (import.meta.main) {
  runAvatarWorkerFromEnv()
    .then((result) => {
      console.log(
        `[Avatar Worker] Runway session started: ${result.sessionId}`,
      );
      console.log("[Avatar Worker] Press Ctrl+C to stop the avatar session.");
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Avatar Worker] Failed to start: ${message}`);
      process.exit(1);
    });
}
