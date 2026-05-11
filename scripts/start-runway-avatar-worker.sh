#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

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
MAX_DURATION="${MAX_DURATION:-300000}" # 5 minutes default

echo "Starting Runway avatar worker..."
echo "  Avatar ID: $AVATAR_ID"
echo "  Room: $LIVEKIT_ROOM"
echo "  LiveKit URL: $LIVEKIT_URL"
echo "  Max Duration: ${MAX_DURATION}ms"
echo ""

# TODO: Implement actual worker startup
# For now, this is a tracer bullet skeleton that validates env
# The actual implementation would:
# 1. Join the LiveKit room as a participant
# 2. Start a Runway AvatarSession using the existing session.ts logic
# 3. Publish avatar video track to the room
# 4. Handle SIGINT/SIGTERM for graceful shutdown
# 5. Enforce max_duration TTL

echo "[Avatar Worker] Environment validation passed"
echo "[Avatar Worker] TODO: Implement actual LiveKit + Runway integration"
