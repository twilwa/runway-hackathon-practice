import { describe, expect, it } from "vitest";
import {
  createRunwayLiveKitAvatarSession,
  createRunwaySessionCredentials,
  stopRunwayRealtimeSession,
  type FetchLike,
} from "../src/runway/session";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("createRunwaySessionCredentials", () => {
  it("creates, polls, consumes, and normalizes realtime credentials without leaking api secrets", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchLike: FetchLike = async (url, init) => {
      calls.push({ url: String(url), init });
      if (
        String(url).endsWith("/v1/realtime_sessions") &&
        init?.method === "POST"
      ) {
        return jsonResponse({ id: "session_123" });
      }
      if (
        String(url).endsWith("/v1/realtime_sessions/session_123") &&
        init?.method === "GET"
      ) {
        return jsonResponse({ status: "READY", sessionKey: "session_key_abc" });
      }
      if (
        String(url).endsWith("/v1/realtime_sessions/session_123/consume") &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          url: "wss://runway.example/session",
          token: "rtc_token",
          roomName: "room_1",
        });
      }
      throw new Error(`Unexpected request: ${init?.method} ${url}`);
    };

    const result = await createRunwaySessionCredentials({
      avatarId: "avatar_123",
      apiSecret: "key_should_not_escape",
      baseUrl: "https://api.dev.runwayml.com",
      fetchLike,
      pollIntervalMs: 0,
      maxPolls: 2,
    });

    expect(result).toEqual({
      sessionId: "session_123",
      serverUrl: "wss://runway.example/session",
      url: "wss://runway.example/session",
      token: "rtc_token",
      roomName: "room_1",
    });
    expect(JSON.stringify(result)).not.toContain("key_should_not_escape");
    expect(calls[0].init?.body).toBe(
      JSON.stringify({
        model: "gwm1_avatars",
        avatar: { type: "custom", avatarId: "avatar_123" },
      }),
    );
    expect(calls[0].init?.headers).toMatchObject({
      Authorization: "Bearer key_should_not_escape",
      "X-Runway-Version": "2024-11-06",
      "Content-Type": "application/json",
    });
    expect(calls[2].init?.headers).toMatchObject({
      Authorization: "Bearer session_key_abc",
      "X-Runway-Version": "2024-11-06",
      "Content-Type": "application/json",
    });
    expect(calls[2].init?.body).toBe("{}");
  });

  it("throws a useful error when the session fails", async () => {
    const fetchLike: FetchLike = async (url, init) => {
      if (
        String(url).endsWith("/v1/realtime_sessions") &&
        init?.method === "POST"
      ) {
        return jsonResponse({ id: "session_failed" });
      }
      if (
        String(url).endsWith("/v1/realtime_sessions/session_failed") &&
        init?.method === "GET"
      ) {
        return jsonResponse({
          status: "FAILED",
          failure: { message: "no capacity" },
        });
      }
      throw new Error(`Unexpected request: ${init?.method} ${url}`);
    };

    await expect(
      createRunwaySessionCredentials({
        avatarId: "avatar_123",
        apiSecret: "key_secret",
        baseUrl: "https://api.dev.runwayml.com",
        fetchLike,
        pollIntervalMs: 0,
        maxPolls: 1,
      }),
    ).rejects.toThrow("Runway session failed: no capacity");
  });
});

