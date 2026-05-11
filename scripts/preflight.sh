#!/usr/bin/env bash
set -euo pipefail

# Preflight validation harness for LiveKit avatar companion
# Checks runtimes, env key presence, and ffmpeg availability
# Never logs secret values - only checks presence/format

echo "🔍 Running preflight checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Helper function to check and report
check() {
  local name="$1"
  local check_cmd="$2"
  local error_msg="$3"
  
  echo -n "  Checking $name... "
  
  if eval "$check_cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    return 0
  else
    echo -e "${RED}✗${NC}"
    echo -e "    ${RED}Error:${NC} $error_msg"
    ((FAILURES++))
    return 1
  fi
}

# Check required runtimes
echo "📦 Checking required runtimes..."
check "Bun" "command -v bun" "Install Bun from https://bun.sh"
check "Python" "command -v python3" "Install Python 3 via uv or system package manager"
check "ffmpeg" "command -v ffmpeg" "Install ffmpeg via brew/apt or download from ffmpeg.org"
check "Node" "command -v node" "Install Node.js via bun or system package manager"

# Check required environment variables (presence only, never log values)
echo ""
echo "🔐 Checking required environment variables..."

# Required secrets - check presence only
REQUIRED_KEYS=(
  "LIVEKIT_API_KEY"
  "LIVEKIT_API_SECRET"
  "LIVEKIT_URL"
  "RUNWAYML_API_SECRET"
)

for key in "${REQUIRED_KEYS[@]}"; do
  if [ -z "${!key:-}" ]; then
    echo -e "  ${RED}✗${NC} $key is not set"
    echo -e "    ${YELLOW}Fix:${NC} Set $key in .env.local or source from secure profile"
    ((FAILURES++))
  else
    # Check format without logging the value
    case "$key" in
      LIVEKIT_API_KEY)
        # Should be in format key:secret
        if [[ ! "${!key}" =~ : ]]; then
          echo -e "  ${RED}✗${NC} $key format invalid (expected key:secret)"
          ((FAILURES++))
        else
          echo -e "  ${GREEN}✓${NC} $key is set"
        fi
        ;;
      LIVEKIT_URL)
        # Should be wss:// or https://
        if [[ ! "${!key}" =~ ^(wss?|https?):// ]]; then
          echo -e "  ${RED}✗${NC} $key format invalid (expected wss:// or https://)"
          ((FAILURES++))
        else
          echo -e "  ${GREEN}✓${NC} $key is set"
        fi
        ;;
      *)
        echo -e "  ${GREEN}✓${NC} $key is set"
        ;;
    esac
  fi
done

# Check optional keys with defaults
echo ""
echo "⚙️  Checking optional environment variables..."

check_optional() {
  local key="$1"
  local default="$2"
  
  if [ -z "${!key:-}" ]; then
    echo -e "  ${YELLOW}○${NC} $key not set (will use default: $default)"
  else
    echo -e "  ${GREEN}✓${NC} $key is set"
  fi
}

check_optional "SESSION_TTL_SECONDS" "300"
check_optional "ROOM_PREFIX" "avatar-"
check_optional "LOG_LEVEL" "info"

# Check vendored Hermes PR tree
echo ""
echo "📂 Checking vendored Hermes PR tree..."
if [ -d "vendor/hermes-agent-pr3894" ]; then
  echo -e "  ${GREEN}✓${NC} vendor/hermes-agent-pr3894 exists"
else
  echo -e "  ${YELLOW}○${NC} vendor/hermes-agent-pr3894 not found (required for M1 transport spike)"
fi

# Check .env.local exists
if [ -f ".env.local" ]; then
  echo -e "  ${GREEN}✓${NC} .env.local exists"
else
  echo -e "  ${YELLOW}○${NC} .env.local not found (copy from .env.example)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✓ All preflight checks passed${NC}"
  exit 0
else
  echo -e "${RED}✗ $FAILURES preflight check(s) failed${NC}"
  echo ""
  echo "Fix the errors above before proceeding with hackathon work."
  exit 1
fi
