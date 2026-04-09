# Release Operations — Pomodoroz

> Extracted from previous `TECHNICAL_DECISIONS_2026.md` (sections 6.5 and 6.6).
>
> This document covers the operational release flow, auto-update behavior,
> and platform-specific validation checklists.
>
> For migration planning, see `MIGRATION_ELECTRON_TO_TAURI.md`.
> For product backlog, see `PRODUCT_BACKLOG.md`.

---

## 1. Auto-Update Overview

In-app auto-update is active for:

- **Windows**: NSIS installer (`latest.yml` + setup)
- **Linux**: AppImage (`latest-linux.yml` + `.AppImage`)

Out of in-app auto-update scope:

- Windows portable (distributed, but no in-app update flow)
- Linux `deb`/`rpm`/AUR (update via distro package manager)
- macOS (requires signing/notarization; not activated in this cycle)
- Dev environment without config (intentional skip)
- Linux packaged without `APPIMAGE` env var (intentional skip)

Current status: **Completed** (release 26.4.9+).

---

## 2. Release Flow

### Step 1 — Prepare Version

1. Set new version (e.g., `26.4.14`).
2. Update both changelogs:
   - `CHANGELOG.md` (PT)
   - `CHANGELOG.en.md` (EN)
3. Prepare commit/tag with dedicated script:
   - Unix: `yarn release:tag -- <version>`
   - PowerShell: `yarn release:tag:ps -- -Version <version>`
4. (Optional) dry run: `yarn release:tag:dry -- <version>`
5. Validate baseline:
   - `yarn lint`
   - `yarn build`
   - `yarn build:dir`

### Step 2 — Publish Artifacts

1. Export token: `GH_TOKEN=<token>`
2. Publish release:
   - All targets: `yarn release`
   - Mac + Windows: `yarn release:mw`
   - Linux dedicated: run in Linux environment when needed
3. `Release Auto Update` workflow syncs release title/notes from `CHANGELOG.md` section when triggered by `v*` tag.
4. Confirm published release contains:
   - Windows: NSIS installer + `latest.yml`
   - Linux: `.AppImage` + `latest-linux.yml`

### Step 3 — Validate Client (E2E)

1. Install previous version (N) in test environment.
2. Open packaged app online.
3. Verify `UPDATE_AVAILABLE` reaches UI.
4. Trigger `Install Now` and confirm restart with new version (N+1).

**Mandatory rule**: next published version (N+1) is complete only after real E2E update
test from latest public version (N). Minimum: Windows NSIS + Linux AppImage.

---

## 3. Behavior Matrix

| Platform/Channel           | Expected behavior                                        |
| -------------------------- | -------------------------------------------------------- |
| Windows (NSIS)             | Check, download, notify, install with `quitAndInstall()` |
| macOS                      | Out of scope for this activation cycle                   |
| Linux AppImage             | Check update when `APPIMAGE` env is present              |
| Linux without `APPIMAGE`   | No update check (intentional skip)                       |
| Linux distro package (AUR) | Update via distro package manager                        |
| Dev environment            | No update check (intentional skip)                       |

### Manjaro Notes

- AppImage binary: in-app update may work.
- Distro package/AUR: in-app update is unsupported; use system package manager.

---

## 4. Code Signing and Notarization

- **Windows**: without code signing, SmartScreen may show extra warning.
- **macOS**: auto-update requires correct signing/notarization; not activated this cycle.
- Project has `afterSign` notarization path conditioned by Apple key environment variables.

---

## 5. Download Policy

- `electron-updater` keeps default behavior (`autoDownload` implicit).
- UI treats `Install Now` as install step for already-downloaded update.
- Windows NSIS hardening (2026-04-08): explicit `shortcutName` and shortcut creation in `nsis` block; `nsis.include` with `customInstall` recreates missing Start Menu shortcut after install/update.

Future optional review: if manual bandwidth/download control is needed, evaluate
`autoDownload = false` with explicit download action in renderer.

---

## 6. Release Checklists

### CH-00 — Mandatory Gate (N+1)

- [ ] Install current public version (N) in clean environment
- [ ] Publish N+1
- [ ] Validate real app update N -> N+1 (not only local build)
- [ ] Register result in N+1 CHANGELOG

### CH-01 — Preparation and Local Validation

- [ ] Define target version and update both changelogs
- [ ] Confirm `release` and `release:mw` scripts exist and run
- [ ] Execute baseline (`lint`, `build`, `build:dir`)

### CH-02 — Feed Publishing

- [ ] Configure `GH_TOKEN` in publishing environment
- [ ] Publish release with `--publish always`
- [ ] Confirm update metadata (Windows `latest.yml`, Linux `latest-linux.yml`)
- [ ] Confirm binary upload (NSIS and AppImage)

### CH-03 — Windows E2E Validation

- [ ] Install version N
- [ ] Publish N+1
- [ ] Verify `UPDATE_AVAILABLE` reception
- [ ] Execute `Install Now` and validate restart on N+1
- [ ] Confirm `Pomodoroz` Start Menu entry (search + alphabetical list)
- [ ] Confirm `.lnk` file in `%APPDATA%\Microsoft\Windows\Start Menu\Programs\`

### CH-04 — Linux AppImage E2E Validation

- [ ] Install version N via AppImage
- [ ] Publish N+1 with `latest-linux.yml`
- [ ] Validate check/download/install in AppImage
- [ ] Register expected skip behavior outside AppImage

### CH-05 — Closeout

- [ ] Register result in CHANGELOG (activation and platform limits)
- [ ] If regression occurs, apply rollback (section 7) and reopen issue

---

## 7. Rollback

1. Stop publishing releases with automatic feed.
2. Publish hotfix without promoting automatic updates, if needed.
3. Keep clients on previous stable version while fixing pipeline/feed.
4. Reopen issue in this document with root cause and next step.

---

## 8. Relation to Tauri Migration

This document describes the **current** Electron-based release flow.
When the Tauri migration reaches Phase 2f (auto-update) and Phase 4 (CI),
this document should be updated to reflect:

- `tauri-plugin-updater` replacing `electron-updater`
- `tauri-apps/tauri-action` replacing `electron-builder` in CI
- New platform artifacts (.dmg via Tauri, etc.)

Until then, the Electron flow described here remains authoritative.
