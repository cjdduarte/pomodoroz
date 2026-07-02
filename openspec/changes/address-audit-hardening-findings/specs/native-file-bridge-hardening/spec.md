## ADDED Requirements

### Requirement: JSON file commands reject symlink bypasses

The native `read_text_file` and `write_text_file` commands SHALL reject final file symlink paths and MUST validate JSON extension constraints at the command boundary without rejecting legitimate symlinked parent directories.

#### Scenario: Import path is a symlink ending in json

- **WHEN** the renderer invokes `read_text_file` with a `.json` symlink path
- **THEN** the native command rejects the request instead of following the symlink

#### Scenario: Export path resolves outside the selected json filename

- **WHEN** the renderer invokes `write_text_file` with a path whose final filesystem target does not satisfy the JSON file guardrails
- **THEN** the native command rejects the request before writing content

#### Scenario: Export path has a symlinked parent directory

- **WHEN** the renderer invokes `write_text_file` for a new `.json` file below a symlinked parent directory selected by the native dialog
- **THEN** the native command accepts the path if the final file path itself is not a symlink and the JSON guardrails pass

### Requirement: JSON file commands retain size and file-type guardrails

The native JSON import/export commands SHALL keep the 5 MiB content limit and SHALL reject non-regular-file targets.

#### Scenario: Oversized export content is submitted

- **WHEN** the renderer invokes `write_text_file` with content larger than 5 MiB
- **THEN** the native command rejects the request with a safe error

#### Scenario: Import target is not a regular file

- **WHEN** the renderer invokes `read_text_file` for a directory or non-regular filesystem object
- **THEN** the native command rejects the request

### Requirement: Renderer-originated native payloads have defensive limits

Native commands that accept renderer-originated binary or label payloads SHALL enforce bounded input sizes or durations.

#### Scenario: Notification sound payload is too large

- **WHEN** the renderer invokes `play_notification_sound` with an oversized byte payload or unreasonable delay
- **THEN** the native command rejects the request without spawning a playback thread

#### Scenario: Tray payloads are too large

- **WHEN** the renderer invokes tray icon or tray copy commands with oversized payloads
- **THEN** the native command rejects the request with a safe error

### Requirement: Opener permissions use least privilege

The Tauri capability configuration SHALL allow only the opener behavior used by the app.

#### Scenario: App capability is audited

- **WHEN** the default Tauri capability file is inspected
- **THEN** opener permissions do not include unused directory reveal capability
