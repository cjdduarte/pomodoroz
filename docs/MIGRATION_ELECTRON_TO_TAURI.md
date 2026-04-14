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

| Layer                               | Files | Lines (approx) | Portability                                                  |
| ----------------------------------- | ----- | -------------- | ------------------------------------------------------------ |
| Redux slices (7)                    | 7     | ~980           | 100% — runtime-agnostic                                      |
| React components (64)               | 64    | ~4000+         | ~95% — only a small compatibility layer touches Electron IPC |
| i18n (5 languages, 200+ keys)       | 10    | ~1200          | 100% — i18next works anywhere                                |
| Styled Components (163 definitions) | 39    | ~2000+         | 100% — CSS-in-JS is framework-agnostic                       |
| Custom hooks (11)                   | 11    | ~500+          | ~90% — few touch IPC                                         |
| Electron main process               | 5+    | ~2500          | 0% — must be rewritten as Tauri commands                     |
| Shareables (IPC contracts)          | 1     | ~199           | Replace with Tauri command/event types                       |

### Renderer Files With Electron Coupling (Phase 1, Compatibility Layer)

At this stage, Electron-specific references are intentionally limited to compatibility
modules while dual-runtime support is still active:

1. `contexts/connectors/ElectronConnector.tsx` — Electron provider implementation
2. `contexts/connectors/ElectronInvokeConnector.ts` — Electron IPC adapter
3. `contexts/ConnectorContext.tsx` — runtime detection (`electron` / `tauri` / browser)
4. `contexts/InvokeConnector.tsx` — shared connector contract (still typed with current IPC map)
5. `extensions/window.extension.ts` — global type definitions for `window.electron`

Direct native calls from feature modules (`CounterContext`, `TaskTransferSection`,
`Control`, `CompactTaskDisplay`) have already been migrated to the connector API.

The project uses a **connector context pattern** (`ConnectorContext` + runtime-specific
providers). Migration path: keep Electron connector for compatibility while expanding
`TauriConnector` + Rust commands until Electron can be removed in Phase 3b.

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

### 4.0 Execution Tracker (Where We Are)

Current status is tracked here (not only in phase descriptions) so we can see exactly where work stopped and what is still pending before moving to the next phase.

| Phase                             | Status                   | Last update | Gate to advance                                                      |
| --------------------------------- | ------------------------ | ----------- | -------------------------------------------------------------------- |
| 0 — Tauri Scaffold + Dual Runtime | Completed                | 2026-04-09  | Closed after Tauri + Electron dev validation and script verification |
| 1 — Connector Swap                | Completed                | 2026-04-10  | Closed after runtime + manual parity validation                      |
| 2 — Native Features               | In progress (2c current) | 2026-04-14  | Start global shortcuts migration after notification parity closure   |
| 3a — Yarn to pnpm                 | Not started              | -           | Start only after Phase 2 exit criteria are complete                  |
| 3b — Flatten Structure            | Not started              | -           | Start only after Phase 3a exit criteria are complete                 |
| 4 — CI for Tauri                  | Not started              | -           | Start only after Phase 3b exit criteria are complete                 |

Phase 0 completion checklist (execution status):

- [x] `src-tauri/` scaffold created and version/identifier aligned with project
- [x] `@tauri-apps/cli` and `@tauri-apps/api` added, plus root `"tauri"` script
- [x] Tauri dev flow validated (`yarn tauri dev` opened and ran the app)
- [x] No Electron code removed yet
- [x] Package manager still Yarn (pnpm remains Phase 3a)
- [x] Revalidate `yarn dev:app` after Tauri scaffold (Electron path still green)
- [x] Run/confirm script checklist impact for current phase (`scripts/` validation rule)

Rule to move forward: only start Phase 1 after all Phase 0 checklist items above are checked.
Current state: Phase 1 closed, Phase 2a and 2b validated, and Phase 2c is now active.
Current guardrail in Tauri runtime: settings toggles that still depend on future native sub-phases (`openAtLogin` -> 2g, `inAppAutoUpdate` -> 2f) stay disabled to avoid false-positive UX.

Phase 1 progress checklist (execution status):

- [x] Remove direct `window.electron` calls from renderer modules (all calls routed through connector API)
- [x] Create and wire `TauriConnector` as runtime-native implementation
- [x] Implement Rust command/event bridge in `src-tauri/src/commands/` for migrated channels
- [x] Replace remaining renderer dependency on Electron IPC contract package (`@pomodoroz/shareables`) with local runtime command/event types
- [x] Validate feature parity for migrated flows (timer reset confirmation, fullscreen events, task import/export; reset confirmation currently uses two-step confirm fallback on Tauri)
  - [x] Runtime smoke validation completed (`yarn tauri dev --no-watch` booted successfully after connector decoupling)
  - [x] Manual functional validation completed (`cancelar/não/sim` reset decision, fullscreen + `Esc`, window actions, and import/export fallback messaging)

Phase 1 manual validation matrix (to close the last checklist item):

| Flow                         | How to validate                                                                               | Expected result                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Reset focus -> idle decision | Start focus timer with elapsed seconds, click reset, test `yes`, `no`, and `cancel` decisions | `yes` reclassifies elapsed focus as idle; `no` resets without reclassification; `cancel` keeps timer running        |
| Fullscreen break events      | Enable fullscreen break, trigger break start/end transitions                                  | Window enters fullscreen on break and exits fullscreen when break ends; timer/navigation state remains consistent   |
| Task export/import           | Export tasks from Settings, then import valid file and malformed file                         | Export success message shown; valid import enters pending merge/replace flow; malformed file shows validation error |

