# Technical Decisions 2026 - Pomodoroz

> English companion document for planning and technical decisions.
> Portuguese source remains available at `docs/DECISOES_TECNICAS_2026.md`.
>
> Reference date: 2026-04-07

---

## 0. Execution Board

| Phase                                | Priority | Status      | Estimate | Risk   | Goal                           |
| ------------------------------------ | -------- | ----------- | -------- | ------ | ------------------------------ |
| Phase 0 - Pre-flight                 | Now      | In progress | 0.5d     | Low    | Green baseline + basic hygiene |
| Phase 1 - Yarn Classic -> Yarn Berry | Now      | Not started | 1d       | Medium | Exit Yarn 1 with low friction  |
| Phase 2 - Remove Lerna               | Later    | Not started | 1d       | Medium | Simplify monorepo              |
| Phase 3 - Scripts -> `yarn exec`     | Later    | Not started | 0.5d     | Low    | Script portability             |
| Phase 4 - Minimal CI matrix          | Later    | Not started | 1d       | Medium | Reproducibility and gates      |
| Phase U - Fork auto-update           | Now      | Completed   | 1d       | Medium | Publish feed and validate      |
| Phase 5 - Hooks tooling              | Optional | Not started | 0.5d     | Low    | Reduce hook overhead           |
| Phase 6 - `electron-vite`            | Optional | Not started | 1d       | Medium | Improve dev DX                 |
| Phase 7 - Vitest in renderer         | Optional | Not started | 1d       | Medium | Faster test cycle              |

Status legend:

- `Not started`: no PR open for this phase.
- `In progress`: active branch/PR exists.
- `Completed`: merged and validated.
- `Blocked`: depends on external decision or prerequisite.

---

## 1. Current Baseline

| Layer           | Technology                       | Version  |
| --------------- | -------------------------------- | -------- |
| Runtime         | Electron                         | 41.x     |
| Frontend        | React                            | 19.x     |
| Bundler         | Vite                             | 8.x      |
| Language        | TypeScript                       | 6.0.x    |
| Router          | React Router (HashRouter)        | 7.x      |
| State           | Redux Toolkit                    | 2.x      |
| Styling         | Styled Components                | 6.x      |
| DnD             | @dnd-kit                         | core 6.x |
| i18n            | i18next                          | 26.x     |
| Package manager | Yarn Classic                     | 1.22.x   |
| Monorepo runner | Lerna (+ embedded Nx runner)     | 9.x      |
| Packaging       | electron-builder                 | 26.x     |
| Persistence     | electron-store + localStorage    | current  |
| Git hooks       | Husky + lint-staged + Commitizen | current  |
| Main dev server | nodemon + wait-on                | current  |
| Tests           | Jest + ts-jest                   | current  |
| Lint            | ESLint 9 flat config + Prettier  | current  |
| Node.js         | v24                              | current  |

---

## 2. Migration Plan (Execution)

### Phase 0 - Pre-flight

- Goal: prepare migration with minimal risk.
- Scope:
  - green baseline
  - `.env` hygiene
  - reference versions documented
- Validation commands:

```sh
yarn lint
yarn build
yarn workspace pomodoroz run test --watchAll=false --runInBand
yarn build:dir
```

- Exit criteria:
  - commands pass locally
  - basic smoke checklist executed
  - `.env` out of version control and `.env.example` present
- Rollback:
  1. Revert phase docs/config changes.
  2. Restore previous lockfile and revalidate baseline.

### Phase 1 - Yarn Classic -> Yarn Berry (node-modules)

- Goal: move off Yarn 1 with minimal friction.
- Scope:
  - adopt Yarn Berry
  - keep `nodeLinker: node-modules` (no PnP in this phase)
  - set `packageManager` and `engines.node`
  - adjust CI to `--immutable`
- Validation commands:

```sh
yarn -v
yarn lint
yarn build
yarn workspace pomodoroz run test --watchAll=false --runInBand
yarn build:dir
```

- Exit criteria:
  - functional parity without regressions
  - Linux and Windows green for lint/build/test/build:dir
- Rollback:
  1. Restore previous Yarn 1 lock/config in branch.
  2. Reinstall dependencies and revalidate baseline.

