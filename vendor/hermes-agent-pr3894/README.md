# Hermes Agent LiveKit PR #3894 Vendor Notes

This directory keeps the Hermes LiveKit transport spike reproducible inside the hackathon repo without committing an entire copy of the Hermes monorepo.

## What is here

- `metadata.json` records the inspected base and PR commits.
- `pr3894-livekit-merge.patch` is the clean merge delta from NousResearch/hermes-agent PR #3894 onto current `origin/main` at the time of inspection.
- `scripts/materialize-livekit-worktree.sh` can recreate a local full working copy under `vendor/hermes-agent-livekit/`.

## Local full copy

A full local copy has also been materialized at:

```text
vendor/hermes-agent-livekit/
```

That directory is intentionally ignored by git because it is about 71 MB and contains a full Hermes source tree. Use it for local hackathon edits/spikes. If you need to preserve a change, either commit it in a real Hermes fork/branch or export a patch back into this directory.

## Source

- PR: https://github.com/NousResearch/hermes-agent/pull/3894
- Base checked: `origin/main` / `a2920b17623e2903bd9481721f60c2bf26c6f97a`
- PR head checked: `1a4ddb466ffd37fc8ea78754d654fa236cab1b0d`
- Merge result: clean no-conflict merge.

## Recreate local copy

From repo root:

```bash
bash vendor/hermes-agent-pr3894/scripts/materialize-livekit-worktree.sh
```

This clones/fetches Hermes, checks out the recorded base commit, applies `pr3894-livekit-merge.patch`, and writes a local full tree to `vendor/hermes-agent-livekit/`.

## Why not a submodule?

A normal submodule can point at either upstream `main` or the PR head, but the useful state for this project is the **merge result** of PR #3894 onto current `origin/main`. That merge commit does not exist on the upstream remote. A local-only submodule would not be portable. The patch + ignored local full copy keeps the hackathon repo self-contained without pretending there is a stable upstream commit to reference.
