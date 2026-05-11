## ADDED Requirements

### Requirement: Add Runway avatar LiveKit worker

The system SHALL provide the `runway-livekit-avatar-worker` capability: A separate worker joins the room, starts a Runway AvatarSession with avatar 6824a3e0-f37f-455a-b1d4-3140111a83bf, publishes avatar video, and enforces cleanup/TTL.

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

### Requirement: Run a Python-first Runway AvatarSession worker

The system SHALL provide a Python-first worker path for starting Runway
`AvatarSession` instances in the same LiveKit room as the Hermes transport.

#### Scenario: Worker validates required configuration

- **WHEN** the worker starts
- **THEN** it validates LiveKit connection settings, Runway API secret,
  configured avatar ID, avatar participant identity, and avatar participant name
- **AND** validation failures produce actionable errors without printing secret
  values

#### Scenario: Worker joins the target room

- **WHEN** the worker receives a room name and authorized worker credentials
- **THEN** it joins that room as the avatar worker path
- **AND** it uses the configured `runway-avatar` participant identity for the
  published avatar participant unless overridden by configuration

#### Scenario: Runway AvatarSession publishes media

- **WHEN** the worker starts a Runway `AvatarSession` for the configured Hermes
  avatar ID
- **THEN** the LiveKit room contains a `runway-avatar` participant
- **AND** that participant publishes an avatar video track visible to the web
  stage

### Requirement: Prevent leaked avatar sessions and worker processes

The worker SHALL enforce explicit cleanup paths so LiveKit rooms, worker
processes, and Runway sessions do not leak during hackathon retries.

#### Scenario: Stop request cleans up the worker

- **WHEN** the session is stopped by command, API call, or local operator action
- **THEN** the worker stops the avatar session and leaves the LiveKit room
- **AND** subsequent status reports show the session as stopped or expired

#### Scenario: Signals and duration limits are handled

- **WHEN** the worker receives `SIGINT` or `SIGTERM`, or reaches the configured
  maximum duration
- **THEN** it exits cleanly after releasing LiveKit and Runway resources
- **AND** the cleanup path is safe to run more than once
