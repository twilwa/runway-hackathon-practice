import { NextResponse } from 'next/server';
import { createRunwaySessionCredentials } from '../../../../src/runway/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SessionRequest = {
  avatarId?: string;
};

const DEFAULT_AVATAR_ID = '6824a3e0-f37f-455a-b1d4-3140111a83bf';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SessionRequest;
    const avatarId = body.avatarId || process.env.NEXT_PUBLIC_RUNWAY_AVATAR_ID || DEFAULT_AVATAR_ID;
    const apiSecret = process.env.RUNWAYML_API_SECRET || process.env.RUNWAY_SKILLS_API_SECRET;

    if (!apiSecret) {
      return NextResponse.json({ error: 'RUNWAYML_API_SECRET is not configured on the server' }, { status: 500 });
    }

    const credentials = await createRunwaySessionCredentials({
      avatarId,
      apiSecret,
      baseUrl: process.env.RUNWAY_BASE_URL,
    });

    return NextResponse.json(credentials, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Runway session error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
