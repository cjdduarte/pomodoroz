# Migration Guide: Electron to Tauri — Pomodoroz

> Reference date: 2026-04-09
>
> This document is the single source of truth for the Electron-to-Tauri
> migration plan. It replaces the previous `TECHNICAL_DECISIONS_2026.md`,
> `DECISOES_TECNICAS_2026.pt-BR.md`, and `POMODOROZ_SPEC.md`.

---

## 1. Decision: Port, Not Rewrite

The codebase analysis shows that ~80-90% of the renderer code is runtime-agnostic.
Rewriting from scratch would discard tested business logic (task CRUD with undo/redo,
drag-drop ordering, statistics tracking, 5-language i18n, and edge cases already fixed
across 7+ releases).

The only mandatory rewrite is the **Electron main process** (~2500 lines), which must
become Tauri Rust commands + plugins. Everything else can be ported incrementally.

### Portability Summary

| Layer                               | Files | Lines (approx) | Portability                              |
| ----------------------------------- | ----- | -------------- | ---------------------------------------- |
| Redux slices (7)                    | 7     | ~980           | 100% — runtime-agnostic                  |
| React components (64)               | 64    | ~4000+         | ~95% — only 10 files touch Electron IPC  |
| i18n (5 languages, 200+ keys)       | 10    | ~1200          | 100% — i18next works anywhere            |
| Styled Components (163 definitions) | 39    | ~2000+         | 100% — CSS-in-JS is framework-agnostic   |
| Custom hooks (11)                   | 11    | ~500+          | ~90% — few touch IPC                     |
| Electron main process               | 5+    | ~2500          | 0% — must be rewritten as Tauri commands |
| Shareables (IPC contracts)          | 1     | ~199           | Replace with Tauri command/event types   |

### Renderer Files With Direct Electron Coupling (10 of 176)

These are the only renderer files that reference `window.electron` or Electron APIs:

1. `contexts/connectors/ElectronConnector.tsx` — IPC send/receive (connector impl)
2. `contexts/ConnectorContext.tsx` — `isElectron()` detection
3. `contexts/InvokeConnector.tsx` — type definitions
4. `contexts/CounterContext.tsx` — direct `window.electron.receive()` (2 places)
5. `routes/Settings/TaskTransferSection.tsx` — direct `window.electron.send/receive()` (4 places)
6. `routes/Timer/Control/Control.tsx` — direct `window.electron.invoke()`
7. `components/Layout.tsx` — uses `getInvokeConnector()`
8. `components/Updater.tsx` — uses `getInvokeConnector()` + `window.Notification`
9. `extensions/window.extension.ts` — type definitions for `window.electron`
10. (style/theme files with connector integration)

The project already uses a **connector context pattern** (`ConnectorContext` / `ElectronConnector`).
Most Electron calls are routed through this abstraction. The migration path is: create a
`TauriConnector` that implements the same interface using `@tauri-apps/api`.

---

## 2. Stack: Current vs Target

| Layer               | Current (Electron)               | Target (Tauri)                                      | Migration effort               |
| ------------------- | -------------------------------- | --------------------------------------------------- | ------------------------------ |
| Runtime             | Electron 41.x                    | Tauri 2                                             | **Rewrite** main process       |
| Frontend            | React 19.x                       | React 19.x                                          | None                           |
| Bundler             | Vite 8.x                         | Keep current or latest compatible with Tauri plugin | Verify at Phase 0 kickoff      |
| Language (frontend) | TypeScript 6.0.x                 | Keep current or latest stable                       | Verify at Phase 0 kickoff      |
| Language (backend)  | Node.js / TypeScript             | Rust                                                | **New**                        |
| Router              | React Router 7 (HashRouter)      | React Router 7 (HashRouter)                         | None                           |
| State               | Redux Toolkit 2.x                | Redux Toolkit 2.x                                   | None (Zustand optional later)  |
| Styling             | Styled Components 6.x            | Styled Components 6.x                               | None (Tailwind optional later) |
| DnD                 | @dnd-kit core 6.x                | @dnd-kit core 6.x                                   | None                           |
| i18n                | i18next 26.x                     | i18next 26.x                                        | None                           |
| Package manager     | Yarn Classic 1.22.x              | pnpm                                                | Replace                        |
| Monorepo            | Lerna 9 + Nx                     | None (flat structure)                               | Remove                         |
| Packaging           | electron-builder 26.x            | Tauri (native)                                      | Replace                        |
| Persistence         | electron-store + localStorage    | tauri-plugin-store + localStorage                   | Replace wrapper                |
| Notifications       | Electron native Notification     | tauri-plugin-notification                           | Replace                        |
| Global shortcuts    | Electron globalShortcut          | tauri-plugin-global-shortcut                        | Replace                        |
| Auto-update         | electron-updater                 | tauri-plugin-updater                                | Replace                        |
| Tray                | Electron Tray API                | Tauri tray plugin                                   | Replace                        |
| Autostart           | Electron (custom)                | tauri-plugin-autostart                              | Replace                        |
| Tests               | Jest + ts-jest                   | Vitest (optional later)                             | Keep Jest initially            |
| Lint                | ESLint 9 flat config + Prettier  | ESLint 9 flat config + Prettier                     | None                           |
| Node.js             | v24                              | Keep current LTS                                    | Verify at Phase 0 kickoff      |
| Git hooks           | Husky + lint-staged + Commitizen | Husky + lint-staged + Commitizen                    | None (lefthook optional later) |

