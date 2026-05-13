import { describe, expect, it } from "vitest";
import { ConnectionState } from "livekit-client";
import { connectionStateLabel } from "../src/livekit/connection-label";

describe("connectionStateLabel", () => {
  it("maps LiveKit connection states to short UI labels", () => {
    expect(connectionStateLabel(ConnectionState.Connected)).toBe("connected");
    expect(connectionStateLabel(ConnectionState.Connecting)).toBe("connecting");
    expect(connectionStateLabel(ConnectionState.Reconnecting)).toBe(
      "reconnecting",
    );
    expect(connectionStateLabel(ConnectionState.Disconnected)).toBe(
      "disconnected",
    );
  });
});
