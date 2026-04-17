# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pomodoroz is a cross-platform Pomodoro desktop app, forked from [Pomatez](https://github.com/zidoro/pomatez). Standalone desktop app with no server or cloud — all data is local.

**Current runtime: Electron.** Migrating to Tauri — see `docs/MIGRATION_ELECTRON_TO_TAURI.md`.

### Key Documents

| Document                              | Purpose                                        |
| ------------------------------------- | ---------------------------------------------- |
| `AGENTS.md`                           | Agent operational rules                        |
| `CHANGELOG.md` / `CHANGELOG.en.md`    | Implemented changes                            |
| `docs/MIGRATION_ELECTRON_TO_TAURI.md` | Migration plan (Electron -> Tauri)             |
| `docs/RELEASE_OPERATIONS.md`          | Release flow, auto-update, checklists          |
| `docs/PRODUCT_BACKLOG.md`             | Future features (gamification, adaptive focus) |

## Repository Layout (Current — Electron)

```text
<repo-root>/
├── AGENTS.md
├── CLAUDE.md
├── package.json                 # Root operational manifest (pnpm scripts + deps)
├── src/                         # React renderer source (flat at repo root)
├── app/
│   ├── electron/                # Electron main process (entry: src/main.ts)
│   └── renderer/                # React renderer shell (Vite dev + build)
├── docs/                        # Technical docs (migration, release ops, backlog)
└── scripts/                     # Helper scripts (validation, install, version sync)
```

## Current Stack

- **Electron** `41.x` — main process + preload (sandbox enabled)
- **React** `19.x` with `createRoot`
- **Vite** `8.x` — renderer dev server and build
- **TypeScript** `6.0.x`
- **React Router** `7.x` (HashRouter)
- **Redux Toolkit** `2.x` — state management
- **Styled Components** — CSS-in-JS
- **@dnd-kit** — drag-and-drop
- **i18next** — internationalization (en, pt, es, ja, zh)
- **ESLint 9** + `@typescript-eslint 8` (flat config)
- **pnpm** `10.x` — package manager
- **Node.js** `v24` (see `.nvmrc`)

## Development Commands

All commands run from the repo root:

```sh
pnpm install

pnpm dev:app                 # Main dev flow (Electron + Vite renderer in parallel)
pnpm dev:renderer            # Renderer only (Vite on localhost:3000)
pnpm dev:main                # Electron main only (waits for renderer on port 3000)

pnpm lint                    # Lint + typecheck: renderer + electron
pnpm build                   # Build renderer + electron
pnpm build:dir               # Build unpacked Electron app (for smoke testing)
pnpm format                  # Prettier across all files

# Platform-specific packaged builds
pnpm build:win
pnpm build:mac
pnpm build:linux
pnpm build:mwl               # All platforms

# Release helper scripts (version + tag + push)
pnpm release:tag -- 26.4.10
pnpm release:tag:dry -- 26.4.10
pnpm release:tag:ps -- -Version 26.4.10
```

Validation wrapper scripts:

```sh
./scripts/validar-tudo.sh              # Interactive menu
./scripts/validar-tudo.sh --dev        # Quick dev validation
./scripts/validar-tudo.sh --run-packed # Build + run packaged app
```

Smoke test a packaged build:

```sh
pnpm build:dir
./app/electron/dist/linux-unpacked/pomodoroz
```

## Architecture

### Package Layout

Root package is the source of truth for dependencies and day-to-day scripts.  
`app/electron` and `app/renderer` remain as runtime/build shells.

### Renderer <-> Electron Bridge

- **Connector abstraction**: `src/contexts/ConnectorContext.tsx` — provides a `useConnector()` hook for all renderer-to-native calls.
- **Active connector**: `src/contexts/InvokeConnector.tsx` — Electron-specific implementation using `window.electron` (exposed by preload).
- **IPC contracts**: `src/ipc/index.ts` (renderer) and `app/electron/src/ipc.ts` (main/preload) — local typed channel map.
- **Electron main handlers**: `app/electron/src/main.ts` — IPC handlers, window management, tray, and system integration.

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
| `update/`        | Auto-updater state                                    |

React contexts: connector (IPC bridge), theme, counter (timer display).
Renderer persists state in `localStorage`. Electron uses `electron-store` for native settings.

### Electron Security

- `sandbox: true` enabled on BrowserWindow
- Preload script adapted for sandbox constraints
- IPC channels typed via local IPC contracts (`src/ipc` and `app/electron/src/ipc.ts`)
- Auto-updater active via GitHub Releases for Windows (NSIS) and Linux AppImage
- Linux packaged without `APPIMAGE` keeps explicit updater skip by design

## Known Non-Blocking Warnings

- Wayland/DBus/KWin logs on Linux (environment-specific, harmless)
- `@typescript-eslint` declares peer support `<6` while project uses TS 6 (non-blocking)
- pnpm global install may require permission-aware setup (`PNPM_HOME` / user-local bin)

## Key Policies

- **Updater**: Keep release feed on this fork (`cjdduarte/pomodoroz`). Do not point updater to original Pomatez feed.
- **Documentation**: Log implemented changes in `CHANGELOG.md` and `CHANGELOG.en.md`. Track migration in `docs/MIGRATION_ELECTRON_TO_TAURI.md`. Track future features in `docs/PRODUCT_BACKLOG.md`.
- **Release Notes Source of Truth**: GitHub Release title/notes are generated from `CHANGELOG.md` section `## [x.y.z]`. Always update both changelogs before tag/release.
- **Changelog Fill Rule**: Never add new items to a published version. Keep the next version at the top as `A definir` (PT) / `TBD` (EN), set the date only on release day, and move subsequent work to the next version.
- **Agent Release Prompt Rule**: Before suggesting `./scripts/release.sh` or `./scripts/release.ps1`, the agent must set `YYYY-MM-DD` in both changelog headers of the target version.
- **Language**: Code in English. Logs/comments in Portuguese (PT-BR) where appropriate.
- **Commits**: Commit messages and PR titles must be in English (Conventional Commits).
- **AI Finalization Output**: At the end of each finalized implementation, suggest a ready-to-use Conventional Commit message in English.
- **Dependencies**: Explain options and wait for confirmation before adding new libraries.
