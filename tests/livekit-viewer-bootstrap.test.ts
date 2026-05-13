import { describe, expect, it } from "vitest";
import { parseViewerBootstrapResponse } from "../src/livekit/viewer-bootstrap";

describe("parseViewerBootstrapResponse", () => {
  it("accepts a well-formed viewer-token JSON body", () => {
    const body = {
      token: "a.b.c",
      roomName: "hermes-test-room",
      url: "wss://example.livekit.cloud",
      participantIdentity: "viewer-550e8400-e29b-41d4-a716-446655440000",
    };
    expect(parseViewerBootstrapResponse(body)).toEqual(body);
  });

  it("rejects non-objects", () => {
    expect(() => parseViewerBootstrapResponse(null)).toThrow(
      "Invalid viewer bootstrap payload",
    );
  });

  it("rejects mock-looking tokens", () => {
    expect(() =>
      parseViewerBootstrapResponse({
        token: "mock_jwt_token_123",
        roomName: "r",
        url: "wss://x",
        participantIdentity: "viewer-x",
      }),
    ).toThrow("Invalid LiveKit viewer token");
  });

  it("rejects missing required string fields", () => {
    expect(() =>
      parseViewerBootstrapResponse({
        token: "a.b.c",
        roomName: "",
        url: "wss://x",
        participantIdentity: "viewer-x",
      }),
    ).toThrow("roomName");
  });
});
