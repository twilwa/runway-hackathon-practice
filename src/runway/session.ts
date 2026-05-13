import { AccessToken } from "livekit-server-sdk";

export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export type RunwaySessionCredentials = {
  sessionId: string;
  /** Shape used by @runwayml/avatars-react examples. */
  serverUrl: string;
  /** Alias retained for SDKs/examples that expect the raw consume field name. */
  url: string;
  token: string;
  roomName: string;
};

type CreateSessionOptions = {
  avatarId: string;
  apiSecret: string;
  baseUrl?: string;
  fetchLike?: FetchLike;
  maxPolls?: number;
  pollIntervalMs?: number;
};

type CreateLiveKitAvatarSessionOptions = {
  avatarId?: string;
  presetId?: string;
  apiSecret: string;
  liveKitApiKey: string;
  liveKitApiSecret: string;
  liveKitUrl: string;
  roomName: string;
  agentIdentity: string;
  avatarParticipantIdentity?: string;
  avatarParticipantName?: string;
  maxDurationSeconds?: number;
  baseUrl?: string;
  fetchLike?: FetchLike;
};

type StopRunwayRealtimeSessionOptions = {
  sessionId: string;
  apiSecret: string;
  baseUrl?: string;
  fetchLike?: FetchLike;
};

export type RunwayLiveKitAvatarSession = {
  sessionId: string;
  roomName: string;
  avatarParticipantIdentity: string;
  avatarParticipantName: string;
};

type CreateSessionResponse = {
  id?: string;
};

type RetrieveSessionResponse = {
  status?: string;
  sessionKey?: string;
  failure?: unknown;
};

type ConsumeSessionResponse = {
  url?: string;
  token?: string;
  roomName?: string;
};

const RUNWAY_VERSION = "2024-11-06";
const DEFAULT_BASE_URL = "https://api.dev.runwayml.com";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