describe("createRunwayLiveKitAvatarSession", () => {
  it("starts a Runway avatar session in an existing LiveKit room", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchLike: FetchLike = async (url, init) => {
      calls.push({ url: String(url), init });
      return jsonResponse({ id: "session_livekit_123" });
    };

    const result = await createRunwayLiveKitAvatarSession({
      avatarId: "avatar_123",
      apiSecret: "runway_secret",
      liveKitApiKey: "livekit_key",
      liveKitApiSecret: "livekit_secret",
      liveKitUrl: "wss://example.livekit.cloud",
      roomName: "avatar-room",
      agentIdentity: "hermes-agent",
      avatarParticipantIdentity: "runway-avatar",
      avatarParticipantName: "Runway Avatar",
      maxDurationSeconds: 120,
      baseUrl: "https://api.dev.runwayml.com",
      fetchLike,
    });

    expect(result).toEqual({
      sessionId: "session_livekit_123",
      roomName: "avatar-room",
      avatarParticipantIdentity: "runway-avatar",
      avatarParticipantName: "Runway Avatar",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      "https://api.dev.runwayml.com/v1/realtime_sessions",
    );
    expect(calls[0].init?.headers).toMatchObject({
      Authorization: "Bearer runway_secret",
      "X-Runway-Version": "2024-11-06",
      "Content-Type": "application/json",
    });

    const body = JSON.parse(String(calls[0].init?.body)) as {
      model: string;
      avatar: { type: string; avatarId: string };
      livekit: {
        url: string;
        token: string;
        roomName: string;
        agentIdentity: string;
      };
      maxDuration: number;
    };
    expect(body.model).toBe("gwm1_avatars");
    expect(body.avatar).toEqual({ type: "custom", avatarId: "avatar_123" });
    expect(body.livekit.url).toBe("wss://example.livekit.cloud");
    expect(body.livekit.roomName).toBe("avatar-room");
    expect(body.livekit.agentIdentity).toBe("hermes-agent");
    expect(body.maxDuration).toBe(120);

    const tokenPayload = JSON.parse(
      Buffer.from(body.livekit.token.split(".")[1], "base64url").toString(
        "utf8",
      ),
    ) as {
      sub: string;
      name: string;
      kind: string;
      video: { roomJoin: boolean; room: string };
      attributes: Record<string, string>;
    };
    expect(tokenPayload.sub).toBe("runway-avatar");
    expect(tokenPayload.name).toBe("Runway Avatar");
    expect(tokenPayload.kind).toBe("agent");
    expect(tokenPayload.video).toMatchObject({
      roomJoin: true,
      room: "avatar-room",
    });
    expect(tokenPayload.attributes).toMatchObject({
      "lk.publish_on_behalf": "hermes-agent",
    });
  });

  it("uses preset avatars when presetId is configured", async () => {
    const fetchLike: FetchLike = async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { avatar: unknown };
      expect(body.avatar).toEqual({
        type: "runway-preset",
        presetId: "cat-character",
      });
      return jsonResponse({ id: "session_preset_123" });
    };

    await createRunwayLiveKitAvatarSession({
      presetId: "cat-character",
      apiSecret: "runway_secret",
      liveKitApiKey: "livekit_key",
      liveKitApiSecret: "livekit_secret",
      liveKitUrl: "wss://example.livekit.cloud",
      roomName: "avatar-room",
      agentIdentity: "hermes-agent",
      fetchLike,
    });
  });

  it("requires exactly one avatar identifier", async () => {
    await expect(
      createRunwayLiveKitAvatarSession({
        apiSecret: "runway_secret",
        liveKitApiKey: "livekit_key",
        liveKitApiSecret: "livekit_secret",
        liveKitUrl: "wss://example.livekit.cloud",
        roomName: "avatar-room",
        agentIdentity: "hermes-agent",
      }),
    ).rejects.toThrow("RUNWAY_AVATAR_ID or RUNWAY_PRESET_ID is required");

    await expect(
      createRunwayLiveKitAvatarSession({
        avatarId: "avatar_123",
        presetId: "cat-character",
        apiSecret: "runway_secret",
        liveKitApiKey: "livekit_key",
        liveKitApiSecret: "livekit_secret",
        liveKitUrl: "wss://example.livekit.cloud",
        roomName: "avatar-room",
        agentIdentity: "hermes-agent",
      }),
    ).rejects.toThrow("Use RUNWAY_AVATAR_ID or RUNWAY_PRESET_ID, not both");
  });
});

describe("stopRunwayRealtimeSession", () => {
  it("cancels a Runway realtime session without exposing secrets", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchLike: FetchLike = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response("", { status: 204 });
    };

    await stopRunwayRealtimeSession({
      sessionId: "session_livekit_123",
      apiSecret: "runway_secret",
      baseUrl: "https://api.dev.runwayml.com",
      fetchLike,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      "https://api.dev.runwayml.com/v1/realtime_sessions/session_livekit_123",
    );
    expect(calls[0].init?.method).toBe("DELETE");
    expect(calls[0].init?.headers).toMatchObject({
      Authorization: "Bearer runway_secret",
      "X-Runway-Version": "2024-11-06",
    });
  });
});
