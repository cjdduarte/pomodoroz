# Improvements Roadmap — Pomodoroz

> Single source of truth for **pending improvements**.
>
> Implemented changes belong in `CHANGELOG.md` / `CHANGELOG.en.md`.
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
2. Add implementation details to `CHANGELOG.md` and `CHANGELOG.en.md`.
3. Remove unnecessary detail from this roadmap in the next planning cycle.

### Current checkpoint (2026-04-20)

- Released in `26.4.28` (PT/EN changelogs):
  - `A0` runtime consolidation to Tauri-only.
  - `A1` titlebar legacy CSS/changelog consistency (`-webkit-app-region`).
  - `A4` `check-updates` simplification to root-only narrative.
  - Linux release pipeline/AppImage hardening and `sync-latest-json` alignment.
- Current planning baseline:
  - Next open version headers already prepared in changelog (`26.4.29` as `A definir` / `TBD`).
  - `A2` env hygiene completed (renderer `.env` untracked, no committed `.env.example` required by default).
  - `A5` dependency modernization started in controlled batches (`uuid@14` and safe updates).
  - `A6` intentionally deferred by product decision (no test-track changes now).

### Next execution order (after 26.4.28)

1. **A5 — Controlled major dependency batches**
   - Batch 2: `eslint`/`@eslint/js` 10.x.
   - Batch 3: `vite-plugin-svgr` 5.x.
   - Validate and register each batch in changelog.
2. **A3 — Shortcut persistence**
   - Persist customizable shortcuts and restore on boot.
3. **Product cycle (B1 -> B2 -> B3)**
   - Cadence presets, session extension, break suggestion prompts.
4. **A6 revisit gate**
   - Revisit test strategy only after items above are stabilized.

---

## 2. Track A — Conversion Hardening (Tauri-only)

| ID  | Item                                                                          | Status      | Priority | Notes                                       |
| --- | ----------------------------------------------------------------------------- | ----------- | -------- | ------------------------------------------- |
| A0  | Consolidate runtime to Tauri-only and remove browser fallback branches        | Done        | High     | Released in 26.4.28                         |
| A1  | Resolve titlebar legacy CSS/changelog divergence (`-webkit-app-region`)       | Done        | High     | Released in 26.4.28                         |
| A2  | `.env` hygiene (`app/renderer/.env` tracked)                                  | Done        | High     | Completed and registered in 26.4.29 draft   |
| A3  | Persist custom shortcuts (`Shortcut.tsx` TODO)                                | Open        | Medium   | Avoid loss after restart                    |
| A4  | Simplify `check-updates` to root-only narrative and flows                     | Done        | Medium   | Released in 26.4.28                         |
| A5  | Controlled major updates (`eslint`/`@eslint/js` 10.x, `vite-plugin-svgr` 5.x) | In Progress | Medium   | Batch 1 applied; major batches pending      |
| A6  | Define automated test strategy (adopt baseline tests or remove idle stack)    | Blocked     | High     | Deferred by decision (no tests changes now) |

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

- `CHANGELOG.md` / `CHANGELOG.en.md` for `26.4.26` stated that `-webkit-app-region` rules were removed.
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
  - [ ] Apply batch 2 (`eslint` / `@eslint/js` 10.x) with full validation.
  - [ ] Apply batch 3 (`vite-plugin-svgr` 5.x) with full validation.
  - [ ] Register each completed batch in changelog.
- Validation checklist:
  - [x] `pnpm lint` (batch 1)
  - [x] `pnpm typecheck:renderer` (batch 1)
  - [x] `pnpm build:renderer` (batch 1)
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml` (batch 1)
- Suggested commit:
  - `chore(deps): apply controlled major updates batch`

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

---

## 3. Track B — Product Features

| ID  | Feature                                  | Status      | Priority | Effort |
| --- | ---------------------------------------- | ----------- | -------- | ------ |
| B1  | Cadence presets (5/1, 10/3, 25/5, 50/10) | In Progress | High     | Low    |
| B2  | Extend session (+5 / +10)                | Open        | High     | Medium |
| B3  | Break suggestion prompts                 | Open        | High     | Low    |
| B4  | Global play/pause hotkey                 | In Progress | Medium   | Low    |
| B5  | Cadence insights in statistics           | Open        | Medium   | Medium |
| B6  | Motivational completion messages         | Open        | Medium   | Low    |
| B7  | Reverse Pomodoro mode                    | Open        | Low      | Medium |
| B8  | Ambient sounds                           | Open        | Low      | High   |
| B9  | No-judgment mode                         | Open        | Low      | Low    |

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
  - [ ] Verify i18n keys in `en/pt/es/ja/zh`.
- Suggested commit:
  - `feat(timer): add cadence presets, session extension, and break suggestions`

---

## 4. Guardrails

- Keep all data local-only (no cloud/server).
- New libraries require explicit impact review before adoption.
- Never edit changelog entries from released versions.
- Every finished implementation should leave a ready-to-use Conventional Commit suggestion.
