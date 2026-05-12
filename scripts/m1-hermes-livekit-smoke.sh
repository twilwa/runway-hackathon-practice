#!/usr/bin/env bash
# M1: Hermes PR #3894 LiveKit gateway smoke — real credentials required.
# Does not print secret values (only [SET]/[MISSING]).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_ROOT="$ROOT/vendor/hermes-agent-livekit"

# Pick up LIVEKIT_* the same way Next.js does (repo root only; not inherited from cwd).
load_repo_env_files() {
  local f
  for f in "$ROOT/.env.local" "$ROOT/.env"; do
    if [[ -f "$f" ]]; then
      echo "note: loading ${f##*/} from repo root" >&2
      set -a
      # shellcheck disable=SC1090
      source "$f"
      set +a
    fi
  done
}
load_repo_env_files

LOG_ROOT="${M1_SMOKE_LOG_DIR:-$ROOT/scratchpad/m1-smoke-logs}"
# How long to keep the gateway running before stopping (Hermes is a long-lived process).
RUN_SECS="${M1_SMOKE_RUN_SECS:-45}"
# Use an isolated Hermes home. HERMES_CONFIG_DIR is not honored by PR #3894;
# gateway/run.py resolves config/logs from HERMES_HOME via hermes_constants.py.
# Do not inherit the caller's active Hermes profile by default, or the smoke can
# collide with the real Discord gateway and use unrelated platform config.
export HERMES_HOME="${M1_SMOKE_HERMES_HOME:-$ROOT/scratchpad/m1-smoke-hermes-home}"
# Poll quickly during smoke so a synthetic participant triggers Hermes join fast.
export LIVEKIT_PRESENCE_POLL_INTERVAL="${LIVEKIT_PRESENCE_POLL_INTERVAL:-2}"
export LIVEKIT_ALLOW_ALL_USERS="${LIVEKIT_ALLOW_ALL_USERS:-true}"

have() { [[ -n "${!1:-}" ]]; }

mask_status() {
  local n="$1"
  if have "$n"; then echo "[SET]"; else echo "[MISSING]"; fi
}

require_env() {
  local missing=0
  for n in LIVEKIT_URL LIVEKIT_API_KEY LIVEKIT_API_SECRET; do
    if ! have "$n"; then
      echo "error: $n is $(mask_status "$n")" >&2
      missing=1
    fi
  done
  if [[ "$missing" -ne 0 ]]; then
    echo "Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET (and optionally LIVEKIT_ROOM) then re-run." >&2
    exit 1
  fi
}

