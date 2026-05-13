#!/usr/bin/env bash
# ABOUTME: Runs a real LiveKit smoke for the vendored Hermes gateway.
# ABOUTME: Publishes synthetic room audio and verifies Hermes STT, agent, TTS, and audio return evidence.
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
export M1_SMOKE_REQUIRE_TURN="${M1_SMOKE_REQUIRE_TURN:-false}"

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
if [[ -n "${M1_SMOKE_MODEL:-${HERMES_MODEL:-}}" ]]; then
  SMOKE_PROVIDER="${M1_SMOKE_PROVIDER:-${HERMES_INFERENCE_PROVIDER:-auto}}"
  cat >"$HERMES_HOME/config.yaml" <<YAML
model:
  default: "${M1_SMOKE_MODEL:-${HERMES_MODEL:-}}"
  provider: "${SMOKE_PROVIDER}"
YAML
fi
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
echo "Utterance:       ${M1_SMOKE_UTTERANCE:-Hermes, please say livekit smoke test complete.}"
echo "Audio delay (s): ${M1_SMOKE_AUDIO_DELAY_SECS:-8} (time after observer joins before publishing speech)"
echo "Require turn:    $M1_SMOKE_REQUIRE_TURN (set true to require STT/response/TTS evidence)"
echo ""
echo "A synthetic LiveKit participant will join first. This forces PR #3894's"
echo "presence-aware LiveKit adapter to create a real LiveKit session and join."
echo "The participant also publishes a short spoken mic track unless M1_SMOKE_PUBLISH_AUDIO=false."
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
import subprocess
import tempfile
from livekit import rtc
from livekit.api import AccessToken, VideoGrants

SAMPLE_RATE = 48000
NUM_CHANNELS = 1