### Phase 2 - Remove Lerna and use native workspaces

- Goal: simplify monorepo tooling.
- Scope:
  - replace `lerna run` with `yarn workspaces foreach`
  - remove `lerna` dependency after parity
- Validation commands:

```sh
yarn dev:app
yarn lint
yarn build
yarn build:dir
```

- Exit criteria:
  - equivalent scripts working
  - no loss of expected parallel behavior
- Rollback:
  1. Restore Lerna-based scripts.
  2. Reinstall deps and revalidate baseline.

### Phase 3 - Fixed binary paths -> `yarn exec`

- Goal: make scripts portable across environments.
- Scope:
  - replace `../../node_modules/...` style calls with `yarn exec`
- Validation commands:

```sh
yarn lint
yarn build
yarn workspace pomodoroz run test --watchAll=false --runInBand
```

- Exit criteria:
  - no remaining script with fixed tooling binary path
- Rollback:
  1. Revert script changes from this phase.
  2. Revalidate baseline.

### Phase 4 - Minimal CI matrix and reproducibility

- Goal: prevent silent regressions.
- Scope:
  - minimal matrix: Linux + Windows
  - gates: lint -> build -> test -> build:dir
  - fixed Node v24 + immutable lockfile
  - this phase covers source-code CI; packaged Win/macOS/Linux validation remains in product/release section
- Exit criteria:
  - pipeline running on PRs and push
  - gate failures block merge
- Rollback:
  1. Revert workflow if critical false positive appears.
  2. Open follow-up task and reapply in dedicated PR.

### Phase 5 (optional) - Husky + Commitizen -> lefthook

- Goal: reduce hook overhead.
- Run only after phases 1-4 stabilize.

### Phase 6 (optional) - `nodemon + wait-on` -> `electron-vite`

- Goal: improve dev workflow DX.
- Run only if there is real pain in current loop.

### Phase 7 (optional) - Jest -> Vitest (renderer)

- Goal: speed up renderer tests.
- Jest may remain in main/electron.

---

## 3. First Recommended PR

Recommended low-risk starting scope:

1. Finish Phase 0:
   - `.env` hygiene
   - green baseline documented
2. Deliver without changing package manager yet.

Expected outcome:

- small, reversible PR, no structural build change.
- cutoff rule: first PR includes only Phase 0. Phase 1 comes in next PR.

---

## 4. What NOT to Migrate in This Cycle

### Styled Components

- Decision: keep.
- Reason: high migration cost for low current functional gain.
- Reevaluate: if real performance/maintenance pain appears.

### React Router (HashRouter)

- Decision: keep.
- Reason: predictable navigation with low maintenance cost.
- Reevaluate: not in this cycle.

### electron-store -> SQLite

- Decision: keep.
- Reason: SQLite adds native complexity without immediate need.
- Reevaluate: when there is clear demand for complex querying.
- Note: keep `electron-store` in this cycle without isolated replacement.

### Redux Toolkit -> Zustand

- Decision: keep.
- Reason: large rewrite with no direct functional gain.
- Reevaluate: not in this cycle.

### Bun (runtime/package manager)

- Decision: keep Node + Yarn in this cycle.
- Reason: compatibility risk for Electron/release stack.
- Reevaluate: if Electron ecosystem maturity/support changes and current flow becomes painful.

### @dnd-kit, i18next, electron-builder

- Decision: keep.
- Reason: current choices are stable and fit the product.

---

## 5. Active Technical Pending Items (Now)

1. `.env` hygiene not finalized (`app/renderer/.env` tracked).
2. CI matrix not implemented yet.
3. Custom shortcut TODO without persistence (`Shortcut.tsx`).
4. Pending major updates in renderer:
   - `eslint` and `@eslint/js` 10.x
   - `vite-plugin-svgr` 5.x
5. Evolve `scripts/check-updates.sh` with `full` report mode for:
   - vulnerability auditing (`yarn audit`, no auto-fix)
   - GitHub Actions version checks in workflows
   - keep current mode as default (no interactive-flow break)

### 5.1 Planned task - `check-updates --full`