cleanup() {
  if [[ -n "${HERMES_PID:-}" ]] && kill -0 "$HERMES_PID" 2>/dev/null; then
    echo "Stopping gateway PID $HERMES_PID"
    kill "$HERMES_PID" 2>/dev/null || true
    wait "$HERMES_PID" 2>/dev/null || true
  fi
  if [[ -n "${PARTICIPANT_PID:-}" ]] && kill -0 "$PARTICIPANT_PID" 2>/dev/null; then
    echo "Stopping synthetic LiveKit participant PID $PARTICIPANT_PID"
    kill "$PARTICIPANT_PID" 2>/dev/null || true
    wait "$PARTICIPANT_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [[ ! -d "$HERMES_ROOT" ]]; then
  echo "error: vendored Hermes tree missing at $HERMES_ROOT" >&2
  echo "Run: bash vendor/hermes-agent-pr3894/scripts/materialize-livekit-worktree.sh" >&2
  exit 1
fi

require_env

hermes_python() {
  if [[ -x "$HERMES_ROOT/.venv/bin/python" ]]; then
    echo "$HERMES_ROOT/.venv/bin/python"
  elif command -v python3 >/dev/null 2>&1; then
    command -v python3
  else
    echo ""
  fi
}

HERMES_PY="$(hermes_python)"
if [[ -z "$HERMES_PY" ]]; then
  echo "error: no Python interpreter found (expected $HERMES_ROOT/.venv from uv sync)" >&2
  exit 1
fi

if ! (cd "$HERMES_ROOT" && "$HERMES_PY" -c "import livekit" 2>/dev/null); then
  echo "error: Hermes Python deps missing (livekit extra). From repo root:" >&2
  echo "  cd \"$HERMES_ROOT\" && uv sync --extra livekit" >&2
  exit 1
fi

export LIVEKIT_ROOM="${LIVEKIT_ROOM:-hermes-m1-smoke-$(date +%Y%m%d%H%M%S)}"
mkdir -p "$LOG_ROOT" "$HERMES_HOME"
LOG_FILE="$LOG_ROOT/hermes-gateway-${LIVEKIT_ROOM}.log"
PARTICIPANT_LOG="$LOG_ROOT/livekit-participant-${LIVEKIT_ROOM}.log"
HERMES_GATEWAY_LOG="$HERMES_HOME/logs/gateway.log"
# Keep each run's evidence clean. Reusing LIVEKIT_ROOM previously appended stale
# participant errors to the same log, making successful runs look suspicious.
: >"$LOG_FILE"
: >"$PARTICIPANT_LOG"
mkdir -p "$(dirname "$HERMES_GATEWAY_LOG")"
: >"$HERMES_GATEWAY_LOG"

echo "=== M1 Hermes LiveKit smoke ==="
echo "Hermes root:     $HERMES_ROOT"
echo "LiveKit URL:     $(mask_status LIVEKIT_URL) (value not printed; use LiveKit Cloud dashboard if needed)"
echo "API key:         $(mask_status LIVEKIT_API_KEY)"
echo "API secret:      $(mask_status LIVEKIT_API_SECRET)"
echo "Room:            $LIVEKIT_ROOM"
echo "Hermes home:     $HERMES_HOME"
echo "Gateway stderr:  $LOG_FILE"
echo "Gateway log:     $HERMES_GATEWAY_LOG"
echo "Participant log: $PARTICIPANT_LOG"
echo "Run window (s):  $RUN_SECS (set M1_SMOKE_RUN_SECS to change)"
echo ""
echo "A synthetic LiveKit participant will join first. This forces PR #3894's"
echo "presence-aware LiveKit adapter to create a real LiveKit session and join."
echo "You can also join this room from LiveKit Meet during the run window to exercise audio/STT."
echo ""

# Fail fast on bad LiveKit credentials. This uses the Server API, so it catches
# key/secret/URL mismatches before we start long-lived Hermes processes.
"$HERMES_PY" - <<'PY'
import asyncio
import os
import sys
from livekit import api

async def main() -> None:
    url = os.environ["LIVEKIT_URL"]
    http_url = url.replace("wss://", "https://", 1).replace("ws://", "http://", 1).rstrip("/")
    client = api.LiveKitAPI(
        url=http_url,
        api_key=os.environ["LIVEKIT_API_KEY"],
        api_secret=os.environ["LIVEKIT_API_SECRET"],
    )
    try:
        await client.room.list_rooms(api.ListRoomsRequest(names=[os.environ["LIVEKIT_ROOM"]]))
    finally:
        await client.aclose()

try:
    asyncio.run(main())
except Exception as exc:
    print(f"error: LiveKit Server API preflight failed: {type(exc).__name__}: {str(exc)[:240]}", file=sys.stderr)
    print("Check that LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET are from the same LiveKit project.", file=sys.stderr)
    raise SystemExit(1)
else:
    print("LiveKit Server API preflight: ok")
PY

cd "$HERMES_ROOT"

# Start a synthetic participant before Hermes. The PR #3894 adapter is
# presence-aware: it intentionally stays out of empty rooms and only polls.
# Without another participant, a "successful" long-lived gateway process may
# create no visible LiveKit dashboard session.
"$HERMES_PY" - <<'PY' >>"$PARTICIPANT_LOG" 2>&1 &
import asyncio
import os
import signal
from livekit import rtc
from livekit.api import AccessToken, VideoGrants

async def main() -> None:
    room_name = os.environ["LIVEKIT_ROOM"]
    ttl = int(float(os.environ.get("M1_SMOKE_RUN_SECS", "45"))) + 15
    token = (
        AccessToken(os.environ["LIVEKIT_API_KEY"], os.environ["LIVEKIT_API_SECRET"])
        .with_identity("m1-smoke-observer")
        .with_name("M1 Smoke Observer")
        .with_grants(VideoGrants(room_join=True, room=room_name))
        .to_jwt()
    )
    room = rtc.Room()
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, stop.set)
        except NotImplementedError:
            pass
    await room.connect(os.environ["LIVEKIT_URL"], token)
    print(f"joined room={room_name} identity=m1-smoke-observer", flush=True)
    try:
        await asyncio.wait_for(stop.wait(), timeout=ttl)
    except asyncio.TimeoutError:
        pass
    await room.disconnect()
    print(f"disconnected room={room_name}", flush=True)

