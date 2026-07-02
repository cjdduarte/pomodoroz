## ADDED Requirements

### Requirement: Changelogs retain next-version placeholders

Both changelogs SHALL keep an unreleased next-version placeholder at the top and MUST record this audit-hardening batch under that placeholder instead of editing a published version.

#### Scenario: New implemented changes are documented

- **WHEN** this hardening batch changes code, scripts, workflows, or docs
- **THEN** `CHANGELOG.md` and `CHANGELOG.pt.md` contain matching top entries under `TBD` / `A definir`

### Requirement: Operational version docs match local manifests

Version and contributor documentation SHALL match the versions declared in local manifests after the batch is complete.

#### Scenario: Version documentation is reviewed

- **WHEN** `docs/VERSIONS.md` and `CONTRIBUTING.md` are compared with `package.json` and `src-tauri/Cargo.toml`
- **THEN** their app, pnpm, and major dependency/toolchain references are not stale

### Requirement: Roadmap and handoff reflect current state

Operational planning and handoff documents SHALL not describe obsolete release baselines or already-completed next steps as current.

#### Scenario: Next agent resumes the project

- **WHEN** `RETOMADA.md` is read after this batch
- **THEN** it describes the current hardening batch state and objective next steps without stale 26.6.1 handoff content

#### Scenario: Roadmap is used for next planning

- **WHEN** `docs/IMPROVEMENTS.md` is read after this batch
- **THEN** its current checkpoint and next execution order align with the latest release baseline and remaining open items
