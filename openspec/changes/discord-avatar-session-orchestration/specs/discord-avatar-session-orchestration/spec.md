## ADDED Requirements

### Requirement: Orchestrate Discord demo sessions

The system SHALL provide the `discord-avatar-session-orchestration` capability: A session lifecycle path creates/identifies a LiveKit room, provides a web stage URL, supervises Hermes/avatar worker processes when feasible, and keeps manual Discord screen-share as the visual handoff.

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

### Requirement: Maintain avatar session bindings

The orchestration layer SHALL create one `AvatarSessionBinding` per Discord
avatar session so Discord, Hermes, LiveKit, Runway, and the web stage refer to
the same session.

#### Scenario: Session binding contains required identifiers

- **WHEN** an avatar session is created
- **THEN** the binding records the binding ID, guild ID, text channel ID, voice
  channel ID, Discord user ID, Hermes session ID, LiveKit room name, Runway
  avatar ID, avatar web URL, lifecycle status, creation time, update time, and
  expiry time
- **AND** it records the Runway session ID when that value is available

#### Scenario: Binding lifecycle is explicit

- **WHEN** the session starts, becomes ready, becomes active, degrades, stops,
  expires, or fails
- **THEN** the binding status reflects `starting`, `ready`, `active`,
  `degraded`, `stopped`, or `failed`
- **AND** status updates are visible to the operator or web stage

### Requirement: Provide avatar session control APIs or local equivalents

The orchestration layer SHALL expose the PRD's session create, bootstrap,
event, and stop operations through HTTP APIs, scripts, or an equivalent local
operator interface.

#### Scenario: Session creation returns a usable web URL

- **WHEN** Discord or the operator creates an avatar session
- **THEN** the response includes a binding ID, LiveKit room name, avatar web URL,
  and starting status
- **AND** the LiveKit room and viewer bootstrap path are ready or become
  observable as startup proceeds

#### Scenario: Event updates reach the web stage

- **WHEN** Hermes emits listening, transcribing, thinking, tool, speaking, idle,
  or failure events for the bound session
- **THEN** the orchestration path forwards those events to the web stage through
  LiveKit data, server-sent events, WebSocket, or documented local equivalent

#### Scenario: Stop resets the demo cleanly

- **WHEN** Discord or the operator stops an avatar session
- **THEN** the orchestration path stops or marks expired the worker, Runway
  session, LiveKit room participation, and status streams it owns
- **AND** the same development environment can start a new session without
  manual process cleanup

### Requirement: Support Discord and operator demo controls

The system SHALL keep Discord as the human collaboration surface while using a
manual web-stage screen share for MVP visuals.

#### Scenario: Discord command returns the avatar link

- **WHEN** a user invokes `/avatar link`, `/avatar start`, `/voice join
  --avatar`, or the chosen MVP command
- **THEN** Discord receives or displays a usable avatar web URL
- **AND** the operator can open and screen-share the page manually

#### Scenario: Preflight and fallback are documented

- **WHEN** the team prepares for the hackathon demo
- **THEN** the runbook verifies Discord, Hermes, LiveKit, Runway, webapp,
  canonical audio routing, and cleanup readiness
- **AND** it includes fallback paths for Discord voice failure, Runway avatar
  failure, and LiveKit failure
