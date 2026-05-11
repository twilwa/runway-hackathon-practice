import { NextResponse } from 'next/server';
import { startSession, stopSession, getSessionStatus } from '../../scripts/session-orchestration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type StartRequest = {
  roomName?: string;
  avatarId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as StartRequest;
    const roomName = body.roomName || process.env.LIVEKIT_ROOM;
    const avatarId = body.avatarId || process.env.NEXT_PUBLIC_RUNWAY_AVATAR_ID || '6824a3e0-f37f-455a-b1d4-3140111a83bf';

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const session = await startSession({ roomName, avatarId });

    return NextResponse.json(session, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown session error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const status = await getSessionStatus(sessionId);

    return NextResponse.json(status, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown session error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const result = await stopSession(sessionId);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown session error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