### What Changes for the User

Nothing. Same features, same interface, same experience.
Internally: ~90% less RAM, smaller bundle, no embedded Chromium.

---

## 3. Target Folder Structure

```text
pomodoroz/
├── src/                          # All React frontend (moved from app/renderer/src/)
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Routes
│   ├── pages/                    # One folder per page (renamed from routes/)
│   │   ├── timer/
│   │   ├── tasks/
│   │   ├── rotation/
│   │   ├── stats/
│   │   └── settings/
│   ├── components/               # Shared components
│   ├── store/                    # Redux slices (unchanged)
│   ├── hooks/                    # Custom hooks
│   ├── lib/                      # Pure utilities (storage wrapper, i18n, constants)
│   └── styles/                   # Global styles
│
├── src-tauri/                    # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs               # Entry point, window setup
│   │   ├── lib.rs                # Plugin registration and commands
│   │   └── commands/             # Rust functions exposed to React via invoke()
│   │       ├── storage.rs
│   │       ├── tray.rs
│   │       ├── window.rs
│   │       └── audio.rs
│   ├── icons/
│   ├── tauri.conf.json
│   └── Cargo.toml
│
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── pnpm-lock.yaml
```

---

## 4. Migration Phases

### Phase 0 — Tauri Scaffold + Dual Runtime

- Goal: get Tauri running alongside the existing renderer without breaking Electron.
- Scope:
  - `pnpm init` at root, install dependencies
  - `pnpm create tauri-app` scaffold into `src-tauri/`
  - Configure `vite.config.ts` with `@tauri-apps/vite-plugin`
  - Verify the renderer loads inside a Tauri window (no native features yet)
- Validation:
  - `pnpm dev` opens a Tauri window with the React UI
  - Electron dev flow still works in parallel (not broken yet)
- Exit criteria:
  - Tauri window renders the existing React app
  - No Electron code removed yet
- Rollback:
  - Delete `src-tauri/` and `pnpm-lock.yaml`

### Phase 1 — Connector Swap (Electron IPC to Tauri Commands)

- Goal: replace the Electron IPC bridge with Tauri commands.
- Scope:
  - Create `TauriConnector.tsx` implementing the same interface as `ElectronConnector.tsx`
  - Replace `ConnectorContext` detection to use Tauri when available
  - Implement Rust commands in `src-tauri/src/commands/` for each IPC channel
  - Fix the 10 renderer files that bypass the connector (direct `window.electron` calls)
  - Replace `@pomodoroz/shareables` IPC constants with Tauri command/event types
- Validation:
  - Timer works (start/pause/skip/reset)
  - Settings persist across restarts
  - Tasks CRUD works
- Exit criteria:
  - All renderer-to-native communication goes through Tauri
  - No remaining references to `window.electron`
- Rollback:
  - Revert connector changes; `ElectronConnector` is still in git history

### Phase 2 — Native Features (Rust Implementation)

Migrate Electron main process features to Tauri plugins, one at a time:

| Sub-phase | Feature                           | Tauri equivalent               | Complexity |
| --------- | --------------------------------- | ------------------------------ | ---------- |
| 2a        | System tray + context menu        | `tauri::tray`                  | Medium     |
| 2b        | Notifications                     | `tauri-plugin-notification`    | Low        |
| 2c        | Global shortcuts                  | `tauri-plugin-global-shortcut` | Low        |
| 2d        | Always on top + window management | `tauri::window` API            | Low        |
| 2e        | Fullscreen break                  | `tauri::window` + custom logic | Medium     |
| 2f        | Auto-update                       | `tauri-plugin-updater`         | Medium     |
| 2g        | Open at login                     | `tauri-plugin-autostart`       | Low        |
| 2h        | File dialogs (task import/export) | `tauri-plugin-dialog`          | Low        |
| 2i        | Custom notification sound         | Rust audio playback            | Medium     |

- Validation per sub-phase:
  - Feature works identically to Electron version
  - No regression in previously migrated features
- Exit criteria:
  - All native features from Electron main process work in Tauri
  - Electron main process code is no longer needed
- Rollback:
  - Each sub-phase is independent; revert individual Rust commands if needed

