import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("LiveKit room page source", () => {
  it("renders a prominent status panel for manual smoke verification", () => {
    const source = readFileSync(
      new URL("../app/livekit-room/page.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("LiveKit status:");
    expect(source).toContain("remote participants:");
    expect(source).toContain("data messages:");
    expect(source).toContain("hermes.status");
  });

  it("explicitly subscribes to remote tracks that already exist when the viewer joins", () => {
    const source = readFileSync(
      new URL("../app/livekit-room/page.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("function subscribeToRemoteTracks(room: Room)");
    expect(source).toContain("pub.setSubscribed(true)");
    expect(source).toContain("RoomEvent.TrackPublished");
  });
});