async def main() -> None:
    room_name = os.environ["LIVEKIT_ROOM"]
    ttl = int(float(os.environ.get("M1_SMOKE_RUN_SECS", "45"))) + 15
    token = (
        AccessToken(os.environ["LIVEKIT_API_KEY"], os.environ["LIVEKIT_API_SECRET"])
        .with_identity("m1-smoke-observer")
        .with_name("M1 Smoke Observer")
        .with_grants(VideoGrants(room_join=True, room=room_name, can_publish_data=True))
        .to_jwt()
    )
    room = rtc.Room()
    stop = asyncio.Event()
    remote_audio_frames = 0
    remote_audio_samples = 0
    remote_audio_tasks = []
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, stop.set)
        except NotImplementedError:
            pass

    async def drain_remote_audio(track: rtc.Track, identity: str) -> None:
        nonlocal remote_audio_frames, remote_audio_samples
        stream = rtc.AudioStream(track)
        try:
            async for event in stream:
                remote_audio_frames += 1
                remote_audio_samples += event.frame.samples_per_channel
                if remote_audio_frames == 1:
                    print(f"received remote audio from {identity}", flush=True)
        except asyncio.CancelledError:
            return

    def on_track_subscribed(track, publication, participant) -> None:
        if track.kind != rtc.TrackKind.KIND_AUDIO:
            return
        if participant.identity == "m1-smoke-observer":
            return
        print(f"subscribed remote audio identity={participant.identity}", flush=True)
        remote_audio_tasks.append(asyncio.create_task(drain_remote_audio(track, participant.identity)))

    room.on("track_subscribed", on_track_subscribed)
    await room.connect(os.environ["LIVEKIT_URL"], token)
    print(f"joined room={room_name} identity=m1-smoke-observer", flush=True)

    async def publish_audio_once() -> None:
        if os.environ.get("M1_SMOKE_PUBLISH_AUDIO", "true").lower() in {"0", "false", "no"}:
            print("audio publish disabled", flush=True)
            return

        delay = float(os.environ.get("M1_SMOKE_AUDIO_DELAY_SECS", "8"))
        if delay > 0:
            print(f"waiting {delay:.1f}s before publishing speech", flush=True)
            await asyncio.sleep(delay)

        utterance = os.environ.get(
            "M1_SMOKE_UTTERANCE",
            "Hermes, please say livekit smoke test complete.",
        )
        with tempfile.NamedTemporaryFile(suffix=".aiff", delete=False) as tmp:
            audio_path = tmp.name
        try:
            subprocess.run(["say", "-o", audio_path, utterance], check=True)
            decoded = subprocess.run(
                [
                    "ffmpeg", "-i", audio_path,
                    "-f", "s16le",
                    "-acodec", "pcm_s16le",
                    "-ar", str(SAMPLE_RATE),
                    "-ac", str(NUM_CHANNELS),
                    "-loglevel", "error",
                    "pipe:1",
                ],
                check=True,
                capture_output=True,
            ).stdout
        finally:
            try:
                os.unlink(audio_path)
            except OSError:
                pass

        source = rtc.AudioSource(SAMPLE_RATE, NUM_CHANNELS)
        track = rtc.LocalAudioTrack.create_audio_track("m1-smoke-mic", source)
        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        await room.local_participant.publish_track(track, options)
        print(f"published audio track utterance={utterance!r}", flush=True)

        samples_per_frame = SAMPLE_RATE // 50
        bytes_per_frame = samples_per_frame * NUM_CHANNELS * 2
        for offset in range(0, len(decoded), bytes_per_frame):
            chunk = decoded[offset:offset + bytes_per_frame]
            if len(chunk) < bytes_per_frame:
                chunk = chunk + b"\x00" * (bytes_per_frame - len(chunk))
            frame = rtc.AudioFrame(
                data=chunk,
                sample_rate=SAMPLE_RATE,
                num_channels=NUM_CHANNELS,
                samples_per_channel=samples_per_frame,
            )
            await source.capture_frame(frame)

        silence_frame = rtc.AudioFrame(
            data=b"\x00" * bytes_per_frame,
            sample_rate=SAMPLE_RATE,
            num_channels=NUM_CHANNELS,
            samples_per_channel=samples_per_frame,
        )
        for _ in range(125):
            await source.capture_frame(silence_frame)
        print("published audio silence tail", flush=True)

    async def publish_status_loop() -> None:
        if os.environ.get("M1_SMOKE_PUBLISH_DATA", "true").lower() in {"0", "false", "no"}:
            return
        i = 0
        while not stop.is_set():
            payload = f'hermes.listening {{"state":"active","source":"m1-smoke-observer","seq":{i}}}'
            await room.local_participant.publish_data(payload, reliable=True, topic="hermes.status")
            print(f"published data topic=hermes.status payload={payload}", flush=True)
            i += 1
            try:
                await asyncio.wait_for(stop.wait(), timeout=5)
            except asyncio.TimeoutError:
                pass

    status_task = asyncio.create_task(publish_status_loop())
    audio_task = asyncio.create_task(publish_audio_once())
    try:
        await asyncio.wait_for(stop.wait(), timeout=ttl)
    except asyncio.TimeoutError:
        pass
    if not audio_task.done():
        audio_task.cancel()
        try:
            await audio_task
        except asyncio.CancelledError:
            pass
    elif audio_task.exception():
        raise audio_task.exception()
    status_task.cancel()
    for task in remote_audio_tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass
    try:
        await status_task
    except asyncio.CancelledError:
        pass
    await room.disconnect()
    print(
        f"remote audio frames={remote_audio_frames} samples={remote_audio_samples}",
        flush=True,
    )
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

if [[ "$M1_SMOKE_REQUIRE_TURN" =~ ^(1|true|yes)$ ]]; then
  if ! grep -Eq "STT result from .*'success': True" "$COMBINED_LOG"; then
    echo "error: strict smoke did not capture successful STT" >&2
    echo "Combined log: $COMBINED_LOG" >&2
    exit 1
  fi
  if ! grep -Eiq "Transcript from|Sending response" "$COMBINED_LOG"; then
    echo "error: strict smoke did not capture Hermes transcript/response evidence" >&2
    echo "Combined log: $COMBINED_LOG" >&2
    exit 1
  fi
  if ! grep -Eiq "TTS audio saved|agent:speaking-start|received remote audio" "$COMBINED_LOG"; then
    echo "error: strict smoke did not capture TTS/playback evidence" >&2
    echo "Combined log: $COMBINED_LOG" >&2
    exit 1
  fi
  if ! grep -Eq "remote audio frames=[1-9][0-9]*" "$PARTICIPANT_LOG"; then
    echo "error: strict smoke did not receive Hermes audio frames" >&2
    echo "Participant log: $PARTICIPANT_LOG" >&2
    exit 1
  fi
fi

echo "Stopped. LiveKit evidence found. Useful log lines:"
grep -Eih 'livekit|participant|room|joined|connected|published data|hermes\.|STT result|Transcript from|Sending response|TTS audio saved|received remote audio|remote audio frames' "$COMBINED_LOG" | tail -n 60 | sed 's/sk_[A-Za-z0-9_-]*/sk_[REDACTED]/g; s/api_secret=[^ ]*/api_secret=[REDACTED]/Ig; s/token=[^ ]*/token=[REDACTED]/Ig' || true
