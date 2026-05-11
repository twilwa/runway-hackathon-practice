## ADDED Requirements

### Requirement: Make Hermes output drive avatar speech

The system SHALL provide the `hermes-avatar-audio-handoff` capability: A vertical slice relays Hermes final text or TTS artifact to the Runway/LiveKit path, renders matching captions, and documents the canonical audio route to avoid echo.

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

### Requirement: Preserve Hermes as the only response and tool brain

The handoff SHALL make the avatar speak or animate from Hermes output without
letting the avatar path generate unrelated answers.

#### Scenario: Hermes final output drives the avatar turn

- **WHEN** Hermes completes a user turn with final assistant text or a TTS
  artifact
- **THEN** the handoff relays that Hermes-owned output to the selected
  Runway/LiveKit avatar path
- **AND** the avatar output remains tied to the same Hermes session and turn

#### Scenario: Avatar path does not answer independently

- **WHEN** the avatar worker needs text, audio, context, or persona data
- **THEN** it uses the Hermes session summary and Hermes response events
- **AND** it does not run a separate LLM response that can diverge from Hermes
  context or tool authorization

### Requirement: Select and document the first workable audio route

The handoff SHALL determine whether the MVP uses Hermes text to worker TTS,
Hermes TTS artifacts, or a deferred LiveKit-native AgentSession route.

#### Scenario: Audio route is selected from verified behavior

- **WHEN** the team evaluates Runway and LiveKit avatar input options
- **THEN** the chosen route is based on a verified same-turn spike
- **AND** unsupported routes are documented as deferred or failed with evidence

#### Scenario: Canonical audio avoids echo

- **WHEN** both Discord and LiveKit/avatar audio paths could be audible
- **THEN** the implementation or runbook identifies the canonical audience audio
  source
- **AND** the default MVP keeps Discord Hermes bot audio canonical and shared
  web-stage audio muted unless intentionally enabled

### Requirement: Mirror captions and status for congruence

The handoff SHALL provide captions and status that make the avatar visibly
congruent with Hermes.

#### Scenario: Same-turn caption appears with avatar output

- **WHEN** the avatar speaks or animates for a Hermes turn
- **THEN** the web stage displays matching Hermes response text or a concise
  status message
- **AND** the status makes clear that Hermes is the source of truth
