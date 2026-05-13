import { describe, expect, it } from "vitest";
import {
  validateWorkerEnv,
  runAvatarWorkerFromEnv,
  startAvatarWorker,
} from "../scripts/runway-avatar-worker";

describe("validateWorkerEnv", () => {
  it("validates required environment variables", () => {
    const result = validateWorkerEnv({
      RUNWAYML_API_SECRET: "test-secret",
      LIVEKIT_API_KEY: "test-key",
      LIVEKIT_API_SECRET: "test-lk-secret",
      LIVEKIT_URL: "wss://test.livekit.cloud",
      LIVEKIT_ROOM: "test-room",
    });
    expect(result.valid).toBe(true);
  });

  it("fails when RUNWAYML_API_SECRET is missing", () => {
    const result = validateWorkerEnv({
      RUNWAYML_API_SECRET: "",
      LIVEKIT_API_KEY: "test-key",
      LIVEKIT_API_SECRET: "test-lk-secret",
      LIVEKIT_URL: "wss://test.livekit.cloud",
      LIVEKIT_ROOM: "test-room",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("RUNWAYML_API_SECRET is required");
  });

  it("fails when LiveKit variables are missing", () => {
    const result = validateWorkerEnv({
      RUNWAYML_API_SECRET: "test-secret",
      LIVEKIT_API_KEY: "",
      LIVEKIT_API_SECRET: "",
      LIVEKIT_URL: "",
      LIVEKIT_ROOM: "",
    });
    expect(result.valid).toBe(false);
  });
});

describe("startAvatarWorker", () => {
  it("starts and stops a real Runway LiveKit avatar session through the API boundary", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchLike = async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ id: "session_livekit_123" }), {
          headers: { "content-type": "application/json" },
        });
      }
      if (init?.method === "DELETE") {
        return new Response("", { status: 204 });
      }
      throw new Error(`Unexpected request: ${init?.method} ${url}`);
    };

    const result = await startAvatarWorker({
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
      roomName: "test-room",
      maxDurationSeconds: 300,
      runwayApiSecret: "runway-secret",
      liveKitApiKey: "livekit-key",
      liveKitApiSecret: "livekit-secret",
      liveKitUrl: "wss://test.livekit.cloud",
      agentIdentity: "hermes-hermes",
      manageLifecycle: false,
      fetchLike,
    });

    expect(result.started).toBe(true);
    expect(result.sessionId).toBe("session_livekit_123");
    expect(result.avatarParticipantIdentity).toBe("runway-avatar");

    await result.stop();
    expect(calls.map((call) => call.init?.method)).toEqual(["POST", "DELETE"]);
  });

  it("throws error when avatarId is missing", async () => {
    await expect(
      startAvatarWorker({
        avatarId: "",
        roomName: "test-room",
        maxDurationSeconds: 300,
        runwayApiSecret: "runway-secret",
        liveKitApiKey: "livekit-key",
        liveKitApiSecret: "livekit-secret",
        liveKitUrl: "wss://test.livekit.cloud",
        manageLifecycle: false,
      }),
    ).rejects.toThrow("RUNWAY_AVATAR_ID or RUNWAY_PRESET_ID is required");
  });
});

describe("runAvatarWorkerFromEnv", () => {
  it("does not combine the default avatar ID with an explicit preset ID", async () => {
    const calls: Array<{ init?: RequestInit }> = [];
    const fetchLike = async (_url: string | URL, init?: RequestInit) => {
      calls.push({ init });
      if (init?.method === "POST") {
        return new Response(JSON.stringify({ id: "session_preset_env" }), {
          headers: { "content-type": "application/json" },
        });
      }
      return new Response("", { status: 204 });
    };

    const result = await runAvatarWorkerFromEnv(
      {
        RUNWAYML_API_SECRET: "runway-secret",
        LIVEKIT_API_KEY: "livekit-key",
        LIVEKIT_API_SECRET: "livekit-secret",
        LIVEKIT_URL: "wss://test.livekit.cloud",
        LIVEKIT_ROOM: "test-room",
        RUNWAY_PRESET_ID: "cat-character",
      },
      fetchLike,
    );

    const body = JSON.parse(String(calls[0].init?.body)) as { avatar: unknown };
    expect(body.avatar).toEqual({
      type: "runway-preset",
      presetId: "cat-character",
    });
    await result.stop();
  });
});
