# Improvements Roadmap — Pomodoroz

> Single source of truth for **pending improvements**.
>
> Implemented changes belong in `CHANGELOG.md` / `CHANGELOG.pt.md`.
> Release procedures belong in `RELEASE_OPERATIONS.md`.

---

## 1. How To Use This Document

This roadmap has two tracks:

- **Track A — Conversion Hardening (Tauri-only)**: technical consolidation after migration.
- **Track B — Product Features**: user-facing features pending or partially implemented.

### Status values

- `Open`: approved and pending implementation.
- `In Progress`: currently being implemented.
- `Blocked`: pending decision or dependency.
- `Done`: implemented and moved to changelog on release.

### Checklist filling pattern

For each item, use this structure:

- Scope checklist: concrete technical tasks.
- Validation checklist: objective checks before closing.
- Suggested commit: one Conventional Commit title in English.

When an item is released:

1. Mark it `Done` here.
2. Add implementation details to `CHANGELOG.md` and `CHANGELOG.pt.md`.
3. Remove unnecessary detail from this roadmap in the next planning cycle.

### Current checkpoint (2026-04-25)

- Released in `26.4.28` (PT/EN changelogs):
  - `A0` runtime consolidation to Tauri-only.
  - `A1` titlebar legacy CSS/changelog consistency (`-webkit-app-region`).
  - `A4` `check-updates` simplification to root-only narrative.
  - Linux release pipeline/AppImage hardening and `sync-latest-json` alignment.
- Current planning baseline:
  - Releases up to `26.4.36` are already published in EN/PT changelogs.
  - `26.4.37` changelog entries are open as the next release placeholders (`TBD` / `A definir`).
  - `26.4.36` changelog entry contains `A14` native IPC error visibility, `A7` renderer version source hardening, and operational guide alignment.
  - `A2` env hygiene completed (renderer `.env` untracked, no committed `.env.example` required by default).
  - `A5` dependency modernization major batches are now completed (`eslint`/`@eslint/js` 10.x with `eslint-react`, and `vite-plugin-svgr@5.2.0`) with full validation.
  - `A6` intentionally deferred by product decision (no test-track changes now).
  - `A9` locale-source unification is now implemented with `@tauri-apps/plugin-os` (renderer) + `tauri_plugin_os::locale()` (native startup).
  - `A10` opens a dependency-rationalization gate where migration is executed only if measurable ROI justifies the change.
  - `A11` Windows CI parity gate is now implemented (`ubuntu-latest` + `windows-latest`) and workflow runs completed successfully in both OS lanes.
  - `A12` write-path hardening is now implemented: `write_text_file` enforces `.json`, rejects existing non-file targets, and caps payload at 5 MB.
  - `A13` updater channel support memoization is implemented; only manual runtime-channel validation remains.
  - `A14` native IPC error visibility is implemented; only manual failure-injection validation remains.
  - `26.4.37` draft contains `A15` renderer CSP hardening and an IPC warning refinement so optional background sync failures do not show the generic native warning banner.

### Next execution order (after 26.4.36)

1. **A3 — Shortcut persistence**
   - Persist customizable shortcuts and restore on boot.
2. **Product cycle (B1 -> B2 -> B3)**
   - Cadence presets, session extension, break suggestion prompts.
3. **A6 revisit gate**
   - Revisit test strategy only after items above are stabilized.
4. **A10 dependency rationalization gate**
   - Evaluate necessity first; execute only if metrics and maintenance ROI are clear.

---

## 2. Track A — Conversion Hardening (Tauri-only)

