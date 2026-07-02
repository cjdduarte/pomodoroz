## ADDED Requirements

### Requirement: Corrupted persisted state is preserved before replacement

The system SHALL distinguish missing local storage keys from malformed JSON and MUST preserve the raw malformed payload before any boot-time default or later persistence write can replace it.

#### Scenario: Root state key is malformed

- **WHEN** the `state` local storage key contains invalid JSON during startup
- **THEN** the app initializes with safe in-memory defaults and stores the original raw payload under a recoverable backup key before writing a replacement `state` value

#### Scenario: Statistics key is malformed

- **WHEN** the `statistics` local storage key contains invalid JSON during startup
- **THEN** the app initializes statistics with safe in-memory defaults and stores the original raw payload under a recoverable backup key before writing a replacement `statistics` value

### Requirement: Missing persisted state still receives defaults

The system SHALL keep the existing first-run behavior for absent local storage keys.

#### Scenario: Fresh install has no persisted keys

- **WHEN** the `state` and `statistics` local storage keys are absent during startup
- **THEN** the app writes default persisted values for the absent keys

### Requirement: Storage parse status is testable

The storage utility SHALL expose a way for callers and tests to observe whether a read was successful, missing, or corrupted without relying on console output.

#### Scenario: Caller reads malformed JSON

- **WHEN** a caller reads a malformed local storage value through the status-aware API
- **THEN** the result reports corruption and includes enough information to preserve the raw value
