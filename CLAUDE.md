# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pomodoroz is a cross-platform Pomodoro desktop app, forked from [Pomatez](https://github.com/zidoro/pomatez). Standalone desktop app with no server or cloud — all data is local.

**Current runtime: Tauri.**

### Key Documents

| Document                           | Purpose                                            |
| ---------------------------------- | -------------------------------------------------- |
| `AGENTS.md`                        | Agent operational rules                            |
| `CHANGELOG.md` / `CHANGELOG.pt.md` | Implemented changes                                |
| `docs/IMPROVEMENTS.md`             | Pending improvements roadmap (technical + product) |
| `docs/MIGRATION_TO_TAURI.md`       | Migration closure reference                        |
| `docs/RELEASE_OPERATIONS.md`       | Release flow, updater pipeline, validation         |

## Repository Layout

```text
<repo-root>/
├── AGENTS.md
├── CLAUDE.md
├── package.json                 # Root operational manifest (pnpm scripts + deps)
├── src/                         # React renderer source (flat at repo root)
├── app/
│   └── renderer/                # React renderer shell (Vite dev + build)
├── src-tauri/                   # Tauri backend (Rust commands, tray, updater)
├── docs/                        # Technical docs (migration, release ops, backlog)
└── scripts/                     # Helper scripts (validation, install, release, version sync)
```

## Current Stack

- **Tauri** `2.x` (Rust backend + native bundling)
- **React** `19.x` with `createRoot`
- **Vite** `8.x` — renderer dev server and build
- **TypeScript** `6.0.x`
- **React Router** `7.x` (HashRouter)
- **Redux Toolkit** `2.x` — state management
- **Styled Components** — CSS-in-JS
- **@dnd-kit** — drag-and-drop
- **i18next** — internationalization (en, pt, es, ja, zh, de, fr)
- **ESLint 10** + `@eslint-react` + `@typescript-eslint 8` (flat config)
- **pnpm** `10.x` — package manager
- **Node.js** `v24` (see `.nvmrc`)

## Development Commands

All commands run from the repo root:

```sh
pnpm install

pnpm dev:app                 # Main dev flow (Tauri + Vite renderer)

pnpm lint                    # ESLint (renderer)
pnpm typecheck:renderer      # Typecheck renderer
pnpm build:renderer          # Build renderer assets
pnpm tauri build --no-bundle # Build native release binary
pnpm format                  # Prettier across all files

# Release helper scripts (version + tag + push)
pnpm release:tag -- 26.4.10
pnpm release:tag:dry -- 26.4.10
pnpm release:tag:ps -- -Version 26.4.10
```

Validation wrapper scripts:

```sh
./scripts/validar-tudo.sh                # Interactive menu
./scripts/validar-tudo.sh --quick-dev    # Quick lint + typecheck + tauri dev
./scripts/validar-tudo.sh --run-packed   # Build + run local Tauri release binary
./scripts/validar-tudo.sh --installers   # Build platform installers
```

## Architecture

### Renderer <-> Native Bridge

- **Connector abstraction**: `src/contexts/ConnectorContext.tsx` — exposes the Tauri-only connector provider and `getInvokeConnector()`.
- **Connector provider**: `src/contexts/connectors/TauriConnector.tsx` — syncs renderer settings with native tray/window/updater behavior and surfaces native communication errors.
- **Active native connector**: `src/contexts/connectors/TauriInvokeConnector.ts` — Tauri command/event adapter through `invoke`, `emit`, and `listen`.
- **Rust command bridge**: `src-tauri/src/commands/` + registrations in `src-tauri/src/lib.rs`.

### State Management

Redux Toolkit slices in `src/store/`:

| Slice            | Purpose                                               |
| ---------------- | ----------------------------------------------------- |
| `timer/`         | Timer state, countdown, session rounds                |
| `tasks/`         | Task lists, items, drag-and-drop ordering             |
| `taskSelection/` | Active task selection for timer context               |
| `settings/`      | User preferences (theme, notifications, breaks, etc.) |
| `statistics/`    | Focus/break/idle time tracking, per-task stats        |
| `config/`        | App config (window state, first-run flags)            |
| `update/`        | In-app updater state                                  |

React contexts: connector bridge, theme, counter.
State persistence is local (`localStorage` + native layer where applicable).

### Security / Updater

- Tauri capabilities are defined in `src-tauri/capabilities/`.
- Updater plugin config lives in `src-tauri/tauri.conf.json` (`plugins.updater`).
- Release updater artifacts are signed in CI and published to GitHub Releases.

## Known Non-Blocking Warnings

- Wayland/DBus/KWin logs on Linux (environment-specific, generally harmless)
- `@typescript-eslint` declares peer support `<6` while project uses TS 6 (non-blocking)
- pnpm global install may require permission-aware setup (`PNPM_HOME` / user-local bin)

## Key Policies

- **Updater feed**: keep updater endpoints pointing to this fork (`cjdduarte/pomodoroz`).
- **Documentation**: log implemented changes in `CHANGELOG.md` and `CHANGELOG.pt.md`.
- **Release Notes Source of Truth**: GitHub Release title/notes are generated from `CHANGELOG.md` section `## [x.y.z]`.
- **Changelog Fill Rule**: never add new items to a published version; keep next version at top as `A definir` (PT) / `TBD` (EN), set date only on release day.
- **Agent Release Prompt Rule**: before suggesting `./scripts/release.sh` or `./scripts/release.ps1`, the agent must set `YYYY-MM-DD` in both changelog headers of the target version.
- **Language**: code in English; logs/comments in Portuguese (PT-BR) where appropriate.
- **Commits**: commit messages and PR titles in English (Conventional Commits).
- **AI Finalization Output**: after each finalized implementation, suggest a ready-to-use Conventional Commit message in English.
- **Dependencies**: explain options and wait for confirmation before adding new libraries.
