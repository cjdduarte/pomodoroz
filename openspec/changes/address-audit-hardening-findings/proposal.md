## Why

The 2026-07-02 audit found concrete risks in local-state recovery, Tauri file IPC, release/version automation, timer/task behavior, CI gates, and operational documentation. These issues should be handled as one traceable hardening batch because several fixes protect user data or future releases and need coordinated tests/docs.

## What Changes

- Preserve recoverable local user data when persisted JSON is corrupted instead of treating corruption as an absent key.
- Harden the native JSON import/export bridge against symlink/path bypasses and oversized IPC payloads while preserving the existing dialog-driven UX.
- Align release scripts and workflows so version sync, changelog validation, CI gates, and updater feed generation behave predictably across platforms.
- Fix selected timer/task regressions from the audit: special-break missed windows and automatic day-color reset interaction with undo/redo; document the timer-session reset decision instead of silently changing it.
- Update operational docs/changelogs/roadmap references affected by the audit, without editing already-published release entries.
- Add focused tests and validation coverage for the high-risk changes.

## Capabilities

### New Capabilities

- `local-state-resilience`: Persisted local state distinguishes absent data from corrupted data and avoids destructive boot-time overwrites.
- `native-file-bridge-hardening`: Tauri import/export and related renderer-originated native payloads enforce defensive filesystem and size guardrails.
- `release-pipeline-integrity`: Release/version automation preserves manifest consistency and updater feed platform entries across supported release flows.
- `timer-task-regression-safety`: Timer and task automatic maintenance behavior remains predictable and does not corrupt user-facing history or scheduled breaks.
- `operational-documentation-governance`: Operational documents, changelog placeholders, and version references stay aligned with the project state after audit corrections.

### Modified Capabilities

- None. This repository has no existing OpenSpec capability specs yet.

## Impact

- Renderer utilities/store/timer/task code: `src/utils/storage.ts`, `src/store/**`, `src/contexts/CounterContext.tsx`, `src/routes/Tasks/TaskListGrid.tsx`.
- Native bridge/security: `src-tauri/src/commands/window_bridge.rs`, `src-tauri/capabilities/default.json`, Rust tests.
- Release/CI automation: `scripts/version-sync.mjs`, `scripts/release.ps1`, `.github/workflows/ci.yml`, `.github/workflows/release-autoupdate.yml`.
- Documentation: `CHANGELOG.md`, `CHANGELOG.pt.md`, `docs/IMPROVEMENTS.md`, `docs/RELEASE_OPERATIONS.md`, `docs/VERSIONS.md`, `docs/MIGRATION_TO_TAURI.md`, `CONTRIBUTING.md`, `RETOMADA.md`.
- Validation: existing pnpm/Vitest, TypeScript, renderer build, cargo check/test, and OpenSpec validation commands.
