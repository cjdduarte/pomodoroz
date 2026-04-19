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

---

## 2. Track A — Conversion Hardening (Tauri-only)

| ID  | Item                                                                          | Status | Priority | Notes                                       |
| --- | ----------------------------------------------------------------------------- | ------ | -------- | ------------------------------------------- |
| A1  | Resolve titlebar legacy CSS/changelog divergence (`-webkit-app-region`)       | Open   | High     | Keep behavior stable and align public notes |
| A2  | `.env` hygiene (`app/renderer/.env` tracked)                                  | Open   | High     | Remove from VCS and provide `.env.example`  |
| A3  | Persist custom shortcuts (`Shortcut.tsx` TODO)                                | Open   | Medium   | Avoid loss after restart                    |
| A4  | Simplify `check-updates` to root-only narrative and flows                     | Open   | Medium   | Remove workspace-era operational noise      |
| A5  | Controlled major updates (`eslint`/`@eslint/js` 10.x, `vite-plugin-svgr` 5.x) | Open   | Medium   | Execute in small validated batches          |
| A6  | Define automated test strategy (adopt baseline tests or remove idle stack)    | Open   | High     | Required for safer refactors                |

### A1 — Titlebar CSS/Changelog consistency

- Scope checklist:
  - [ ] Decide code direction (remove or retain `-webkit-app-region` rules).
  - [ ] Validate titlebar interactions (drag/minimize/close) on Linux and Windows.
  - [ ] Record final decision in changelog for the next version.
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
  - [ ] Remove obsolete workspace-centric wording where not needed.
  - [ ] Keep current root-only behavior explicit.
  - [ ] Preserve report/apply flows.
- Validation checklist:
  - [ ] `./scripts/check-updates.sh report`
  - [ ] `./scripts/check-updates.ps1 report`
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
