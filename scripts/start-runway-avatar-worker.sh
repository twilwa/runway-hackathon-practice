#!/usr/bin/env bash
# ABOUTME: Starts the Runway avatar worker with repo-local environment loading.
# ABOUTME: Keeps secrets out of logs while showing operator-safe runtime config.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for env_file in "$ROOT/.env.local" "$ROOT/.env"; do
  if [[ -f "$env_file" ]]; then
    echo "Loading ${env_file##*/}"
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    set +a
  fi
done

# Validate environment variables
echo "Validating environment variables..."

if [ -z "${RUNWAYML_API_SECRET:-}" ]; then
  echo "Error: RUNWAYML_API_SECRET not set"
  exit 1
fi

if [ -z "${LIVEKIT_API_KEY:-}" ]; then
  echo "Error: LIVEKIT_API_KEY not set"
  exit 1
fi

if [ -z "${LIVEKIT_API_SECRET:-}" ]; then
  echo "Error: LIVEKIT_API_SECRET not set"
  exit 1
fi

if [ -z "${LIVEKIT_URL:-}" ]; then
  echo "Error: LIVEKIT_URL not set"
  exit 1
fi

if [ -z "${LIVEKIT_ROOM:-}" ]; then
  echo "Error: LIVEKIT_ROOM not set"
  exit 1
fi

AVATAR_ID="${RUNWAY_AVATAR_ID:-6824a3e0-f37f-455a-b1d4-3140111a83bf}"
MAX_DURATION_SECONDS="${MAX_DURATION_SECONDS:-300}" # 5 minutes default

echo "Starting Runway avatar worker..."
echo "  Avatar ID: $AVATAR_ID"
echo "  Room: $LIVEKIT_ROOM"
echo "  LiveKit URL: $LIVEKIT_URL"
echo "  Max Duration: ${MAX_DURATION_SECONDS}s"
echo ""

echo "[Avatar Worker] Environment validation passed"
exec bun scripts/runway-avatar-worker.ts
