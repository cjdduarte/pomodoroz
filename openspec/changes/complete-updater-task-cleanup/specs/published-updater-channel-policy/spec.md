## ADDED Requirements

### Requirement: Native updater eligibility matches published channels

The system SHALL report in-app updater support only for Windows NSIS and Linux AppImage bundles while those are the only channels with signed updater artifacts in release CI.

#### Scenario: Supported bundle is evaluated

- **WHEN** the native runtime is an NSIS or AppImage bundle
- **THEN** the system reports the in-app updater channel as supported

#### Scenario: Unsupported bundle is evaluated

- **WHEN** the native runtime is a deb, rpm, MSI, macOS app, development build, or unknown bundle
- **THEN** the system reports the in-app updater channel as unsupported

### Requirement: Unsupported updater channels retain safe fallback

The system SHALL avoid in-app installation attempts on unsupported updater channels.

#### Scenario: User requests an update on an unsupported channel

- **WHEN** a user requests an update from an unsupported runtime channel
- **THEN** the renderer uses its existing release-page fallback instead of attempting a native install
