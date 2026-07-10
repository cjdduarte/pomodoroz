## ADDED Requirements

### Requirement: Native task import owns file selection and reading

The system SHALL open the task-import JSON dialog and read the selected file within one native command. The renderer MUST NOT provide a path for task import.

#### Scenario: User imports a valid task export

- **WHEN** the renderer requests a task import and the user selects a valid JSON file
- **THEN** the backend validates and reads that selected file and emits the existing successful task-import result with its content

#### Scenario: User cancels task import

- **WHEN** the renderer requests a task import and the user cancels the native dialog
- **THEN** the backend emits the existing canceled task-import result without reading a file

#### Scenario: Selected import file violates native guards

- **WHEN** the user selects a non-regular, final-symlink, non-JSON, or oversized file
- **THEN** the backend does not read the file and emits a failed task-import result with a safe error

### Requirement: Native task export owns file selection and writing

The system SHALL open the task-export save dialog and write the renderer-provided task export content within one native command. The renderer MUST NOT provide a path for task export.

#### Scenario: User exports valid task data

- **WHEN** the renderer requests an export with content within the size limit and the user selects a JSON destination
- **THEN** the backend validates and writes only that selected destination and emits the existing successful task-export result

#### Scenario: User cancels task export

- **WHEN** the renderer requests a task export and the user cancels the native save dialog
- **THEN** the backend emits the existing canceled task-export result without writing a file

#### Scenario: Export content or destination violates native guards

- **WHEN** export content exceeds 5 MiB or the selected final destination violates JSON or final-symlink guardrails
- **THEN** the backend does not write a file and emits a failed task-export result with a safe error

### Requirement: Generic renderer-controlled file commands are unavailable

The Tauri invoke surface MUST NOT expose generic commands that read or write arbitrary renderer-provided filesystem paths.

#### Scenario: Invoke surface is inspected

- **WHEN** the native command registration and renderer task-transfer code are inspected
- **THEN** neither exposes a generic file-path read or write command for task transfer
