# Pomodoroz — Agent Rules

> Operational rules for AI agents working on this codebase.
> For project overview, stack, and commands, see `CLAUDE.md`.
> For migration plan, see `docs/MIGRATION_ELECTRON_TO_TAURI.md`.

---

## Scope

- Platform: Electron desktop app (migrating to Tauri — see migration doc).
- Architecture: standalone, no server, no cloud. All data is local.
- Direction: incremental evolution with focus on stability, security, and predictability.

---

## Mission

1. Preserve functional stability (timer, tasks, settings, tray, compact mode).
2. Maintain security hardening (preload/IPC/sandbox/CSP).
3. Evolve dependencies in small, testable, reversible blocks.
4. Keep cross-platform builds green (Windows, macOS, Linux).
5. Log changes in CHANGELOG; track decisions in docs.

---

## Rules

1. Work in small, testable, reversible blocks.
2. Preserve UX and behavior of timer/tasks/settings.
3. Before adding a new library: present options, impact, and wait for confirmation.
4. Never swap technology silently.
5. Code in English. Comments/logs in Portuguese (PT-BR) where appropriate.
6. Commit messages and PR titles must be in English (Conventional Commits).
7. At the end of each finalized implementation, AI agents must suggest a ready-to-use commit message (Conventional Commits, English).

---

## Documentation Policy

| What                              | Where                                          |
| --------------------------------- | ---------------------------------------------- |
| Implemented changes               | `CHANGELOG.md` (PT) and `CHANGELOG.en.md` (EN) |
| Migration plan                    | `docs/MIGRATION_ELECTRON_TO_TAURI.md`          |
| Release/update operations         | `docs/RELEASE_OPERATIONS.md`                   |
| Product backlog (future features) | `docs/PRODUCT_BACKLOG.md`                      |
| Agent operational rules           | This file (`AGENTS.md`)                        |
| Claude Code guide                 | `CLAUDE.md`                                    |

Do not create loose specs/checklists for topics already covered in the documents above.

### Changelog Rules

1. Source of truth for GitHub Release notes: `CHANGELOG.md` section `## [x.y.z]`.
2. Before creating a tag/release, update both `CHANGELOG.md` and `CHANGELOG.en.md`.
3. Never edit items of an already-published version; new changes go in the next version.
4. Keep the next version at the top as `A definir` (PT) / `TBD` (EN); set date only on release day.
5. Do not create tag `v*` without a valid entry in both changelogs.
6. When an AI agent suggests running `./scripts/release.sh` or `./scripts/release.ps1`, it must first set the target version date (`YYYY-MM-DD`) in both changelog headers for that version.

---

## MCP (Recommended Usage)

| MCP                 | When to use                              |
| ------------------- | ---------------------------------------- |
| context7            | API and official documentation questions |
| sequential-thinking | Planning larger migrations               |
| playwright          | UI behavior investigation                |

Use MCP as decision support; do not duplicate history or roadmap in this file.