Goal:

- increase technical visibility (dependencies + security + CI) without changing default behavior.

Minimum scope:

- new read-only execution mode (`report --full`).
- separate summary for:
  - outdated direct dependencies (already available)
  - audit vulnerabilities
  - outdated GitHub Actions in `.github/workflows/*.yml`
- no automatic dependency updates in this mode.

Exit criteria:

- `./scripts/check-updates.sh report --full` works.
- self-explanatory output with `Dependencies`, `Audit`, and `GitHub Actions` sections.
- usage docs updated in `scripts/check-updates.sh --help` and README/technical docs.

---

## 6. Product Pending Items (Non-tooling)

Scope note: this section covers product/release validation (including packaged app), separate from CI phase 4.

| Pending item                                          | Source                    | Status                     |
| ----------------------------------------------------- | ------------------------- | -------------------------- |
| Always On Top on Linux/Wayland                        | Consolidated (2026-04-07) | Open                       |
| Full packaged matrix validation (Win/macOS/Linux)     | Consolidated (2026-04-07) | Open                       |
| Gamification (streaks, XP, achievements)              | Consolidated (2026-04-07) | Ideation                   |
| Adaptive focus improvements (presets, extend, breaks) | Consolidated (2026-04-08) | Ideation                   |
| Updater: fork-owned feed                              | Consolidated (2026-04-07) | Completed (release 26.4.9) |

### 6.1 Non-blocking future improvements (consolidated reference)

- [ ] Always On Top on Linux/Wayland (behavior depends on window manager/compositor)
- [ ] Full packaged matrix validation (Windows/macOS/Linux) in dedicated release cycle
- [ ] Gamification: achievements, streaks, XP, and level system based on completed focus cycles
- [ ] Adaptive focus: cadence presets, extend session, break suggestions (see section 6.7)

### 6.2 Final validation items (Settings)

- [x] Validate in packaged app: `Dark Theme` toggle appears and switches in Settings (including `Follow System Theme` -> manual transition)
- [ ] `Always On Top` on Linux/Wayland: keep as non-blocking future improvement for current baseline

### 6.3 Product reference features

#### Timer

- Focus / short break / long break / special break
- Play / pause / skip / reset
- Session rounds
- Compact mode

#### Tasks

- Lists and tasks
- Edit and complete
- Drag-and-drop

#### Settings

- Theme and language
- Tray behavior (minimize/close to tray)
- Always on top
- Native titlebar
- Open at login

#### Native integrations

- System tray with progress icon
- Notifications
- Global shortcuts
- Updater
- Fullscreen break

### 6.4 Gamification (future planning)

Goal: increase user engagement and motivation through game mechanics in Pomodoro workflow.

#### Ideas under evaluation

| Mechanic      | Description                                                           | Required data                                            |
| ------------- | --------------------------------------------------------------------- | -------------------------------------------------------- |
| Streaks       | Consecutive days with at least one completed cycle                    | Daily cycle history (already in `statistics`)            |
| XP / Levels   | Points per completed focus cycle with progressive levels              | Persistent counter (new slice or `statistics` extension) |
| Achievements  | Unlockable badges by milestones (e.g., 10 cycles, 7-day streak, 100h) | Rule logic over existing data                            |
| Daily summary | End-of-day popup/card with metrics and progress                       | `statistics` data filtered by day                        |

#### Principles

- 100% local data (no server/cloud), aligned with current architecture.
- Persistence via `localStorage` or `electron-store` (same app pattern).
- No new external dependencies; use Redux Toolkit state patterns.
- Incremental rollout: streaks -> XP -> achievements.
- Discreet UI that does not disrupt primary timer flow.

#### Technical dependencies

- `store/statistics` already tracks completed cycles, durations, and timestamps; enough for streaks and XP.
- Needs new slice (`store/gamification`) or `statistics` extension for persistent XP/levels/achievements.
- New components expected: badge/card in Timer or Statistics route.

#### Status

- In ideation. No code implemented.
- Waiting for minimum scope definition and approval.

### 6.5 Fork auto-update (implementation guide)

Goal: enable controlled auto-update, focused on Windows and Linux AppImage.