### Phase 3a — Replace Package Manager (Yarn Classic to pnpm)

- Goal: switch package manager before touching folder structure.
- Scope:
  - Install pnpm, create `pnpm-workspace.yaml`
  - Generate `pnpm-lock.yaml`, remove `yarn.lock`
  - Update CI and scripts to use `pnpm`
  - Keep monorepo structure intact (still `app/*` workspaces)
- Validation:
  - `pnpm install` succeeds
  - `pnpm dev` / `pnpm build` / `pnpm lint` work
- Exit criteria:
  - No remaining Yarn references in scripts or CI
- Rollback:
  - Restore `yarn.lock`, remove `pnpm-lock.yaml`

### Phase 3b — Remove Monorepo (Flatten Structure)

- Goal: move to flat structure, remove Lerna/Nx.
- Scope:
  - Move `app/renderer/src/` to `src/`
  - Remove `app/electron/`, `app/shareables/`
  - Remove Lerna, Nx from dependencies
  - Update all import paths
  - Consolidate to single `package.json`
- Validation:
  - `pnpm dev` works
  - `pnpm build` works
  - `pnpm lint` works
- Exit criteria:
  - No monorepo tooling remains
  - Single `package.json` at root
- Rollback:
  - Restore monorepo structure from git history

### Phase 4 — CI for Tauri

- Goal: CI pipeline for the new stack.
- Scope:
  - `ci.yml`: lint + typecheck + test on PR
  - `release.yml`: matrix build (ubuntu/macos/windows) with `tauri-apps/tauri-action`
  - Node 24 LTS + pnpm with cache
  - Rust toolchain setup
- Validation:
  - Pipeline passes on PR and push
  - Release artifacts generated for all platforms
- Exit criteria:
  - Gate failures block merge
  - Release flow produces .dmg, .exe, .AppImage
- Rollback:
  - Revert workflow files

### Phase 5 (optional) — Redux Toolkit to Zustand

- Goal: simplify state management.
- Scope:
  - Replace Redux slices with Zustand stores, one at a time
  - Remove Redux Toolkit, react-redux dependencies
  - Components use hooks directly (no Provider)
- When: only after phases 0-4 are stable.
- Not required for Tauri migration; purely a code quality improvement.

### Phase 6 (optional) — Styled Components to Tailwind CSS

- Goal: remove CSS-in-JS runtime.
- Scope:
  - Install Tailwind CSS 4
  - Convert styled components to utility classes, one page at a time
  - Remove styled-components dependency
- When: only after phases 0-4 are stable.
- Not required for Tauri migration.

### Phase 7 (optional) — Jest to Vitest

- Goal: faster test cycle integrated with Vite.
- Scope:
  - Replace Jest config with Vitest
  - Migrate test files (mostly config changes)
- When: only after phases 0-4 are stable.

---

## 4.1 Cross-Cutting Rule: Scripts and CI

### Scripts (`scripts/`)

Every migration phase that changes the build flow, package manager, or folder structure
**must** verify and update the helper scripts accordingly:

| Script                      | Purpose                        | Phases that affect it             |
| --------------------------- | ------------------------------ | --------------------------------- |
| `validar-tudo.sh` / `.ps1`  | Dev validation wrapper         | 1, 3a, 3b (paths, commands)       |
| `install.sh` / `.ps1`       | Local AppImage/desktop install | 3b (artifact paths)               |
| `uninstall.sh` / `.ps1`     | Local uninstall                | 3b (artifact paths)               |
| `release.sh` / `.ps1`       | Release flow (tag, publish)    | 3a, 3b, 4 (pkg manager, CI)       |
| `version.sh` / `.ps1`       | Version bump helper            | 3b (package.json location)        |
| `version-sync.mjs`          | Sync version across workspaces | 3b (may be removed with monorepo) |
| `check-updates.sh` / `.ps1` | Dependency update checker      | 3a (pkg manager commands)         |

Rule: no phase is complete until all scripts in `scripts/` pass or are updated.
Include script validation as part of the phase's exit criteria.

### GitHub Actions

Current state: only `release-autoupdate.yml` exists (release on `v*` tag or manual dispatch,
Windows + Linux jobs). There is **no CI pipeline for PRs** yet.

Migration impact per phase:

| Phase            | Action required                                                                  |
| ---------------- | -------------------------------------------------------------------------------- |
| 3a (pnpm)        | Update workflow: `yarn` commands to `pnpm`, cache strategy                       |
| 3b (flatten)     | Update workflow: workspace paths, build commands                                 |
| 4 (CI for Tauri) | New `ci.yml` for PR gates + rewrite `release.yml` with `tauri-apps/tauri-action` |

The current `release-autoupdate.yml` is Electron-specific (uses `electron-builder`).
It will be replaced entirely in Phase 4 with Tauri-native CI.

