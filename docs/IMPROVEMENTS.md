# Corrections Roadmap — Pomodoroz

> Single source of truth for open corrections and operational hardening.
>
> Implemented work belongs in `CHANGELOG.md` / `CHANGELOG.pt.md`. Historical
> evidence belongs in audit reports and OpenSpec changes. Product ideas are
> retained only as deferred backlog below.

## Current Direction

The project is in a correction-first cycle. Work that changes code, data,
pipelines, or verifiable runtime behavior requires an OpenSpec change before
implementation. New dependencies still require an explicit impact review.

The active published baseline is `26.7.1`. Version `26.7.2` is prepared in
both changelogs with the release date `2026-07-10`.

## Active Corrections

### P0 — Security and Release Integrity

| ID  | Correction                                                                   | Status | Next action                                       |
| --- | ---------------------------------------------------------------------------- | ------ | ------------------------------------------------- |
| C2  | Pin release actions and Linux AppImage tooling; verify downloaded checksums  | Open   | Create a release supply-chain OpenSpec change.    |
| C3  | Require release admission checks for tag, manifests, both changelogs, and CI | Open   | Create a release admission OpenSpec change.       |
| C4  | Keep releases private until all platform assets and `latest.json` validate   | Open   | Include draft-to-publish flow in the same change. |

### P1 — Local Data and Core Behavior

| ID  | Correction                                                           | Status | Next action                                        |
| --- | -------------------------------------------------------------------- | ------ | -------------------------------------------------- |
| C5  | Validate persisted `state` and `statistics` schemas before hydration | Open   | Create a local-state resilience OpenSpec change.   |
| C6  | Apply the latest auto-update preference when a check is in flight    | Open   | Create an updater policy OpenSpec change.          |
| C7  | Align supported updater channels with the published release matrix   | Open   | Include in the updater policy change.              |
| C8  | Preserve active-task selection when a card moves between lists       | Open   | Create a timer/task regression OpenSpec change.    |
| C9  | Do not reset an active timer when unrelated duration settings change | Open   | Include in the timer/task regression change.       |
| C10 | Report native notification-audio failures and bound playback work    | Open   | Create a notification reliability OpenSpec change. |

### P2 — Cross-Platform and Operational Reliability

| ID  | Correction                                                                    | Status | Next action                                    |
| --- | ----------------------------------------------------------------------------- | ------ | ---------------------------------------------- |
| C11 | Add macOS CI coverage and verify declared Rust MSRV                           | Open   | Create a CI compatibility OpenSpec change.     |
| C12 | Keep release docs aligned with signed updater archives and supported channels | Open   | Include in the release admission change.       |
| C13 | Keep `RETOMADA.md`, `VERSIONS.md`, and release references current             | Open   | Update with every completed operational phase. |

### P3 — Regression Prevention and Maintenance

| ID  | Correction                                                                         | Status | Next action                                                               |
| --- | ---------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------- |
| C14 | Add tests for storage, statistics, settings, timer transitions, and task selection | Open   | Expand tests in small no-new-dependency batches.                          |
| C15 | Restore justified lint coverage for unused code and resource cleanup               | Open   | Audit disabled rules before changing their severity.                      |
| C16 | Remove verified dead code, unused dependencies, Yarn residue, and obsolete scripts | Open   | Handle as small, independently validated maintenance changes.             |
| C17 | Correct remaining operational documentation drift and platform prerequisites       | Open   | Address with the related correction, not as a standalone history rewrite. |

## Execution Order

1. Secure release supply chain and release admission (C2-C4, C12).
2. Protect local data and updater behavior (C5-C7).
3. Correct timer, task, and notification regressions (C8-C10).
4. Add cross-platform CI and operational controls (C11, C13).
5. Expand regression prevention and remove verified maintenance residue (C14-C17).

## Deferred Product Backlog

These items are intentionally deferred while corrections remain active. They
are not approved implementation work and must be reprioritized explicitly.

| ID  | Feature                            |
| --- | ---------------------------------- |
| B2  | Cadence presets                    |
| B4  | Break suggestion prompts           |
| B5  | Global play/pause hotkey           |
| B6  | Cadence insights in statistics     |
| B7  | Motivational completion messages   |
| B8  | Ambient sounds                     |
| B9  | No-judgment mode                   |
| B11 | Optional window focus on timer end |

## Document Boundaries

- `CHANGELOG.md` / `CHANGELOG.pt.md`: implemented and released changes.
- `docs/AUDITORIA_*.md`: historical evidence; not an active checklist.
- `openspec/changes/`: traceable scope, requirements, design, and tasks for
  operational changes.
- `docs/RELEASE_OPERATIONS.md` and `docs/VERSIONS.md`: current release and
  version operations.
- `RETOMADA.md`: current-session handoff only.
- `docs/decisions/ADR-0001-correction-first-roadmap.md`: rationale for this
  correction-first structure.
