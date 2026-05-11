export type SessionConfig = {
  roomName: string;
  avatarId: string;
};

export type SessionResult = {
  sessionId: string;
  roomName: string;
  webStageUrl: string;
  createdAt: number;
};

export type SessionState = {
  sessionId: string;
  state: 'idle' | 'starting' | 'running' | 'stopping' | 'stopped';
  roomName: string;
  avatarId: string;
  createdAt: number;
  updatedAt: number;
};

export type StopResult = {
  success: boolean;
  cleanedUp: boolean;
  error?: string;
};

// In-memory session store (for tracer bullet)
const sessions = new Map<string, SessionState>();

export async function startSession(config: SessionConfig): Promise<SessionResult> {
  const { roomName, avatarId } = config;

  if (!roomName) {
    throw new Error('roomName is required');
  }

  if (!avatarId) {
    throw new Error('avatarId is required');
  }

  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = Date.now();

  const sessionState: SessionState = {
    sessionId,
    state: 'starting',
    roomName,
    avatarId,
    createdAt,
    updatedAt: createdAt,
  };

  sessions.set(sessionId, sessionState);

  // TODO: Implement actual session startup
  // This would:
  // 1. Create/identify LiveKit room
  // 2. Start Hermes gateway worker
  // 3. Start Runway avatar worker
  // 4. Generate web stage URL

  console.log(`[Session Orchestration] Starting session ${sessionId}`);
  console.log(`[Session Orchestration] Room: ${roomName}`);
  console.log(`[Session Orchestration] Avatar: ${avatarId}`);

  // Simulate startup completion
  sessionState.state = 'running';
  sessionState.updatedAt = Date.now();

  return {
    sessionId,
    roomName,
    webStageUrl: `/livekit-room?room=${encodeURIComponent(roomName)}`,
    createdAt,
  };
}

export async function getSessionStatus(sessionId: string): Promise<SessionState> {
  const session = sessions.get(sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  return session;
}

export async function stopSession(sessionId: string): Promise<StopResult> {
  const session = sessions.get(sessionId);

  if (!session) {
    return {
      success: false,
      cleanedUp: false,
      error: 'Session not found',
    };
  }

  console.log(`[Session Orchestration] Stopping session ${sessionId}`);

  // TODO: Implement actual session cleanup
  // This would:
  // 1. Stop Hermes gateway worker
  // 2. Stop Runway avatar worker
  // 3. Close LiveKit room connections
  // 4. Clean up temporary resources

  session.state = 'stopped';
  session.updatedAt = Date.now();

  // Remove from store after cleanup
  sessions.delete(sessionId);

  return {
    success: true,
    cleanedUp: true,
  };
}
