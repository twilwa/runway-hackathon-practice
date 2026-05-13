import { describe, expect, it } from "vitest";
import {
  processHermesToAvatarSpeech,
  type SpeechResult,
} from "../scripts/hermes-avatar-speech";

describe("processHermesToAvatarSpeech", () => {
  it("accepts evidence that Hermes audio drove the Runway avatar in LiveKit", async () => {
    const result = await processHermesToAvatarSpeech({
      hermesText: "Hello, how can I help you today?",
      method: "livekit-agent-audio",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
      liveKitRoomName: "hermes-test-room",
      runwaySessionId: "session_123",
      avatarParticipantIdentity: "runway-avatar",
      hermesParticipantIdentity: "hermes-hermes",
      evidence: {
        hermesAudioTrack: true,
        avatarVideoTrack: true,
        avatarAudioTrack: true,
        captionDelivered: true,
      },
    });
    expect(result.success).toBe(true);
    expect(result.caption).toBe("Hello, how can I help you today?");
    expect(result.handoffMethod).toBe("livekit-agent-audio");
    expect(result.roomName).toBe("hermes-test-room");
  });

  it("handles tool calls in the same turn", async () => {
    const result = await processHermesToAvatarSpeech({
      hermesText: "Let me check that for you.",
      method: "livekit-agent-audio",
      avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
      toolCalls: [{ name: "search", result: "Found 3 results" }],
      liveKitRoomName: "hermes-test-room",
      runwaySessionId: "session_123",
      avatarParticipantIdentity: "runway-avatar",
      hermesParticipantIdentity: "hermes-hermes",
      evidence: {
        hermesAudioTrack: true,
        avatarVideoTrack: true,
        avatarAudioTrack: true,
        captionDelivered: true,
      },
    });
    expect(result.success).toBe(true);
    expect(result.toolCallsProcessed).toBe(1);
  });

  it("returns error when avatarId is missing", async () => {
    await expect(
      processHermesToAvatarSpeech({
        hermesText: "Hello",
        method: "livekit-agent-audio",
        avatarId: "",
        liveKitRoomName: "hermes-test-room",
        runwaySessionId: "session_123",
        avatarParticipantIdentity: "runway-avatar",
        hermesParticipantIdentity: "hermes-hermes",
      }),
    ).rejects.toThrow("avatarId is required");
  });

  it("rejects incomplete LiveKit handoff evidence", async () => {
    await expect(
      processHermesToAvatarSpeech({
        hermesText: "Hello",
        method: "livekit-agent-audio",
        avatarId: "6824a3e0-f37f-455a-b1d4-3140111a83bf",
        liveKitRoomName: "hermes-test-room",
        runwaySessionId: "session_123",
        avatarParticipantIdentity: "runway-avatar",
        hermesParticipantIdentity: "hermes-hermes",
        evidence: {
          hermesAudioTrack: true,
          avatarVideoTrack: false,
          avatarAudioTrack: true,
          captionDelivered: true,
        },
      }),
    ).rejects.toThrow("avatar video track is required");
  });
});
