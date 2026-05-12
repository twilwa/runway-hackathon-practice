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
mkdir -p "$LOG_ROOT"
LOG_FILE="$LOG_ROOT/hermes-gateway-${LIVEKIT_ROOM}.log"

echo "=== M1 Hermes LiveKit smoke ==="
echo "Hermes root:     $HERMES_ROOT"
echo "LiveKit URL:     $(mask_status LIVEKIT_URL) (value not printed; use LiveKit Cloud dashboard if needed)"
echo "API key:         $(mask_status LIVEKIT_API_KEY)"
echo "API secret:      $(mask_status LIVEKIT_API_SECRET)"
echo "Room:            $LIVEKIT_ROOM"
echo "Gateway log:     $LOG_FILE"
echo "Run window (s):  $RUN_SECS (set M1_SMOKE_RUN_SECS to change)"
echo ""
echo "Join this room from LiveKit Meet or your app during the run window to exercise audio/STT."
echo "Ensure your Hermes gateway config enables the LiveKit platform (see docs/hermes-livekit-usage.md)."
echo ""

cd "$HERMES_ROOT"

# Isolated profile: avoid clobbering a developer's default Hermes config dir.
export HERMES_CONFIG_DIR="${HERMES_CONFIG_DIR:-$ROOT/scratchpad/m1-smoke-hermes-config}"
mkdir -p "$HERMES_CONFIG_DIR"

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

echo "Stopped. Last log lines:"
tail -n 30 "$LOG_FILE" | sed 's/sk_/sk_[REDACTED]_/g; s/api_secret=[^ ]*/api_secret=[REDACTED]/Ig' || true
