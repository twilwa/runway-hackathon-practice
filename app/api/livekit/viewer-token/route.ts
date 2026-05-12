import { NextResponse } from 'next/server';
import { createLiveKitViewerToken } from '../../../../src/livekit/token';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ViewerTokenRequest = {
  roomName?: string;
  participantName?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ViewerTokenRequest;
    const roomName = body.roomName || process.env.LIVEKIT_ROOM;
    const participantName = body.participantName || 'viewer';
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey) {
      return NextResponse.json({ error: 'LIVEKIT_API_KEY is not configured on the server' }, { status: 500 });
    }

    if (!apiSecret) {
      return NextResponse.json({ error: 'LIVEKIT_API_SECRET is not configured on the server' }, { status: 500 });
    }

    if (!roomName) {
      return NextResponse.json({ error: 'roomName is required' }, { status: 400 });
    }

    const token = await createLiveKitViewerToken({
      roomName,
      apiKey,
      apiSecret,
      participantName,
    });

    return NextResponse.json(token, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown LiveKit token error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
