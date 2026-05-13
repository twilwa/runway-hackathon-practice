export type ViewerBootstrap = {
  token: string;
  roomName: string;
  url: string;
  participantIdentity: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Validates JSON returned from `POST /api/livekit/viewer-token` before calling `Room.connect`.
 */
export function parseViewerBootstrapResponse(data: unknown): ViewerBootstrap {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid viewer bootstrap payload");
  }

  const o = data as Record<string, unknown>;
  const token = o.token;
  const roomName = o.roomName;
  const url = o.url;
  const participantIdentity = o.participantIdentity;

  if (!isNonEmptyString(token)) {
    throw new Error("Invalid viewer bootstrap payload: token");
  }
  if (token.startsWith("mock_jwt_token_")) {
    throw new Error("Invalid LiveKit viewer token");
  }
  const parts = token.split(".");
  if (parts.length < 3) {
    throw new Error("Invalid LiveKit viewer token");
  }

  if (!isNonEmptyString(roomName)) {
    throw new Error("Invalid viewer bootstrap payload: roomName");
  }
  if (!isNonEmptyString(url)) {
    throw new Error("Invalid viewer bootstrap payload: url");
  }
  if (!isNonEmptyString(participantIdentity)) {
    throw new Error("Invalid viewer bootstrap payload: participantIdentity");
  }

  return {
    token,
    roomName: roomName.trim(),
    url: url.trim(),
    participantIdentity: participantIdentity.trim(),
  };
}
