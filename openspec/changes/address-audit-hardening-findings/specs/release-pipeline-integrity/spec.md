## ADDED Requirements

### Requirement: Version sync updates all local version manifests

The version synchronization script SHALL update the app version in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, and the local `pomodoroz_tauri` package entry in `src-tauri/Cargo.lock`.

#### Scenario: Release validation is skipped

- **WHEN** a release script runs `version:sync` with `--skip-validate`
- **THEN** the resulting release commit still contains synchronized Node, Tauri config, Cargo manifest, and Cargo lock versions

### Requirement: Release scripts validate changelog before mutating manifests

Both Unix and PowerShell release scripts SHALL validate target-version changelog headers and matching dates before running version synchronization.

#### Scenario: PowerShell release has missing changelog header

- **WHEN** `release.ps1` targets a version missing from one changelog
- **THEN** it fails before modifying package or Cargo version files

### Requirement: Updater feed generation preserves supported platforms

The release workflow SHALL upload `latest.json` only when the generated feed includes both active updater platforms: Windows NSIS and Linux AppImage.

#### Scenario: Manual dispatch builds only one platform without existing complete feed

- **WHEN** `release-autoupdate.yml` is manually dispatched for only Windows or only Linux and the release cannot provide both platform entries
- **THEN** the `sync-latest-json` job fails before uploading a partial `latest.json`

#### Scenario: Manual dispatch rebuilds one platform with existing complete assets

- **WHEN** `release-autoupdate.yml` is manually dispatched for one platform and the release already has complete updater assets for both platforms
- **THEN** the generated `latest.json` preserves both platform entries

### Requirement: CI Rust gates match local quality expectations

The CI workflow SHALL include Rust format, clippy, check, and test coverage consistent with the local preflight expectations where platform support allows it.

#### Scenario: Linux CI runs Rust quality gates

- **WHEN** the Linux Rust CI job runs
- **THEN** it executes format, clippy, cargo check, and cargo test gates

#### Scenario: Windows CI runs Rust tests

- **WHEN** the Windows Rust CI job runs
- **THEN** it executes cargo check and cargo test gates
