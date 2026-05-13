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
- `Implemented`: implemented and tracked in changelog, pending final manual validation.
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
  - `A6` is now being reopened incrementally: Vitest replaced the idle Jest stack, CI/local validation run `pnpm test:run`, and the next work is prioritized unit coverage without adding React/DOM test dependencies first.
  - `A9` locale-source unification is now implemented with `@tauri-apps/plugin-os` (renderer) + `tauri_plugin_os::locale()` (native startup).
  - `A10` opens a dependency-rationalization gate where migration is executed only if measurable ROI justifies the change.
  - `A11` Windows CI parity gate is now implemented (`ubuntu-latest` + `windows-latest`) and workflow runs completed successfully in both OS lanes.
  - `A12` write-path hardening is now implemented: `write_text_file` enforces `.json`, rejects existing non-file targets, and caps payload at 5 MB.
  - `A13` updater channel support memoization is implemented; only manual runtime-channel validation remains.
  - `A14` native IPC error visibility is implemented; only manual failure-injection validation remains.
  - `26.4.37` draft contains `A15` renderer CSP hardening and an IPC warning refinement so optional background sync failures do not show the generic native warning banner.
  - `26.4.38` draft contains updater prompt state simplification and `A3` shortcut persistence for the app-owned toggle-theme shortcut.

### Next execution order

1. **Product validation (B1)**
   - Manually validate task priorities in the normal and compact grids before marking B1 as `Done`.
2. **Remaining product cycle (B2 -> B4)**
   - Cadence presets and break suggestion prompts.
3. **A6 test coverage expansion**
   - Expand Vitest coverage in small no-new-dependency batches before considering React/component test tooling.
4. **A10 dependency rationalization gate**
   - Evaluate necessity first; execute only if metrics and maintenance ROI are clear.

---

## 2. Track A — Conversion Hardening (Tauri-only)

| ID  | Item                                                                          | Status      | Priority | Notes                                                         |
| --- | ----------------------------------------------------------------------------- | ----------- | -------- | ------------------------------------------------------------- |
| A0  | Consolidate runtime to Tauri-only and remove browser fallback branches        | Done        | High     | Released in 26.4.28                                           |
| A1  | Resolve titlebar legacy CSS/changelog divergence (`-webkit-app-region`)       | Done        | High     | Released in 26.4.28                                           |
| A2  | `.env` hygiene (`app/renderer/.env` tracked)                                  | Done        | High     | Completed and registered in 26.4.29 draft                     |
| A3  | Persist custom shortcuts (`Shortcut.tsx` TODO)                                | Done        | Medium   | Delivered in 26.4.38 draft                                    |
| A4  | Simplify `check-updates` to root-only narrative and flows                     | Done        | Medium   | Released in 26.4.28                                           |
| A5  | Controlled major updates (`eslint`/`@eslint/js` 10.x, `vite-plugin-svgr` 5.x) | Done        | Medium   | Batches 1/2/3 completed in 26.4.29 draft                      |
| A6  | Define automated test strategy and expand high-ROI unit coverage              | In Progress | High     | Vitest baseline adopted; expand no-new-dependency tests first |
| A7  | Replace renderer `package.json` imports with injected app version metadata    | Done        | Medium   | Delivered in 26.4.36                                          |
| A8  | Expand i18n language coverage (`de`/`fr`) with tray/startup parity            | Done        | High     | Delivered in 26.4.31                                          |
| A9  | Unify auto-language source between renderer and native tray                   | Done        | Medium   | Delivered in 26.4.33 draft                                    |
| A10 | Dependency rationalization gate (`uuid`, debounce, tests, style/state stack)  | Blocked     | Medium   | Execute only with measurable ROI; no-change is valid          |
| A11 | Add Windows CI parity gate for renderer and Rust quality checks               | Done        | High     | Delivered in 26.4.34 draft                                    |
| A12 | Harden `write_text_file` to mirror `read_text_file` guardrails                | Done        | High     | Delivered in 26.4.34 draft                                    |
| A13 | Memoize updater-channel support result across runtime session                 | Done        | Medium   | Delivered in 26.4.35 draft                                    |
| A14 | Surface asynchronous Tauri IPC command errors in the UI                       | Done        | High     | Delivered in 26.4.36                                          |
| A15 | Tighten renderer CSP and remove small dead-code residues                      | Done        | High     | Delivered in 26.4.37 draft                                    |
| A16 | Add AppImage external update information (`zsync`) for `AppImageUpdate`       | Open        | Low      | Schedule with next Linux pipeline change                      |

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

