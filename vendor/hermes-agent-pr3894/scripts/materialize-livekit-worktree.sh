#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
META="$ROOT/vendor/hermes-agent-pr3894/metadata.json"
PATCH="$ROOT/vendor/hermes-agent-pr3894/pr3894-livekit-merge.patch"
DEST="$ROOT/vendor/hermes-agent-livekit"
CACHE="$ROOT/.tools/hermes-agent-livekit-cache"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

BASE_COMMIT="$(python3 - <<'PY' "$META"
import json, sys
print(json.load(open(sys.argv[1]))['base_commit'])
PY
)"
PR_COMMIT="$(python3 - <<'PY' "$META"
import json, sys
print(json.load(open(sys.argv[1]))['pr_commit'])
PY
)"

mkdir -p "$(dirname "$CACHE")"
if [ ! -d "$CACHE/.git" ]; then
  git clone https://github.com/NousResearch/hermes-agent.git "$CACHE"
else
  git -C "$CACHE" fetch origin
fi

# Make sure the PR commit is available even if it is not reachable from main.
git -C "$CACHE" fetch origin pull/3894/head:refs/remotes/origin/pr/3894 || true
if ! git -C "$CACHE" cat-file -e "$PR_COMMIT^{commit}" 2>/dev/null; then
  echo "Warning: PR commit $PR_COMMIT not found after fetch; continuing because patch is authoritative." >&2
fi

rm -rf "$DEST"
mkdir -p "$DEST"

git -C "$CACHE" archive "$BASE_COMMIT" | tar -x -C "$DEST"
# Apply the clean-merge patch produced from PR #3894 onto the recorded base.
git -C "$DEST" init -q
# `git apply --index` requires paths to exist in the index; snapshot extracted files first.
git -C "$DEST" add -A
git -C "$DEST" apply --index "$PATCH"
git -C "$DEST" reset -q
rm -rf "$DEST/.git"

cat <<EOF
Materialized Hermes LiveKit worktree:
  $DEST
Base: $BASE_COMMIT
Patch: $PATCH
EOF
