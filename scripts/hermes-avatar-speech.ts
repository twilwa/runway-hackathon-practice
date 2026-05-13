// ABOUTME: Validates the evidence for a Hermes response driving Runway avatar speech.
// ABOUTME: Turns LiveKit handoff observations into caption metadata for the web stage.
export type SpeechProcessOptions = {
  hermesText: string;
  method: "livekit-agent-audio" | "tts-mirroring" | "direct-text";
  avatarId: string;
  liveKitRoomName?: string;
  runwaySessionId?: string;
  avatarParticipantIdentity?: string;
  hermesParticipantIdentity?: string;
  evidence?: {
    hermesAudioTrack?: boolean;
    avatarVideoTrack?: boolean;
    avatarAudioTrack?: boolean;
    captionDelivered?: boolean;
  };
  toolCalls?: Array<{ name: string; result: unknown }>;
};

export type SpeechResult = {
  success: boolean;
  caption: string;
  handoffMethod: SpeechProcessOptions["method"];
  roomName?: string;
  runwaySessionId?: string;
  avatarParticipantIdentity?: string;
  hermesParticipantIdentity?: string;
  toolCallsProcessed?: number;
  error?: string;
};

function requireEvidence(value: unknown, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

export async function processHermesToAvatarSpeech(
  options: SpeechProcessOptions,
): Promise<SpeechResult> {
  const {
    hermesText,
    method,
    avatarId,
    liveKitRoomName,
    runwaySessionId,
    avatarParticipantIdentity,
    hermesParticipantIdentity,
    evidence,
    toolCalls = [],
  } = options;

  if (!avatarId) {
    throw new Error("avatarId is required");
  }

  if (!hermesText) {
    throw new Error("hermesText is required");
  }

  if (method === "livekit-agent-audio") {
    requireEvidence(liveKitRoomName, "liveKitRoomName is required");
    requireEvidence(runwaySessionId, "runwaySessionId is required");
    requireEvidence(
      avatarParticipantIdentity,
      "avatarParticipantIdentity is required",
    );
    requireEvidence(
      hermesParticipantIdentity,
      "hermesParticipantIdentity is required",
    );
    requireEvidence(
      evidence?.hermesAudioTrack,
      "Hermes audio track is required",
    );
    requireEvidence(
      evidence?.avatarVideoTrack,
      "avatar video track is required",
    );
    requireEvidence(
      evidence?.avatarAudioTrack,
      "avatar audio track is required",
    );
    requireEvidence(
      evidence?.captionDelivered,
      "caption delivery evidence is required",
    );
  }

  console.log(`[Avatar Speech] Processing with method: ${method}`);
  console.log(`[Avatar Speech] Avatar ID: ${avatarId}`);
  console.log(`[Avatar Speech] Text: ${hermesText}`);
  console.log(`[Avatar Speech] Tool calls: ${toolCalls.length}`);

  // Mock implementation for tracer bullet
  return {
    success: true,
    caption: hermesText,
    handoffMethod: method,
    roomName: liveKitRoomName,
    runwaySessionId,
    avatarParticipantIdentity,
    hermesParticipantIdentity,
    toolCallsProcessed: toolCalls.length,
  };
}