Resolution status:

- The app-owned `Toggle Theme` shortcut now persists through `settings.shortcuts.toggleTheme` and is restored by the existing root-state hydration path.
- Invalid shortcuts and conflicts with reserved system/native shortcuts are ignored safely.
- System editing shortcuts and native hide/show shortcuts remain informational until a future native re-registration flow exists.

- Scope checklist:
  - [x] Persist custom shortcut setting in local state storage.
  - [x] Restore values at boot.
  - [x] Handle invalid conflicts safely.
- Validation checklist:
  - [ ] Manual restart preserves changed shortcut.
  - [x] `pnpm lint`
  - [x] `pnpm typecheck:renderer`
  - [x] `pnpm build:renderer`
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

### A6 — Automated test strategy and high-ROI unit coverage

Decision checkpoint:

- Final path selected: **adopt tests**.
- Jest-specific packages and direct Babel test dependencies are being removed in favor of Vitest.
- `pnpm test:run` is part of CI and local validation/build gates.
- Expansion must start with pure TypeScript logic and reducers before adding React/DOM test tooling.

Critical assessment of the proposed test plan:

- The overall priority is correct: task/settings/statistics reducers and persistence helpers have the best regression-risk-to-effort ratio.
- `jsdom` should not be treated as configuration-only. Vitest can run in `node` by default, and storage tests can mock `globalThis.localStorage` manually without adding a DOM dependency.
- Reducer tests should prefer public actions/reducers over private helper exports. Private normalization helpers such as task day-color migration should be validated through hydrated/replaced state behavior where practical.
- Hook/component tests are valuable later, but adding `@testing-library/react` / `user-event` should remain a separate dependency decision with a clear test target and maintenance cost.
- Tauri E2E should stay deferred. Current CI build/check gates plus manual release checks are a better cost/risk tradeoff for now.

Priority order:

1. `src/store/tasks/utils/task.ts` and `tasklist.ts`
   - Cover task/list creation, shallow edits, append/remove behavior, and immutability of the original list.
   - Use `vi.mock("uuid")`; no new dependency.
2. `src/store/tasks/index.ts`
   - Cover `addTaskList`, `setTaskListPriority`, `skipTaskCard`, `dragList`, `replaceTaskLists` / `appendTaskLists`, and `undoTasks` / `redoTasks`.
   - Validate the single-priority invariant and undo/redo boundaries.
3. `src/store/settings/index.ts`
   - Cover invalid persisted setting values, shortcut normalization, reserved shortcut rejection, and reset/default behavior through public reducer state where possible.
4. `src/store/statistics/index.ts`
   - Cover session merge versus append behavior, duration precision, ignored zero/negative durations, and legacy storage hydration behavior.
5. `src/store/config`, `src/store/timer`, `src/store/taskSelection`, `src/store/update`
   - Add smoke reducer tests for simple setters and merge/default behavior.
6. `src/utils/storage.ts`
   - Mock `localStorage` manually in `node` environment; cover serialization, parsing, missing keys, and swallowed storage/JSON errors.
7. `src/hooks/useNotification.ts`
   - Mock audio/desktop notification utilities and cover mute/notify/sound behavior without React Testing Library if the returned notifier remains directly callable.
8. `src/hooks/useLanguageSync.ts`
   - Blocked until React hook testing tooling is explicitly approved.
9. Shared UI component tests
   - Blocked until React Testing Library and user-event are explicitly approved.
10. Tauri E2E

- Deferred indefinitely unless release regressions justify tauri-driver/WebDriver setup.