| ID  | Item                                                                          | Status  | Priority | Notes                                                |
| --- | ----------------------------------------------------------------------------- | ------- | -------- | ---------------------------------------------------- |
| A0  | Consolidate runtime to Tauri-only and remove browser fallback branches        | Done    | High     | Released in 26.4.28                                  |
| A1  | Resolve titlebar legacy CSS/changelog divergence (`-webkit-app-region`)       | Done    | High     | Released in 26.4.28                                  |
| A2  | `.env` hygiene (`app/renderer/.env` tracked)                                  | Done    | High     | Completed and registered in 26.4.29 draft            |
| A3  | Persist custom shortcuts (`Shortcut.tsx` TODO)                                | Open    | Medium   | Avoid loss after restart                             |
| A4  | Simplify `check-updates` to root-only narrative and flows                     | Done    | Medium   | Released in 26.4.28                                  |
| A5  | Controlled major updates (`eslint`/`@eslint/js` 10.x, `vite-plugin-svgr` 5.x) | Done    | Medium   | Batches 1/2/3 completed in 26.4.29 draft             |
| A6  | Define automated test strategy (adopt baseline tests or remove idle stack)    | Blocked | High     | Deferred by decision (no tests changes now)          |
| A7  | Replace renderer `package.json` imports with injected app version metadata    | Done    | Medium   | Delivered in 26.4.36                                 |
| A8  | Expand i18n language coverage (`de`/`fr`) with tray/startup parity            | Done    | High     | Delivered in 26.4.31                                 |
| A9  | Unify auto-language source between renderer and native tray                   | Done    | Medium   | Delivered in 26.4.33 draft                           |
| A10 | Dependency rationalization gate (`uuid`, debounce, tests, style/state stack)  | Blocked | Medium   | Execute only with measurable ROI; no-change is valid |
| A11 | Add Windows CI parity gate for renderer and Rust quality checks               | Done    | High     | Delivered in 26.4.34 draft                           |
| A12 | Harden `write_text_file` to mirror `read_text_file` guardrails                | Done    | High     | Delivered in 26.4.34 draft                           |
| A13 | Memoize updater-channel support result across runtime session                 | Done    | Medium   | Delivered in 26.4.35 draft                           |
| A14 | Surface asynchronous Tauri IPC command errors in the UI                       | Done    | High     | Delivered in 26.4.36                                 |
| A15 | Tighten renderer CSP and remove small dead-code residues                      | Done    | High     | Delivered in 26.4.37 draft                           |

### A0 — Tauri-only runtime consolidation

- Scope checklist:
  - [x] Remove dual-runtime branch resolution and keep Tauri connector path as primary runtime.
  - [x] Simplify updater action path to Tauri-native install/restart flow.
  - [x] Remove renderer/browser fallback branches in utility wrappers where runtime is always Tauri.
  - [x] Align docs references to the consolidated roadmap structure.
  - [x] Mark as `Done` after release `26.4.28` publication.
- Validation checklist:
  - [x] `pnpm lint`
  - [x] `pnpm typecheck:renderer`
  - [x] `pnpm build:renderer`
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml`
- Suggested commit:
  - `refactor(tauri): enforce tauri-only runtime and consolidate improvements roadmap`

### A1 — Titlebar CSS/Changelog consistency

Resolution status (code):

- `CHANGELOG.md` / `CHANGELOG.pt.md` for `26.4.26` stated that `-webkit-app-region` rules were removed.
- Release `26.4.28` carried the corrective entry and code is aligned (legacy rules removed from `src/styles/components/titlebar.ts`).
- Dragging remains on current Tauri runtime through:
  - `data-tauri-drag-region` in `src/components/Titlebar.tsx`
  - native command `start_window_drag` in `src-tauri/src/commands/window_bridge.rs`

Impact:

- Main issue was **public documentation inconsistency** (audit/release trust), not a known crash.
- Marked as `Done` after `26.4.28` publication.

- Scope checklist:
  - [x] Decide code direction (remove or retain `-webkit-app-region` rules).
  - [x] Align code to selected direction (`-webkit-app-region` removed).
  - [x] Validate titlebar interactions (drag/minimize/close) on Linux and Windows.
  - [x] Record final decision in changelog for the next version.
  - [x] Mark as `Done` after release `26.4.28` publication.
- Validation checklist:
  - [x] `pnpm lint`
  - [x] `pnpm typecheck:renderer`
  - [x] `pnpm build:renderer`
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml`
- Suggested commit:
  - `fix(titlebar): align legacy drag css with tauri behavior and release notes`

### A2 — `.env` hygiene

- Scope checklist:
  - [x] Stop tracking `app/renderer/.env`.
  - [x] Remove committed `app/renderer/.env.example` pattern.
  - [x] Update setup docs to keep renderer `.env` as local-only optional file.
  - [x] Register this change in changelog on next release.
- Validation checklist:
  - [x] `git status --short` no longer includes a tracked renderer `.env`.
- Suggested commit:
  - `chore(config): untrack renderer env and keep local-only usage`

### A3 — Shortcut persistence

- Scope checklist:
  - [ ] Persist custom shortcut setting in local state storage.
  - [ ] Restore values at boot.
  - [ ] Handle invalid conflicts safely.
