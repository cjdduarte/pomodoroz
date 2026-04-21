# Changelog

> [Portuguese version](CHANGELOG.md)

> **Pomodoroz** is a fork of [Pomatez](https://github.com/zidoro/pomatez) by [Roldan Montilla Jr](https://github.com/roldanjr).
> Forked on 2026-03-25 from Pomatez v1.10.0.
> Thanks to the original author for the solid foundation.

## [26.4.31] - TBD

### Fixed

- **Automatic cycle-end transitions are now resilient to timer state races** — `CounterContext` now manages/clears break-transition timeout through a single ref plus lifecycle cleanup, preventing stale delayed execution after reset/reconfigure/unmount.
- **Global `Escape` listener in the special-break setter is no longer always active** — keyboard handler registration in `SpecialField` now happens only while the setter popup is open.
- **Button ripple positioning was fixed for scroll scenarios** — `useRippleEffect` now uses `clientX/clientY` with `getBoundingClientRect()`.
- **Local persistence now flushes defensively on WebView lifecycle events** — debounced `store.subscribe` writes are now flushed on `beforeunload`, `pagehide`, and `visibilitychange`, reducing last-state loss on fast shutdown.

### Changed

- **Special-break setter moved to full i18n coverage (pt/en/es/ja/zh)** — hardcoded strings were replaced with translation keys across all supported languages.
- **Short-break config contract normalized** — typo action `setShorBreak` was renamed to `setShortBreak` (slice and consumers), with no intended behavior change.
- **Orphan `restartTimer` action removed from the `timer` slice** — dead renderer path was removed to reduce misuse surface.
- **Tauri `read_text_file` command hardened for task import flow** — file reads now enforce `.json` extension, reject non-file paths, and cap payload size (5 MB).
- **Technical roadmap updated with explicit renderer-versioning follow-up** — `docs/IMPROVEMENTS.md` now includes item `A7` to migrate UI version display away from `package.json` bundle dependency in a future cycle.

## [26.4.30] - 2026-04-20

### Changed

- **IPC contract simplified after Tauri-only consolidation** — removed `INVOKE_MAIN` channel/types and dropped the `invoke` method from `InvokeConnector`, eliminating a dead path with no renderer consumers.
- **Compact-window auto-expand for dialogs consolidated in a shared hook** — duplicated temporary expand/collapse logic (`Control` and `TaskListGrid`) was centralized in `useCompactAutoExpand`, reducing flow drift and avoiding unintended collapse when compact mode is turned off while a prompt is open.
- **`ConfirmDialog` focus accessibility strengthened** — added `Tab`/`Shift+Tab` focus trap, initial auto-focus on cancel when opening, `aria-describedby` for message semantics, and focus restoration to the triggering element on close.
- **Grid columns selector in dark mode fixed** — the `Columns` dropdown in `TaskListGrid` now applies native appearance reset (`appearance: none`) and a custom CSS chevron to prevent white background rendering and keep dark theme consistency.

## [26.4.29] - 2026-04-20

### Changed

- **Project dependency updates** — a maintenance batch was applied across JS/TS ecosystem libraries, with no planned functional behavior change.
- **TypeScript lint dependencies updated (`@typescript-eslint/*` 8.59.0)** — `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` were upgraded to `8.59.0`, with lockfile refresh.
- **Renderer env hygiene simplified** — `app/renderer/.env.example` was removed and the `!.env.example` exception was dropped from `.gitignore`; the renderer does not consume `SKIP_PREFLIGHT_CHECK`, `BROWSER`, or `CI` in the default runtime/build path, keeping `.env` as optional local-only config.
- **A5 batch 2 completed (`eslint`/`@eslint/js` 10.x + `eslint-react`)** — lint was migrated to `@eslint-react/eslint-plugin` (`recommended-typescript` with compatibility-oriented overrides), `eslint` was upgraded to `10.2.1` and `@eslint/js` to `10.0.1`; `eslint-plugin-react` and `eslint-plugin-react-hooks` were removed, and the lint directive in `Portal.tsx` was updated to the new plugin rule namespace.
- **A5 batch 3 completed (`vite-plugin-svgr` 5.x)** — `vite-plugin-svgr` was upgraded from `4.5.0` to `5.2.0`, keeping the current SVG icon contract (`ReactComponent` named export) and passing full validation (`pnpm lint`, `pnpm typecheck:renderer`, `pnpm build:renderer`, `cargo check --manifest-path src-tauri/Cargo.toml`).
- **Validation/release scripts were hardened to reduce accidental bypass** — `scripts/release.sh` and `scripts/release.ps1` now require explicit confirmation when `--skip-validate`/`-SkipValidate` is used (or `POMODOROZ_RELEASE_SKIP_VALIDATE_ACK=1` in non-interactive mode), and `scripts/validar-tudo.sh` and `scripts/validar-tudo.ps1` now include `cargo check --all-targets --all-features` in the Rust quality gate (with a dedicated log in `--log-full-cargo`/`-LogMode full-cargo` mode).
- **Tauri runtime consistency fixes after technical audit** — `onSelectAutoUpdatePolicy` in `Layout` no longer uses inverted condition logic for auto-update sync, redundant non-null connector checks were removed (`Layout`, `Updater`, `Control`, `CompactTaskDisplay`, `CounterContext`, `TaskTransferSection`), orphan utility exports (`isBrowser`, `isObjectEmpty`) were removed from the `utils` barrel, Rust `restart_app` now uses a non-misleading no-return signature, reset confirmation flows (timer and task grid) moved to an internal React modal (instead of `@tauri-apps/plugin-dialog`), and the legacy `runtimeInvokeConnector` layer was removed.
- **Reset confirmations are now standardized with in-app modal UI to avoid Linux/GTK duplication** — reset prompts now render through the app `Portal` with i18n-controlled title/message (pt/en/es/ja/zh), eliminating duplicated text behavior from native dialogs; in compact mode, the app temporarily expands the window when needed to avoid modal clipping and collapses again after close.
- **Release operations guide updated for explicit preflight bypass usage** — `docs/RELEASE_OPERATIONS.md` now documents `--skip-validate`/`-SkipValidate` as emergency-only and requires `POMODOROZ_RELEASE_SKIP_VALIDATE_ACK=1` in non-interactive runs.
- **`validar-tudo.ps1` Windows compatibility fixed for `:` interpolation** — `PKG_CONFIG_PATH` assignment moved from direct string interpolation to safe formatting (`"{0}:{1}" -f ...`), preventing PowerShell `ParserError` (`InvalidVariableReferenceWithDrive`).
- **Windows quick run no longer requires global `pnpm` in PATH** — `scripts/validar-tudo.ps1` removed the `Get-Command pnpm` gate and now validates/runs package commands only through `scripts/pnpmw.mjs` (`node + corepack`), fixing the early failure in the interactive menu flow.
- **PowerShell `pnpmw/corepack` diagnostics improved** — `scripts/validar-tudo.ps1` now prints real details when `node scripts/pnpmw.mjs --version` fails and no longer hard-fails on false negatives when the command succeeds without a version line in stdout.
- **`pnpmw.mjs` no longer masks command failures as “pnpm not found”** — the wrapper now propagates the exit code of the first runnable candidate (for example, real `pnpm exec eslint` failures) and only falls back when the binary is truly unavailable (`ENOENT`).
- **Quick run no-install flow is now explicit with early dependency guard** — `scripts/validar-tudo.ps1` and `scripts/validar-tudo.sh` now label option 1 as no-install and fail fast with a direct message when `node_modules` is missing under `--skip-install`.
- **PowerShell version/release scripts are now resilient on Windows without global `pnpm`** — `scripts/version.ps1` and `scripts/release.ps1` now run package-manager commands through `node scripts/pnpmw.mjs`, removing hard dependency on a global `pnpm` binary in `PATH` and aligning behavior with wrappers already used by `validar-tudo.ps1` and `check-updates.ps1`.
- **`uninstall.ps1` now supports Windows user-scope with mode parity** — the script now runs on Linux and Windows with the same standard + `-Purge`/`-Yes` flow; on Windows it removes common user install folders (`%LOCALAPPDATA%`), Start Menu/Desktop shortcuts, and, with `-Purge`, clears local data in `%APPDATA%`/`%LOCALAPPDATA%` for both `pomodoroz` and `com.cjdduarte.pomodoroz`.
- **Windows release/installer build is now resilient to local executable locks** — `scripts/validar-tudo.ps1` now automatically terminates running instances of `src-tauri/target/release/pomodoroz_tauri.exe` before `tauri build`, avoiding `Access denied (os error 5)` when replacing the release binary.
- **Local installer generation no longer requires updater private signing key** — `scripts/validar-tudo.sh` and `scripts/validar-tudo.ps1` now force `bundle.createUpdaterArtifacts=false` for all local installer bundles, avoiding failure when `TAURI_SIGNING_PRIVATE_KEY` is not set outside the official signed-release pipeline.
- **PowerShell local Tauri config override is now Windows JSON-parse safe** — `scripts/validar-tudo.ps1` now uses a temporary file (`src-tauri/.tauri-local-no-updater.json`) with `--config` during installer generation, avoiding inline quoting parse errors (`key must be a string`) in `tauri build`.

## [26.4.28] - 2026-04-20

### Changed

- **Linux release pipeline pinned to a deterministic environment (no dependency fallback)** — `release-linux` now runs on `ubuntu-24.04` with explicit `libfuse2t64` installation for AppImage (`linuxdeploy`) packaging, removing conditional package-selection logic.
- **Linux AppImage pipeline hardened with explicit `linuxdeploy` gtk/gstreamer dependencies** — the release job now installs runtime/tooling GStreamer packages and `binutils`, with per-attempt logs and filtered tails for failure diagnostics without output flooding.
- **AppImage packaging aligned with freedesktop `.desktop` validation** — Linux category is now pinned to `Utility` (`tauri.conf.json`, bundle desktop template, and install scripts), removing `Productivity` as a non-registered category in `appimagetool`.
- **`sync-latest-json` aligned with `createUpdaterArtifacts: "v1Compatible"`** — platform merge now recognizes compressed updater artifacts (`.exe.zip` and `.AppImage.tar.gz`, with fallback to `.exe`/`.AppImage`) and release uploads now include those formats.

## [26.4.27] - 2026-04-20

### Changed

- **Runtime consolidated as Tauri-only** — dual-runtime/browser branches were removed from `runtimeInvokeConnector`, `ConnectorContext`, and `Updater` action flow.
- **Native utilities aligned to a single runtime** — `openExternalUrl` and `desktopNotification` now follow the Tauri-only path; `notificationAudio` keeps renderer-audio fallback only when native playback fails.
- **Development bootstrap simplified** — `dev:renderer` script was removed from `package.json`; Tauri `beforeDevCommand` now runs Vite directly.
- **Tauri titlebar drag path consolidated to a single strategy** — legacy `-webkit-app-region` rules were removed from `titlebar.ts`, keeping drag behavior via `data-tauri-drag-region` and `start_window_drag`.
- **Linux taskbar icon alignment between launcher and active window** — renderer `favicon.ico` was updated to the official app icon, and `.desktop` entries (local install + `deb/rpm` bundles) now declare `StartupWMClass/X-GNOME-WMClass` to reduce duplicate/switching panel icons.
- **`check-updates` wording aligned to root-only scope** — Shell/PowerShell labels were normalized (`Workspace` -> `Escopo`, `Monorepo/Tooling` -> `Tooling`) without changing update logic.
- **GitHub Release notes are now auto-populated from changelog again** — `release-autoupdate.yml` now extracts the target version section from `CHANGELOG.md` and applies it through `gh release create/edit`, preventing empty release bodies on tag/dispatch publish paths.
- **Documentation consolidated into a single improvements roadmap** — `docs/IMPROVEMENTS.md` is now the pending-work reference (technical + product), while `docs/MIGRATION_TO_TAURI.md` and `docs/PRODUCT_BACKLOG.md` remain compatibility pointers.

## [26.4.26] - 2026-04-19

### Changed

- **Tauri release pipeline hardened against transient AppImage network failures** — the Linux job in `.github/workflows/release-autoupdate.yml` now retries `pnpm tauri build --bundles appimage` up to 3 times before failing.
- **CI/release runtime improved with Rust build caching** — `Swatinem/rust-cache@v2` was added to `ci.yml` (`tauri-rust-check`) and to both Windows/Linux jobs in `release-autoupdate.yml`.
- **Legacy Electron/runtime residues cleaned from current operations** — removed the local `dist/linux-unpacked` artifact (not versioned), removed `-webkit-app-region` titlebar CSS rules, and dropped the unused global `window.isUserHaveSession` extension.
- **Install documentation aligned with published release scope** — `README.md` and `README.pt-BR.md` now state that published release artifacts currently target Windows/Linux, while macOS remains source-build based.
- **Legacy `styled-components/macro` usage removed from the renderer** — imports were migrated to `styled-components` across `src/`, the compatibility alias was removed from `app/renderer/vite.config.ts`, and `src/types/styled-components-macro.d.ts` was deleted.
- **“Native Titlebar” toggle hardened to prevent `X` button click loss after repeated switches** — `titlebar.ts` now explicitly marks drag region (`drag`) and window controls (`no-drag`) again, and Rust `set_native_titlebar` now performs a defensive surface renegotiation on Linux after `set_decorations`.

## [26.4.25] - 2026-04-18

### Fixed

- **Window dragging restored when disabling “Native Titlebar” on Tauri runtime** — the custom `Titlebar` now triggers native window drag (`start_window_drag`) on title-area `mousedown`, in addition to `data-tauri-drag-region`, while keeping window action buttons clickable outside that region.
- **Immediate border/shadow refresh when toggling native titlebar** — `ThemeContext` no longer uses a static `useNativeTitlebar` reference, preventing stale visual state after the toggle.

## [26.4.24] - 2026-04-17

### Changed

- **Legacy Electron packaging manifest removed from the repository without breaking build/release** — committed `app/electron/package.json` was removed, and a new `scripts/electron-builder-wrapper.mjs` now creates/removes an ephemeral manifest during `electron-builder` executions (local scripts and release workflow), keeping compatibility with electron-builder two-package expectations.
- **Electron packaging flow centralized in the root wrapper** — root `package.json` (`eb`) and `.github/workflows/release-autoupdate.yml` now run the dedicated wrapper (instead of calling `electron-builder` directly), preserving `traversal` dependency collection and removing operational coupling to a permanent `package.json` inside `app/electron`.
- **Phase 3b marked as completed in the migration plan** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` was updated to reflect flatten-stage closure with removal of remaining workspace manifests and gate unblocked to start Phase 4 (Tauri CI).
- **Final hardening for Phase 2f (Tauri updater) completed** — `TauriInvokeConnector` now runs `downloadAndInstall` on `INSTALL_UPDATE` and restarts the app through a Rust `restart_app` command; the `In-app auto update` toggle is re-enabled for Tauri runtime, and the update screen now exposes a native “Install and restart” action with release-page fallback.
- **Phase 4 kickoff with PR/push CI gate** — new workflow `.github/workflows/ci.yml` adds automated `pnpm lint`, `pnpm typecheck:renderer`, `pnpm build:renderer`, and Linux `cargo check`, establishing a quality gate while release migration to a full Tauri-native pipeline is still in progress.
- **Tauri updater release workflow now supports tag-triggered runs (`v*`) in addition to manual dispatch** — `.github/workflows/release-tauri-updater.yml` now resolves `RELEASE_TAG` automatically on tag pushes, enabling signed updater asset publishing (`.exe`/`.AppImage` + `.sig` + `latest.json`) without relying only on `workflow_dispatch`.

## [26.4.23] - 2026-04-17

### Changed

- **Agent release procedure rule reinforced in documentation** — `AGENTS.md`, `CLAUDE.md`, and `docs/RELEASE_OPERATIONS.md` now require the agent to fill the target version date (`YYYY-MM-DD`) in both `CHANGELOG.md` and `CHANGELOG.en.md` headers before suggesting `./scripts/release.sh`/`./scripts/release.ps1`.

## [26.4.22] - 2026-04-17

### Changed

- **`electron-builder` metadata migrated to a root-managed layout** — new root-level `electron-builder.config.json` is now the single source of truth for Electron packaging; the root `eb` script now uses this config explicitly, and `app/electron/package.json` no longer carries an embedded `build` block, preparing safe removal of the Electron packaging manifest in the final Phase 3b step.

## [26.4.21] - 2026-04-17

### Fixed

- **Electron installer publishing in GitHub Actions now uses a valid package-manager context again** — the root `eb` script (`package.json`) no longer forces `npm_execpath=traversal`/`npm_config_user_agent=traversal`; as a result, `release-autoupdate` jobs can run `pnpm eb ... --publish always` without `spawn traversal ENOENT` on Windows and Linux.

## [26.4.20] - 2026-04-17

### Fixed

- **Release workflow installer builds (Windows/Linux) work again on CI** — `app/electron/package.json` no longer injects `npm_config_user_agent=traversal npm_execpath=traversal` into the `eb` script; in recent `electron-builder` versions those envs caused the packager to literally spawn a `traversal` binary to install subproject dependencies, breaking `pnpm eb --win nsis` and `pnpm eb --linux AppImage` with `spawn traversal ENOENT`.
- **Release scripts now stage `src-tauri/Cargo.lock`** — `scripts/release.sh` and `scripts/release.ps1` now include `src-tauri/Cargo.lock` in the release commit; Cargo regenerates the lockfile with the new version during preflight (fmt/clippy), so without staging it the file stayed permanently marked as modified after each release.

## [26.4.19] - 2026-04-17

### Changed

- **AppImage generation in `validar-tudo` (Tauri runtime) is now mandatory and Linux-resilient** — `scripts/validar-tudo.sh` and `scripts/validar-tudo.ps1` now run AppImage builds with `NO_STRIP=1` + `APPIMAGE_EXTRACT_AND_RUN=1`, apply an automatic `pkg-config` workaround when `gdk-pixbuf` resolves to a missing path, and no longer downgrade AppImage failures to silent warnings in installer flow.
- **Local AppImage installer flow now disables signed updater artifact generation** — in `validar-tudo*`, local AppImage build now uses `bundle.createUpdaterArtifacts=false` to avoid failures when `TAURI_SIGNING_PRIVATE_KEY` is not set outside the official release pipeline.
- **Operational flow is now root-driven (without `pnpm-workspace.yaml`)** — day-to-day `dev/build/lint` now runs directly from root scripts (`build:renderer`, `build:electron`, `typecheck:renderer`, `dev:app` via `scripts/dev-app.mjs`), `app/renderer/package.json` was removed, and wrappers (`validar-tudo*`, `install*`, `check-updates*`, `release-autoupdate.yml`) no longer depend on workspace `pnpm --filter` calls.
- **`version-sync`/`release` are now resilient to optional manifest flattening** — `scripts/version-sync.mjs` now treats `app/electron/package.json` and `app/renderer/package.json` as optional (while keeping root `package.json` + Tauri files required), and `scripts/release.sh`/`scripts/release.ps1` now build `git add` inputs dynamically so release flow does not break when those manifests are removed.
- **Root scripts no longer depend on `lerna run` for daily operations** — `package.json` now uses `scripts/pnpmw.mjs` with `pnpm -r --filter` for `dev:*`, `build*`, `release*`, and `clean`, starting the Phase 3b kickoff (progressively removing Lerna/Nx coupling while keeping the current `app/*` structure for now).
- **Remaining Lerna/Nx orchestration leftovers removed from the repository** — `lerna.json` was removed, root `package.json` dropped the `lerna` script/dependency, and `pnpm-workspace.yaml` no longer carries the `nx` toggle, keeping daily builds on pure `pnpm`; `check-updates` tooling inventory no longer reports `lerna`.
- **Renderer flatten kickoff completed with root-level `src`** — frontend source was moved from `app/renderer/src` to `src`, and `app/renderer/index.html`, `app/renderer/tsconfig.json`, `app/renderer/vite.config.ts`, and `app/renderer/package.json` scripts (lint/prebuild) were updated to keep `pnpm lint` and `pnpm build` green during the transition.
- **Renderer dependency source consolidated into the root manifest** — duplicated entries between root `package.json` and `app/renderer/package.json` were removed from the renderer workspace (keeping only renderer-local specifics), and `check-updates.sh/.ps1` now reads the `[Renderer]` inventory directly from the root (`root/src`) manifest during the flat-structure transition.
- **Operational flow decoupled from `@pomodoroz/shareables`** — `app/electron` now uses a local IPC contract (`app/electron/src/ipc.ts`), the `workspace:*` dependency was removed from `app/electron/package.json`, and scripts/workflow (`validar-tudo*`, `install*`, `check-updates*`, `release-autoupdate.yml`) no longer run build/lint steps scanning the `app/shareables` workspace.
- **Legacy `app/shareables` workspace removed from the monorepo** — package files were deleted, `package.json`/`pnpm-workspace.yaml` now list only `app/electron` and `app/renderer`, and the lockfile was regenerated without local link references to `@pomodoroz/shareables`.
- **`pnpm` orchestration switched to path-based filters (instead of workspace names)** — root scripts (`package.json`), validation wrappers (`validar-tudo.sh/.ps1`), Tauri bootstrap (`src-tauri/tauri.conf.json`), and release workflow (`release-autoupdate.yml`) now target `./app/renderer` and `./app/electron`, reducing coupling to workspace names (`@pomodoroz/renderer`/`pomodoroz`) during the final flatten stage.

## [26.4.18] - 2026-04-16

### Changed

- **Release workflow `pnpm` bootstrap fixed to avoid Actions failure (`pnpm` not found)** — `.github/workflows/release-autoupdate.yml` no longer uses `pnpm` cache in `actions/setup-node`, keeping `pnpm` activation via Corepack before build/publish commands.
- **Tauri flow and contributor docs aligned to `pnpm`** — `src-tauri/tauri.conf.json` now uses `scripts/pnpmw.mjs` for `beforeDevCommand`/`beforeBuildCommand` (removing Yarn dependency from Tauri runtime bootstrap), and `README*`, `CONTRIBUTING.md`, `CLAUDE.md`, and `docs/MIGRATION_ELECTRON_TO_TAURI.md` were updated to `pnpm`-based commands/requirements.
- **Phase 2f kickoff wired for Tauri updater in safe notify-only mode** — initial `tauri-plugin-updater` integration was added in `src-tauri` plus `@tauri-apps/plugin-updater` in renderer, with policy bridge (`SET_IN_APP_AUTO_UPDATE`) through `TauriConnector` and `UPDATE_AVAILABLE` propagation to the existing UI flow. Install/restart (`downloadAndInstall` + relaunch strategy) remains pending for final signed-feed hardening of the Tauri release pipeline.
- **Tauri updater now uses real public key + compatible updater artifacts (`latest.json`)** — `src-tauri/tauri.conf.json` now has `plugins.updater.pubkey` configured and `bundle.createUpdaterArtifacts: "v1Compatible"`, preparing signed feed generation for the configured update endpoint.
- **Manual workflow to publish signed Tauri updater assets added** — `.github/workflows/release-tauri-updater.yml` builds/uploads updater artifacts (Windows NSIS and Linux AppImage + `.sig` + `latest*.json`) to a specific tag using `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- **`version-sync` and release scripts now include Tauri runtime version files** — `scripts/version-sync.mjs` now synchronizes `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml`; `scripts/release.sh`/`scripts/release.ps1` now stage those files in release commits to avoid Electron/Tauri version drift.
- **Release now requires final date in both changelogs** — `scripts/release.sh` and `scripts/release.ps1` now validate `CHANGELOG.md` and `CHANGELOG.en.md` headings as `## [x.y.z] - YYYY-MM-DD` for the target version (blocking `A definir`/`TBD` and also blocking PT/EN date mismatch).

## [26.4.17] - 2026-04-16

### Changed

- **GitHub Actions release workflow standardized across Linux/Windows with Corepack-based `pnpm` pinning** — `.github/workflows/release-autoupdate.yml` now activates `pnpm` using `corepack prepare pnpm@10.33.0 --activate` in both release jobs, removing reliance on `pnpm/action-setup@v4` and Node 20 deprecation warnings.
- **`check-updates` improved for workflow pin guidance and cleaner Cargo output in shell/PowerShell** — `scripts/check-updates.sh` and `scripts/check-updates.ps1` now show `pnpm` workflow pin status/suggestions (supporting both `pnpm/action-setup` and `corepack` formats), clearly state that `report` mode does not apply JS/TS updates, keep Cargo output compact (`root-deps-only` + advisory summary), and write full `cargo outdated`/`cargo audit` details to `logs/` in interactive mode. A fallback `pnpm` update hint via `npm install -g` was also added for environments without `corepack` in PATH, plus an initial log-type menu (`none`, `cargo`, `full`) when running with no arguments.
- **`check-updates` now includes JS-style Rust selection for root crates (`SAFE`/`MAJOR`)** — in interactive mode, when `cargo outdated --root-deps-only` reports updates, `scripts/check-updates.sh` and `scripts/check-updates.ps1` now let you select Rust updates by category and confirm before applying `cargo update -p <crate> --precise <version>`.
- **`validar-tudo` now includes a log-type menu and split Rust gate traces** — when run interactively with no arguments, `scripts/validar-tudo.sh` and `scripts/validar-tudo.ps1` now prompt for log mode (`none`, `full`, `full-cargo`); under `full-cargo`, `cargo fmt` and `cargo clippy` are also written to dedicated files in `logs/`.

## [26.4.16] - 2026-04-16

### Added

- **Initial Tauri runtime scaffold (v2)** — new `src-tauri/` directory with `Cargo.toml`, `build.rs`, `src/main.rs`, `src/lib.rs`, capabilities, and default icons to bootstrap a dual-runtime flow.
- **Tauri tooling in the current monorepo** — added `@tauri-apps/cli` and `@tauri-apps/api` dependencies at the root project plus a new `yarn tauri` script.

### Changed

- **Tauri config aligned with current renderer workspace** — `src-tauri/tauri.conf.json` now targets `../app/renderer/build`, uses `devUrl` `http://localhost:3000`, and runs renderer workspace commands in `beforeDevCommand`/`beforeBuildCommand`.
- **Initial Tauri app metadata adjusted** — identifier set to `com.cjdduarte.pomodoroz`, scaffold version set to `26.4.15`, and initial window size set to `340x470` to better match current Electron behavior.
- **Renderer native calls centralized behind connector APIs** — direct `window.electron` usage was removed from `CounterContext`, `Control`, and `TaskTransferSection`; these flows now use the typed `InvokeConnector` contract.
- **Connector contract expanded for Phase 1** — `InvokeConnector` now includes `send`, `receive`, and `invoke`, preserving Electron behavior while preparing the Tauri swap.
- **`TauriConnector` runtime path enabled** — `ConnectorContext` now selects provider by runtime (`electron`/`tauri`), with a dedicated `TauriInvokeConnector` for window/fullscreen/compact mode and task import/export flow under Tauri.
- **Tauri capability permissions aligned** — `src-tauri/capabilities/default.json` now includes explicit window permissions required by the connector (`show`, `hide`, `close`, `minimize`, `set_focus`, `set_always_on_top`, `set_fullscreen`, `set_size`, `set_theme`, `set_decorations`).
- **Compact mode detached from direct Electron usage** — `CompactTaskDisplay` now uses `getInvokeConnector()` for `COMPACT_EXPAND`/`COMPACT_COLLAPSE`.
- **Rust command bridge started in `src-tauri`** — added native commands in `src-tauri/src/commands/window_bridge.rs` (always-on-top, fullscreen break, compact mode, theme, titlebar, show/minimize/close), and `TauriInvokeConnector` now calls these channels via `invoke()`.
- **Renderer decoupled from `@pomodoroz/shareables`** — frontend IPC contract moved to `app/renderer/src/ipc/index.ts`, renderer imports now use `ipc`, and the package dependency was removed from `@pomodoroz/renderer`.
- **Tauri reset confirmation flow refined for clarity** — `TauriInvokeConnector` replaced `window.prompt` with a two-step `window.confirm` flow, preserving `cancel/no/yes` decisions without a text input field.
- **Fullscreen break exit via `Esc` restored on Tauri** — `CounterContext` now exits fullscreen by keyboard during break, matching expected behavior from the previous experience.
- **Initial tray support enabled in Tauri runtime (Phase 2a)** — `src-tauri/src/lib.rs` now creates a tray icon with menu actions (`Restore`/`Quit`) and left-click restore behavior.
- **Close/minimize-to-tray behavior re-enabled with safe fallback** — `window_bridge` now hides the window only when tray is available; otherwise it performs normal minimize/close to avoid hidden-window dead ends.
- **Native titlebar `X` now honors `Close to tray` on Tauri** — Rust backend now intercepts main-window `CloseRequested` using `set_tray_behavior` state, avoiding inconsistent close behavior after tray restore.
- **Hide-vs-exit decision now centralized in the native close flow** — `close_window` now delegates to `window.close()`, and `CloseRequested` (backed by `TrayBehaviorState`) is the single decision point for hide vs exit.
- **Custom titlebar `X` now honors `Close to tray` consistently** — the React titlebar now routes through the same native `CloseRequested` path used by normal window close.
- **Dynamic tray icon now works on Tauri** — `TRAY_ICON_UPDATE` now converts renderer `dataUrl` into bytes and updates the native tray icon through the Rust `set_tray_icon` command, removing no-op overhead.
- **Tray menu now syncs with app language on Tauri** — tray labels (`Restore`/`Quit`, etc.) are now updated from renderer via `SET_TRAY_COPY`, avoiding English-only tray text when UI is Portuguese.
- **`SET_TRAY_BEHAVIOR` re-enabled on Tauri path** — renderer now syncs `closeToTray` to native state so hide-vs-exit behavior has a single source of truth.
- **`Open at login` re-enabled on Tauri runtime (Phase 2g kickoff)** — initial `tauri-plugin-autostart` wiring now connects the Settings toggle to native backend behavior through `SET_OPEN_AT_LOGIN` in `TauriConnector`.
- **Single-instance behavior restored on Tauri runtime (Electron parity)** — `tauri-plugin-single-instance` is now wired so repeated launcher/start-menu opens focus/restore the existing window instead of spawning duplicate app instances.
- **NSIS Start Menu shortcut path made explicit** — `src-tauri/tauri.conf.json` now sets `bundle.windows.nsis.startMenuFolder = \"Pomodoroz\"` for more predictable Start Menu discoverability on Windows.
- **Task import/export on Tauri moved to native dialogs (Phase 2h kickoff)** — `TauriInvokeConnector` now uses `tauri-plugin-dialog` (`save/open`) plus Rust bridge commands (`write_text_file`/`read_text_file`), removing the previous web fallback based on `<a download>` and `<input type=\"file\">`.
- **Notification sound on Tauri moved to native Rust playback (Phase 2i kickoff)** — renderer now sends WAV bytes to Rust command `play_notification_sound` (using `rodio`), with renderer fallback kept for non-Tauri runtimes or native-audio failures.
- **First-run update-policy prompt layout refined** — title/body are now centered in the modal, and action labels now use compact wording to avoid visual overflow on narrow windows.
- **Updater guardrail kept on Tauri after 2f defer decision** — only `In-app auto update` remains disabled in Settings until final release-hardening implementation.
- **Tauri stack versions pinned to reduce ecosystem drift** — `@tauri-apps/api`, `@tauri-apps/cli`, `tauri`, `tauri-build`, and `tauri-plugin-log` now use fixed versions in the project.
- **Linux tray icon cache collisions mitigated across dev sessions** — `setup_tray` now uses an app-specific per-session (`pid+timestamp`) `temp_dir_path` under runtime temp storage and performs defensive cleanup of orphan session folders, reducing stale icon-path reuse between `yarn tauri dev` runs.
- **Renderer desktop notifications migrated to a cross-runtime wrapper** — `useNotification` and `Updater` now call `showDesktopNotification`, which uses `tauri-plugin-notification` on Tauri and keeps browser notification fallback outside Tauri.
- **Tauri notification capability enabled in app permissions** — `src-tauri/capabilities/default.json` now includes `notification:default`, unblocking `isPermissionGranted`/`requestPermission`/`notify` on native runtime.
- **External link opening on Tauri fixed through native opener path** — support/help links and release-note opening no longer rely on `window.open`/`target=\"_blank\"`; they now use `plugin-opener` (`@tauri-apps/plugin-opener` + `tauri-plugin-opener`).
- **Notification permission request moved to user-gesture flow** — permission prompting was moved out of async timer events into Settings interaction (notification type selection), avoiding WebKit/Tauri prompt rejection (`Notification prompting can only be done from a user gesture`).
- **Initial global shortcuts migrated to Tauri (Phase 2c kickoff)** — Rust backend now registers `Alt+Shift+H` (hide app; fallback to minimize when tray is unavailable) and `Alt+Shift+S` (restore/focus window), matching Electron behavior.
- **`version/release/check-updates` scripts migrated to `pnpm` with no fallback** — `.sh`/`.ps1` pairs now require `pnpm`, use `pnpm version:sync` for version/release flows, and run updates via `pnpm outdated --format json` + `pnpm add`.
- **`check-updates` now includes a Rust (Cargo) report step** — `.sh`/`.ps1` scripts now run a `[5/5]` block with `cargo outdated` and `cargo audit` (when installed) and show recommended manual crate-update commands.
- **`validar-tudo` now enforces Rust quality gates for `src-tauri`** — default preflight now includes `cargo fmt --all -- --check` and `cargo clippy --all-targets --all-features -- -D warnings` (while keeping `quick-dev` fast without Rust gates).
- **Local install scripts migrated to `pnpm` with no fallback** — `scripts/install.sh` and `scripts/install.ps1` now require `pnpm` and run pre-check/build/AppImage steps through `pnpm` (`pnpm --filter ... run ...`, `pnpm build:dir`, `pnpm exec electron-builder`).
- **`validar-tudo` wrappers migrated to `pnpm` with no fallback** — `.sh`/`.ps1` scripts now validate `pnpm`, run lint/typecheck/build through `pnpm`, and execute packaged/installer flows via `pnpm exec electron-builder`.
- **PowerShell script compatibility fixed for Windows PowerShell 5.1** — `validar-tudo.ps1` and `check-updates.ps1` were updated to avoid parser-breaking interpolation patterns (notably variable+`:` and `&&` in problematic command examples), fixing `-File` execution errors.
- **PowerShell scripts now route `pnpm` through `pnpmw`/Corepack** — `validar-tudo.ps1` and `check-updates.ps1` now call `node scripts/pnpmw.mjs` for pnpm operations, preventing `pnpm not found` failures when the binary is missing from `PATH` on Windows.
- **`check-updates.sh` JS/TS table alignment fixed** — `pnpm outdated` JSON parsing now keeps columns aligned when `workspace` is empty, so package names are shown correctly again.
- **Root/workspace `package.json` scripts migrated to `pnpm`** — build/lint/start/release commands in `package.json`, `app/electron/package.json`, `app/renderer/package.json`, and `app/shareables/package.json` no longer call `yarn`, removing implicit fallback in prebuild/build flows.
- **`pnpm` script execution made resilient when binary is missing from PATH** — new wrapper `scripts/pnpmw.mjs` is now used by root/workspace `package.json` scripts to run `pnpm` directly when available or `corepack pnpm` when needed, fixing Windows failures such as `'pnpm' is not recognized` during `corepack pnpm run ...` flows.
- **`pnpmw` on Windows now invokes `corepack.js` directly from the Node installation directory** — the wrapper now resolves `node_modules/corepack/dist/corepack.js` next to `node.exe`, so `pnpm` works even when `corepack.cmd` resolution fails in child-process PATH lookup.
- **`pnpmw` is now resilient to invalid `npm_execpath` in profile-less shells** — the wrapper now only accepts candidates whose probe exits with `status=0` and no longer aborts early when `npm_execpath` fails, preventing `validar-tudo.ps1` startup failure under `powershell -NoProfile`.
- **`pnpmw` on Windows now iterates candidates without aborting on first runtime failure** — when an available candidate fails to execute (for example `corepack.cmd` in specific shell contexts), the wrapper proceeds to the next candidates and also tries `cmd.exe` invocation, reducing false `pnpm not found` outcomes.
- **`lerna run` execution stabilized for Corepack-only Windows environments** — `lerna.json` now uses `npmClient: \"npm\"` to avoid `'pnpm' is not recognized` failures in child processes, while dependency management remains on `pnpm` and scripts keep using `pnpmw`.
- **`validar-tudo.ps1` fixed for strict Clippy gate on Windows** — Rust validation now enforces `-D warnings` through `RUSTFLAGS`, avoiding argument forwarding/parsing failures in environments where `cargo clippy -- -D warnings` is not accepted as expected.
- **`validar-tudo.ps1` packaging path hardened for Windows without `pnpm` in PATH** — the script now invokes `electron-builder` through the Electron workspace `eb` script (which sets traversal env vars), avoiding node-module-collector failure with `'pnpm' is not recognized`.
- **`check-updates.ps1` fixed to preserve real `pnpmw` output** — the `pnpm` function no longer discards stdout/stderr, restoring proper `pnpm` version detection and `pnpm outdated --format json` parsing.
- **`check-updates.ps1` updated for PowerShell 5.1 list-to-array conversion** — update rows now use `ToArray()` instead of array-subexpression over `List[object]`, eliminating `Argument types do not match` during per-workspace reports.
- **`check-updates.ps1` `pnpm outdated` parser hardened for keyed-object payloads** — the script now correctly handles JSON returned as `PSCustomObject` with package names as keys, restoring JS/TS update rows on Windows PowerShell 5.1.
- **Local operational logs excluded from Git tracking** — `.gitignore` now includes `/logs/`, avoiding runtime-noise files (`validar-tudo`, `check-updates`, `cargo audit/outdated`) in `git status`.
- **Pre-commit hook aligned with `pnpm` workflow** — `.husky/pre-commit` no longer calls `yarn lint-staged` and now uses `node ./scripts/pnpmw.mjs exec lint-staged`, preventing commit failures in environments without Yarn.
- **SAFE dependency batch applied with full validation** — `@types/node` (`25.5.2 -> 25.6.0`) in root and renderer, `react-router` (`7.14.0 -> 7.14.1`) in renderer, `electron` (`41.2.0 -> 41.2.1`) in Electron workspace, and `tauri-plugin-global-shortcut` (`2.2.1 -> 2.3.1`) in `src-tauri`.
- **`validar-tudo` now auto-repairs Electron runtime for `dev:app` flow** — `scripts/validar-tudo.sh` and `scripts/validar-tudo.ps1` now check `require('electron')` before starting dev mode and, when the binary is missing/incomplete, automatically run Electron package `install.js` in `app/electron`.
- **Primary auto-update prompt label shortened for PT-BR/EN/ES** — `settings.autoUpdatePromptEnable` now uses `Atualizar auto.` (pt), `Auto update` (en), and `Actualizar auto.` (es) to avoid visual overflow on narrow windows.
- **`uninstall` purge mode now covers Tauri runtime data on Linux** — `scripts/uninstall.sh` and `scripts/uninstall.ps1` now also remove identifier-based paths (`~/.config/com.cjdduarte.pomodoroz`, `~/.cache/com.cjdduarte.pomodoroz`, and `~/.local/share/com.cjdduarte.pomodoroz`) in addition to legacy `~/.config/pomodoroz` and `~/.cache/pomodoroz`.

### Documentation

- **Tauri migration plan (Phase 0) refined** — scope updated for a Yarn-based dual runtime, `tauri` script in root `package.json`, and integration via `src-tauri/tauri.conf.json` with the current renderer workspace, without premature folder restructuring.
- **Commit/PR language policy formalized** — `AGENTS.md`, `CLAUDE.md`, and `CONTRIBUTING.md` now explicitly require commit messages and PR titles in English (Conventional Commits).
- **Milestone-based execution tracking added to migration plan** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` now includes an explicit phase tracker (status, advancement gate, and execution checklists for phases 0 and 1).
- **Migration tracker advanced to 2c after manual 2b closure** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` now records notification parity validation (user-gesture permission prompt + notification delivery) as completed.
- **Tracker advanced to 2d after Linux manual 2c validation** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` now marks `Alt+Shift+H/S` global shortcut parity as validated on Linux dev runtime and opens the 2d operational snapshot.
- **Phase 2 Linux operational snapshot updated in migration plan** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` now records revalidation of `validar-tudo` flows (options 5 and 6) and `uninstall` `purge`, including non-blocking `linux-unpacked` diagnostics.
- **Phase 3a checklist updated for lockfile and release workflow migration** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` now marks `yarn.lock` removal and `.github/workflows/release-autoupdate.yml` migration to `pnpm` as completed, keeping only the GitHub Actions runtime validation pending.
- **Release operations guide aligned with current flow (`pnpm` + `release.sh`)** — `docs/RELEASE_OPERATIONS.md` now reflects real tagging/publishing commands and explicitly documents keeping `A definir`/`TBD` until release day, setting the final date only at publication time.

### Note

- Release `26.4.16` still publishes Electron artifacts (`NSIS .exe` + `.AppImage` + `latest*.yml`). Tauri items above are internal migration progress (dual runtime), without switching the official release pipeline in this version.

## [26.4.15] - 2026-04-09

### Fixed

- **Grid color reset now acts on first click** — button now shows immediate confirmation and applies reset without requiring a second click.
- **Grid reset confirmation copy updated** — confirmation message now uses an interrogative dialog style (`window.confirm`) across pt/en/es/ja/zh.

## [26.4.14] - 2026-04-09

### Fixed

- **PT-BR support wording normalized.**
- **Cross-list drag visual stabilized** — when dragging a task to another list, the card no longer visually snaps back to the source list before drop.
- **Drag preview aligned with real card UI** — drag overlay now reuses the same card styling (width, layout, and icons), improving visual consistency while moving tasks.
- **Top list icons visually separated** — list drag button now uses a grip icon, reducing visual ambiguity with the actions menu (`...`) button.
- **SVG typing aligned for TypeScript 6** — `*.svg` module now declares named `ReactComponent` in `src/typings.d.ts`, removing `TS2614` in the icons index.
- **`useTargetOutside` hook aligned with React refs in TS6** — `ref` now accepts `RefObject<T | null>`, removing `TS2322` in `TaskHeader` and other `useRef(..., null)` call sites.
- **Renderer typecheck added to validation wrappers** — `scripts/validar-tudo.sh` and `scripts/validar-tudo.ps1` now run `yarn workspace @pomodoroz/renderer exec tsc --noEmit -p tsconfig.json` in both full and `quick-dev` flows.
- **Renderer TS6 typing cleanup batch** — fixed event handler typings (`implicit any`), button ref compatibility in ripple effect, `wakeLock` typing, `children` typing in `Dimmer`, ref compatibility in `Popper`, and widened `trackedTaskActionTypes` in tasks history reducer.

## [26.4.13] - 2026-04-08

### Fixed

- **Readable HTML release notes in Updater** — when `releaseNotes` arrives as HTML, the screen now normalizes it to structured text before rendering, avoiding raw tag output.
- **Escaped HTML release notes compatibility** — when notes arrive with escaped entities (`&lt;p&gt;...`), Updater now decodes them before normalization/rendering.
- **Settings support message updated** — one-time banner now mentions both support paths (⭐ GitHub and ☕ coffee), matching the footer action buttons.
- **First-run update prompt persistence fixed** — if the app is closed before choosing `Yes/No`, the prompt is shown again on next launch until the user makes an explicit choice.
- **Initial update check deferred until explicit choice** — on a fresh profile, main no longer runs `checkForUpdates()` at boot; the first check runs only after the user picks `Yes/No` in the policy prompt.
- **Release notes screen hidden in automatic mode** — when `In-app Auto Update` is enabled, Settings no longer forces the `Updater` screen; download/install flow stays on native notifications.
- **Local AppImage selection fixed in install scripts** — `scripts/install.sh` and `scripts/install.ps1` now pick the newest artifact by version (`sort -V`/`[version]`), avoiding old installs like `26.4.8` when `26.4.12` is already available.

### Changed

- **First-run update policy choice** — on a fresh profile (clean install/data), the app now shows a one-time prompt on first open to choose `in-app auto update` or `notify only`; the choice is persisted and can be changed later in Settings.

### Note

- This release includes updates across renderer/main (update flow) and Linux local install scripts (AppImage).

## [26.4.12] - 2026-04-08

### Fixed

- **Windows installer shortcut hardening (NSIS)** — `nsis` config now explicitly sets `shortcutName`, `createStartMenuShortcut`, and `createDesktopShortcut`.
- **Fallback for missing Start Menu shortcut** — new NSIS include (`electron-builder/installer.nsh`) recreates the shortcut when it is missing after install/update.
- **No redundant version in Windows "Installed apps" title** — NSIS `uninstallDisplayName` is now set to `Pomodoroz`, keeping version only in the details row.
- **Renderer Updater i18n** — update screen copy and release-page notification text now use `updater.*` keys in pt/en/es/ja/zh.

### Changed

- **Safe dependency updates** — `electron` (`41.1.1 -> 41.2.0`), `i18next` (`26.0.3 -> 26.0.4`), `@typescript-eslint/eslint-plugin` (`8.58.0 -> 8.58.1`), and `@typescript-eslint/parser` (`8.58.0 -> 8.58.1`).

### Note

- Change is limited to the Windows NSIS target; Linux/AppImage flow remains unchanged.

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

- **CHANGELOG <-> Release policy formalized** — changelog/tag/release-notes linkage is now explicitly documented in `AGENTS.md`, `CLAUDE.md`, and `docs/TECHNICAL_DECISIONS_2026.md`.
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