Current status (2026-04-07):

- Base technical flow already exists in code:
  - main/electron: `activateAutoUpdate`, `UPDATE_AVAILABLE` and `INSTALL_UPDATE` events.
  - renderer: update UI in Settings.
- Current blocker: fork-owned feed not yet fully operational in official release.
- Linux without `APPIMAGE` still intentionally skips checks.

Scope of this implementation:

- Includes:
  - release publishing with update metadata
  - packaged-app end-to-end validation
  - operation + rollback documentation
- Excludes:
  - changing Linux non-`APPIMAGE` behavior
  - stack migration (Yarn/Lerna) as updater prerequisite
  - introducing non-GitHub release server in this cycle

#### 6.5.1 Minimum requirements

1. Fork repository with GitHub Releases enabled.
2. Publish token (`GH_TOKEN`) available in release environment (local or CI).
3. Packaged build generates update metadata:
   - Linux AppImage: `latest-linux.yml` + `.AppImage`
   - Windows NSIS: `latest.yml` + NSIS installer
4. Published version greater than installed client version.

Notes:

- `build:*` scripts use `--publish=never` (do not publish feed).
- Publishing uses `release`/`release:mw` scripts with `--publish always`.

#### 6.5.2 Recommended operation steps

Step 1 - Prepare version:

1. Set new version (e.g., `26.4.9`).
2. Update changelog for this version.
3. Prepare commit/tag with dedicated script (independent of `validar-tudo`):
   - Unix: `yarn release:tag -- <version>`
   - PowerShell: `yarn release:tag:ps -- -Version <version>`
4. (Optional) validate without side effects:
   - `yarn release:tag:dry -- <version>`
5. Validate release script definitions:
   - root: `release` and `release:mw` in `package.json`
   - electron: `release` and `release:mw` in `app/electron/package.json`
6. Validate baseline:
   - `yarn lint`
   - `yarn build`
   - `yarn build:dir`

Step 2 - Publish artifacts with feed:

1. Export token in environment: `GH_TOKEN=<token>`
2. Publish release:
   - all targets: `yarn release`
   - mac + windows: `yarn release:mw`
   - dedicated linux release in linux job/platform when needed
3. `Release Auto Update` workflow syncs release title/notes from `CHANGELOG.md` section when triggered by `v*` tag.
4. Confirm published release contains:
   - Windows: NSIS installer + `latest.yml`
   - Linux: `.AppImage` + `latest-linux.yml`

Step 3 - Validate client (E2E):

1. Install previous version in test environment.
2. Open packaged app online.
3. Verify `UPDATE_AVAILABLE` reaches UI.
4. Trigger `Install Now` and confirm restart with new version.

Mandatory rule for next release:

- Next published version (N+1) is complete only after real E2E update test from latest public version (N).
- Minimum mandatory validation: Windows NSIS (`latest.yml`) and Linux AppImage (`latest-linux.yml`).

#### 6.5.3 Behavior matrix by platform/channel

| Platform/channel                  | Expected behavior                                        |
| --------------------------------- | -------------------------------------------------------- |
| Windows (NSIS)                    | Check, download, notify, install with `quitAndInstall()` |
| macOS                             | Out of scope for this activation cycle                   |
| Linux AppImage                    | Check update when `APPIMAGE` is present                  |
| Linux packaged without `APPIMAGE` | No update check (intentional skip)                       |
| Linux distro package (AUR)        | Update via distro package manager, not in-app updater    |
| Dev environment without config    | No update check (intentional skip)                       |

#### 6.5.4 Manjaro practical summary

- If user runs AppImage binary: in-app update may work.
- If user installs via distro package/AUR: treat in-app update as unsupported in this cycle.
- Recommended action for distro package users: update via system package manager.

#### 6.5.5 Acceptance criteria

- [x] Release metadata published and reachable.
- [x] Windows: automatic upgrade validated from N -> N+1.
- [x] Linux AppImage: update metadata/artifacts published and validated in release.
- [x] Linux without `APPIMAGE`: expected skip registered (no fatal error).
- [x] CHANGELOG updated with activation status.
- [x] Pending item "Updater: fork-owned feed" updated to Completed.

