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
