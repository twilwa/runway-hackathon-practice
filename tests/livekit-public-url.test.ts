import { describe, expect, it } from "vitest";
import { resolveLiveKitPublicUrl } from "../src/livekit/public-url";

describe("resolveLiveKitPublicUrl", () => {
  it("prefers NEXT_PUBLIC_LIVEKIT_URL over LIVEKIT_URL", () => {
    expect(
      resolveLiveKitPublicUrl({
        livekitUrl: "wss://server.example/ws",
        nextPublicLivekitUrl: "wss://public.example/",
      }),
    ).toBe("wss://public.example");
  });

  it("falls back to LIVEKIT_URL when public URL is unset", () => {
    expect(
      resolveLiveKitPublicUrl({
        livekitUrl: "wss://only.example/livekit",
        nextPublicLivekitUrl: "",
      }),
    ).toBe("wss://only.example/livekit");
  });

  it("maps https server URL to wss", () => {
    expect(
      resolveLiveKitPublicUrl({
        livekitUrl: "https://cloud.livekit.io/custom",
        nextPublicLivekitUrl: null,
      }),
    ).toBe("wss://cloud.livekit.io/custom");
  });

  it("maps http server URL to ws", () => {
    expect(
      resolveLiveKitPublicUrl({
        livekitUrl: "http://127.0.0.1:7880/",
        nextPublicLivekitUrl: null,
      }),
    ).toBe("ws://127.0.0.1:7880");
  });

  it("throws when neither URL is set", () => {
    expect(() =>
      resolveLiveKitPublicUrl({
        livekitUrl: "",
        nextPublicLivekitUrl: undefined,
      }),
    ).toThrow("LIVEKIT_URL or NEXT_PUBLIC_LIVEKIT_URL must be configured");
  });
});
