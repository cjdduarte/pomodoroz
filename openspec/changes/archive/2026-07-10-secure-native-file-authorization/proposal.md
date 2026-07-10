## Why

The current task import/export bridge accepts a renderer-provided `file_path`. Even with extension, size, and symlink checks, a compromised renderer can invoke the commands with any user-accessible JSON path. The native dialog is currently a UX step, not an authorization boundary.

## What Changes

- Move task-import file selection and reading into one native Tauri command.
- Move task-export file selection and writing into one native Tauri command.
- Remove the generic renderer-callable `read_text_file` and `write_text_file` commands.
- Preserve current task transfer behavior, cancellation handling, JSON limits, and user-visible result events.
- Add focused Rust tests for task-transfer input validation and the absence of generic file commands from the invoke handler.

## Capabilities

### New Capabilities

- `task-transfer-native-authorization`: Task import and export authorize file access through native dialogs owned by the backend rather than renderer-supplied paths.

### Modified Capabilities

- None.

## Impact

- Native Tauri bridge: `src-tauri/src/commands/window_bridge.rs` and `src-tauri/src/lib.rs`.
- Renderer connector: `src/contexts/connectors/TauriInvokeConnector.ts`.
- Existing task-transfer result contracts and Settings UI behavior.
- Rust tests and changelogs; no new runtime dependency is required because `tauri-plugin-dialog` is already installed.
