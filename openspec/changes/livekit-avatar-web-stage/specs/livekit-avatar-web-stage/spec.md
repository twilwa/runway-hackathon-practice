## ADDED Requirements

### Requirement: Build LiveKit avatar web stage

The system SHALL provide the `livekit-avatar-web-stage` capability: Browser obtains short-lived viewer tokens, joins a room, displays participants/tracks, and renders Hermes lifecycle overlays while retaining the direct Runway fallback.

#### Scenario: Slice can be started locally

- **WHEN** a developer follows the documented setup for this workstream
- **THEN** they can start the relevant local process or page without committing secrets
- **AND** missing external configuration fails with actionable, non-secret error output

#### Scenario: Slice proves vertical behavior

- **WHEN** the required local and external services are configured
- **THEN** the workstream demonstrates its end-to-end tracer bullet behavior
- **AND** the result is visible through logs, browser UI, LiveKit room state, or Discord/operator output as appropriate

#### Scenario: Slice has a fallback

- **WHEN** the tracer bullet fails during hackathon operation
- **THEN** the operator can fall back to the previous completed slice or documented manual path
- **AND** the system does not require unsupported Discord-native video automation

### Requirement: Issue scoped LiveKit viewer bootstrap data

The system SHALL provide browser bootstrap data that lets a viewer join only the
intended LiveKit avatar room without exposing privileged LiveKit or Runway
credentials.

#### Scenario: Viewer token response is scoped to one room

- **WHEN** the browser requests bootstrap data for an avatar session
- **THEN** the server returns a LiveKit URL, room name, viewer token, avatar
  participant identity, display name, and status stream URL
- **AND** the token grants viewer join and subscribe permissions for only that
  room
- **AND** the response does not include LiveKit API secrets or Runway API
  secrets

#### Scenario: Missing configuration fails safely

- **WHEN** LiveKit server configuration or token signing configuration is
  missing
- **THEN** the endpoint returns an actionable non-secret error
- **AND** it does not generate fake JWTs or simulated room credentials

### Requirement: Render real LiveKit room state and avatar tracks

The web stage SHALL join the configured LiveKit room and render real participant
and track state from the LiveKit browser SDK.

#### Scenario: Viewer joins the room

- **WHEN** the browser opens `/avatar/:sessionId` with valid bootstrap data
- **THEN** it connects to the LiveKit room as a viewer
- **AND** it displays room connection state and participant presence

#### Scenario: Avatar video is displayed when available

- **WHEN** a participant with the configured avatar identity publishes a video
  track
- **THEN** the web stage renders that track as the primary screen-share surface
- **AND** the stage remains useful with waiting and reconnecting states before
  the avatar track exists

### Requirement: Render Hermes and LiveKit lifecycle overlays

The web stage SHALL render captions, status, and tool-activity overlays from
actual Hermes or LiveKit lifecycle events.

#### Scenario: Hermes lifecycle events drive visible status

- **WHEN** the web stage receives listening, transcribing, thinking, tool,
  speaking, idle, avatar joined, or avatar track ready events
- **THEN** it updates visible status or captions without requiring a page reload
- **AND** it supports both the captured PR #3894 event contract and the PRD's
  normalized `hermes.*` event names when a compatibility layer is present

#### Scenario: Fallback remains available

- **WHEN** LiveKit or Runway room rendering is unavailable during the hackathon
- **THEN** the previous direct Runway browser path remains documented as a
  fallback until the LiveKit path is proven

### Requirement: Provide web-stage health and debug surfaces

The web stage SHALL provide lightweight health and session debug surfaces for
hackathon operator troubleshooting.

#### Scenario: Health endpoint reports service readiness

- **WHEN** the operator checks the web-stage health surface
- **THEN** it reports whether the webapp process is reachable
- **AND** it does not expose privileged LiveKit or Runway credentials

#### Scenario: Session debug surface supports recovery

- **WHEN** the operator opens a debug surface for an avatar session
- **THEN** it shows the session ID, room name, connection state, participant
  identities, avatar track readiness, and recent non-secret lifecycle events
- **AND** it provides enough information to recover or stop a failed demo
  attempt without restarting the whole development environment
