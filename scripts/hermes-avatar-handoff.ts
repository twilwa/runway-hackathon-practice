export type HandoffDecisionOptions = {
  runwaySupportsExternalAudio: boolean;
  hermesHasTTSArtifact: boolean;
};

export type HandoffMethod =
  | { type: 'text-to-avatar'; description: string }
  | { type: 'tts-mirroring'; description: string }
  | { type: 'direct-text'; description: string };

export type HandoffResult = {
  method: HandoffMethod;
  reason: string;
};

export async function decideHandoffMethod(
  options: HandoffDecisionOptions
): Promise<HandoffResult> {
  const { runwaySupportsExternalAudio, hermesHasTTSArtifact } = options;

  // Priority order:
  // 1. text-to-avatar: Best quality, Runway handles speech synthesis
  // 2. tts-mirroring: Reuse Hermes TTS if available
  // 3. direct-text: Fallback to text-only display

  if (runwaySupportsExternalAudio) {
    return {
      method: {
        type: 'text-to-avatar',
        description: 'Send final text to Runway avatar for speech synthesis',
      },
      reason: 'Runway supports external audio input - use text-to-avatar for best quality',
    };
  }

  if (hermesHasTTSArtifact) {
    return {
      method: {
        type: 'tts-mirroring',
        description: 'Mirror Hermes TTS audio to LiveKit room',
      },
      reason: 'Hermes has TTS artifact available - mirror audio to LiveKit',
    };
  }

  return {
    method: {
      type: 'direct-text',
      description: 'Display text captions without avatar speech',
    },
    reason: 'Neither external audio nor TTS artifact available - use text-only fallback',
  };
}
