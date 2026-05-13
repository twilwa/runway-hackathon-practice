import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  appendDataChannelLogEntry,
  type DataLogEntry,
} from "../src/livekit/data-channel-log";

describe("appendDataChannelLogEntry", () => {
  it("records UTF-8 preview for plain text payloads", () => {
    const enc = new TextEncoder();
    const prev: DataLogEntry[] = [];
    const next = appendDataChannelLogEntry(prev, enc.encode("hello room"), {
      participantIdentity: "agent-1",
      topic: "lk.topic",
    });
    expect(next).toHaveLength(1);
    expect(next[0].preview).toContain("hello room");
    expect(next[0].participantIdentity).toBe("agent-1");
    expect(next[0].topic).toBe("lk.topic");
    expect(next[0].parsedAgent?.type).toBeUndefined();
  });

  it("parses agent: lines into parsedAgent when format matches", () => {
    const enc = new TextEncoder();
    const line = 'agent:thinking {"stage":"start"}';
    const next = appendDataChannelLogEntry([], enc.encode(line), {});
    expect(next[0].parsedAgent?.type).toBe("thinking");
    expect(next[0].parsedAgent?.data).toEqual({ stage: "start" });
  });

  it("parses hermes.* lines into parsedAgent when format matches", () => {
    const enc = new TextEncoder();
    const line = 'hermes.listening {"state":"active"}';
    const next = appendDataChannelLogEntry([], enc.encode(line), {});
    expect(next[0].parsedAgent?.type).toBe("listening");
    expect(next[0].parsedAgent?.data).toEqual({ state: "active" });
  });

  it("truncates long previews", () => {
    const enc = new TextEncoder();
    const long = "x".repeat(500);
    const next = appendDataChannelLogEntry([], enc.encode(long), {
      maxPreviewLen: 40,
    });
    expect(next[0].preview.length).toBeLessThanOrEqual(43);
    expect(next[0].preview).toMatch(/\.\.\.$/);
  });

  it("keeps the client-side data-channel logger free of Node-only crypto imports", () => {
    const source = readFileSync(
      new URL("../src/livekit/data-channel-log.ts", import.meta.url),
      "utf8",
    );
    expect(source).not.toContain("from 'node:crypto'");
    expect(source).not.toContain('from "node:crypto"');
  });

  it("caps log length keeping most recent entries", () => {
    const enc = new TextEncoder();
    let log: DataLogEntry[] = [];
    for (let i = 0; i < 5; i += 1) {
      log = appendDataChannelLogEntry(log, enc.encode(`msg-${i}`), {
        maxEntries: 3,
      });
    }
    expect(log).toHaveLength(3);
    expect(log[0].preview).toContain("msg-2");
    expect(log[2].preview).toContain("msg-4");
  });
});
