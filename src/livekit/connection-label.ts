import { ConnectionState } from "livekit-client";

/** Human-readable connection phase for the M2 web stage UI. */
export function connectionStateLabel(state: ConnectionState): string {
  switch (state) {
    case ConnectionState.Connected:
      return "connected";
    case ConnectionState.Connecting:
      return "connecting";
    case ConnectionState.Reconnecting:
      return "reconnecting";
    case ConnectionState.Disconnected:
      return "disconnected";
    default:
      return "unknown";
  }
}
