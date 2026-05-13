"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type Participant,
  type RemoteTrack,
} from "livekit-client";
import {
  appendDataChannelLogEntry,
  type DataLogEntry,
} from "../../src/livekit/data-channel-log";
import { parseViewerBootstrapResponse } from "../../src/livekit/viewer-bootstrap";
import { connectionStateLabel } from "../../src/livekit/connection-label";
import { HermesOverlay } from "../../src/livekit/HermesOverlay";
import { RemoteVideo } from "../../src/livekit/RemoteVideo";

type ParticipantRow = {
  sid: string;
  identity: string;
  name: string;
  isLocal: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: RemoteTrack;
};

function subscribeToRemoteTracks(room: Room) {
  for (const participant of room.remoteParticipants.values()) {
    for (const pub of participant.trackPublications.values()) {
      if (
        !pub.isSubscribed &&
        "setSubscribed" in pub &&
        typeof pub.setSubscribed === "function"
      ) {
        pub.setSubscribed(true);
      }
    }
  }
}

function trackFlags(p: Participant): {
  hasVideo: boolean;
  hasAudio: boolean;
  videoTrack?: RemoteTrack;
} {
  let hasVideo = false;
  let hasAudio = false;
  let videoTrack: RemoteTrack | undefined;
  for (const pub of p.trackPublications.values()) {
    if (!pub.isSubscribed || !pub.track) {
      continue;
    }
    if (pub.kind === Track.Kind.Video) {
      hasVideo = true;
      videoTrack = pub.track as RemoteTrack;
    }
    if (pub.kind === Track.Kind.Audio) {
      hasAudio = true;
    }
  }
  return { hasVideo, hasAudio, videoTrack };
}

function buildParticipantRows(room: Room): ParticipantRow[] {
  const rows: ParticipantRow[] = [];
  const push = (p: Participant, isLocal: boolean) => {
    const { hasVideo, hasAudio, videoTrack } = trackFlags(p);
    rows.push({
      sid: p.sid,
      identity: p.identity,
      name: p.name || p.identity,
      isLocal,
      hasVideo,
      hasAudio,
      videoTrack,
    });
  };
  push(room.localParticipant, true);
  for (const p of room.remoteParticipants.values()) {
    push(p, false);
  }
  return rows;
}

