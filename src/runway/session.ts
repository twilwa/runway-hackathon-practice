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

const RUNWAY_VERSION = '2024-11-06';
const DEFAULT_BASE_URL = 'https://api.dev.runwayml.com';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const message = typeof data?.error === 'string'
      ? data.error
      : typeof data?.message === 'string'
        ? data.message
        : `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

function failureMessage(failure: unknown): string {
  if (typeof failure === 'string') return failure;
  if (failure && typeof failure === 'object' && 'message' in failure) {
    const message = (failure as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return JSON.stringify(failure ?? 'unknown failure');
}

function requireString(value: unknown, name: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  throw new Error(`Runway response missing ${name}`);
}

export async function createRunwaySessionCredentials({
  avatarId,
  apiSecret,
  baseUrl = DEFAULT_BASE_URL,
  fetchLike = fetch,
  maxPolls = 60,
  pollIntervalMs = 1_000,
}: CreateSessionOptions): Promise<RunwaySessionCredentials> {
  if (!avatarId) throw new Error('avatarId is required');
  if (!apiSecret) throw new Error('RUNWAYML_API_SECRET is required');

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  const createResponse = await fetchLike(`${normalizedBaseUrl}/v1/realtime_sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiSecret}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': RUNWAY_VERSION,
    },
    body: JSON.stringify({
      model: 'gwm1_avatars',
      avatar: { type: 'custom', avatarId },
    }),
  });
  const created = await parseJson<CreateSessionResponse>(createResponse);
  const sessionId = requireString(created.id, 'session id');

  let sessionKey: string | undefined;
  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const retrieveResponse = await fetchLike(`${normalizedBaseUrl}/v1/realtime_sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiSecret}`,
        'X-Runway-Version': RUNWAY_VERSION,
      },
    });
    const session = await parseJson<RetrieveSessionResponse>(retrieveResponse);

    if (session.status === 'READY') {
      sessionKey = requireString(session.sessionKey, 'session key');
      break;
    }
    if (session.status === 'FAILED') {
      throw new Error(`Runway session failed: ${failureMessage(session.failure)}`);
    }
    if (session.status === 'CANCELLED') {
      throw new Error('Runway session was cancelled before it became ready');
    }

    if (attempt < maxPolls - 1) await sleep(pollIntervalMs);
  }

  if (!sessionKey) {
    throw new Error(`Runway session ${sessionId} did not become READY before timeout`);
  }

  const consumeResponse = await fetchLike(`${normalizedBaseUrl}/v1/realtime_sessions/${sessionId}/consume`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': RUNWAY_VERSION,
    },
    body: '{}',
  });
  const consumed = await parseJson<ConsumeSessionResponse>(consumeResponse);
  const url = requireString(consumed.url, 'consume url');

  return {
    sessionId,
    serverUrl: url,
    url,
    token: requireString(consumed.token, 'consume token'),
    roomName: requireString(consumed.roomName, 'consume roomName'),
  };
}
