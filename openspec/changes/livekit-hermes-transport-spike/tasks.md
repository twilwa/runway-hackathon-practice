## 1. Tracer bullet tasks

- [x] 1.1 Document how to refresh and run `vendor/hermes-agent-livekit/`.
- [x] 1.2 Add a smoke script for Python, ffmpeg, LiveKit env, and import checks.
- [ ] 1.3 Run Hermes gateway from the vendored PR tree against a LiveKit room. _(Operator: `bash scripts/m1-hermes-livekit-smoke.sh` with real `LIVEKIT_*` + Hermes gateway configured for LiveKit.)_
- [ ] 1.4 Verify speech -> STT -> Hermes/tool loop -> TTS back into LiveKit. _(Requires 1.3 + a human participant publishing audio.)_
- [x] 1.5 Capture and document actual `agent:*` event payloads. _(See `docs/hermes-livekit-event-contract.md` — verified from PR #3894 code in `gateway/platforms/livekit.py`.)_

## 2. Verification

- [x] 2.1 Run relevant unit/type/build checks for touched code.
- [ ] 2.2 Run manual smoke for external LiveKit/Runway behavior when credentials are available. _(Same operator gate as 1.3.)_
- [x] 2.3 Update README/PRD notes with exact commands and remaining limitations.
