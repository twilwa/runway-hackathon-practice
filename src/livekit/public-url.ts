/**
 * Resolve the WebSocket URL the browser should pass to LiveKit `Room.connect`.
 * Prefer `NEXT_PUBLIC_LIVEKIT_URL` when set; otherwise derive from server `LIVEKIT_URL`.
 * Does not expose API secrets.
 */
export function resolveLiveKitPublicUrl(options: {
  livekitUrl?: string | null;
  nextPublicLivekitUrl?: string | null;
}): string {
  const trimmedPublic = options.nextPublicLivekitUrl?.trim();
  if (trimmedPublic) {
    return normalizeLiveKitWsUrl(trimmedPublic);
  }

  const trimmedServer = options.livekitUrl?.trim();
  if (!trimmedServer) {
    throw new Error(
      "LIVEKIT_URL or NEXT_PUBLIC_LIVEKIT_URL must be configured for the viewer",
    );
  }

  return normalizeLiveKitWsUrl(trimmedServer);
}

function normalizeLiveKitWsUrl(url: string): string {
  const u = url.replace(/\/+$/, "");
  if (u.startsWith("https://")) {
    return `wss://${u.slice("https://".length)}`;
  }
  if (u.startsWith("http://")) {
    return `ws://${u.slice("http://".length)}`;
  }
  return u;
}
