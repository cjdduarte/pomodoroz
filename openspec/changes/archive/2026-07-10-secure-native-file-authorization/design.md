## Context

Task transfer currently opens a native dialog from the renderer and then invokes generic Rust commands with the selected path. The previous hardening change validates extension, file type, final symlink, and payload size, but the renderer can still invoke the commands with a path that was never selected by a user.

The repository already includes and initializes `tauri-plugin-dialog`; no new dependency is needed. The Settings UI already consumes asynchronous `TASKS_IMPORT_RESULT` and `TASKS_EXPORT_RESULT` events, so the native dialog callback can preserve the existing user-facing result contract.

## Goals / Non-Goals

**Goals:**

- Make native dialog selection the authorization boundary for task import and export.
- Keep task JSON limits, final-path symlink checks, regular-file checks, cancellation behavior, and Settings notices.
- Remove renderer-callable generic file-path commands from the Tauri invoke surface.
- Keep the change local to task transfer without changing task JSON format or storage behavior.

**Non-Goals:**

- No new dialog, filesystem, or runtime dependency.
- No arbitrary file-manager, attachment, or generic JSON editor feature.
- No change to task parsing, merge/replace semantics, or the 5 MiB transfer limit.
- No attempt to solve filesystem races beyond the existing final-path guard in this batch.

## Decisions

1. **Native commands own both dialog and file I/O.**
   - Replace `read_text_file(file_path)` with an import command that opens a JSON-only dialog, validates the selected final path, reads it, and emits the existing import result event.
   - Replace `write_text_file(file_path, content)` with an export command that validates the renderer-provided task JSON content, opens a save dialog, validates the selected final path, writes it, and emits the existing export result event.
   - This keeps the path entirely inside native code; the renderer never receives or submits an authorization path.

2. **Keep event-based completion rather than changing Settings UI flow.**
   - Native dialogs are callback-driven and the current Settings screen already listens for task-transfer result events.
   - The command returns only setup errors synchronously. Cancellation, selection, read/write failure, and success are reported through the established result event with the same fields.
   - Alternative: return opaque path tokens to the renderer. Rejected because it adds token state, expiry, and one-use lifecycle without improving the task-transfer UX over a fully native flow.

3. **Remove generic file commands completely.**
   - Delete `read_text_file` and `write_text_file` from the Rust command module and invoke handler.
   - Delete renderer imports of the JavaScript dialog plugin and direct invokes for these commands.
   - Alternative: retain them for possible future JSON features. Rejected because an unused generic filesystem primitive expands the privileged surface without a current consumer.

4. **Reuse existing validation helpers.**
   - Dialog-selected imports keep `.json`, regular-file, final-symlink, and 5 MiB checks.
   - Exports keep `.json`, final-symlink, and 5 MiB checks before writing.
   - The backend emits safe error text and logs technical context only where the existing logging policy permits it.

## Risks / Trade-offs

- [Native dialog callback cannot be scheduled] -> Return a synchronous setup error and preserve a terminal result event for every scheduled dialog callback.
- [User selects a filename containing non-UTF-8 data] -> Return a lossy display string only for the success notice; filesystem operations use `PathBuf`.
- [Validation-to-write filesystem race] -> Keep final-path symlink validation and document the remaining OS-level race; do not introduce platform-specific unsafe APIs in this focused change.
- [Result event is lost during Settings unmount] -> Existing listener cleanup remains valid; the operation still completes natively and a remounted screen can initiate a new transfer.

## Migration Plan

1. Add native task import/export command result types and dialog callback helpers.
2. Replace the renderer's dialog-plus-generic-command orchestration with native command invocations.
3. Remove generic command registrations and obsolete JavaScript dialog imports.
4. Add Rust tests for transfer input guards and invoke-surface regression coverage where practical.
5. Run renderer and Rust validation gates; rollback is limited to the bridge and connector files.

## Open Questions

- None. The existing native dialog plugin and event contracts support the chosen design.