- Validation checklist:
  - [ ] Manual restart preserves changed shortcut.
- Suggested commit:
  - `feat(shortcuts): persist custom shortcut bindings across restarts`

### A4 — `check-updates` simplification

- Scope checklist:
  - [x] Remove obsolete workspace-centric wording where not needed.
  - [x] Keep current root-only behavior explicit.
  - [x] Preserve report/apply flows.
  - [x] Mark as `Done` after release `26.4.28` publication.
- Validation checklist:
  - [x] `./scripts/check-updates.sh report`
  - [x] `./scripts/check-updates.ps1 report`
- Suggested commit:
  - `refactor(scripts): simplify check-updates flow for root-only project layout`

### A5 — Major dependency updates

- Scope checklist:
  - [x] Split updates into independent batches.
  - [x] Apply batch 1 (`uuid@14` + safe JS/TS updates from `check-updates`).
  - [x] Define batch 2 strategy from references (ESLint 10 migration guide + `eslint-react`) and choose implementation path.
  - [x] Apply batch 2 (`eslint` / `@eslint/js` 10.x) with full validation after path approval.
  - [x] Apply batch 3 (`vite-plugin-svgr` 5.x) with full validation.
  - [x] Register completed batches 2 and 3 in changelog.
- Validation checklist:
  - [x] `pnpm lint` (batch 1)
  - [x] `pnpm typecheck:renderer` (batch 1)
  - [x] `pnpm build:renderer` (batch 1)
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml` (batch 1)
  - [x] `pnpm lint` (batch 2)
  - [x] `pnpm typecheck:renderer` (batch 2)
  - [x] `pnpm build:renderer` (batch 2)
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml` (batch 2)
  - [x] `pnpm lint` (batch 3)
  - [x] `pnpm typecheck:renderer` (batch 3)
  - [x] `pnpm build:renderer` (batch 3)
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml` (batch 3)
- Batch 2 references used during implementation:
  - Current plugin repository (`eslint-plugin-react`): https://github.com/jsx-eslint/eslint-plugin-react
  - Candidate plugin repository (`eslint-react`): https://github.com/Rel1cx/eslint-react
  - ESLint official migration guide: https://eslint.org/docs/latest/use/migrate-to-10.0.0
  - ESLint React migration guide (`eslint-plugin-react` -> `eslint-react`): https://www.eslint-react.xyz/docs/migrating-from-eslint-plugin-react
  - `eslint-plugin-react` ESLint 10 tracking issue (current blocker context): https://github.com/jsx-eslint/eslint-plugin-react/issues/3977
  - `eslint-plugin-react` package compatibility (`peerDependencies`): https://www.npmjs.com/package/eslint-plugin-react
- Suggested commit:
  - `chore(lint): migrate to eslint-react and upgrade eslint to v10`

### A6 — Test strategy decision

Decision checkpoint:

- Current decision is to **defer** test-strategy changes for now.
- Keep this item `Blocked` until the team chooses one path (`adopt-tests` or `remove-test-stack`).

- Scope checklist:
  - [x] Decide current cycle policy: defer test-strategy work.
  - [ ] Decide final path: `adopt-tests` or `remove-test-stack`.
  - [ ] If adopt: create baseline smoke tests + CI job.
  - [ ] If remove: clean Jest/Babel test deps and scripts.
- Validation checklist:
  - [ ] CI reflects the chosen strategy.
- Suggested commit:
  - `chore(testing): define and apply project test strategy`

### A7 — Renderer version source hardening

- Scope checklist:
  - [x] Remove direct `package.json` imports from renderer components.
  - [x] Inject app version through build-time metadata (`define` / `import.meta.env`) or dedicated runtime bridge.
  - [x] Keep titlebar/settings version display behavior unchanged.
- Validation checklist:
  - [x] `pnpm build:renderer`
  - [x] Confirm output bundles do not include full root package manifest object.
- Suggested commit:
  - `refactor(renderer): replace package-json imports with injected app version`

### A8 — i18n language expansion hardening (`de`/`fr`)

- Scope checklist:
  - [x] Extend language contract (`LanguageCode` and settings validation).
  - [x] Register `de`/`fr` in renderer i18n resources and language selector source.
  - [x] Add translation files with full key parity against `en`.
  - [x] Extend tray copy mapping in renderer (`TRAY_COPY_BY_LANGUAGE`).
  - [x] Extend Rust startup tray locale mapping (`resolve_tray_copy`).
  - [x] Add maintenance guide for future language additions in `docs/`.
- Validation checklist:
  - [ ] Manual: switch to `de` and `fr` in Settings and verify full UI copy.
  - [ ] Manual: set language to `auto` and validate locale detection behavior.
  - [ ] Manual: launch app with OS locale `de_*` and `fr_*`; verify tray startup labels.
  - [ ] Manual: confirm tray labels remain aligned after renderer sync.
  - [x] `pnpm typecheck:renderer`
  - [x] `pnpm build:renderer`
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml`
- Suggested commit:
  - `feat(i18n): add de/fr locales and align tray startup localization`