### Phase 0 — Tauri Scaffold + Dual Runtime

- Goal: get Tauri running alongside the existing renderer without breaking Electron.
- Scope:
  - Scaffold `src-tauri/` (Cargo.toml, tauri.conf.json, src/main.rs)
  - Add `@tauri-apps/cli` and `@tauri-apps/api` as devDependencies via Yarn
  - Add `"tauri": "tauri"` script to root `package.json` (uses local bin from `@tauri-apps/cli`)
  - Keep the existing renderer Vite config (`app/renderer/vite.config.ts`) and wire Tauri via `src-tauri/tauri.conf.json` (`devUrl` + `beforeDevCommand`) — no folder restructuring yet
  - Verify the renderer loads inside a Tauri window (no native features yet)
- Validation:
  - `yarn tauri dev` opens a Tauri window with the React UI
  - `yarn dev:app` (Electron) still works in parallel (not broken)
- Exit criteria:
  - Tauri window renders the existing React app
  - No Electron code removed yet (including `app/shareables/` — IPC contracts stay until Phase 1)
  - Package manager remains Yarn (pnpm migration is Phase 3a)
  - Existing scripts (`validar-tudo.sh`, `release.sh`, etc.) still work unchanged
- Rollback:
  - Delete `src-tauri/`, remove Tauri devDependencies and `"tauri"` script from package.json, revert vite.config.ts changes

### Phase 1 — Connector Swap (Electron IPC to Tauri Commands)

- Goal: replace the Electron IPC bridge with Tauri commands.
- Scope:
  - Create `TauriConnector.tsx` implementing the same interface as `ElectronConnector.tsx`
  - Replace `ConnectorContext` detection to use Tauri when available
  - Implement Rust commands in `src-tauri/src/commands/` for each IPC channel
  - Remove feature-level direct native calls so renderer modules use connector APIs only
  - Replace `@pomodoroz/shareables` IPC constants with Tauri command/event types
- Validation:
  - Timer works (start/pause/skip/reset)
  - Settings persist across restarts
  - Tasks CRUD works
- Exit criteria:
  - All renderer-to-native communication goes through Tauri
  - No remaining `window.electron` usage outside Electron compatibility modules
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

Phase 2a current validation snapshot (2026-04-10):

- [x] Item 1 validated: tray/menu parity (`Restore`/`Quit`, tray click restore, localized copy).
- [x] Item 2 validated (functional): close/minimize tray flows work as implemented (`closeToTray` and `minimizeToTray`) with current Tauri bridge.
- [!] Known UX caveat (to revisit): when `useNativeTitlebar = true`, OS-native minimize controls may bypass custom renderer callbacks, so `minimizeToTray` toggle can feel inconsistent versus custom titlebar behavior.

Linux tray icon dev-session note (record for future revisit):

- Root context: `tray-icon` (via Tauri Linux stack) writes tray PNGs to runtime temp paths and uses file paths with appindicator/status notifier.
- Observed symptom: in repeated `yarn tauri dev` cycles, tray icon could appear stale/“random” at startup in some sessions.
- Mitigation applied: app-specific Linux tray `temp_dir_path` is now session-isolated (`pid + timestamp`) and startup performs defensive cleanup of orphan `session-*` folders based on `/proc/<pid>` existence.
- Residual note: if compositor-side cache behavior still appears, revisit in Phase 2a polish and re-evaluate with packaged builds (not only dev loop).

Phase 2b kickoff snapshot (2026-04-10):

- [x] Tauri notification plugin dependencies wired (`tauri-plugin-notification` in Rust and `@tauri-apps/plugin-notification` in renderer).
- [x] Tauri capabilities updated for desktop notifications (`notification:default`) to unblock permission/dispatch on the `main` window.
- [x] Desktop notification wrapper introduced in renderer (`showDesktopNotification`) with runtime-aware path (`tauri` vs browser/Electron fallback).
- [x] Notification permission request moved to user-gesture path (Settings notification type selection), avoiding WebKit/Tauri prompt rejection in background timer events.
- [x] Direct renderer notification calls migrated to wrapper (`useNotification`, `Updater`).
- [x] External URL opening on Tauri migrated from `window.open`/`target="_blank"` to native opener plugin path (`@tauri-apps/plugin-opener` + `tauri-plugin-opener`), fixing Settings support/help links and release-page actions.
- [x] Manual parity validation completed on Linux dev runtime (permission prompt via Settings user gesture, timer/update notification delivery, and external links opening through native opener path).

Phase 2b lessons learned (Linux/WebKit runtime):

- Notification permission prompt must be triggered by a user gesture (Settings interaction). Background/timer-triggered permission prompts are rejected by WebKit.
- In Tauri dev on Linux, prefer native notification IPC path (`plugin:notification|notify`) for deterministic behavior instead of relying only on web `window.Notification` semantics inside the WebView.
- WebKit DevTools console on this stack does not support top-level `await`; use async IIFE snippets for manual diagnostics.
- `VM ... NeedDebuggerBreak trap` observed while DevTools/Inspector is attached is a debug/runtime-inspector signal and, by itself, is not treated as a functional app error.

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
