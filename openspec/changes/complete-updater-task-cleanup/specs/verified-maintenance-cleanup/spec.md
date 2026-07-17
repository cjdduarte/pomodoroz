## ADDED Requirements

### Requirement: Cleanup removes only consumer-verified residue

The system SHALL remove a renderer artifact, direct dependency declaration, configuration residue, or obsolete script only after confirming that no active entry point consumes it.

#### Scenario: Cleanup candidate has no active consumer

- **WHEN** an artifact has no source, configuration, script, workflow, or documented operational consumer
- **THEN** the cleanup may remove it and validates the affected renderer or native build path

#### Scenario: Shared artifact retains a live consumer

- **WHEN** a file contains both unused and active exports or a JavaScript package has a separately used native counterpart
- **THEN** cleanup removes only the unused export or direct declaration and preserves the active consumer

### Requirement: Release documentation describes published updater artifacts

The release operations guide SHALL identify the signed x86_64 updater payloads, feed platform requirements, and local preflight limitation used by release CI.

#### Scenario: Operator validates a release

- **WHEN** an operator follows the release operations guide
- **THEN** the guide requires validating both signed updater channels and non-empty Windows and Linux entries in `latest.json`
