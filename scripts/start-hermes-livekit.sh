#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMES_PATH="$ROOT/vendor/hermes-agent-livekit"

if [ ! -d "$HERMES_PATH" ]; then
  echo "Error: Hermes LiveKit vendor directory not found at $HERMES_PATH"
  echo "Run: bash vendor/hermes-agent-pr3894/scripts/materialize-livekit-worktree.sh"
  exit 1
fi

# Check for required environment variables
if [ -z "${LIVEKIT_API_KEY:-}" ]; then
  echo "Error: LIVEKIT_API_KEY not set"
  echo "Set it in your environment or .env.local"
  exit 1
fi

if [ -z "${LIVEKIT_API_SECRET:-}" ]; then
  echo "Error: LIVEKIT_API_SECRET not set"
  echo "Set it in your environment or .env.local"
  exit 1
fi

if [ -z "${LIVEKIT_URL:-}" ]; then
  echo "Error: LIVEKIT_URL not set"
  echo "Set it in your environment or .env.local"
  exit 1
fi

if [ -z "${LIVEKIT_ROOM:-}" ]; then
  echo "Error: LIVEKIT_ROOM not set"
  echo "Set it in your environment or .env.local"
  exit 1
fi

echo "Starting Hermes LiveKit gateway..."
echo "  Room: $LIVEKIT_ROOM"
echo "  LiveKit URL: $LIVEKIT_URL"
echo ""

cd "$HERMES_PATH"

# Start the Hermes gateway
# This will run the gateway from the PR #3894 tree
python3 gateway/run.py
