<h1 align="center">Pomodoroz</h1>

<h3 align="center">Flexible focus. Smarter breaks. Real progress.</h3>

<p align="center"><em>Adaptive Focus Timer — 25/5 is a starting point, not a rule.</em></p>

<p align="center">
  <a href="README.pt-BR.md">Portuguese version</a>
</p>

<p align="center">
  <a href="https://github.com/cjdduarte/pomodoroz/releases/latest"><img alt="release" src="https://img.shields.io/github/v/release/cjdduarte/pomodoroz?label=release&color=blue"></a>
  <a href="https://github.com/cjdduarte/pomodoroz/releases"><img alt="downloads" src="https://img.shields.io/github/downloads/cjdduarte/pomodoroz/total?label=downloads&color=green"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/github/license/cjdduarte/pomodoroz?label=license&color=yellow"></a>
</p>

<p align="center">
  <img src="assets/timerA.png" alt="Pomodoroz - Light Theme" width="49%"><img src="assets/timerB.png" alt="Pomodoroz - Dark Theme" width="49%">
</p>

<p align="center">
  <img src="assets/miniA.png" alt="Pomodoroz - Mini Preview A" width="49%"><img src="assets/miniB.png" alt="Pomodoroz - Mini Preview B" width="49%">
</p>

<p align="center">
  <img src="assets/gridA.png" alt="Pomodoroz - Grid Preview A" width="49%"><img src="assets/gridB.png" alt="Pomodoroz - Grid Preview B" width="49%">
</p>

<p align="center">
  <br>
  <a href="#-about">About</a>
  .
  <a href="#-features">Features</a>
  .
  <a href="#-installation">Installation</a>
  .
  <a href="#-development">Development</a>
  .
  <a href="#-contributing">Contributing</a>
  .
  <a href="#-privacy">Privacy</a>
  .
  <a href="#-license">License</a>
  <br>
  <br>
</p>

## 🔗 About

