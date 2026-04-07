# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pomodoroz is a cross-platform Pomodoro desktop app (Electron-only), forked from [Pomatez](https://github.com/zidoro/pomatez). It is a standalone desktop app with no server or cloud — all data is local.

Operational agent rules: `AGENTS.md`.
Implemented changes tracked in: `CHANGELOG.md`.
Technical decisions, roadmap, and pending items tracked in: `docs/DECISOES_TECNICAS_2026.md`.

## Repository Layout

```text
<repo-root>/                     # Git root AND monorepo root
├── AGENTS.md                    # Agent operation rules (no roadmap/history duplication)
├── CLAUDE.md                    # This file
├── package.json                 # Root workspace config (Lerna + Yarn Classic)
├── app/
│   ├── electron/                # Electron main process (entry: src/main.ts)
│   ├── renderer/                # React renderer (Vite dev + build)
│   └── shareables/              # @pomodoroz/shareables (shared IPC channel constants)
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
- **@dnd-kit** — drag-and-drop (replaced `react-beautiful-dnd`)
- **i18next** — internationalization (en, pt, es, ja, zh)
- **ESLint 9** + `@typescript-eslint 8` (flat config)
- **Lerna 9** + Nx — monorepo orchestration
- **Yarn Classic** `1.22.x` — package manager
- **Node.js** `v24` (see `.nvmrc`)

## Development Commands

All commands run from the repo root:

```sh
yarn install

yarn dev:app                 # Main dev flow (Electron + Vite renderer in parallel)
yarn dev:renderer            # Renderer only (Vite on localhost:3000)
yarn dev:main                # Electron main only (waits for renderer on port 3000)

yarn lint                    # Lint + typecheck: renderer + electron + shareables
yarn build                   # Build all workspaces
yarn build:dir               # Build unpacked Electron app (for smoke testing)
yarn format                  # Prettier across all files

# Platform-specific packaged builds
yarn build:win
yarn build:mac
yarn build:linux
yarn build:mwl               # All platforms
```

Validation wrapper scripts:

```sh
./scripts/validar-tudo.sh              # Interactive menu
./scripts/validar-tudo.sh --dev        # Quick dev validation
./scripts/validar-tudo.sh --run-packed # Build + run packaged app
```

Smoke test a packaged build:

```sh
yarn build:dir
./app/electron/dist/linux-unpacked/pomodoroz
```

Local install/uninstall (AppImage + desktop launcher):

```sh
./scripts/install.sh
./scripts/uninstall.sh
```

## Architecture

### Monorepo

Three workspaces under `app/*`, orchestrated by Lerna. Yarn Classic manages dependencies at the root. The `prebuild` script ensures `@pomodoroz/shareables` and the electron workspace are prepared before builds.

### Renderer <-> Electron Bridge

- **Connector abstraction**: `app/renderer/src/contexts/ConnectorContext.tsx` — provides a `useConnector()` hook for all renderer-to-native calls.
- **Active connector**: `app/renderer/src/contexts/InvokeConnector.tsx` — Electron-specific implementation using `window.electron` (exposed by preload).
- **IPC channel constants**: `app/shareables/src/index.ts` — shared between renderer and main process.
- **Electron main handlers**: `app/electron/src/main.ts` — IPC handlers, window management, tray, and system integration.

### State Management

Redux Toolkit slices in `app/renderer/src/store/`:

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
- IPC channels typed via `@pomodoroz/shareables`
- Auto-updater disabled (fork has no release channel yet — see updater policy in `docs/DECISOES_TECNICAS_2026.md`)

## Known Non-Blocking Warnings

- Wayland/DBus/KWin logs on Linux (environment-specific, harmless)
- `@typescript-eslint` declares peer support `<6` while project uses TS 6 (non-blocking)
- Yarn Classic may warn about cache/global folders depending on permissions

## Key Policies

- **Updater**: Keep auto-update disabled until fork has its own release channel. Do not point to the original Pomatez feed. Details in `docs/DECISOES_TECNICAS_2026.md`.
- **Documentation**: Log implemented changes in `CHANGELOG.md`. Track future work and technical decisions in `docs/DECISOES_TECNICAS_2026.md`. Keep `AGENTS.md` for agent operational rules.
- **Language**: Code in English. Logs/comments in Portuguese (PT-BR) where appropriate.
- **Dependencies**: Explain options and wait for confirmation before adding new libraries.
