## 1. Local State Resilience

- [x] 1.1 Add a status-aware storage read API that reports `ok`, `missing`, or `corrupt` and preserves raw malformed values.
- [x] 1.2 Update startup persistence for `state` and `statistics` so corrupted keys are backed up before any default replacement.
- [x] 1.3 Add Vitest coverage for missing, valid, and corrupted storage reads plus backup-before-replace behavior.

## 2. Native File Bridge Hardening

- [x] 2.1 Harden `read_text_file` and `write_text_file` against symlink bypasses while preserving valid JSON import/export paths.
- [x] 2.2 Add defensive payload limits for notification sound, tray icon, and tray copy native commands.
- [x] 2.3 Narrow the opener capability to the URL-opening permission used by the renderer.
- [x] 2.4 Extend Rust tests for symlink rejection, JSON path validation, and native payload limits.
- [x] 2.5 Allow symlinked parent directories while still rejecting final file symlinks in JSON import/export validation.

## 3. Release And CI Integrity

- [x] 3.1 Update `version-sync.mjs` to synchronize the local `pomodoroz_tauri` entry in `src-tauri/Cargo.lock`.
- [x] 3.2 Reorder `release.ps1` so changelog validation runs before version synchronization.
- [x] 3.3 Update `release-autoupdate.yml` so `latest.json` generation fails instead of uploading a partial Windows-only or Linux-only feed.
- [x] 3.4 Remove obsolete custom `GH_TOKEN` secret validation language from release workflow/docs while preserving `github.token` for `gh` CLI usage.
- [x] 3.5 Add Rust fmt/clippy gates to Linux CI and cargo tests to Windows CI.
- [x] 3.6 Refresh Rust audit transitives where compatible and document temporary quick-xml RustSec ignores blocked by upstream Tauri/plist constraints.

## 4. Timer And Task Regression Fixes

- [x] 4.1 Trigger special breaks by configured time window with once-per-day deduplication.
- [x] 4.2 Keep automatic daily day-color cleanup out of task undo/redo history while preserving manual reset history.
- [x] 4.3 Document the active timer restart policy instead of persisting timer state in this batch.
- [x] 4.4 Add focused tests for task history behavior and any extracted timer special-break helpers.

## 5. Operational Documentation

- [x] 5.1 Add top next-version placeholders to `CHANGELOG.md` and `CHANGELOG.pt.md` with this hardening batch.
- [x] 5.2 Refresh `docs/RELEASE_OPERATIONS.md`, `docs/VERSIONS.md`, `CONTRIBUTING.md`, and stale migration/roadmap references touched by the audit.
- [x] 5.3 Rewrite `RETOMADA.md` to describe the current hardening batch and remove stale 26.6.1 handoff content.
- [x] 5.4 Mark or annotate the audit report where severity/wording was refined during review.

## 6. Validation

- [x] 6.1 Run `openspec validate address-audit-hardening-findings --strict` and `openspec validate --all --strict`.
- [x] 6.2 Run `pnpm lint`, `pnpm typecheck:renderer`, and `pnpm test:run`.
- [x] 6.3 Run `pnpm build:renderer`.
- [x] 6.4 Run `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `cargo check --all-targets --all-features`, and `cargo test --manifest-path src-tauri/Cargo.toml` where the local environment allows.
