## ADDED Requirements

### Requirement: Browser companion page

The system SHALL provide a local browser page for screen-sharing a Hermes Runway
avatar alongside an existing Discord voice call.

#### Scenario: Initial ready state

- **WHEN** a user opens the root page before starting a call
- **THEN** the page shows the configured avatar ID, Discord screen-share
  guidance, session duration guidance, and an idle status
- **AND** the page shows an empty state instead of an active avatar call

#### Scenario: Start avatar call

- **WHEN** a user activates the start or reconnect control
- **THEN** the page creates a fresh avatar call instance using
  `/api/avatar/session` as the connection endpoint
- **AND** the page updates visible status text to indicate that a one-time
  Runway session is starting

#### Scenario: Avatar call ends or errors

- **WHEN** the avatar call ends or reports an error
- **THEN** the page updates visible status text so the user can reconnect with a
  fresh session

### Requirement: Server-side Runway session endpoint

The system SHALL expose a server-only `POST /api/avatar/session` endpoint that
creates one-time Runway realtime avatar credentials without exposing the Runway
API secret to the browser.

#### Scenario: Successful credential response

- **WHEN** the endpoint receives a POST request and a server API secret is
  configured
- **THEN** it resolves the avatar ID from the request body, public environment
  value, or default Hermes avatar ID
- **AND** it creates a Runway realtime session for model `gwm1_avatars` with a
  custom avatar
- **AND** it polls the session until Runway reports `READY`
- **AND** it consumes the session using the returned session key
- **AND** it returns `sessionId`, `serverUrl`, `url`, `token`, and `roomName`
  with `Cache-Control: no-store`

#### Scenario: Missing API secret

- **WHEN** the endpoint receives a POST request without `RUNWAYML_API_SECRET` or
  `RUNWAY_SKILLS_API_SECRET` configured
- **THEN** it returns a 500 JSON error that identifies the missing server
  configuration
- **AND** it does not call the Runway API

#### Scenario: Secret remains server-side

- **WHEN** the endpoint returns a successful credential response
- **THEN** the response body MUST NOT include the configured Runway API secret

### Requirement: Runway session lifecycle helper

The system SHALL implement a testable helper that creates, polls, consumes, and
normalizes Runway realtime avatar session credentials.

#### Scenario: Ready session lifecycle

- **WHEN** Runway returns a created session ID, a `READY` session with a session
  key, and consumed WebRTC connection data
- **THEN** the helper returns normalized credentials containing the session ID,
  `serverUrl`, `url`, token, and room name
- **AND** create and retrieve requests use the server API secret
- **AND** the consume request uses the one-time session key
- **AND** Runway requests include the configured API version header

#### Scenario: Failed session lifecycle

- **WHEN** Runway reports a `FAILED` session
- **THEN** the helper throws an error that includes the Runway failure message

#### Scenario: Timed-out session lifecycle

- **WHEN** Runway never reports `READY` within the configured poll limit
- **THEN** the helper throws a timeout error that identifies the session ID

### Requirement: Local configuration and validation

The system SHALL document and expose local configuration and validation commands
for running the MVP safely.

#### Scenario: Environment documentation

- **WHEN** a developer reads `.env.example` or `README.md`
- **THEN** they can identify the required server-only Runway secret, optional
  base URL override, and non-secret avatar ID configuration
- **AND** the documentation warns against exposing the Runway API secret through
  `NEXT_PUBLIC_*` variables

#### Scenario: Local validation commands

- **WHEN** a developer reads `README.md` or `package.json`
- **THEN** they can identify commands for tests, type checking, building, local
  development, and production start

### Requirement: Discord integration boundary

The system SHALL use Discord screen sharing as the MVP visual handoff and SHALL
NOT automate Discord bot video, camera, screen-share, or raw media bridging.

#### Scenario: Discord usage guidance

- **WHEN** a user follows the MVP Discord flow
- **THEN** they run the local browser companion, start or reconnect the avatar
  call, screen-share the browser window into Discord, and keep Hermes on the
  existing Discord voice path