### A9 — Locale source unification (`@tauri-apps/plugin-os`)

Decision checkpoint:

- Previous behavior used two locale detection paths:
  - Renderer auto mode: browser locale (`navigator.languages` / `navigator.language`).
  - Native tray startup: environment variables (`LC_ALL`, `LC_MESSAGES`, `LANG`).
- Implemented direction:
  - Keep `react-i18next` as the renderer translation layer.
  - Use `@tauri-apps/plugin-os` `locale()` as the primary renderer locale source in auto mode.
  - Use `tauri_plugin_os::locale()` for native tray startup fallback resolution.
  - Keep safe browser fallback in renderer when plugin locale is unavailable.
  - Do not introduce Rust-side Fluent unless backend starts emitting user-facing localized copy.

Why this changed (explicit rationale):

- Consistency issue:
  - Auto-language behavior used different data sources in renderer and native startup.
  - This made locale mismatch possible during boot (`auto` mode), especially around tray labels versus initial UI language.
- Maintenance issue:
  - Locale parsing logic based on environment variables was duplicated and drift-prone across boundaries.
  - Moving both sides to the same Tauri OS locale contract reduces long-term divergence risk.
- Ecosystem alignment:
  - `@tauri-apps/plugin-os` is official, versioned with Tauri v2 plugins workspace, and already fits the current plugin stack.
- Product impact:
  - No UX contract change for manual language selection.
  - Main benefit is deterministic startup behavior and clearer architecture, not a visible feature change.

- Scope checklist:
  - [x] Run dependency impact review for locale bridge adoption and select official Tauri source (`@tauri-apps/plugin-os`).
  - [x] Wire auto-language resolution to plugin `locale()` in renderer (`settings.language = auto`).
  - [x] Align native startup tray locale resolution to `tauri_plugin_os::locale()`.
  - [x] Preserve manual language selection behavior exactly as-is.
  - [x] Update roadmap/changelog traces for the final architecture decision.
