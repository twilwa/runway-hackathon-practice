// ABOUTME: Supervises local Hermes, Runway, and web-stage demo sessions.
// ABOUTME: Exposes start/status/stop primitives used by API routes and smoke tests.
import { spawn } from "node:child_process";

export type SessionConfig = {
  roomName: string;
  avatarId: string;
  startProcesses?: boolean;
  maxDurationSeconds?: number;
  runwayStartDelayMs?: number;
  publishAudio?: boolean;
  requireTurn?: boolean;
  audioDelaySeconds?: number;
  utterance?: string;
  hermesHome?: string;
  processRunner?: ProcessRunner;
};

export type ManagedProcess = {
  pid?: number;
  kill: (signal?: NodeJS.Signals) => void;
  exit: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
};

export type ProcessRunner = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
) => ManagedProcess;

export type SessionResult = {
  sessionId: string;
  roomName: string;
  webStageUrl: string;
  createdAt: number;
};

export type SessionState = {
  sessionId: string;
  state: "idle" | "starting" | "running" | "stopping" | "stopped";
  roomName: string;
  avatarId: string;
  webStageUrl: string;
  processes: Array<{
    name: "hermes-livekit" | "runway-avatar";
    pid?: number;
    state: "running" | "stopped";
  }>;
  createdAt: number;
  updatedAt: number;
};

export type StopResult = {
  success: boolean;
  cleanedUp: boolean;
  error?: string;
};

// In-memory session store (for tracer bullet)
const sessions = new Map<string, SessionState>();
const processHandles = new Map<string, ManagedProcess[]>();

function defaultProcessRunner(
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
): ManagedProcess {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: "ignore",
    detached: false,
  });
  return {
    pid: child.pid,
    kill: (signal = "SIGTERM") => {
      child.kill(signal);
    },
    exit: new Promise((resolve) => {
      child.once("exit", (code, signal) => resolve({ code, signal }));
    }),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function startSession(
  config: SessionConfig,
): Promise<SessionResult> {
  const {
    roomName,
    avatarId,
    startProcesses = false,
    maxDurationSeconds = 180,
    runwayStartDelayMs = 8_000,
    publishAudio = false,
    requireTurn = false,
    audioDelaySeconds,
    utterance,
    hermesHome,
    processRunner = defaultProcessRunner,
  } = config;

  if (!roomName) {
    throw new Error("roomName is required");
  }

  if (!avatarId) {
    throw new Error("avatarId is required");
  }

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = Date.now();

  const webStageUrl = `/livekit-room?roomName=${encodeURIComponent(roomName)}`;
  const sessionState: SessionState = {
    sessionId,
    state: "starting",
    roomName,
    avatarId,
    webStageUrl,
    processes: [],
    createdAt,
    updatedAt: createdAt,
  };

  sessions.set(sessionId, sessionState);

  console.log(`[Session Orchestration] Starting session ${sessionId}`);
  console.log(`[Session Orchestration] Room: ${roomName}`);
  console.log(`[Session Orchestration] Avatar: ${avatarId}`);

  if (startProcesses) {
    const cwd = process.cwd();
    const hermes = processRunner(
      "bash",
      ["scripts/m1-hermes-livekit-smoke.sh"],
      {
        cwd,
        env: {
          ...process.env,
          LIVEKIT_ROOM: roomName,
          M1_SMOKE_RUN_SECS: String(maxDurationSeconds),
          M1_SMOKE_PUBLISH_AUDIO: String(publishAudio),
          M1_SMOKE_REQUIRE_TURN: String(requireTurn),
          ...(audioDelaySeconds === undefined
            ? {}
            : { M1_SMOKE_AUDIO_DELAY_SECS: String(audioDelaySeconds) }),
          ...(utterance ? { M1_SMOKE_UTTERANCE: utterance } : {}),
          ...(hermesHome ? { M1_SMOKE_HERMES_HOME: hermesHome } : {}),
        },
      },
    );
    processHandles.set(sessionId, [hermes]);
    sessionState.processes.push({
      name: "hermes-livekit",
      pid: hermes.pid,
      state: "running",
    });

    await sleep(runwayStartDelayMs);
    const runway = processRunner(
      "bash",
      ["scripts/start-runway-avatar-worker.sh"],
      {
        cwd,
        env: {
          ...process.env,
          LIVEKIT_ROOM: roomName,
          RUNWAY_AVATAR_ID: avatarId,
          MAX_DURATION_SECONDS: String(maxDurationSeconds),
        },
      },
    );
    processHandles.get(sessionId)?.push(runway);
    sessionState.processes.push({
      name: "runway-avatar",
      pid: runway.pid,
      state: "running",
    });
  }

  sessionState.state = "running";
  sessionState.updatedAt = Date.now();

  return {
    sessionId,
    roomName,
    webStageUrl,
    createdAt,
  };
}

export async function getSessionStatus(
  sessionId: string,
): Promise<SessionState> {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

export async function stopSession(sessionId: string): Promise<StopResult> {
  const session = sessions.get(sessionId);

  if (!session) {
    // Idempotent: stopping an unknown or already-removed session is a no-op success.
    return {
      success: true,
      cleanedUp: true,
    };
  }

  console.log(`[Session Orchestration] Stopping session ${sessionId}`);

  session.state = "stopping";
  session.updatedAt = Date.now();
  const handles = processHandles.get(sessionId) ?? [];
  for (const handle of handles) {
    handle.kill("SIGTERM");
  }
  await Promise.allSettled(handles.map((handle) => handle.exit));
  session.processes = session.processes.map((p) => ({
    ...p,
    state: "stopped",
  }));
  session.state = "stopped";
  session.updatedAt = Date.now();

  processHandles.delete(sessionId);
  sessions.delete(sessionId);

  return {
    success: true,
    cleanedUp: true,
  };
}
