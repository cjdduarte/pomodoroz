## Context

The audit found that several high-risk paths are individually small but cross-cutting: storage reads happen during module initialization, native import/export commands trust renderer-provided paths, release scripts coordinate multiple manifests, and timer/task background behavior interacts with user history. The repository also has an active dirty worktree containing dependency/workflow updates, so implementation must be minimal and preserve existing uncommitted changes.

## Goals / Non-Goals

**Goals:**

- Protect recoverable local user data when `localStorage` JSON is malformed.
- Keep the current import/export UX while hardening the Rust command boundary.
- Make release/version automation deterministic across Unix and PowerShell paths.
- Fix audit-confirmed timer/task regressions without changing core UX contracts.
- Strengthen CI gates and bring operational docs back in sync with the current release baseline.
- Add focused tests for the new persistence/native behavior and changed reducers.

**Non-Goals:**

- No new runtime libraries.
- No migration away from Redux, styled-components, Tauri, pnpm, or the current release architecture.
- No release tag, push, installer publication, or updater E2E execution.
- No broad cleanup of every low-severity audit finding in this batch.
- No behavioral change to the deliberate timer-session reset-on-restart policy unless the operator later asks for persistence.

## Decisions

1. **Preserve corrupted storage with local backup before replacement.**
   - Decision: add a storage read API that returns `ok`, `missing`, or `corrupt`, and record corrupted raw payloads under backup keys before boot-time defaults or later persistence can replace the original keys.
   - Rationale: disabling persistence after corruption would prevent users from saving new work; backing up the raw value preserves recovery while allowing the app to continue.
   - Alternative considered: never write over corrupted keys. Rejected because it would make subsequent valid edits non-persistent until manual repair.

2. **Harden path handling inside Rust commands, not only in the renderer dialog flow.**
   - Decision: reject symlink paths, validate `.json` before and after canonicalization where possible, keep the 5 MiB JSON content limit, and use defensive limits for renderer-originated binary/text payloads.
   - Rationale: Tauri commands are the trust boundary. Renderer filters are useful UX, but command-level validation must stand alone.
   - Alternative considered: restrict import/export to a fixed app directory. Rejected because the existing UX intentionally lets users import/export backups anywhere selected by native dialogs.

3. **Update `Cargo.lock` directly in `version-sync.mjs`.**
   - Decision: sync the local package version entry for `pomodoroz_tauri` in `src-tauri/Cargo.lock` when the package version changes.
   - Rationale: this keeps `--skip-validate` deterministic without invoking networked cargo resolution from the version-sync script.
   - Alternative considered: run `cargo update -p pomodoroz_tauri --precise <version>`. Rejected for the script because it may require the cargo toolchain and is unnecessary for the local package version entry.

4. **Make partial updater dispatch safe by requiring complete feed output.**
   - Decision: when `sync-latest-json` runs, it must produce both Windows and Linux updater platform entries, using existing release assets when available; otherwise it fails instead of uploading a partial `latest.json`.
   - Rationale: the in-app updater feed should never silently drop a supported platform.
   - Alternative considered: always allow single-platform feeds. Rejected because this fork documents Windows NSIS and Linux AppImage as active updater channels.

5. **Keep automatic task maintenance out of undo/redo history.**
   - Decision: introduce a dedicated automatic day-color reset action handled outside tracked task history while keeping manual reset undoable.
   - Rationale: Ctrl+Z should reverse user actions, not restore stale daily maintenance state.

6. **Treat timer round persistence as a documented policy, not an implementation change.**
   - Decision: document that active timer session state is intentionally not persisted in this batch.
   - Rationale: persisting active timers has UX and correctness implications around sleep/restart and should be designed separately.

## Risks / Trade-offs

- **Backup keys can accumulate after repeated corruption** -> keep names deterministic enough to identify and document the behavior; leave cleanup to a future maintenance item if needed.
- **Rust path canonicalization can reject some edge-case valid paths** -> validate new files through their parent directory and existing files through their canonical path so normal export/import remains supported.
- **Partial release dispatch may fail more often** -> this is intentional; failing before uploading a partial updater feed is safer than silently dropping a platform.
- **Special-break window matching can trigger after app resume inside the configured window** -> this matches the audit recommendation and should happen only once per configured break per day.
- **CI gets slower with extra Rust gates** -> acceptable because local preflight already expects these checks.

## Migration Plan

1. Add persistence/storage helpers and tests.
2. Harden native file/payload commands and capability permissions; extend Rust tests.
3. Fix release/version scripts and workflow feed generation.
4. Fix timer/task behavior and add focused reducer/helper tests where practical.
5. Update CI and operational docs/changlog placeholders.
6. Run OpenSpec validation and applicable local gates.

Rollback is file-level: each section is small and reversible. If a native guard proves too strict, revert only the affected `window_bridge.rs` guard while preserving storage/release fixes.

## Open Questions

- Whether to implement full timer state persistence is intentionally deferred; this batch documents the current reset behavior instead of changing it.
- Pinning third-party GitHub Actions by SHA and pinning `linuxdeploy` checksums remains a follow-up that requires selecting exact trusted upstream revisions.
