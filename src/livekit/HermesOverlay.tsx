'use client';

import type { DataLogEntry } from './data-channel-log';

export type HermesOverlayProps = {
  connectionPhase: string;
  remoteParticipantCount: number;
  dataLog: DataLogEntry[];
};

const STATUS_COLORS: Record<string, { bar: string; badgeBg: string; badgeText: string }> = {
  connected:  { bar: '#4ade80', badgeBg: '#166534', badgeText: '#bbf7d0' },
  failed:     { bar: '#f87171', badgeBg: '#7f1d1d', badgeText: '#fecaca' },
  connecting: { bar: '#facc15', badgeBg: '#713f12', badgeText: '#fef08a' },
  reconnecting: { bar: '#facc15', badgeBg: '#713f12', badgeText: '#fef08a' },
};

function getColors(phase: string) {
  return STATUS_COLORS[phase] ?? { bar: '#78716c', badgeBg: '#292524', badgeText: '#a8a29e' };
}

/**
 * LiveKit data-channel log and connection context.
 * Always rendered as a fixed bottom bar. Uses inline styles because this project
 * does not have Tailwind — only globals.css custom classes.
 */
export function HermesOverlay({ connectionPhase, remoteParticipantCount, dataLog }: HermesOverlayProps) {
  const lastAgent = [...dataLog].reverse().find((e) => e.parsedAgent);
  const c = getColors(connectionPhase);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderTop: `6px solid ${c.bar}`,
        background: 'rgba(0,0,0,0.85)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '8px 16px', color: '#e5e5e5', fontFamily: 'ui-monospace, Menlo, monospace' }}>
        {/* Status row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 6 }}>
          <span style={{ background: c.badgeBg, color: c.badgeText, fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {connectionPhase}
          </span>
          <span style={{ color: '#d1d5db', fontSize: 13 }}>
            {remoteParticipantCount} remote
          </span>
          <span style={{ color: '#d1d5db', fontSize: 13 }}>
            {dataLog.length} data events
          </span>
          {lastAgent && (
            <span style={{ background: 'rgba(59,130,246,0.5)', color: '#93c5fd', fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 3 }}>
              {lastAgent.parsedAgent?.type}
            </span>
          )}
        </div>

        {/* Data log */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 4, maxHeight: 96, overflowY: 'auto', fontSize: 11, lineHeight: 1.6 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>data-channel</div>
          {dataLog.length === 0 ? (
            <div style={{ color: '#4b5563', fontStyle: 'italic' }}>
              None yet — Hermes publishes agent:* lines when active.
            </div>
          ) : (
            dataLog.map((entry) => (
              <div key={entry.id} style={{ color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                <span style={{ color: '#6b7280' }}>
                  {new Date(entry.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {' '}
                <span style={{ color: '#34d399', wordBreak: 'break-all' }}>{entry.preview}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
