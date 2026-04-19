# Improvements Roadmap — Pomodoroz

> Single source of truth for **pending improvements**.
>
> Implemented changes belong in `CHANGELOG.md` / `CHANGELOG.en.md`.
> Release procedures belong in `RELEASE_OPERATIONS.md`.

---

## 1. How To Use This Document

This roadmap has two tracks:

- **Track A — Conversion Hardening (Tauri-only)**: technical consolidation after migration.
- **Track B — Product Features**: user-facing features not implemented yet.

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

### Current checkpoint (2026-04-19)

- Implemented in code and registered in changelog draft `26.4.27` (PT/EN):
  - Runtime consolidation to Tauri-only (connector/runtime fallback cleanup).
  - Utility flows aligned to Tauri-only (`openExternalUrl`, desktop notification, updater actions).
  - Titlebar legacy CSS cleanup (`-webkit-app-region` removal) aligned with Tauri drag path.
  - Linux panel/launcher icon alignment (`favicon` + `StartupWMClass` in `.desktop` paths).
  - `check-updates` wording aligned to root-only project narrative.
  - Documentation consolidation around `docs/IMPROVEMENTS.md`.
- Pending to close this checkpoint:
  - Final release date for `26.4.27` in both changelogs.
  - Tag/publish flow execution via release script.

### Next execution order (after 26.4.27)

1. **Close release 26.4.27**
   - Set final date in `CHANGELOG.md` and `CHANGELOG.en.md`.
   - Run `./scripts/release.sh 26.4.27`.
2. **Release 26.4.28 — Stability + consistency**
   - Execute **A1** (titlebar CSS/changelog divergence).
   - Execute **A2** (`.env` hygiene).
3. **Release 26.4.29 — Quality gate**
   - Execute **A6** (test strategy decision and implementation).
   - Optionally include **A3** (shortcut persistence) if scope fits.
4. **Next product cycle**
   - Start **B1/B2/B3** together (presets, extend session, break suggestions).

---

## 2. Track A — Conversion Hardening (Tauri-only)

| ID  | Item                                                                          | Status      | Priority | Notes                                                |
| --- | ----------------------------------------------------------------------------- | ----------- | -------- | ---------------------------------------------------- |
| A0  | Consolidate runtime to Tauri-only and remove browser fallback branches        | In Progress | High     | Implemented in code, pending 26.4.27 release close   |
| A1  | Resolve titlebar legacy CSS/changelog divergence (`-webkit-app-region`)       | In Progress | High     | Code aligned in 26.4.27 draft; pending release close |
| A2  | `.env` hygiene (`app/renderer/.env` tracked)                                  | Open        | High     | Remove from VCS and provide `.env.example`           |
| A3  | Persist custom shortcuts (`Shortcut.tsx` TODO)                                | Open        | Medium   | Avoid loss after restart                             |
| A4  | Simplify `check-updates` to root-only narrative and flows                     | In Progress | Medium   | Implemented in code, pending 26.4.27 release close   |
| A5  | Controlled major updates (`eslint`/`@eslint/js` 10.x, `vite-plugin-svgr` 5.x) | Open        | Medium   | Execute in small validated batches                   |
| A6  | Define automated test strategy (adopt baseline tests or remove idle stack)    | Open        | High     | Required for safer refactors                         |

### A0 — Tauri-only runtime consolidation

- Scope checklist:
  - [x] Remove dual-runtime branch resolution and keep Tauri connector path as primary runtime.
  - [x] Simplify updater action path to Tauri-native install/restart flow.
  - [x] Remove renderer/browser fallback branches in utility wrappers where runtime is always Tauri.
  - [x] Align docs references to the consolidated roadmap structure.
  - [ ] Mark as `Done` after release `26.4.27` is published.
- Validation checklist:
  - [x] `pnpm lint`
  - [x] `pnpm typecheck:renderer`
  - [x] `pnpm build:renderer`
  - [x] `cargo check --manifest-path src-tauri/Cargo.toml`
- Suggested commit:
  - `refactor(tauri): enforce tauri-only runtime and consolidate improvements roadmap`

### A1 — Titlebar CSS/Changelog consistency

Resolution status (code):

- `CHANGELOG.md` / `CHANGELOG.en.md` for `26.4.26` state that `-webkit-app-region` rules were removed.
- `26.4.27` draft now includes the corrective item and code has been aligned (legacy rules removed from `src/styles/components/titlebar.ts`).
- Dragging remains on current Tauri runtime through:
  - `data-tauri-drag-region` in `src/components/Titlebar.tsx`
  - native command `start_window_drag` in `src-tauri/src/commands/window_bridge.rs`

Impact:

- Main issue was **public documentation inconsistency** (audit/release trust), not a known crash.
- Keep this tracked until `26.4.27` is released and then mark as `Done`.

- Scope checklist:
  - [x] Decide code direction (remove or retain `-webkit-app-region` rules).
  - [x] Align code to selected direction (`-webkit-app-region` removed).
  - [ ] Validate titlebar interactions (drag/minimize/close) on Linux and Windows.
  - [ ] Record final decision in changelog for the next version.
  - [ ] Mark as `Done` after release `26.4.27` is published.
- Validation checklist:
  - [ ] `pnpm lint`
  - [ ] `pnpm typecheck:renderer`
  - [ ] `pnpm build:renderer`
  - [ ] `cargo check --manifest-path src-tauri/Cargo.toml`
- Suggested commit:
  - `fix(titlebar): align legacy drag css with tauri behavior and release notes`

### A2 — `.env` hygiene

- Scope checklist:
  - [ ] Stop tracking `app/renderer/.env`.
  - [ ] Add `app/renderer/.env.example` with safe placeholders.
  - [ ] Update setup docs.
- Validation checklist:
  - [ ] `git status --short` shows no sensitive env values staged.
- Suggested commit:
  - `chore(config): untrack renderer env file and add env example`

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
  - [ ] Mark as `Done` after release `26.4.27` is published.
- Validation checklist:
  - [x] `./scripts/check-updates.sh report`
  - [x] `./scripts/check-updates.ps1 report`
- Suggested commit:
  - `refactor(scripts): simplify check-updates flow for root-only project layout`

### A5 — Major dependency updates

- Scope checklist:
  - [ ] Split updates into independent batches.
  - [ ] Run full validation per batch.
  - [ ] Register each batch in changelog.
- Validation checklist:
  - [ ] `pnpm lint`
  - [ ] `pnpm typecheck:renderer`
  - [ ] `pnpm build:renderer`
  - [ ] `cargo check --manifest-path src-tauri/Cargo.toml`
- Suggested commit:
  - `chore(deps): apply controlled major updates batch`

### A6 — Test strategy decision

- Scope checklist:
  - [ ] Decide path: `adopt-tests` or `remove-test-stack`.
  - [ ] If adopt: create baseline smoke tests + CI job.
  - [ ] If remove: clean Jest/Babel test deps and scripts.
- Validation checklist:
  - [ ] CI reflects the chosen strategy.
- Suggested commit:
  - `chore(testing): define and apply project test strategy`

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
