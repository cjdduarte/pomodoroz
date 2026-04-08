# Changelog

> [Portuguese version](CHANGELOG.md)

> **Pomodoroz** is a fork of [Pomatez](https://github.com/zidoro/pomatez) by [Roldan Montilla Jr](https://github.com/roldanjr).
> Forked on 2026-03-25 from Pomatez v1.10.0.
> Thanks to the original author for the solid foundation.

## [26.4.12] - 2026-04-08

### Fixed

- **Windows installer shortcut hardening (NSIS)** — `nsis` config now explicitly sets `shortcutName`, `createStartMenuShortcut`, and `createDesktopShortcut`.
- **Fallback for missing Start Menu shortcut** — new NSIS include (`electron-builder/installer.nsh`) recreates the shortcut when it is missing after install/update.
- **No redundant version in Windows "Installed apps" title** — NSIS `uninstallDisplayName` is now set to `Pomodoroz`, keeping version only in the details row.
- **Renderer Updater i18n** — update screen copy and release-page notification text now use `updater.*` keys in pt/en/es/ja/zh.
- **Readable HTML release notes in Updater** — when `releaseNotes` arrives as HTML, the screen now normalizes it to structured text before rendering, avoiding raw tag output.
- **Escaped HTML release notes compatibility** — when notes arrive with escaped entities (`&lt;p&gt;...`), Updater now decodes them before normalization/rendering.
- **Settings support message updated** — one-time banner now mentions both support paths (⭐ GitHub and ☕ coffee), matching the footer action buttons.
- **First-run update prompt persistence fixed** — if the app is closed before choosing `Yes/No`, the prompt is shown again on next launch until the user makes an explicit choice.
- **Initial update check deferred until explicit choice** — on a fresh profile, main no longer runs `checkForUpdates()` at boot; the first check runs only after the user picks `Yes/No` in the policy prompt.
- **Release notes screen hidden in automatic mode** — when `In-app Auto Update` is enabled, Settings no longer forces the `Updater` screen; download/install flow stays on native notifications.
- **Local AppImage selection fixed in install scripts** — `scripts/install.sh` and `scripts/install.ps1` now pick the newest artifact by version (`sort -V`/`[version]`), avoiding old installs like `26.4.8` when `26.4.12` is already available.

### Changed

- **Safe dependency updates** — `electron` (`41.1.1 -> 41.2.0`), `i18next` (`26.0.3 -> 26.0.4`), `@typescript-eslint/eslint-plugin` (`8.58.0 -> 8.58.1`), and `@typescript-eslint/parser` (`8.58.0 -> 8.58.1`).
- **First-run update policy choice** — on a fresh profile (clean install/data), the app now shows a one-time prompt on first open to choose `in-app auto update` or `notify only`; the choice is persisted and can be changed later in Settings.

### Note

- This release includes updates across Windows (NSIS), renderer/main (update flow), and Linux local install scripts (AppImage).

## [26.4.11] - 2026-04-08

### Changed

- **Configurable update policy in Settings** — new `In-app Auto Update` toggle; default mode is notify+redirect to release page, and enabling it restores in-app download/install behavior.
- **Updater IPC contract refined** — added `SET_IN_APP_AUTO_UPDATE` and `OPEN_RELEASE_PAGE`; `INSTALL_UPDATE` remains as a compatibility alias for one transition cycle.
- **Settings header now shows app version** — displays `vX.Y.Z` in a subtle way.
- **Downloaded-update guard now logs explicitly** — when an update finishes downloading with in-app mode disabled, main logs the decision and intentionally skips the install prompt.
- **Tag-based version suggestion** — `release/version` scripts (bash + PowerShell) now suggest `YY.M.(last+1)` from local `vYY.M.*` tags; when a month turns with no tags, they suggest `YY.M.1`.
- **Tag sync in release flow** — `release.sh`/`release.ps1` now attempt `fetch --tags` automatically; if network/auth fails, they continue with a warning and use local tags.
- **Release mode menu** — without parameters, `release.sh`/`release.ps1` now show an interactive menu to choose real release or simulation mode.

### Translations

- **New settings label key** — `settings.inAppAutoUpdate` added in pt/en/es/ja/zh.

### Manual test (release)

- **Default mode (toggle off)** — when an update is detected, the app only notifies and the button opens the release page in the browser.
- **In-app mode (toggle on)** — after update detection/download, the app shows the `Quit and Install` prompt.
- **Settings** — header displays the current app version as `vX.Y.Z`.

## [26.4.10] - 2026-04-08

### Fixed

- **Safer update installation trigger** — `quitAndInstall()` now runs only when the `"Quit and Install"` action is explicitly confirmed in the notification callback.
- **Updater listener registration order** — updater events (`update-available`, `download-progress`, `update-downloaded`) are now registered before `checkForUpdates()`, reducing race risk on fast responses.
- **Consistent update state typing** — renderer `updateBody` was normalized to `string`, with safe fallback for legacy persisted state.

### Changed

- **Release notes workflow hardening** — CI now fails with explicit error messages when `CHANGELOG.md` is missing the tagged version section or when that section is empty.
- **Script-based release flow** — added dedicated release scripts (`scripts/release.sh` and `scripts/release.ps1`) and root shortcuts (`release:tag*`) in `package.json`.

### Documentation

- **CHANGELOG <-> Release policy formalized** — changelog/tag/release-notes linkage is now explicitly documented in `AGENTS.md`, `CLAUDE.md`, and `docs/DECISOES_TECNICAS_2026.md`.
- **Auto-update channel policy clarified** — current in-app support is explicitly scoped to Windows NSIS and Linux AppImage; portable/deb/rpm/AUR remain out of in-app auto-update scope.
- **Dependency visibility planning** — added planned task to evolve `check-updates.sh` with `report --full` coverage (dependencies + audit + GitHub Actions).

## [26.4.9] - 2026-04-07

### Changed

- **Fork auto-update activated in release flow** — publishing pipeline now generates and uploads update metadata to GitHub Releases for Windows (`latest.yml`) and Linux AppImage (`latest-linux.yml`).
- **Automated release workflow (CI)** — new dedicated workflow to publish platform update artifacts.

### Validated

- **Windows (NSIS)** — update detection from `26.4.8` to `26.4.9` confirmed.
- **Linux (AppImage)** — update artifacts and metadata published successfully.

## [26.4.8] - 2026-04-07

### Changed

- **Renderer build dependency** — `vite` updated from `8.0.6` to `8.0.7`.

### Note

- This release does not add new end-user features; it is a dependency maintenance update.

## [26.4.7] - 2026-04-07 (Initial Pomodoroz Release)

### Scope

- Consolidates all post-fork work through **2026-04-07** before first public release.
- Classification below is relative to the original **Pomatez v1.10.0** baseline.

### Added

- **Statistics module** — full report screen with focus/break/idle time tracking, completed cycles, daily flow chart, and per-task breakdown. Data 100% local.
- **Study Rotation Grid** — list/grid toggle in Tasks with per-card daily status (`white/green/red`) and persisted state.
- **Grid card actions** — right-click selection keeps Timer sync behavior (normal mode navigates to Timer; compact mode collapses after selection).
- **Compact Grid Expansion** — grid available in compact mode with resize/collapse IPC integration.
- **Draw button (`Sortear`)** — optional via Settings; phase-based draw (`white -> green`, then `green -> red`) without navigating to Timer.
- **Grid color-loop setting** — optional manual loop on card click (`red -> white`) controlled in Settings.
- **Grid columns control** — selector (`Auto / 1 / 2 / 3`) in toolbar with persisted preference across normal and compact modes.
- **Tasks import/export (JSON)** — Settings supports exporting/importing task lists/cards with schema validation, `version`, UUID regeneration, and merge/replace option.
- **Reset time to Idle (focus only)** — new Settings toggle (`Back may count as Idle`) with `Yes/No/Cancel` confirmation on reset.
- **Custom notification sound** — select between default bell or custom sound file in Settings.
- **0-minute breaks** — short/long break sliders allow 0 minutes (auto-skip break).
- **Compact task display** — expanded `CompactTaskDisplay` with actions menu (done/skip/delete) in all modes, replacing the old `PriorityCard`.
- **Native quit confirmation** — localized dialog in Electron main (pt/en).
- **Update IPC flow** — end-to-end `UPDATE_AVAILABLE` / `INSTALL_UPDATE` for fork-stage policy.
- **i18n** — translations for Statistics in pt, en, es, ja, zh.
- **Strict mode warning i18n** — localized Timer warning bubble text using `timer.strictModeNotice` in all locales.

### Changed

- **Electron-only** — Tauri/Rust runtime fully removed from codebase and scripts.
- **React 19** — migrated from React 16 with `createRoot`.
- **Vite 8** — replaced CRA as default dev/build workflow.
- **TypeScript 6** — upgraded from 4.x with tsconfig alignment.
- **React Router 7** — migrated from v5 (`Switch`/`withRouter` removed).
- **Router imports normalization** — renderer imports now use `react-router` package directly.
- **Redux Toolkit 2** — upgraded from 1.x.
- **@dnd-kit** — replaced `react-beautiful-dnd` for drag-and-drop.
- **Lerna 9** — upgraded monorepo runner from v7.
- **Electron 41** — upgraded from earlier version.
- **Electron sandbox** — enabled `sandbox: true` with preload adapted.
- **Updater hardened** — skips check safely when config files missing (dev/`--dir`).
- **Statistics UI** — "Time Distribution" section removed; "By Task List" promoted; default period changed to "today".
- **Compact mode height** — corrected in Electron main (`getCompactHeight()`).
- **Grid color model simplified** — removed orange stage from day colors; legacy saved states migrate on load.
- **Grid typography refinement** — card title weight aligned with List view.
- **ESLint stack modernization** — renderer lint migrated to ESLint v9 flat config.
- **i18n stack refresh** — `react-i18next` 17 and `i18next` 26.
- **Electron dependency refresh** — `electron-builder` 26, `electron-updater` 6, and `electron-store` 11.
- **Vite config migration (Rolldown)** — `rollupOptions` to `rolldownOptions` for Vite 8 compatibility.
- **Styled-components prop forwarding hardening** — `StyleSheetManager.shouldForwardProp` combining `@emotion/is-prop-valid` with project-specific blocked props.
- **Notarization package migration** — replaced deprecated `electron-notarize` with `@electron/notarize`.
- **Tasks textarea autosize migration** — now uses `react-textarea-autosize`.
- **Notification backend migration (Electron main)** — replaced `node-notifier` with native `Notification` API.
- **Tasks undo/redo state migration** — replaced `redux-undo` with internal history reducer (`past/present/future`).
- **Router dependency cleanup** — removed residual `react-router-dom` after full migration to `react-router`.
- **Redux action typing cleanup** — `AnyAction` updated to `UnknownAction` (RTK 2 recommendation).
- **Keyboard event modernization** — replaced `onkeypress`/`keyCode` with `onkeydown` + `e.key === "Enter"`.
- **React 19 ref-pattern alignment** — replaced `React.forwardRef` with ref-as-prop in `TaskDetails`, `Checkbox`, and `Radio`.
- **Timer footer actions (P2.5 G1)** — actions trigger now uses `option-x` icon; without active task, opens dropdown directly.
- **Post-break switch flow (P2.5 G2)** — "Switch" in post-break prompt now opens the rotation grid.
- **Tasks list right-click parity (P2.5 G3)** — list mode now mirrors grid behavior.
- **Grouped Grid mode (P2.5 G4)** — `Group/Ungroup` toggle with persisted preference and flat full-width list separators.
- **Grid toolbar icon affordance (P2.5 G4)** — `Reset`, `Draw`, and `Group/Ungroup` use icon-only controls with localized tooltips.
- **Grouped card density refinement** — grouped mode renders shorter cards.
- **Tasks list priority action refinement** — clicking `Priority List` also selects the first pending card.
- **Rebranding** — renamed from Pomatez to Pomodoroz (`com.cjdduarte.pomodoroz`).

### Fixed

- **Reset-to-idle tracking hotfix** — fixed `CounterProvider` initialization order (`ReferenceError`).
- **Tray behavior consistency** — main process now keeps in-memory tray behavior state synchronized via `SET_TRAY_BEHAVIOR`.
- **Fullscreen break state restoration** — fullscreen cycle now restores previous window state.
- **Fullscreen visual/native synchronization + Wayland robustness** — fullscreen UI applies only after native confirmation, with Linux/Wayland fallback.
- **Timer display** — clamped to zero (no more negative `0-1 : 0-1`).
- **SVG progress ring** — protected against division by zero.
- **Countdown interval** — fallback of 1000ms when `count % 1 === 0`.
- **Timer controls visibility (strict mode)** — restored compact mode button visibility; strict warning renders in overlay.
- **Task progression from actions menu (P2.5 G1)** — `Done` and `Skip` now auto-advance to the next pending task.
- **Delete action progression (post-P2.5)** — deleting the active task follows the same auto-advance rule.
- **Skip target correctness (P2.5 G1)** — `skipTaskCard` now skips the selected card instead of always the first pending.
- **Tasks list context-menu guard (P2.5 G3)** — right-click on completed cards is ignored.
- **Task form cancel warning (post-P2.5)** — fixed `"Form submission canceled"` by setting `type="button"`.
- **Renderer dependency resilience** — added direct `uuid` dependency in renderer.
- **Compact grid scrollbar parity** — compact-mode grid now preserves vertical scrollbar behavior.

### Removed

- **Legacy repository scaffolding** — `.travis.yml`, `snap/`, and `.devcontainer/` removed.
- **Tauri/Rust** — entire `app/tauri` directory, Cargo files, and related scripts.
- **CRA** — `react-scripts` and `react-app-env.d.ts` removed.
- **react-beautiful-dnd** — replaced by `@dnd-kit`.
- **use-stay-awake** — replaced by internal hook (Wake Lock API with fallback).
- **`v8-compile-cache`** — removed (unused on Node 24 / Electron 41).
- **`regenerator-runtime`** — removed (legacy Babel async polyfill not needed).
- **`say`** — removed (audio `.wav` assets remain versioned).
- **`autosize` / `@types/autosize`** — removed after migration to `react-textarea-autosize`.
- **`node-notifier` / `@types/node-notifier`** — removed after migration to native Electron notifications.
- **`redux-undo`** — removed after migration to internal undo/redo handling.
- **`react-router-dom`** — removed after full migration to `react-router` imports.
- **PriorityCard** — replaced by `CompactTaskDisplay`.
- **Google Analytics** — removed.
- **Discord community link** — removed from Settings.

---

_For the original Pomatez changelog prior to the fork, see the [Pomatez repository](https://github.com/zidoro/pomatez/blob/master/CHANGELOG.md)._