asyncio.run(main())
PY
PARTICIPANT_PID=$!
echo "Synthetic participant PID: $PARTICIPANT_PID"
sleep 3

"$HERMES_PY" gateway/run.py >>"$LOG_FILE" 2>&1 &
HERMES_PID=$!

echo "Gateway PID:     $HERMES_PID"
echo "Tail log:        tail -f \"$LOG_FILE\""

sleep "$RUN_SECS"

if ! kill -0 "$HERMES_PID" 2>/dev/null; then
  wait "$HERMES_PID" || true
  echo "error: gateway exited before end of run window (see $LOG_FILE)" >&2
  exit 1
fi

echo "Run window complete; stopping gateway."
kill "$HERMES_PID"
wait "$HERMES_PID" 2>/dev/null || true
HERMES_PID=""
if [[ -n "${PARTICIPANT_PID:-}" ]] && kill -0 "$PARTICIPANT_PID" 2>/dev/null; then
  kill "$PARTICIPANT_PID" 2>/dev/null || true
  wait "$PARTICIPANT_PID" 2>/dev/null || true
  PARTICIPANT_PID=""
fi

COMBINED_LOG="$LOG_ROOT/combined-${LIVEKIT_ROOM}.log"
{
  echo "--- gateway stderr ---"
  [[ -f "$LOG_FILE" ]] && cat "$LOG_FILE"
  echo "--- hermes gateway.log ---"
  [[ -f "$HERMES_GATEWAY_LOG" ]] && cat "$HERMES_GATEWAY_LOG"
  echo "--- synthetic participant ---"
  [[ -f "$PARTICIPANT_LOG" ]] && cat "$PARTICIPANT_LOG"
} >"$COMBINED_LOG"

if ! grep -Eiq 'livekit|m1-smoke-observer|participant|room' "$COMBINED_LOG"; then
  echo "error: no LiveKit evidence found in logs; smoke did not prove M1 transport" >&2
  echo "Combined log: $COMBINED_LOG" >&2
  exit 1
fi

if ! grep -Eq 'joined room=.*identity=m1-smoke-observer' "$PARTICIPANT_LOG"; then
  echo "error: synthetic participant did not join LiveKit; see $PARTICIPANT_LOG" >&2
  exit 1
fi

if ! grep -Eiq "LiveKit|participant|${LIVEKIT_ROOM}" "$HERMES_GATEWAY_LOG" "$LOG_FILE" 2>/dev/null; then
  echo "error: Hermes gateway did not log LiveKit activity; see $HERMES_GATEWAY_LOG and $LOG_FILE" >&2
  exit 1
fi

echo "Stopped. LiveKit evidence found. Useful log lines:"
grep -Eih 'livekit|participant|room|joined|connected' "$COMBINED_LOG" | tail -n 40 | sed 's/sk_[A-Za-z0-9_-]*/sk_[REDACTED]/g; s/api_secret=[^ ]*/api_secret=[REDACTED]/Ig; s/token=[^ ]*/token=[REDACTED]/Ig' || true
