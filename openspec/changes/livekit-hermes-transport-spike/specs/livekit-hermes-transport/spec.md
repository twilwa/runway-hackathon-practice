## ADDED Requirements

### Requirement: Validate PR #3894 Hermes LiveKit transport

The system SHALL provide the `livekit-hermes-transport` capability: Hermes joins LiveKit, receives user audio, runs STT and the normal agent/tool loop, publishes TTS audio back, and emits documented lifecycle events.

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

### Requirement: Verify the Hermes PR #3894 gateway unchanged before adding avatar behavior

The system SHALL verify the vendored Hermes PR #3894 LiveKit gateway as the
transport foundation before adding Runway avatar or Discord orchestration
behavior.

#### Scenario: Vendored gateway can join a real LiveKit room

- **WHEN** the PR #3894 Hermes gateway is configured with `LIVEKIT_URL`,
  `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_ROOM`, and the hackathon
  room access setting
- **THEN** Hermes appears in the configured LiveKit room as a participant
- **AND** the run uses local configuration without committing credentials

#### Scenario: LiveKit-originated speech reaches the normal Hermes pipeline

- **WHEN** a user speaks in the LiveKit room and Hermes receives the audio
- **THEN** Hermes transcribes the utterance
- **AND** Hermes routes the turn through the normal session, memory, tool, and
  response pipeline rather than a mock path

#### Scenario: Hermes publishes real response output back into LiveKit

- **WHEN** Hermes finishes a LiveKit-originated turn
- **THEN** the room receives Hermes assistant text or lifecycle data events
- **AND** Hermes TTS audio is audible in LiveKit when configured

### Requirement: Capture the authoritative Hermes LiveKit event contract

The system SHALL document the actual data-channel event names and payload shapes
emitted by the PR #3894 gateway so downstream web-stage and avatar handoff work
uses observed behavior.

#### Scenario: Runtime event payloads are captured

- **WHEN** the PR #3894 gateway runs through a representative listen, think,
  tool, speak, and idle turn
- **THEN** the implementation captures the emitted event names and payload
  fields from runtime logs or LiveKit data-channel inspection
- **AND** the captured contract distinguishes actual `agent:*` events from any
  proposed `hermes.*` normalization

#### Scenario: Downstream consumers have a compatibility target

- **WHEN** the web stage or audio handoff consumes Hermes lifecycle events
- **THEN** it supports the captured event contract
- **AND** any schema normalization is documented as a compatibility layer, not
  assumed upstream behavior
