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
