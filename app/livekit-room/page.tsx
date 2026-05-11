'use client';

import { useEffect, useState } from 'react';
import { HermesOverlay } from '../../src/livekit/HermesOverlay';

type Participant = {
  identity: string;
  name: string;
  state: string;
  tracks: {
    video?: boolean;
    audio?: boolean;
  };
};

type RoomState = {
  connected: boolean;
  participants: Participant[];
};

export default function LiveKitRoomPage() {
  const [roomName, setRoomName] = useState('');
  const [roomState, setRoomState] = useState<RoomState>({
    connected: false,
    participants: [],
  });
  const [error, setError] = useState<string | null>(null);

  const connectToRoom = async () => {
    try {
      setError(null);
      const response = await fetch('/api/livekit/viewer-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get viewer token');
      }

      const { token } = await response.json();

      // TODO: Use LiveKit client SDK to actually connect to the room
      // For now, simulate connection
      setRoomState({
        connected: true,
        participants: [
          {
            identity: 'hermes-gateway',
            name: 'Hermes Gateway',
            state: 'active',
            tracks: { video: true, audio: true },
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">LiveKit Room Viewer</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={connectToRoom}
              disabled={!roomName || roomState.connected}
              className="px-6 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              {roomState.connected ? 'Connected' : 'Join Room'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>

        {roomState.connected && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Room Participants</h2>

            {roomState.participants.length === 0 ? (
              <p className="text-gray-500">No participants in room</p>
            ) : (
              <div className="space-y-4">
                {roomState.participants.map((participant) => (
                  <div key={participant.identity} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{participant.name}</h3>
                        <p className="text-sm text-gray-500">{participant.identity}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        participant.state === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {participant.state}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className={participant.tracks.video ? 'text-green-600' : 'text-gray-400'}>
                        📹 {participant.tracks.video ? 'Video' : 'No Video'}
                      </span>
                      <span className={participant.tracks.audio ? 'text-green-600' : 'text-gray-400'}>
                        🎤 {participant.tracks.audio ? 'Audio' : 'No Audio'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is a tracer bullet implementation. The LiveKit client SDK integration
            is TODO - currently showing simulated participant data.
          </p>
        </div>
      </div>

      {roomState.connected && <HermesOverlay />}
    </main>
  );
}
