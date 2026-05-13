import { describe, expect, it } from "vitest";
import {
  startSession,
  stopSession,
  getSessionStatus,
  type ManagedProcess,
} from "../scripts/session-orchestration";

function fakeProcess(pid: number): ManagedProcess {
  return {
    pid,
    kill: () => undefined,
    exit: Promise.resolve({ code: 0, signal: null }),
  };
}

describe("startSession", () => {
  it("creates a new session with LiveKit room", async () => {
    const result = await startSession({
      roomName: "test-session",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
    });
    expect(result.sessionId).toBeDefined();
    expect(result.roomName).toBe("test-session");
    expect(result.webStageUrl).toContain("/livekit-room");
  });

  it("starts real demo processes when process supervision is requested", async () => {
    const commands: Array<{
      command: string;
      args: string[];
      env: NodeJS.ProcessEnv;
    }> = [];
    const result = await startSession({
      roomName: "test-session",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
      startProcesses: true,
      runwayStartDelayMs: 0,
      publishAudio: true,
      requireTurn: true,
      audioDelaySeconds: 30,
      utterance: "Hermes, run a tool.",
      processRunner: (command, args, options) => {
        commands.push({ command, args, env: options.env });
        return fakeProcess(1000 + commands.length);
      },
    });

    const status = await getSessionStatus(result.sessionId);
    expect(status.state).toBe("running");
    expect(status.processes.map((p) => p.name)).toEqual([
      "hermes-livekit",
      "runway-avatar",
    ]);
    expect(commands[0]).toMatchObject({
      command: "bash",
      args: ["scripts/m1-hermes-livekit-smoke.sh"],
    });
    expect(commands[1]).toMatchObject({
      command: "bash",
      args: ["scripts/start-runway-avatar-worker.sh"],
    });
    expect(commands[0].env).toMatchObject({
      M1_SMOKE_PUBLISH_AUDIO: "true",
      M1_SMOKE_REQUIRE_TURN: "true",
      M1_SMOKE_AUDIO_DELAY_SECS: "30",
      M1_SMOKE_UTTERANCE: "Hermes, run a tool.",
    });
    await stopSession(result.sessionId);
  });

  it("throws error when roomName is missing", async () => {
    await expect(
      startSession({
        roomName: "",
        avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
      }),
    ).rejects.toThrow("roomName is required");
  });
});

describe("getSessionStatus", () => {
  it("returns status for an active session", async () => {
    const session = await startSession({
      roomName: "test-session",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
    });

    const status = await getSessionStatus(session.sessionId);
    expect(status).toBeDefined();
    expect(status.state).toBe("running");
  });

  it("returns error for non-existent session", async () => {
    await expect(getSessionStatus("non-existent")).rejects.toThrow(
      "Session not found",
    );
  });
});

describe("stopSession", () => {
  it("stops an active session and cleans up", async () => {
    const session = await startSession({
      roomName: "test-session",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
    });

    const result = await stopSession(session.sessionId);
    expect(result.success).toBe(true);
    expect(result.cleanedUp).toBe(true);
  });

  it("stops supervised processes before deleting the session", async () => {
    const killed: number[] = [];
    let nextPid = 2000;
    const session = await startSession({
      roomName: "test-session",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
      startProcesses: true,
      runwayStartDelayMs: 0,
      processRunner: (_command, _args) => {
        const pid = nextPid;
        nextPid += 1;
        return {
          pid,
          kill: () => {
            killed.push(pid);
          },
          exit: Promise.resolve({ code: 0, signal: "SIGTERM" }),
        };
      },
    });

    const result = await stopSession(session.sessionId);
    expect(result.success).toBe(true);
    expect(killed).toEqual([2000, 2001]);
  });

  it("handles stopping already stopped session gracefully", async () => {
    const session = await startSession({
      roomName: "test-session",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
    });

    await stopSession(session.sessionId);
    const result = await stopSession(session.sessionId);
    expect(result.success).toBe(true); // Should be idempotent
  });
});