#### 6.5.6 Rollback

1. Stop publishing releases with automatic feed.
2. Publish hotfix without promoting automatic updates, if needed.
3. Keep clients on previous stable version while fixing pipeline/feed.
4. Reopen pending item in technical doc with root cause and next step.

#### 6.5.7 Relation to tooling phases

- Yarn/Lerna/CI migration improves release predictability but is not a direct technical prerequisite for updater.
- Real updater unlock depends on:
  - correct feed/metadata in published release
  - platform validation in packaged app

#### 6.5.8 Code signing and notarization (known risk)

- Windows: without code signing, SmartScreen may show extra warning.
- macOS: auto-update requires correct signing/notarization; this cycle does not include official macOS auto-update activation.
- Project already has `afterSign` notarization path conditioned by Apple key environment variables.

#### 6.5.9 Channel and download policy (current decision)

In-app auto-update supported in this cycle:

- Windows: NSIS installer only (`latest.yml` + NSIS setup)
- Linux: AppImage only (`latest-linux.yml` + `.AppImage`)

Out of in-app auto-update support in this cycle:

- Windows portable: distribution allowed, but no in-app update flow
- Linux `deb`/`rpm`/AUR: update via distro package manager

Download policy (current state):

- `electron-updater` keeps default behavior (`autoDownload` implicit)
- current UI treats `Install Now` as install step for already-downloaded update
- Windows NSIS hardening (2026-04-08):
  - explicit `shortcutName` and shortcut creation in `nsis` block
  - `nsis.include` with `customInstall` recreates missing Start Menu shortcut after install/update

Future optional review:

- If manual bandwidth/download control is needed, evaluate `autoDownload = false` with explicit download action in renderer.

### 6.6 PR/Release execution checklist (Auto Update)

PR-AU-00 - Mandatory gate for next release (N+1):

- [ ] Install current public version (N) in clean environment.
- [ ] Publish N+1.
- [ ] Validate real app update N -> N+1 (not only local build).
- [ ] Register result in N+1 CHANGELOG.

PR-AU-01 - Preparation and local validation:

- [ ] Define target version and update changelog.
- [ ] Confirm `release` and `release:mw` scripts exist and run.
- [ ] Execute baseline (`lint`, `build`, `build:dir`).
- [ ] Review section 6.5 for scope/non-scope.

PR-AU-02 - Feed publishing (pipeline/release):

- [ ] Configure `GH_TOKEN` in publishing environment.
- [ ] Publish release with `--publish always`.
- [ ] Confirm update metadata in release (Windows `latest.yml`, Linux `latest-linux.yml`).
- [ ] Confirm target binary upload (NSIS and AppImage).

PR-AU-03 - Windows E2E validation:

- [ ] Install version N.
- [ ] Publish N+1.
- [ ] Verify `UPDATE_AVAILABLE` reception.
- [ ] Execute `Install Now` and validate restart on N+1.
- [ ] Confirm `Pomodoroz` Start Menu entry (search + alphabetic list).
- [ ] Confirm `.lnk` file in `%APPDATA%\Microsoft\Windows\Start Menu\Programs\`.

PR-AU-04 - Linux AppImage E2E validation:

- [ ] Install version N via AppImage.
- [ ] Publish N+1 with `latest-linux.yml`.
- [ ] Validate check/download/install in AppImage.
- [ ] Register expected skip behavior outside AppImage.

PR-AU-05 - Closeout and governance:

- [ ] Update updater pending status in section 6 (Completed when ready).
- [ ] Register result in CHANGELOG (activation and platform limits).
- [ ] If regression occurs, apply section 6.5.6 rollback and reopen pending item.

<a id="adaptive-focus-candidates"></a>

### 6.7 Candidate improvements - adaptive focus (hypotheses)

Source: real feedback from ADHD communities (Reddit r/ADHD, clinical articles, user reports).
None of these are fixed commitments - all are hypotheses to validate.

Context: classic 25/5 Pomodoro tends to have limited adoption among ADHD users.
Most people who say it works are using a modified version. Common complaints:

1. Interrupting hyperfocus is disruptive.
2. Task-initiation paralysis - "I need to work 25 min" does not help starting.
3. Break becomes doomscroll instead of rest.
4. Rigid timer can create anxiety rather than focus.

Pomodoroz already covers part of this space (1-120 min durations, 0-min breaks, strict mode, progressive notifications, rotation grid with draw). Items below target the remaining gaps.

#### Next cycle (high priority)

| #   | Feature                 | Effort | Description                                                                                             | Success metric                                 |
| --- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Cadence presets         | Low    | Settings buttons: Just Start (5/1), Sprint (10/3), Classic (25/5), Flow (50/10). Fills existing fields. | % sessions started via preset vs manual config |
| 2   | Extend session (+5/+10) | Medium | End-of-focus option "Continue +5/+10 min" before break starts. Addresses hyperfocus interruption.       | Reduction in skip/reset during focus sessions  |
| 3   | Break suggestion        | Low    | Rotating break text: "Drink water", "Stretch", "Breathe". Keep user away from phone doomscroll.         | Lower cancel/skip rate during break            |

#### Backlog (evaluate after next cycle)

| #   | Feature                  | Effort | Description                                                                                                 | Success metric                                 |
| --- | ------------------------ | ------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 4   | Global play/pause hotkey | Low    | Example: `Alt+Shift+P` to start/pause without opening window. Existing hotkey infrastructure can be reused. | Hotkey adoption (local measurement, no upload) |
| 5   | Cadence report           | Medium | Statistics hint: "Your most productive sessions were around ~15 min" using existing store data.             | Statistics screen engagement                   |
| 6   | Motivational message     | Low    | "You completed 3 cycles today" after each focus block. Positive reinforcement.                              | Consecutive sessions/day                       |
| 7   | Reverse Pomodoro         | Medium | Inverted mode: long break -> short 2-3 min check-in -> break. For low-energy days.                          | Usage on days with 0 normal cycles             |
| 8   | Ambient sounds           | High   | White noise / lo-fi during focus. Frequently requested, requires audio assets and new UI.                   | % sessions with sound enabled                  |
| 9   | "No-judgment" mode       | Low    | Option to hide cycle counters/statistics on hard days.                                                      | Retention on low-usage days                    |

#### Principles

- Do not add rigid behavior - adaptability is the differentiator.
- Keep data 100% local.
- Implement incrementally; each item should be valuable on its own.
- Validate with real usage before expanding scope.

#### Status

- In ideation. No code implemented.
- Next cycle priority defined (items 1-3).

---

## 7. Impact on Packaged Artifacts

Changing package manager (Yarn -> Berry/pnpm) does not change final artifact formats.
Formats and naming come from `electron-builder`.

Flow:

```text
install deps -> build app -> electron-builder -> exe / nsis / AppImage / deb / rpm
```

What may vary:

- hash/size due to dependency resolution differences

What should remain:

- artifact formats
- naming policy (if builder config is unchanged)
- functional app behavior

---

## 8. If Starting from Scratch (Reference)

Reference stack (not for rewriting current app now):

```text
pnpm + electron-vite + React 19 + CSS Modules + Zustand + Vitest
+ @dnd-kit + i18next + lefthook + ESLint 9 + Prettier
```

---

## 9. Approved Decisions on 2026-04-07

1. Migrate tooling first (Yarn/Lerna/scripts/CI), not UI/state.
2. Keep Electron + React + Vite + TypeScript as base.
3. Do not migrate to Bun in this cycle.
4. Do not migrate styled-components/router/store/state in this cycle.
5. Execute in small, reversible blocks.

---

## 10. Standard Approval Checklist

Apply to every migration phase/PR:

- [ ] `lint` green
- [ ] `build` green
- [ ] `test` green
- [ ] `build:dir` green
- [ ] manual smoke in packaged binary (timer, tasks, settings, compact mode, tray)
- [ ] CHANGELOG updated when applicable

---

## 11. Sources

- CHANGELOG.md / CHANGELOG.en.md
- README.md / README.pt-BR.md
- docs/DECISOES_TECNICAS_2026.md
- CLAUDE.md
- Technical discussions from 2026-04-07