- Validation checklist:
  - [ ] Manual: in `auto` mode, UI and tray start with the same language.
  - [ ] Manual: runtime locale changes keep UI/tray aligned after renderer sync.
  - [ ] Manual: unsupported locale falls back to `en` without missing-key warnings.
  - [x] `pnpm typecheck:renderer`
  - [x] `pnpm build:renderer`
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml`
- Suggested commit:
  - `refactor(i18n): unify locale detection with tauri plugin os`

Migration value notes (decision support):

- `react-i18next`: keep (already aligned with Tauri frontend-agnostic model).
- Locale source unification (`A9`): implemented using official Tauri OS plugin.
- Rust Fluent i18n: defer (only adds value when Rust generates user-facing localized copy).
- Jest -> Vitest: evaluate only after `A6` is unblocked and test strategy is finalized.
- `styled-components` migration: not recommended now due high churn vs current roadmap priorities.
- Additional dependency swaps must pass `A10` necessity/ROI gate before execution.

### A10 — Dependency rationalization gate (evaluate necessity first)

Decision checkpoint:

- This item exists to avoid migrations by trend alone.
- Every candidate dependency change needs measurable motivation and a clear success metric.
- "No change required" is an acceptable and explicit final decision.

Candidate set under evaluation:

- Low-risk candidates:
  - `uuid` -> native `crypto.randomUUID()` (with safe fallback contract).
  - `lodash.debounce` -> local debounced utility preserving `flush()` semantics.
- Conditional candidates:
  - `Jest` -> `Vitest` only after `A6` test-strategy decision is unblocked.
- High-churn candidates (default is defer):
  - `styled-components` -> zero-runtime/utility alternatives.
  - `Redux Toolkit` -> lighter state alternatives.
  - `react-markdown` -> alternative markdown stack.

Scope checklist:

- [ ] Capture baseline metrics before any migration decision (bundle chunks, startup behavior, maintenance friction).
- [ ] Define go/no-go thresholds per candidate (expected gain, risk tolerance, migration effort).
- [ ] Produce one short decision note per candidate (keep/swap + rationale).
- [ ] Execute only candidates that meet thresholds and preserve behavior.
- [ ] If no candidate meets threshold, close as `Done` with explicit "no migration required" outcome.

Validation checklist:

- [ ] Decision log recorded in roadmap/changelog (including "no change" outcomes).
- [ ] For approved migrations: `pnpm lint`, `pnpm typecheck:renderer`, `pnpm build:renderer`, `cargo check --manifest-path src-tauri/Cargo.toml`.
- [ ] Manual parity check confirms no UX regression in timer/tasks/settings/tray flows.

Suggested commit:

- `chore(deps): evaluate dependency rationalization by measurable roi gate`

### A11 — Windows CI parity gate

Decision checkpoint:

- Previous CI ran only `ubuntu-latest` jobs (`frontend-quality` and `tauri-rust-check`).
- Windows script/build regressions historically required reactive hotfixes.
- A minimal Windows parity gate in CI was implemented to reduce release-time surprises without changing product behavior.

Scope checklist:

- [x] Add `windows-latest` job(s) in `.github/workflows/ci.yml` with Node + Corepack `pnpm` setup.
- [x] Run `pnpm lint` on Windows.
- [x] Run `pnpm typecheck:renderer` on Windows.
- [x] Run `pnpm build:renderer` on Windows.
- [x] Run `cargo check --manifest-path src-tauri/Cargo.toml` on Windows.
- [x] Keep Linux jobs unchanged as baseline parity reference.

Validation checklist:

- [x] Workflow runs completed with Linux and Windows jobs green for renderer and Rust checks.
- [x] No script path/quoting regressions were introduced in existing Linux jobs.
- [x] Pull requests require both Linux and Windows CI jobs green before merge (branch protection rules configured).

Suggested commit:

- `ci(workflows): add windows parity quality gates for renderer and tauri`

### A12 — Export write-path hardening symmetry

Decision checkpoint:

- `read_text_file` already enforces `.json`, regular-file checks, and a 5 MB limit.
- `write_text_file` now applies equivalent command-level guardrails for defense in depth.
- Export flow is user-initiated via native save dialog, but command-level hardening should still be symmetric for defense in depth.

Scope checklist:

- [x] Restrict `write_text_file` to `.json` output extension.
- [x] Add maximum payload size validation (align target with import/read limits, currently 5 MB).
- [x] Return explicit, user-safe error messages for rejected writes.
- [x] Keep current successful export UX unchanged for valid `.json` paths.

Validation checklist:

- [x] Manual: valid `.json` export succeeds through native save dialog.
- [x] Manual: non-`.json` target is rejected with a clear message.
- [x] Manual: oversized payload is rejected predictably.
- [x] `pnpm lint`
- [x] `pnpm typecheck:renderer`
- [x] `pnpm build:renderer`
- [x] `cargo check --manifest-path src-tauri/Cargo.toml`

Suggested commit:

- `fix(tauri): harden write_text_file guardrails for export flow`

### A13 — Updater support memoization clarity

Decision checkpoint:

- Updater channel support (`is_updater_channel_supported`) is effectively static for a running binary.
- Current renderer logic deduplicates only concurrent calls and resets promise state after resolve.
- Persisting the resolved value for the runtime session keeps behavior explicit and reduces repeated native `invoke` noise.

Scope checklist:

- [x] Replace in-flight-only dedupe with session memoization of the resolved boolean.
- [x] Preserve concurrent-call deduplication and existing fallback-to-`false` safety behavior on errors.
- [x] Preserve unsupported-channel fallback: unsupported channels open release page instead of installer flow.
- [x] Add concise inline comment documenting memoization intent.

Validation checklist:

- [ ] Manual: unsupported runtime channel still falls back to release page.
- [ ] Manual: supported runtime channel still allows install-and-restart flow.
- [ ] Repeated support checks in one session avoid redundant native invocations.
- [x] `pnpm lint`
- [x] `pnpm typecheck:renderer`
- [x] `pnpm build:renderer`
- [x] `cargo check --manifest-path src-tauri/Cargo.toml`

Suggested commit:

- `refactor(updater): memoize updater channel support per runtime session`

### A14 — Native IPC error visibility

Decision checkpoint:

- `TauriInvokeConnector.send()` is fire-and-forget and catches native command failures asynchronously.
- Callers that wrap `send()` in `try/catch` cannot observe those failures.
- Native command failures should become visible through the existing renderer warning/alert path while keeping console details for diagnosis.

Scope checklist:

- [x] Route asynchronous `sendToTauri` failures to a UI-visible connector error channel.
- [x] Preserve current fire-and-forget call sites unless a stronger contract is needed.
- [x] Keep user-facing error text safe and concise; keep technical details in console logs.
- [x] Avoid duplicate alerts for repeated failures from the same command path.

Validation checklist:

- [ ] Manual: force a native command failure and confirm the renderer alert appears.
- [ ] Manual: dismissing the alert clears the visible error.
- [x] `pnpm lint`
- [x] `pnpm typecheck:renderer`
- [x] `pnpm build:renderer`
- [x] `cargo check --manifest-path src-tauri/Cargo.toml`

Suggested commit:

- `fix(ipc): surface tauri command failures in the renderer`

### A15 — CSP hardening and cleanup

Resolution status:

- Tauri now owns the renderer CSP through explicit `app.security.csp` and `devCsp` entries.
- The packaged policy keeps local scripts, styled-components/inline style needs, local/data images, fonts, media, and Tauri IPC while blocking object/frame/form/worker sources.
- The renderer HTML templates no longer carry the old broad meta CSP.
- Non-functional `className="test"` spacer markers and the unconsumed `openExternalCallback` connector prop were removed.

Scope checklist:

- [x] Replace `app.security.csp: null` with an explicit renderer policy that preserves required Tauri/runtime behavior.
- [x] Remove leftover non-functional markers such as `className="test"` after confirming they have no styling or test dependency.
- [x] Confirm whether `openExternalCallback` has any consumer; remove only if it is truly unused.
- [x] Keep cleanup edits behavior-neutral outside CSP.

Validation checklist:

- [ ] Manual: app starts and navigates in dev mode without CSP violations.
- [ ] Manual: packaged renderer starts without CSP violations.
- [x] `pnpm lint`
- [x] `pnpm typecheck:renderer`
- [x] `pnpm build:renderer`
- [x] `pnpm tauri build --no-bundle`

Suggested commit:

- `chore(security): tighten renderer csp and remove dead code`

---

## 3. Track B — Product Features

| ID  | Feature                                  | Status | Priority | Effort |
| --- | ---------------------------------------- | ------ | -------- | ------ |
| B1  | Cadence presets (5/1, 10/3, 25/5, 50/10) | Open   | High     | Low    |
| B2  | Extend session (+5 / +10)                | Open   | High     | Medium |
| B3  | Break suggestion prompts                 | Open   | High     | Low    |
| B4  | Global play/pause hotkey                 | Open   | Medium   | Low    |
| B5  | Cadence insights in statistics           | Open   | Medium   | Medium |
| B6  | Motivational completion messages         | Open   | Medium   | Low    |
| B7  | Reverse Pomodoro mode                    | Open   | Low      | Medium |
| B8  | Ambient sounds                           | Open   | Low      | High   |
| B9  | No-judgment mode                         | Open   | Low      | Low    |

Current product baseline:

- Manual cadence configuration already exists via config sliders (`stayFocus`, `shortBreak`, `longBreak`, `sessionRounds`).
- Global shortcuts already exist for hide/show app (`Alt+Shift+H` / `Alt+Shift+S`); play/pause is still pending.

### B1/B2/B3 (next cycle)

- Scope checklist:
  - [ ] Implement presets UI in settings.
  - [ ] Implement extend-session action at focus end.
  - [ ] Implement rotating break suggestion copy.
- Validation checklist:
  - [ ] Manual E2E: timer start -> focus end -> extend -> break flow.
  - [ ] Verify i18n keys in `en/pt/es/ja/zh/de/fr`.
- Suggested commit:
  - `feat(timer): add cadence presets, session extension, and break suggestions`

---

## 4. Guardrails

- Keep all data local-only (no cloud/server).
- New libraries require explicit impact review before adoption.
- Never edit changelog entries from released versions.
- Every finished implementation should leave a ready-to-use Conventional Commit suggestion.
