<h1 align="center">Pomodoroz</h1>

<h3 align="center">Focus. Break. Progress.</h3>

<p align="center">
  <a href="README.md">Portuguese version</a>
</p>

<p align="center">
  <a href="https://github.com/cjdduarte/pomodoroz/releases/latest"><img alt="release" src="https://img.shields.io/github/v/release/cjdduarte/pomodoroz?label=release&color=blue"></a>
  <a href="https://github.com/cjdduarte/pomodoroz/releases"><img alt="downloads" src="https://img.shields.io/github/downloads/cjdduarte/pomodoroz/total?label=downloads&color=green"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/github/license/cjdduarte/pomodoroz?label=license&color=yellow"></a>
</p>

<p align="center">
  <img src="assets/timerA.png" alt="Pomodoroz - Light Theme" width="340">
  &nbsp;&nbsp;
  <img src="assets/timerB.png" alt="Pomodoroz - Dark Theme" width="340">
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

**Pomodoroz** is a fork of [Pomatez](https://github.com/zidoro/pomatez) by [Roldan Montilla Jr](https://github.com/roldanjr), started on 2026-03-25.

This fork consolidates the project as **Electron-only** (Tauri/Rust removed), adds a built-in **Statistics module**, **Study Rotation Grid**, and modernizes the entire stack.

Thanks to the original author for the solid foundation.

### What changed from the original Pomatez

- **Statistics module** with daily chart, per-task time breakdown, and period filters.
- **Study Rotation Grid** with daily card status (white/green/red), phase-based draw, and grouped mode.
- **Tasks import/export** in JSON with validation and merge/replace options.
- **Enhanced compact mode** with expandable grid and actions menu.
- **Back may count as Idle** — option to reclassify focus time when resetting.
- **Custom notification sound** and **0-minute breaks** (auto-skip).
- Refined Timer actions, right-click selection, and automatic task progression.
- Modernized stack: React 19, Vite 8, TypeScript 6, React Router 7, Redux Toolkit 2, @dnd-kit, ESLint 9.

For the full history, see [CHANGELOG.en.md](CHANGELOG.en.md).

## ✨ Features

### Timer

- Modes: **Focus**, **Short break**, **Long break**, and **Special breaks** (configurable times).
- Controls: start, pause, skip, reset.
- Configurable session rounds.
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
- Summary cards: focus time, break time, idle time, and completed cycles.
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

- Portuguese (BR), English, Spanish, Japanese, Chinese.
- Automatic system language detection.

### Fullscreen Breaks

- Fills the entire screen during breaks to enforce rest.
- Stable across compact/minimized/hidden window states.

## 💻 Installation

Available for Windows, macOS, and Linux.

Download the latest version from the [Releases page](https://github.com/cjdduarte/pomodoroz/releases/latest).

### Build From Source

```sh
yarn install
yarn build:dir    # Unpacked build
yarn build:linux  # Linux (AppImage, deb, rpm)
yarn build:win    # Windows (portable + setup)
yarn build:mac    # macOS
```

## 🛠️ Development

### Requirements

- Node.js v24
- Yarn Classic (1.x)

### Commands

```sh
yarn dev:app          # Electron + Vite renderer
yarn dev:renderer     # Renderer only (Vite on localhost:3000)
yarn lint             # Monorepo lint/typecheck
yarn build:dir        # Unpacked build
```

### Stack

- Electron 41
- React 19 + Vite 8 + TypeScript 6
- React Router 7 + Redux Toolkit 2
- @dnd-kit (drag-and-drop)
- Styled Components
- i18next
- Lerna 9 + Yarn Classic

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 🔒 Privacy

Pomodoroz **does not collect any data**. All information (tasks, settings, statistics) is stored locally on your machine.

## 📄 License

MIT © [Carlos Duarte](https://github.com/cjdduarte)

Original work: MIT © [Roldan Montilla Jr](https://github.com/roldanjr) — [Pomatez](https://github.com/zidoro/pomatez)