**Pomodoroz** is a fork of [Pomatez](https://github.com/zidoro/pomatez) by [Roldan Montilla Jr](https://github.com/roldanjr), started on 2026-03-25. Thanks to the original author for the solid foundation.

### Why does this fork exist?

**Pomatez already supports flexible session timing** (it is not locked to 25/5).  
Pomodoroz is not about "fixing flexibility"; it focuses on adding workflow features for common friction points: starting tasks, choosing what to do next, staying aware of time, and making breaks actually restorative.

### Pomatez vs Pomodoroz (quick comparison)

| Area                         | Pomatez (original)                                                                        | Pomodoroz (this fork)                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Runtime architecture         | Mixed workspace (`app/electron` + `app/tauri`) with legacy Electron scripts still present | Tauri-only runtime with dedicated `src-tauri/` and no Electron runtime path                 |
| Frontend base                | React 16                                                                                  | React 19                                                                                    |
| Package manager              | Yarn (historical)                                                                         | pnpm                                                                                        |
| Tauri baseline               | Tauri 2 (alpha)                                                                           | Tauri `2.11.x` with explicit capabilities and pinned plugins                                |
| Statistics                   | No                                                                                        | Yes (period report, long-term progress, breakdowns, and history cleanup)                    |
| Grid view                    | No                                                                                        | Yes (**Study Rotation Grid** with daily color cycle, Draw button, and right-click to Timer) |
| Grid footer (current status) | No                                                                                        | Yes (total, visited, and remaining counters)                                                |
| Task-list import/export      | No                                                                                        | Yes (**JSON import/export for task lists/cards** with validation and merge/replace modes)   |
| Focus extension              | No                                                                                        | Yes (optional short/long focus extension with configurable durations and tray reminder)     |
| 0-minute breaks              | No                                                                                        | Yes (auto-skip breaks when short/long break duration is set to zero)                        |
| Idle counting                | No                                                                                        | Yes (idle time by period + optional focus-to-idle reclassification on reset)                |
| Supported languages          | 4                                                                                         | 7                                                                                           |

> Comparison date: 2026-04-27.

### Quick Start (suggested presets)

- **Just Start** — 5 min focus / 1 min break
- **Sprint** — 10 min focus / 3 min break
- **Classic** — 25 min focus / 5 min break
- **Flow** — 50 min focus / 10 min break

### What this fork adds on top of Pomatez

**Task initiation paralysis**

- **Study Rotation Grid** with daily card status.
- **Draw button** to pick the next task when you get stuck on "where do I start?".

**Time awareness**

- **Progressive notifications** (60s and 30s before transitions).
- **Voice assistance** with audio session-status cues.
- **Focus extension** near the end of a focus block, with one short/long extension choice per session.

**Break quality**

- **Fullscreen breaks** to reduce distraction and encourage real rest.
- **0-minute breaks** (auto-skip) when you want to keep momentum.

**Structure on hard days**

- **Strict mode** (no pause/skip/reset once started).
- **Back may count as Idle** for honest mid-focus reset tracking.

**Progress visibility**

- **Statistics module** with period report separated from long-term progress.
- **Period metrics** for focus, break, idle, completed cycles, top focus areas, and daily flow.
- **Progress overview** with streak, level/XP, today's target, milestones, 30-day heatmap, and last-7-day focus bars.
- **Per-task-list breakdown** with accumulated time and completed cycles.

**Quality of life**

- **JSON import/export for task lists and tasks** (validation + merge/replace).
- **Enhanced compact mode** with expandable grid and actions menu.
- **Custom notification sounds**.
- **Right-click task selection** integrated with Timer flow.

> **Note:** Pomodoroz is a productivity tool, not medical advice. If you have an ADHD diagnosis or suspect you might, seek professional support.

### Evidence and history

- Implemented deliveries: [CHANGELOG.md](CHANGELOG.md)
- Pending improvements roadmap: [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md)
- Migration closure reference: [docs/MIGRATION_TO_TAURI.md](docs/MIGRATION_TO_TAURI.md)

## ✨ Features

### Timer

- Modes: **Focus**, **Short break**, **Long break**, and **Special breaks** (configurable times).
- Controls: start, pause, skip, reset.
- Configurable session rounds.
- **Focus extension** — optional `+short` / `+long` prompt near the end of focus, with configurable extension durations.
- **Strict mode** — prevents pausing/skipping/resetting once started.
- **Auto-start** focus after break ends.
- **0-minute breaks** — auto-skip breaks.
- **Progress animation** (can be disabled).

### Tasks

- Create lists and tasks with descriptions.
- Drag-and-drop reordering (lists and cards).
- Mark as done, skip, or delete.
- **Undo/Redo** (Ctrl+Z / Ctrl+Shift+Z).
- **Import/Export** in JSON with validation, ID regeneration, and merge or replace options.

### Study Rotation Grid

- Toggle between **list** and **grid** view.
- Daily card status: white → green → red.
- **Draw button** — random phase-based selection (white→green, then green→red).
- **Columns**: Auto / 1 / 2 / 3 (persistent preference).
- **Grouped mode** — list separators with Group/Ungroup toggle.
- **Color reset** with confirmation and automatic daily reset.
- Right-click selects the active task and navigates to Timer.

### Statistics

- **Periods**: Today, Week (7d), Month (30d), All.
- **Period report**: focus time, break time, idle time, completed cycles, top focus areas, and daily flow.
- **Long-term progress**: streak, level/XP, today's target, explicit milestones, 30-day heatmap, and last-7-day focus bars.
- **Daily flow chart** (stacked focus/break/idle).
- **Per-task-list breakdown** with time and cycles.
- Data clearing with confirmation (week, month, or all).

### Compact Mode

- Minimal UI for small screens.
- **Expandable grid** within compact mode.
- Actions menu (done/skip/delete) on task display.
- Post-break prompt to continue or open the grid.

### Notifications

- **None** — no notifications.
- **Normal** — notifies on every break.
- **Extra** — notifies 60s before break, 30s before break ends, and on break start.
- **Focus extension reminder** — when the app is hidden or in the tray, the extension window can trigger one native reminder.
- **Custom sound** — default bell or custom audio file.
- **Voice assistance** — audio cue about session status.

### Appearance & System

- **Dark theme** with follow-system-theme option.
- **Native titlebar** — toggle between custom and OS-native.
- **Always on top** — keeps the window above others.
- **Minimize/Close to tray** with progress indicator on tray icon.
- **Open at login** (macOS/Windows).

### Keyboard Shortcuts

- `Alt+Shift+H` — Hide app.
- `Alt+Shift+S` — Show app.
- `Alt+Shift+T` — Toggle theme.
- `Ctrl+Z` / `Ctrl+Shift+Z` — Undo/Redo in Tasks.

### Languages

- Portuguese (BR), English, Spanish, Japanese, Chinese, German, and French.
- Automatic system language detection.

### Fullscreen Breaks

- Fills the entire screen during breaks to encourage rest.
- Stable across compact/minimized/hidden window states.

## 🚧 Coming Soon

Improvements informed by real feedback from users who deal with focus difficulties and ADHD. See details at [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md).

- **Cadence presets** — Just Start (5/1), Sprint (10/3), Classic (25/5), Flow (50/10).
- **Break suggestions** — rotating tips (drink water, stretch, breathe) to avoid doomscrolling.

## 💻 Installation

Published release assets currently target Windows and Linux.
macOS builds are currently source-based (`pnpm tauri build`).

Download the latest version from the [Releases page](https://github.com/cjdduarte/pomodoroz/releases/latest).

> **In-app update note:** the automatic in-app channel is currently focused on Windows (NSIS) and Linux (AppImage).

### Local Install Scripts

```sh
./scripts/install.sh
./scripts/install.ps1
./scripts/uninstall.sh
./scripts/uninstall.ps1
```

### Build From Source

```sh
pnpm install
pnpm build:renderer
pnpm tauri build --no-bundle
pnpm tauri build --bundles appimage,deb,rpm
pnpm tauri build --bundles nsis
```

## 🛠️ Development

### Requirements

- Node.js v24
- pnpm v11

### Commands

```sh
pnpm dev:app          # Tauri + Vite renderer
pnpm lint             # Lint (renderer)
pnpm typecheck:renderer
pnpm test:run
pnpm build:renderer
pnpm tauri build --no-bundle
cargo check --manifest-path src-tauri/Cargo.toml
```

### Stack

- Tauri 2.11
- React 19 + Vite 8 + TypeScript 6
- React Router 7 + Redux Toolkit 2
- @dnd-kit (drag-and-drop)
- Styled Components
- i18next
- Root-driven pnpm scripts with renderer shell under `app/renderer` and native backend under `src-tauri`

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🔒 Privacy

Pomodoroz **does not collect any data**. All information (tasks, settings, statistics) is stored locally on your machine.

## 📄 License

MIT © [Carlos Duarte](https://github.com/cjdduarte)

Original work: MIT © [Roldan Montilla Jr](https://github.com/roldanjr) — [Pomatez](https://github.com/zidoro/pomatez)