---

## 5. What NOT to Change During Migration

These decisions are deliberate and should not be revisited in this cycle:

| Decision                           | Reason                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------- |
| Keep React 19                      | Stable, no migration needed                                               |
| Keep React Router 7 (HashRouter)   | Predictable navigation, low maintenance cost                              |
| Keep @dnd-kit                      | Stable, actively maintained                                               |
| Keep i18next                       | Works everywhere, 5 languages already translated                          |
| Keep Redux Toolkit (initially)     | Large rewrite with no direct functional gain; Zustand is optional phase 5 |
| Keep Styled Components (initially) | Works in Tauri; Tailwind is optional phase 6                              |
| Keep Jest (initially)              | Works; Vitest is optional phase 7                                         |
| Keep Husky + lint-staged           | Works; lefthook is a future optional improvement                          |

---

## 6. Data Persistence

All data stays locally on the user's machine. No analytics, no telemetry, no server.

Current (Electron):

- `electron-store` for native settings
- `localStorage` for renderer state

Target (Tauri):

- `tauri-plugin-store` writes JSON files in the app data directory:
  - `tasks.json` — lists and tasks
  - `stats.json` — session history
  - `settings.json` — user preferences
  - `rotation.json` — rotation grid state
- `localStorage` remains available for renderer state

Migration path: create a `lib/storage.ts` wrapper that abstracts the underlying store.
Components never call `invoke()` or store APIs directly.

---

## 7. Standard Approval Checklist

Apply to every migration phase/PR:

- [ ] `lint` green
- [ ] `build` green
- [ ] `test` green (when applicable)
- [ ] Packaged binary runs (smoke test: timer, tasks, settings, compact mode, tray)
- [ ] No regression in previously migrated features
- [ ] CHANGELOG updated when applicable

---

## 8. Risk Register

| Risk                                                                               | Impact                           | Mitigation                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tauri plugin gaps vs Electron API                                                  | Feature parity loss              | Validate each plugin before committing to sub-phase                                                                                                                                                                                          |
| Rust learning curve                                                                | Slower development               | Keep Rust code minimal; use plugins for most native features                                                                                                                                                                                 |
| Vite plugin compatibility with Tauri CLI                                           | Build issues                     | Test renderer build early in Phase 0                                                                                                                                                                                                         |
| Tauri ecosystem version drift (core, api, cli, bundler may have different patches) | Incompatibility between packages | Pin compatible set in both `Cargo.toml` (Rust: `tauri`, `tauri-build`, plugin crates) and `package.json` (JS: `@tauri-apps/api`, `@tauri-apps/cli`, `@tauri-apps/plugin-*`). Validate alignment at Phase 0 kickoff and on each Tauri update. |
| pnpm resolution differs from Yarn                                                  | Dependency issues                | Lock versions early, test full build                                                                                                                                                                                                         |
| Fullscreen break complexity                                                        | Hardest feature to port          | Dedicate Phase 2e as standalone sub-phase                                                                                                                                                                                                    |
| Auto-update flow change                                                            | User-facing regression           | Test E2E update flow before release                                                                                                                                                                                                          |

---

## 9. Pre-Migration Technical Debt

Known issues inherited from the Electron codebase. These should be resolved
before or during the migration, not carried forward silently.

| Item                                                                      | Status | Notes                                           |
| ------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| `.env` hygiene (`app/renderer/.env` tracked)                              | Open   | Remove from version control, add `.env.example` |
| CI pipeline for PRs (lint/build/test)                                     | Open   | Only release workflow exists today; add PR gate |
| Custom shortcut TODO without persistence (`Shortcut.tsx`)                 | Open   | Shortcut config is not saved across restarts    |
| Pending major updates: `eslint`/`@eslint/js` 10.x, `vite-plugin-svgr` 5.x | Open   | Evaluate compatibility during Phase 0           |
| `check-updates.sh` `--full` report mode (audit + GH Actions versions)     | Open   | Planned but not implemented                     |

---

## 10. Development Rules

- Never use `any` in TypeScript.
- All Zustand stores (when adopted) must have explicit state and action types.
- All communication with Tauri goes through dedicated wrappers in `lib/` — never call `invoke()` directly in components. Storage uses `lib/storage.ts`; other native APIs (tray, window, dialog, updater) use their own wrappers.
- Components do not access the store directly — they use custom hooks.
- Business logic lives in hooks and store, never in components.
- Tests cover: timer logic, state transitions, statistics calculations.

---

## 11. Sources

- Codebase analysis (2026-04-09)
- Previous `docs/TECHNICAL_DECISIONS_2026.md` (archived in git history)
- Previous `POMODOROZ_SPEC.md` (archived in git history)
- CHANGELOG.md / CHANGELOG.en.md
