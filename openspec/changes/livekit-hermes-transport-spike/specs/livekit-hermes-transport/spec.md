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
