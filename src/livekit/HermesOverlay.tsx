'use client';

import { useState, useEffect } from 'react';
import { parseAgentEvent, type AgentEvent } from '../../scripts/hermes-livekit-events';

type HermesState = 'idle' | 'thinking' | 'speaking' | 'tool';

export function HermesOverlay() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [currentState, setCurrentState] = useState<HermesState>('idle');
  const [currentCaption, setCurrentCaption] = useState<string>('');

  useEffect(() => {
    // TODO: Connect to real Hermes gateway event stream
    // For now, simulate events
    const simulateEvents = () => {
      const mockEvents: AgentEvent[] = [
        {
          type: 'thinking',
          timestamp: Date.now(),
          data: { thought: 'Processing user input...' },
        },
        {
          type: 'speaking',
          timestamp: Date.now() + 1000,
          data: { text: 'Hello there! How can I help you today?' },
        },
      ];

      setEvents(mockEvents);
      setCurrentState('thinking');
      
      setTimeout(() => {
        setCurrentState('speaking');
        setCurrentCaption('Hello there! How can I help you today?');
      }, 1000);
    };

    simulateEvents();
  }, []);

  const getStateColor = (state: HermesState) => {
    switch (state) {
      case 'thinking': return 'bg-yellow-100 text-yellow-800';
      case 'speaking': return 'bg-green-100 text-green-800';
      case 'tool': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateIcon = (state: HermesState) => {
    switch (state) {
      case 'thinking': return '💭';
      case 'speaking': return '🗣️';
      case 'tool': return '🔧';
      default: return '💤';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto">
      <div className="bg-black/80 backdrop-blur-sm rounded-lg shadow-xl p-4 text-white">
        {/* State indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{getStateIcon(currentState)}</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStateColor(currentState)}`}>
            {currentState}
          </span>
        </div>

        {/* Caption */}
        {currentCaption && (
          <div className="text-lg mb-3 p-3 bg-white/10 rounded">
            {currentCaption}
          </div>
        )}

        {/* Event log */}
        <div className="max-h-32 overflow-y-auto space-y-1 text-sm">
          {events.map((event, index) => (
            <div key={index} className="text-gray-300 font-mono text-xs">
              <span className="text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString()}:
              </span>{' '}
              <span className="text-blue-400">{event.type}:</span>{' '}
              {JSON.stringify(event.data)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