- Scope checklist:
  - [x] Decide final path: adopt automated tests.
  - [x] Replace idle Jest stack with Vitest baseline.
  - [x] Add `pnpm test:run` to CI.
  - [x] Add `pnpm test:run` to local validation/build gates.
  - [x] Add initial phase 1 task utility tests for `task.ts`.
  - [x] Add initial phase 1 task list utility immutability test for `tasklist.ts`.
  - [ ] Add remaining phase 1 task list utility tests for creation/edit/remove behavior.
  - [ ] Add phase 2 high-risk reducer tests.
  - [ ] Add phase 3 storage tests with manual `localStorage` mock.
  - [ ] Decide separately whether React hook/component testing dependencies are worth adding.
- Validation checklist:
  - [x] `pnpm test:run`
  - [x] CI reflects the chosen strategy.
  - [ ] `pnpm lint`
  - [ ] `pnpm typecheck:renderer`
  - [ ] `pnpm build:renderer`
- Suggested commit:
  - `chore(testing): adopt vitest and expand renderer unit coverage`

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

### A16 — AppImage external update information (`zsync`)

Decision checkpoint:

- This item is **independent from the in-app Tauri updater**. The Tauri updater path stays exactly as it is today (`*.AppImage` + `*.AppImage.sig` with check/notify/install/restart in-app).
- Goal: also support **external update tools** like `AppImageUpdate` and `appimaged`, which can apply delta updates to a downloaded AppImage **without opening the app**, by reading an embedded "update information" string and downloading a per-release `.zsync` file.
- Both paths must coexist: a user can choose to update from inside the app (Tauri flow) or from an external tool (AppImage flow). They must not interfere with each other.
- Origin of the request:
  - Local: [Pomodoroz #1](https://github.com/cjdduarte/pomodoroz/issues/1) (`@guidomz`).
  - Upstream parity: [Pomatez #742](https://github.com/zidoro/pomatez/issues/742).
- Timing rationale:
  - The Linux release pipeline (AppImage build, signing, `sync-latest-json`) only recently stabilized after several hotfixes (see `26.4.28` notes).
  - This change must be **scheduled together with the next planned change to the Linux release pipeline**, not as an isolated edit now, to avoid destabilizing a recently stabilized path.
- Out of scope:
  - Changes to Windows NSIS or Linux `deb`/`rpm` flows.
  - Changes to the Tauri updater feed format or signature scheme.
  - Auto-installing AppImage updates externally on behalf of the user (this remains a user-driven action via `AppImageUpdate`/`appimaged`).

What "update information" means here:

- A short string embedded in the AppImage ELF header that tells external tools where to find updates. For GitHub Releases the typical form is:
  - `gh-releases-zsync|<owner>|<repo>|latest|<AppImage-name-pattern>.zsync`
- A `.zsync` file published as a release asset alongside each `.AppImage`, describing block-level deltas so the external tool only downloads changed chunks.

Scope checklist:

- [ ] Decide and document the canonical AppImage filename pattern used in releases (must be stable across versions for `latest` resolution).
- [ ] Extend the Linux build step to embed the GitHub Releases update-information string into the produced AppImage.
- [ ] Generate a `.zsync` file for the produced AppImage during the release job.
- [ ] Publish the `.zsync` file as a GitHub Release asset together with `*.AppImage` and `*.AppImage.sig`.
- [ ] Confirm the existing Tauri updater feed (`latest.json` / signature flow) is **not** affected by the new asset.
- [ ] Update [`docs/RELEASE_OPERATIONS.md`](RELEASE_OPERATIONS.md) Section 5 (Behavior Matrix) and asset list (Section currently at line ~75) to mention the optional external AppImage update path and the `.zsync` artifact.
- [ ] Add a short note to the README (Installation section) describing the optional external update path for AppImage users, without implying it replaces the in-app updater.

Validation checklist:

- [ ] Manual: download AppImage `N`, run `AppImageUpdate ./Pomodoroz-N.AppImage` after publishing `N+1`, confirm it detects the new version, applies the delta, and produces a working `N+1` binary.
- [ ] Manual: same flow with `appimaged` registering the AppImage and detecting the update via the embedded update-information string.
- [ ] Manual: in-app Tauri update flow on Linux AppImage still works exactly as today (check, notify, install, restart) — no regression.
- [ ] Manual: `*.AppImage.sig` still validates against the current Tauri updater public key.
- [ ] Release page shows the new `.zsync` asset alongside `.AppImage` and `.AppImage.sig`.
- [ ] No change in Windows NSIS or Linux `deb`/`rpm` artifacts or behavior.
- [ ] CHANGELOG entry added under the release that ships A16, in both `CHANGELOG.md` and `CHANGELOG.pt.md`.

Risk and rollback:

- Risk: malformed update-information string can make the produced AppImage unusable by external tools (but does not affect in-app updater).
- Rollback: stop publishing the `.zsync` asset and revert the build step that embeds the update-information string. The Tauri updater flow remains unaffected because it does not depend on either artifact.

Suggested commit:

- `feat(release): add appimage update information and zsync for external updaters`

---

## 3. Track B — Product Features

| ID  | Feature                                  | Status      | Priority | Effort |
| --- | ---------------------------------------- | ----------- | -------- | ------ |
| B1  | Task priorities in grid                  | Implemented | High     | Medium |
| B2  | Cadence presets (5/1, 10/3, 25/5, 50/10) | Open        | High     | Low    |
| B3  | Extend session (+5 / +10)                | Done        | High     | Medium |
| B4  | Break suggestion prompts                 | Open        | High     | Low    |
| B5  | Global play/pause hotkey                 | Open        | Medium   | Low    |
| B6  | Cadence insights in statistics           | Open        | Medium   | Medium |
| B7  | Motivational completion messages         | Open        | Medium   | Low    |
| B8  | Reverse Pomodoro mode                    | Open        | Low      | Medium |
| B9  | Ambient sounds                           | Open        | Low      | High   |
| B10 | No-judgment mode                         | Open        | Low      | Low    |
| B11 | Timer circle small-window layout fix     | Done        | Medium   | Low    |

Current product baseline:

- Manual cadence configuration already exists via config sliders (`stayFocus`, `shortBreak`, `longBreak`, `sessionRounds`).
- Global shortcuts already exist for hide/show app (`Alt+Shift+H` / `Alt+Shift+S`); play/pause is still pending.
- Existing `TaskList.priority` is list-level, single-selection behavior used by the Timer flow. It must not be reused for multi-card priorities.
- Existing grid `dayColor` is a daily rotation/status marker (`white/green/red`) and may reset by date. It must not be reused for persistent task priority.
- Normal grid and compact grid both render through `TaskListGrid`; priority behavior should be implemented once there and verified in both window modes.

### B1 — Task priorities in grid

Decision checkpoint:

- Add a new persistent field on each task card, not on the list:
  - `prioritized: boolean`
- Keep the existing meanings separate:
  - `done`: task completion.
  - `taskSelection`: the single active task currently linked to the Timer.
  - `TaskList.priority`: the current single priority/active list behavior used by Timer selection.
  - `dayColor`: daily grid rotation/status.
  - `prioritized`: user-selected cards that should be surfaced first.
- The first implementation should not add a library. Use existing store/UI patterns and local SVG/icon conventions if a new icon is needed.

UX target:

- The main surface is the Tasks grid.
- The same behavior must apply to:
  - normal Tasks grid;
  - Timer grid overlay in normal mode;
  - compact-mode grid panel.
- Prioritized pending tasks should render above the rest of the grid as a first full-width section titled `Priorities` / `Prioridades`.
- When priority filtering is off, prioritized pending tasks appear only in the priority section and are not duplicated in the lower task area.
- The lower task area keeps the existing grid behavior for all non-priority pending tasks plus completed tasks.
- A completed prioritized task should leave the active priority section automatically because the section is for pending priorities. The field may remain stored so unchecking `done` can restore the task to the priority section.
- Add a grid toolbar control to show all tasks or only prioritized pending tasks.
- Empty priority state should be quiet: do not add a large empty panel when no task is prioritized.
- In grouped mode, the priority section stays above all list groups. The remaining groups continue to use list separators.
- The grid card should expose a clear action to mark/unmark priority without interfering with:
  - left-click daily color cycling;
  - right-click Timer selection;
  - active task highlight;
  - completed-card selection guard.

Scope checklist:

- [x] Add `prioritized: boolean` to `Task`.
- [x] Default new tasks to `false`.
- [x] Normalize old persisted tasks to `false` during tasks state hydration.
- [x] Keep all data local-only in the existing root state persistence.
- [x] Add a reducer action to toggle or set card priority by `listId` + `cardId`.
- [x] Preserve undo/redo behavior through the existing tasks history reducer.
- [x] Add Vitest coverage for defaults, migration/normalization, toggle behavior, and undo/redo.
- [x] Include `prioritized` in exported task JSON.
- [x] Accept missing `prioritized` during import as `false` for backward compatibility.
- [x] Bump `TASKS_TRANSFER_VERSION` to `2` while keeping older imports valid.
- [x] Build priority-first grid items in `TaskListGrid`.
- [x] Add the top `Priorities` / `Prioridades` separator only when at least one pending prioritized task exists.
- [x] Add a persisted all/prioritized-only toolbar control.
- [x] Add mark/unmark priority to the grid card flow using an overlaid star action.
- [x] Keep current Timer selection unchanged in the first slice.
- [x] Add a Settings option to limit Draw to prioritized eligible cards with automatic fallback to the normal draw pool.
- [x] Keep Draw behavior independent from the visual prioritized-only grid filter.

Deferred follow-up:

- [ ] Manual desktop validation: verify priority section layout in normal and compact grids.
- [ ] Consider list-mode priority visibility only after the grid behavior is stable.
- [ ] Evaluate whether the Timer dropdown should sort prioritized pending tasks first.

Validation checklist:

- [x] Existing tasks from old storage load with `prioritized: false`.
- [x] New task cards default to non-priority.
- [ ] Manual: priority toggle persists after app restart.
- [x] Undo/redo restores priority state correctly.
- [x] Exported JSON includes priority state.
- [x] Imported older JSON without priority fields remains valid.
- [ ] Manual: normal grid shows pending priorities first under `Priorities`.
- [ ] Manual: compact grid shows the same priority section without clipping or resizing regressions.
- [ ] Manual: priority-only mode hides non-priority cards and keeps completed-card guards.
- [ ] Manual: left-click grid color cycling still works.
- [ ] Manual: right-click Timer selection still works and ignores completed cards.
- [ ] Manual: active task highlight remains visible when the active task is prioritized.
- [ ] Manual: with `Draw only prioritized tasks` enabled and at least one prioritized eligible card, Draw uses only prioritized cards.
- [ ] Manual: with `Draw only prioritized tasks` enabled and no prioritized eligible cards, Draw falls back to the normal eligible pool.
- [x] `pnpm lint`
- [x] `pnpm typecheck:renderer`
- [x] `pnpm test:run`
- [x] `pnpm build:renderer`

Suggested commit:

- `feat(tasks): add task priorities to the grid`

### B11 bug note

- In normal mode, when the user resizes the app by dragging the window border to a smaller width or height, the main timer circle can overflow its intended area and overlap the navigation area, session label, and timer controls.
- Reproduce on the Timer route by dragging the window border inward until the circle touches or covers the top navigation and bottom controls.
- Fixed by enforcing the normal-mode native minimum window size, keeping the control row from shrinking vertically, and retaining width-aware timer-circle scaling for narrower supported layouts.
- Validation target: timer circle must remain fully visible and must not overlap navigation, titlebar, session label, play/skip/volume/fullscreen controls, or compact task footer in small windows.

### B3 decision notes

- Session extension must be optional. Add a settings toggle for the feature; when disabled, the app must behave exactly as it does today.
- Current baseline to preserve: when focus reaches zero, the app automatically transitions into the next short/long break and the break starts counting immediately.
- Add configurable extension durations to the Config/Rules screen:
  - Short extension: default `5 min`.
  - Long extension: default `10 min`.
  - Valid range: `1-30 min`.
- Add localized copy for every supported language (`en`, `pt`, `es`, `ja`, `zh`, `de`, `fr`) for the settings toggle, Config/Rules labels, and extension prompt actions.
- MVP limit: allow one extension per focus session. Keep this limit internal for now instead of adding another user-facing setting.
- Show the extension prompt at `T-30s` during a focus session, not as a blocking step at zero. If the user takes no action, the normal automatic break transition must continue.
- If the app is hidden, unfocused, minimized, or in tray when the `T-30s` extension window opens, send one native reminder only when Settings -> Notification Types is not `none`.
- The hidden-app reminder must align with the existing notification setting: `none` means no native reminder; `normal` and `extra` may show the extension reminder.
- In `extra` notification mode, accepting an extension may allow the standard 30-second focus warning to appear again near the end of the extended focus. This is intentional: the hidden-app extension reminder only suppresses the simultaneous standard 30-second warning at the original extension window.
- The prompt is non-modal. It disappears when the user pauses the timer or when focus ends.
- Do not rewind an already-started break in the first B3 implementation.
- Extending focus keeps the same focus session and round. It must not create a new pomodoro/session count.
- Statistics should record one focus block with the real final duration, including the extension.
- The next break keeps its configured duration; focus extension must not scale short/long break length.
- Defer native notification action buttons and keyboard shortcuts for the first B3 implementation.

### B2/B3/B4 (timer/cadence cycle)

- Scope checklist:
  - [ ] Implement presets UI in settings.
  - [x] Implement optional extend-session feature toggle in settings.
  - [x] Implement configurable short/long extension durations in Config/Rules.
  - [x] Implement one-use extend-session prompt at `T-30s`.
  - [ ] Implement rotating break suggestion copy.
- Validation checklist:
  - [x] Manual E2E: extension disabled -> timer start -> focus end -> automatic break starts as today.
  - [x] Manual E2E: extension enabled -> prompt appears at `T-30s` -> no action -> automatic break starts as today.
  - [x] Manual E2E: extension enabled -> choose short extension -> focus duration increases by configured short value -> break starts after extended focus.
  - [x] Manual E2E: extension enabled -> choose long extension -> focus duration increases by configured long value -> break starts after extended focus.
  - [x] Verify extension duration controls enforce the `1-30 min` range.
  - [x] Verify pausing the timer while the extension prompt is visible hides the prompt.
  - [x] Verify hidden/minimized/tray behavior: with notifications disabled, no native reminder appears; with `normal` or `extra`, one extension reminder appears at `T-30s`.
  - [x] Verify `extra` notification mode suppresses the simultaneous standard 30-second focus notification when the hidden-app extension reminder is sent, while still allowing the standard 30-second warning near the end of an accepted extension.
  - [x] Verify the extension prompt does not appear more than once in the same focus session.
  - [x] Verify statistics record one focus block with the real extended duration and do not inflate completed session count.
  - [x] Verify short/long break duration remains unchanged after an extended focus.
  - [x] Verify i18n keys and rendered copy in `en/pt/es/ja/zh/de/fr` with no fallback/missing-key text.
- Validation executed:
  - [x] `pnpm lint`
  - [x] `pnpm typecheck:renderer`
  - [x] `pnpm build:renderer`
  - [x] Browser smoke: settings toggle renders, Config/Rules extension sliders enforce `1-30 min`, prompt appears at `T-30s`, and short extension adds time once.
  - [x] Normal timer layout smoke: extension prompt renders inline below the controls and stays clear of the task footer.
  - [x] Config/Rules layout smoke: extension sliders remain reachable in short windows through denser spacing and route-level scrolling.
  - [x] Compact layout smoke: extension prompt closes the compact grid if open, uses a prompt-sized compact expansion, keeps both extension buttons visible, and collapses after the prompt closes.
- Suggested commit:
  - `feat(timer): add focus session extension`

---

## 4. Guardrails

- Keep all data local-only (no cloud/server).
- New libraries require explicit impact review before adoption.
- Never edit changelog entries from released versions.
- Every finished implementation should leave a ready-to-use Conventional Commit suggestion.