export default function LiveKitRoomPage() {
  const [roomName, setRoomName] = useState("");
  const [connectionPhase, setConnectionPhase] = useState<string>("idle");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [dataLog, setDataLog] = useState<DataLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const fromQuery = new URLSearchParams(window.location.search).get(
      "roomName",
    );
    if (fromQuery) {
      setRoomName(fromQuery);
    }
  }, []);

  useEffect(() => {
    return () => {
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  const bumpParticipants = useCallback((room: Room) => {
    setParticipants(buildParticipantRows(room));
  }, []);

  const leaveRoom = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setParticipants([]);
    setDataLog([]);
    setConnectionPhase("disconnected");
  }, []);

  const connectToRoom = async () => {
    if (roomRef.current) {
      return;
    }
    try {
      setError(null);
      setDataLog([]);
      setConnectionPhase("connecting");

      const response = await fetch("/api/livekit/viewer-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to get viewer token");
      }

      const json: unknown = await response.json();
      const bootstrap = parseViewerBootstrapResponse(json);

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ConnectionStateChanged, () => {
        setConnectionPhase(connectionStateLabel(room.state));
      });

      room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
        setDataLog((prev) =>
          appendDataChannelLogEntry(prev, payload, {
            participantIdentity: participant?.identity,
            topic: topic ?? undefined,
            maxEntries: 40,
          }),
        );
      });

      const bump = () => bumpParticipants(room);
      const subscribeAndBump = () => {
        subscribeToRemoteTracks(room);
        bumpParticipants(room);
      };
      room.on(RoomEvent.ParticipantConnected, subscribeAndBump);
      room.on(RoomEvent.ParticipantDisconnected, bump);
      room.on(RoomEvent.TrackPublished, subscribeAndBump);
      room.on(RoomEvent.TrackSubscribed, bump);
      room.on(RoomEvent.TrackUnsubscribed, bump);
      room.on(RoomEvent.LocalTrackPublished, bump);
      room.on(RoomEvent.Disconnected, () => {
        setConnectionPhase(connectionStateLabel(ConnectionState.Disconnected));
      });

      await room.connect(bootstrap.url, bootstrap.token, {
        autoSubscribe: true,
      });
      subscribeAndBump();
      setConnectionPhase(connectionStateLabel(room.state));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setConnectionPhase("failed");
      roomRef.current?.disconnect();
      roomRef.current = null;
    }
  };

  const connected = connectionPhase === "connected";
  const remoteCount = participants.filter((p) => !p.isLocal).length;
  const statusTone = connected
    ? "border-green-500 bg-green-50 text-green-900"
    : connectionPhase === "failed"
      ? "border-red-500 bg-red-50 text-red-900"
      : connectionPhase === "connecting" || connectionPhase === "reconnecting"
        ? "border-yellow-500 bg-yellow-50 text-yellow-900"
        : "border-gray-300 bg-gray-50 text-gray-900";

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">LiveKit Room Viewer</h1>

        <section
          className={`border-2 rounded-lg p-4 mb-6 ${statusTone}`}
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold">
              LiveKit status: {connectionPhase.toUpperCase()}
            </h2>
            <span className="text-sm font-mono px-2 py-1 rounded bg-white/70">
              room: {roomName || "(none)"}
            </span>
            <span className="text-sm font-mono px-2 py-1 rounded bg-white/70">
              remote participants: {remoteCount}
            </span>
            <span className="text-sm font-mono px-2 py-1 rounded bg-white/70">
              data messages: {dataLog.length}
            </span>
          </div>
          <p className="mt-2 text-sm">
            M1 smoke should temporarily add <strong>M1 Smoke Observer</strong>{" "}
            and <strong>Hermes</strong>, then stream
            <code className="mx-1 px-1 rounded bg-white/70">
              hermes.status
            </code>{" "}
            data lines into the bottom overlay.
          </p>
        </section>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <span className="text-sm font-mono px-2 py-1 rounded bg-gray-100 text-gray-900">
              legacy connection: {connectionPhase}
            </span>
          </div>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 px-4 py-2 border rounded"
              disabled={connected || connectionPhase === "connecting"}
            />
            <button
              type="button"
              onClick={connectToRoom}
              disabled={
                !roomName || connected || connectionPhase === "connecting"
              }
              className="px-6 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              {connectionPhase === "connecting" ? "Connecting…" : "Join room"}
            </button>
            <button
              type="button"
              onClick={leaveRoom}
              disabled={!roomRef.current && connectionPhase !== "connecting"}
              className="px-6 py-2 bg-gray-700 text-white rounded disabled:bg-gray-300"
            >
              Leave
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>

        {(connected || participants.length > 0) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Participants</h2>
            {remoteCount === 0 && connected && (
              <p className="text-gray-600 mb-4">
                Only you (the viewer) are in the room so far. Start the M1
                Hermes smoke so another participant joins the same room name.
              </p>
            )}
            <div className="space-y-6">
              {participants.map((p) => (
                <div key={p.sid} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">
                        {p.name}
                        {p.isLocal && (
                          <span className="text-gray-500 text-sm"> (you)</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 font-mono">
                        {p.identity}
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span
                        className={
                          p.hasVideo ? "text-green-600" : "text-gray-400"
                        }
                      >
                        video{" "}
                      </span>
                      <span
                        className={
                          p.hasAudio ? "text-green-600" : "text-gray-400"
                        }
                      >
                        audio
                      </span>
                    </div>
                  </div>
                  {p.videoTrack && (
                    <div className="mt-2">
                      <RemoteVideo track={p.videoTrack} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      <div className="mt-2 text-sm text-gray-600">
        Open with a preset room:{' '}
        <code className="bg-gray-100 px-1 rounded">
          /livekit-room?roomName=hermes-test-room
        </code>
      </div>
    </div>

    <HermesOverlay
      connectionPhase={connectionPhase}
      remoteParticipantCount={remoteCount}
      dataLog={dataLog}
    />
  </main>
  );
}
