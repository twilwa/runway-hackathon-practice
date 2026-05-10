'use client';

import { useMemo, useState } from 'react';
import { AvatarCall } from '@runwayml/avatars-react';
import '@runwayml/avatars-react/styles.css';

const DEFAULT_AVATAR_ID = '6824a3e0-f37f-455a-b1d4-3140111a83bf';

export default function Home() {
  const avatarId = process.env.NEXT_PUBLIC_RUNWAY_AVATAR_ID || DEFAULT_AVATAR_ID;
  const [callKey, setCallKey] = useState(0);
  const [status, setStatus] = useState('Idle — click Start avatar call when you are ready to screen-share this browser window.');
  const connectUrl = useMemo(() => '/api/avatar/session', []);

  return (
    <main className="shell">
      <div className="aurora" />
      <section className="layout">
        <aside className="panel sidebar">
          <div>
            <p className="eyebrow">Hermes / Runway</p>
            <h1>Discord avatar companion</h1>
            <p className="lede">
              Screen-share this page into Discord while Hermes joins voice normally. This browser handles the Runway WebRTC avatar session; Discord remains audio-first for the MVP.
            </p>
            <dl className="facts">
              <div>
                <dt>Avatar ID</dt>
                <dd className="mono">{avatarId}</dd>
              </div>
              <div>
                <dt>Session limit</dt>
                <dd>Runway calls max out around 5 minutes; reconnect when it ends.</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{status}</dd>
              </div>
            </dl>
          </div>

          <div className="controls">
            <button
              className="primaryButton"
              onClick={() => {
                setCallKey((value) => value + 1);
                setStatus('Starting a fresh one-time Runway session…');
              }}
            >
              Start / reconnect avatar call
            </button>
            <p className="hint">
              Browser will ask for mic permission. If WebRTC fails, hit reconnect so the server creates a new one-time session credential.
            </p>
          </div>
        </aside>

        <div className="panel stage">
          {callKey === 0 ? (
            <div className="emptyState">
              <div className="sigil">✦</div>
              <h2>Ready when you are.</h2>
              <p>
                Start the avatar call, then share this browser window in Discord. Keep Hermes joined in voice with the existing Discord voice command flow.
              </p>
            </div>
          ) : (
            <AvatarCall
              key={callKey}
              avatarId={avatarId}
              connectUrl={connectUrl}
              onEnd={() => setStatus('Avatar call ended. Start/reconnect to create a fresh session.')}
              onError={(error) => {
                console.error('Avatar error:', error);
                setStatus(`Avatar error: ${error.message}`);
              }}
            />
          )}
        </div>
      </section>
    </main>
  );
}
