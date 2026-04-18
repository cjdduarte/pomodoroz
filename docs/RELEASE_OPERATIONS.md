# Release Operations — Pomodoroz

> Operational guide for versioning, publishing, and validating Tauri releases.
>
> For migration history, see `MIGRATION_TO_TAURI.md`.
> For product backlog, see `PRODUCT_BACKLOG.md`.

---

## 1. Auto-Update Overview

In-app auto-update is currently active for:

- **Windows**: NSIS bundle + signature (`.exe` + `.sig`)
- **Linux**: AppImage + signature (`.AppImage` + `.sig`)

Out of in-app auto-update scope:

- Linux `deb` / `rpm` (install/update via distro package manager)
- macOS (not active in this cycle)
- Dev environment without release artifacts

Updater metadata source:

- `latest.json` (uploaded as a release asset)
- Built/merged from signed Windows and Linux assets by `sync-latest-json` job

---

## 2. Release Flow

### Step 1 — Prepare Version

1. Define target version (example: `26.4.24`).
2. Update both changelogs for this version:
   - `CHANGELOG.md` (PT)
   - `CHANGELOG.en.md` (EN)
3. Keep next version as `A definir` / `TBD`; set final date only on release day.
4. In AI-assisted flow, the agent must set `YYYY-MM-DD` in both changelog headers before suggesting release scripts.
5. Run release script:
   - Unix: `./scripts/release.sh <version>`
   - PowerShell: `./scripts/release.ps1 -Version <version>`
6. Optional dry run:
   - Unix: `./scripts/release.sh --dry-run <version>`
   - PowerShell: `./scripts/release.ps1 -Version <version> -DryRun`

### Step 2 — CI Publish (Tag)

1. Push tag `v<version>`.
2. Workflow `.github/workflows/release-autoupdate.yml` runs:
   - `release-windows` (build NSIS + upload signed updater assets)
   - `release-linux` (build AppImage + upload signed updater assets)
   - `sync-latest-json` (merge and upload `latest.json`)
3. Workflow can also be started manually (`workflow_dispatch`) with target:
   - `all`
   - `windows`
   - `linux`

Required repository secrets:

- `GH_TOKEN`
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### Step 3 — Validate Published Release

Check GitHub release assets include:

- Windows installer (`*.exe`) and signature (`*.exe.sig`)
- Linux AppImage (`*.AppImage`) and signature (`*.AppImage.sig`)
- `latest.json`

---

## 3. Local Validation Commands

Main local validation script:

```sh
./scripts/validar-tudo.sh
```

Useful direct modes:

```sh
./scripts/validar-tudo.sh --quick-dev
./scripts/validar-tudo.sh --run-packed
./scripts/validar-tudo.sh --installers
./scripts/validar-tudo.sh --installers --installers-full
```

Windows equivalent:

```powershell
./scripts/validar-tudo.ps1
```

---

## 4. Mandatory E2E Update Gate (N -> N+1)

Every new public version must be validated from the previous public version:

1. Install version **N** in clean environment.
2. Publish **N+1**.
3. Open app on N and trigger update check.
4. Confirm update is detected and installed.
5. Confirm app restarts on N+1.

Minimum required E2E channels:

- Windows NSIS
- Linux AppImage

---

## 5. Behavior Matrix

| Platform/Channel | Expected behavior                                |
| ---------------- | ------------------------------------------------ |
| Windows NSIS     | Check, notify, install, restart via updater flow |
| Linux AppImage   | Check, notify, install, restart via updater flow |
| Linux deb/rpm    | Update through package manager                   |
| Dev runtime      | No release updater artifact installation path    |

Manjaro note:

- AppImage channel supports in-app updater flow.
- `deb`/`rpm` installs should follow package-manager update flow.

---

## 6. Rollback

1. Stop publishing new updater artifacts.
2. Publish hotfix version without promoting broken feed path.
3. Keep users on last stable release while pipeline is corrected.
4. Register root cause and corrective action in docs/changelog.
