# Audio Routing Guide for Hermes Avatar Integration

This document describes the canonical audio routing for the Hermes + Runway avatar + LiveKit + Discord architecture to avoid echo and ensure clear audio paths.

## Architecture Overview

```
User → Discord Voice (input only)
  ↓
Hermes Gateway (STT → Agent Loop → TTS)
  ↓
LiveKit Room (audio output)
  ↓
Runway Avatar (video + optional audio)
  ↓
Screen-share to Discord (video only)
```

## Canonical Audio Paths

### Input Path (User → Hermes)

1. **User speaks in Discord voice channel**
   - Discord audio is captured by Hermes
   - Sent to Hermes gateway via LiveKit or Discord API
   - Transcribed by STT
   - Processed by Hermes agent/tool loop

### Output Path (Hermes → User)

**Preferred Path (Text-to-Avatar):**
1. Hermes generates final text response
2. Text sent to Runway avatar via API
3. Runway avatar synthesizes speech
4. Avatar video published to LiveKit room
5. Web stage displays avatar video
6. Screen-share shows avatar to Discord users
7. **Discord audio is muted** to avoid echo

**Fallback Path 1 (TTS Mirroring):**
1. Hermes generates TTS audio artifact
2. Audio mirrored to LiveKit room
3. Web stage plays audio from LiveKit
4. Screen-share shows web stage to Discord users
5. **Discord audio is muted** to avoid echo

**Fallback Path 2 (Direct Text):**
1. Hermes generates final text response
2. Text displayed as captions in web stage
3. No avatar speech
4. Screen-share shows captions to Discord users
5. Discord audio remains active (Hermes TTS through Discord)

## Echo Prevention

### Critical Rules

1. **Never enable Discord audio output when using Runway avatar speech**
   - The Runway avatar's speech would create an echo loop with Discord
   - Always mute Discord bot audio when avatar is speaking

2. **Never publish both Hermes TTS and Runway avatar audio to the same room**
   - This would create double audio/echo in LiveKit
   - Choose one audio source per room

3. **Never route LiveKit audio back to Discord**
   - This would create echo between Discord and LiveKit
   - Use LiveKit for video/avatar only, keep audio separate

### Configuration Examples

**Text-to-Avatar (Recommended):**
```bash
# Discord bot configuration
DISCORD_AUDIO_OUTPUT=false  # Mute Discord audio
HERMES_TTS_ENABLED=false    # Disable Hermes TTS

# Runway avatar enabled
RUNWAY_AVATAR_SPEECH=true
```

**TTS Mirroring (Fallback):**
```bash
# Discord bot configuration
DISCORD_AUDIO_OUTPUT=false  # Mute Discord audio
HERMES_TTS_ENABLED=true     # Enable Hermes TTS

# Mirror Hermes TTS to LiveKit
LIVEKIT_AUDIO_MIRROR=true
RUNWAY_AVATAR_SPEECH=false
```

**Direct Text (Fallback):**
```bash
# Discord bot configuration
DISCORD_AUDIO_OUTPUT=true   # Enable Discord audio (Hermes TTS)
HERMES_TTS_ENABLED=true

# No avatar speech
RUNWAY_AVATAR_SPEECH=false
LIVEKIT_AUDIO_MIRROR=false
```

## Troubleshooting

### Echo Symptoms

**Symptom:** Users hear their own voice echoed back
- **Cause:** Discord audio output enabled while using avatar speech
- **Fix:** Set `DISCORD_AUDIO_OUTPUT=false`

**Symptom:** Double audio or overlapping speech
- **Cause:** Both Hermes TTS and Runway avatar publishing audio
- **Fix:** Disable one audio source (prefer Hermes TTS, use avatar speech)

**Symptom:** Audio delay or out-of-sync
- **Cause:** Audio routing through multiple hops
- **Fix:** Simplify audio path, use single source

### Verification Checklist

Before going live with the avatar integration:

- [ ] Discord audio output is muted when using avatar speech
- [ ] Only one audio source is active (Hermes TTS OR Runway avatar)
- [ ] LiveKit audio is not routed back to Discord
- [ ] Test with a single user first to verify no echo
- [ ] Test with multiple users to verify audio clarity
- [ ] Verify captions match speech timing
