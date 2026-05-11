# Hackathon Demo Runbook

This runbook provides step-by-step instructions for running the complete Hermes + Runway avatar + LiveKit + Discord demo for the hackathon.

## Prerequisites

1. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

   Required variables:
   - `RUNWAYML_API_SECRET`: Runway API secret
   - `LIVEKIT_API_KEY`: LiveKit API key
   - `LIVEKIT_API_SECRET`: LiveKit API secret
   - `LIVEKIT_URL`: LiveKit server URL
   - `LIVEKIT_ROOM`: LiveKit room name

2. **Materialize Hermes LiveKit Worktree**
   ```bash
   bash vendor/hermes-agent-pr3894/scripts/materialize-livekit-worktree.sh
   ```

3. **Install Dependencies**
   ```bash
   bun install
   ```

## Demo Flow

### Step 1: Start the Web Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`.

### Step 2: Start Hermes Gateway (Terminal 1)

```bash
bash scripts/start-hermes-livekit.sh
```

This starts the Hermes gateway in the configured LiveKit room.

### Step 3: Start Runway Avatar Worker (Terminal 2)

```bash
bash scripts/start-runway-avatar-worker.sh
```

This starts the Runway avatar worker that publishes video to the LiveKit room.

### Step 4: Open LiveKit Room Viewer

Navigate to: `http://localhost:3000/livekit-room`

Enter the room name from your `.env.local` and click "Join Room".

You should see:
- Room participants list
- Hermes lifecycle overlay (thinking/speaking/tool status)
- Captions for Hermes responses

### Step 5: Screen-Share to Discord

1. Join the Discord voice channel where Hermes is active
2. Share your browser window showing the LiveKit room viewer
3. Ensure Discord audio output is **muted** to avoid echo (see [Audio Routing Guide](./audio-routing-guide.md))

### Step 6: Interact with Hermes

- Speak to Hermes in Discord voice
- Watch the LiveKit room viewer for:
  - Participant list updates
  - Hermes lifecycle state changes
  - Captions appearing
  - Avatar video (if worker is connected)

### Step 7: Stop the Demo

1. Stop the Runway avatar worker (Ctrl+C in Terminal 2)
2. Stop the Hermes gateway (Ctrl+C in Terminal 1)
3. Close the browser tab
4. Stop the web server (Ctrl+C)

## Verification Checklist

Before the demo, verify:

- [ ] All environment variables are set in `.env.local`
- [ ] Hermes LiveKit worktree is materialized
- [ ] Web server starts without errors
- [ ] Hermes gateway connects to LiveKit room
- [ ] Runway avatar worker starts successfully
- [ ] LiveKit room viewer displays participants
- [ ] Hermes lifecycle overlay shows state changes
- [ ] Discord audio output is muted to prevent echo
- [ ] Screen-share shows the web stage clearly

## Troubleshooting

**Hermes gateway fails to start:**
- Check LiveKit credentials in `.env.local`
- Verify LiveKit room exists
- Check Python and ffmpeg are installed

**Runway avatar worker fails to start:**
- Verify Runway API secret is set
- Check avatar ID is correct
- Ensure LiveKit room is accessible

**LiveKit room viewer shows no participants:**
- Verify Hermes gateway is running
- Check room name matches between components
- Refresh the browser page

**Echo in audio:**
- Ensure Discord audio output is muted
- Verify only one audio source is active
- Check audio routing configuration

## Fallback Paths

If the full LiveKit integration fails, fallback to the direct Runway MVP:

1. Navigate to `http://localhost:3000` (home page)
2. Click "Start / reconnect avatar call"
3. Screen-share to Discord
4. Use Hermes voice through Discord normally

This fallback uses the existing Runway WebRTC integration without LiveKit.