function failureMessage(failure: unknown): string {
  if (typeof failure === "string") return failure;
  if (failure && typeof failure === "object" && "message" in failure) {
    const message = (failure as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return JSON.stringify(failure ?? "unknown failure");
}

function requireString(value: unknown, name: string): string {
  if (typeof value === "string" && value.length > 0) return value;
  throw new Error(`Runway response missing ${name}`);
}

function avatarPayload(avatarId?: string, presetId?: string) {
  if (avatarId && presetId) {
    throw new Error("Use RUNWAY_AVATAR_ID or RUNWAY_PRESET_ID, not both");
  }
  if (avatarId) {
    return { type: "custom", avatarId };
  }
  if (presetId) {
    return { type: "runway-preset", presetId };
  }
  throw new Error("RUNWAY_AVATAR_ID or RUNWAY_PRESET_ID is required");
}

async function createAvatarParticipantToken({
  apiKey,
  apiSecret,
  roomName,
  agentIdentity,
  avatarParticipantIdentity,
  avatarParticipantName,
}: {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  agentIdentity: string;
  avatarParticipantIdentity: string;
  avatarParticipantName: string;
}) {
  const token = new AccessToken(apiKey, apiSecret, {
    identity: avatarParticipantIdentity,
    name: avatarParticipantName,
    ttl: "30m",
    attributes: {
      "lk.publish_on_behalf": agentIdentity,
    },
  });
  token.kind = "agent";
  token.addGrant({
    roomJoin: true,
    room: roomName,
  });
  return token.toJwt();
}

export async function createRunwaySessionCredentials({
  avatarId,
  apiSecret,
  baseUrl = DEFAULT_BASE_URL,
  fetchLike = fetch,
  maxPolls = 60,
  pollIntervalMs = 1_000,
}: CreateSessionOptions): Promise<RunwaySessionCredentials> {
  if (!avatarId) throw new Error("avatarId is required");
  if (!apiSecret) throw new Error("RUNWAYML_API_SECRET is required");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  const createResponse = await fetchLike(
    `${normalizedBaseUrl}/v1/realtime_sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiSecret}`,
        "Content-Type": "application/json",
        "X-Runway-Version": RUNWAY_VERSION,
      },
      body: JSON.stringify({
        model: "gwm1_avatars",
        avatar: { type: "custom", avatarId },
      }),
    },
  );
  const created = await parseJson<CreateSessionResponse>(createResponse);
  const sessionId = requireString(created.id, "session id");

  let sessionKey: string | undefined;
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const retrieveResponse = await fetchLike(
      `${normalizedBaseUrl}/v1/realtime_sessions/${sessionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiSecret}`,
          "X-Runway-Version": RUNWAY_VERSION,
        },
      },
    );
    const session = await parseJson<RetrieveSessionResponse>(retrieveResponse);

    if (session.status === "READY") {
      sessionKey = requireString(session.sessionKey, "session key");
      break;
    }
    if (session.status === "FAILED") {
      throw new Error(
        `Runway session failed: ${failureMessage(session.failure)}`,
      );
    }
    if (session.status === "CANCELLED") {
      throw new Error("Runway session was cancelled before it became ready");
    }

    if (attempt < maxPolls - 1) await sleep(pollIntervalMs);
  }

  if (!sessionKey) {
    throw new Error(
      `Runway session ${sessionId} did not become READY before timeout`,
    );
  }

  const consumeResponse = await fetchLike(
    `${normalizedBaseUrl}/v1/realtime_sessions/${sessionId}/consume`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionKey}`,
        "Content-Type": "application/json",
        "X-Runway-Version": RUNWAY_VERSION,
      },
      body: "{}",
    },
  );
  const consumed = await parseJson<ConsumeSessionResponse>(consumeResponse);
  const url = requireString(consumed.url, "consume url");

  return {
    sessionId,
    serverUrl: url,
    url,
    token: requireString(consumed.token, "consume token"),
    roomName: requireString(consumed.roomName, "consume roomName"),
  };
}

export async function createRunwayLiveKitAvatarSession({
  avatarId,
  presetId,
  apiSecret,
  liveKitApiKey,
  liveKitApiSecret,
  liveKitUrl,
  roomName,
  agentIdentity,
  avatarParticipantIdentity = "runway-avatar",
  avatarParticipantName = "Runway Avatar",
  maxDurationSeconds,
  baseUrl = DEFAULT_BASE_URL,
  fetchLike = fetch,
}: CreateLiveKitAvatarSessionOptions): Promise<RunwayLiveKitAvatarSession> {
  if (!apiSecret) throw new Error("RUNWAYML_API_SECRET is required");
  if (!liveKitApiKey) throw new Error("LIVEKIT_API_KEY is required");
  if (!liveKitApiSecret) throw new Error("LIVEKIT_API_SECRET is required");
  if (!liveKitUrl) throw new Error("LIVEKIT_URL is required");
  if (!roomName) throw new Error("LIVEKIT_ROOM is required");
  if (!agentIdentity) throw new Error("agentIdentity is required");

  const livekitToken = await createAvatarParticipantToken({
    apiKey: liveKitApiKey,
    apiSecret: liveKitApiSecret,
    roomName,
    agentIdentity,
    avatarParticipantIdentity,
    avatarParticipantName,
  });
  const body: Record<string, unknown> = {
    model: "gwm1_avatars",
    avatar: avatarPayload(avatarId, presetId),
    livekit: {
      url: liveKitUrl,
      token: livekitToken,
      roomName,
      agentIdentity,
    },
  };
  if (maxDurationSeconds !== undefined) {
    body.maxDuration = maxDurationSeconds;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const response = await fetchLike(
    `${normalizedBaseUrl}/v1/realtime_sessions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiSecret}`,
        "Content-Type": "application/json",
        "X-Runway-Version": RUNWAY_VERSION,
      },
      body: JSON.stringify(body),
    },
  );
  const created = await parseJson<CreateSessionResponse>(response);
  return {
    sessionId: requireString(created.id, "session id"),
    roomName,
    avatarParticipantIdentity,
    avatarParticipantName,
  };
}

export async function stopRunwayRealtimeSession({
  sessionId,
  apiSecret,
  baseUrl = DEFAULT_BASE_URL,
  fetchLike = fetch,
}: StopRunwayRealtimeSessionOptions): Promise<void> {
  if (!sessionId) throw new Error("sessionId is required");
  if (!apiSecret) throw new Error("RUNWAYML_API_SECRET is required");

  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const response = await fetchLike(
    `${normalizedBaseUrl}/v1/realtime_sessions/${sessionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${apiSecret}`,
        "X-Runway-Version": RUNWAY_VERSION,
      },
    },
  );
  await parseJson<Record<string, never>>(response);
}
