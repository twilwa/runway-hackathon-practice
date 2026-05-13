import { randomUUID } from "node:crypto";
import { AccessToken } from "livekit-server-sdk";
import { resolveLiveKitPublicUrl } from "./public-url";

export type LiveKitViewerTokenOptions = {
  roomName: string;
  apiKey: string;
  apiSecret: string;
  participantName?: string;
  /** Server-side LiveKit URL (e.g. wss://….livekit.cloud) */
  livekitUrl?: string | null;
  /** Optional public override for browsers */
  nextPublicLivekitUrl?: string | null;
};

export type LiveKitViewerTokenResult = {
  token: string;
  roomName: string;
  url: string;
  participantIdentity: string;
};

export async function createLiveKitViewerToken(
  options: LiveKitViewerTokenOptions,
): Promise<LiveKitViewerTokenResult> {
  const {
    roomName,
    apiKey,
    apiSecret,
    participantName = "viewer",
    livekitUrl,
    nextPublicLivekitUrl,
  } = options;

  if (!apiKey) {
    throw new Error("LIVEKIT_API_KEY is required");
  }

  if (!apiSecret) {
    throw new Error("LIVEKIT_API_SECRET is required");
  }

  if (!roomName) {
    throw new Error("roomName is required");
  }

  const participantIdentity = `viewer-${randomUUID()}`;
  const displayName = participantName.trim() || "viewer";

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: displayName,
    ttl: "30m",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canSubscribe: true,
    canPublish: false,
    canPublishData: false,
  });

  const token = await at.toJwt();
  const url = resolveLiveKitPublicUrl({ livekitUrl, nextPublicLivekitUrl });

  return {
    token,
    roomName,
    url,
    participantIdentity,
  };
}
