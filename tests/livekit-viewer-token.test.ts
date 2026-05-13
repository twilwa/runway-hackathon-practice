import { describe, expect, it } from "vitest";
import { createLiveKitViewerToken } from "../src/livekit/token";

const testKey = "devkey";
const testSecret = "secretMustBeAtLeast32CharactersLong!!";

function assertJwtShape(token: string) {
  const parts = token.split(".");
  expect(parts.length).toBeGreaterThanOrEqual(3);
  expect(token.startsWith("mock_jwt_token_")).toBe(false);
}

describe("createLiveKitViewerToken", () => {
  it("creates a signed viewer token with room URL metadata and no secrets in the result object", async () => {
    const result = await createLiveKitViewerToken({
      roomName: "test-room",
      apiKey: testKey,
      apiSecret: testSecret,
      participantName: "alice",
      livekitUrl: "wss://livekit.example.com",
      nextPublicLivekitUrl: "wss://public.example.com",
    });

    expect(result.roomName).toBe("test-room");
    expect(result.url).toBe("wss://public.example.com");
    expect(result.participantIdentity).toMatch(/^viewer-[0-9a-f-]{36}$/i);
    assertJwtShape(result.token);

    const keys = Object.keys(result).sort().join(",");
    expect(keys).toBe("participantIdentity,roomName,token,url");
    expect(JSON.stringify(result)).not.toContain(testSecret);
  });

  it("derives wss URL from https LIVEKIT_URL when public URL is absent", async () => {
    const result = await createLiveKitViewerToken({
      roomName: "r1",
      apiKey: testKey,
      apiSecret: testSecret,
      livekitUrl: "https://x.livekit.cloud/path",
      nextPublicLivekitUrl: null,
    });
    expect(result.url).toBe("wss://x.livekit.cloud/path");
    assertJwtShape(result.token);
  });

  it("throws error when API key is missing", async () => {
    await expect(
      createLiveKitViewerToken({
        roomName: "test-room",
        apiKey: "",
        apiSecret: testSecret,
        livekitUrl: "wss://x",
      }),
    ).rejects.toThrow("LIVEKIT_API_KEY is required");
  });

  it("throws error when API secret is missing", async () => {
    await expect(
      createLiveKitViewerToken({
        roomName: "test-room",
        apiKey: testKey,
        apiSecret: "",
        livekitUrl: "wss://x",
      }),
    ).rejects.toThrow("LIVEKIT_API_SECRET is required");
  });

  it("throws error when room name is missing", async () => {
    await expect(
      createLiveKitViewerToken({
        roomName: "",
        apiKey: testKey,
        apiSecret: testSecret,
        livekitUrl: "wss://x",
      }),
    ).rejects.toThrow("roomName is required");
  });

  it("throws when neither LiveKit URL variant is configured", async () => {
    await expect(
      createLiveKitViewerToken({
        roomName: "test-room",
        apiKey: testKey,
        apiSecret: testSecret,
        livekitUrl: "",
        nextPublicLivekitUrl: "",
      }),
    ).rejects.toThrow(
      "LIVEKIT_URL or NEXT_PUBLIC_LIVEKIT_URL must be configured",
    );
  });
});
