# Release Operations — Pomodoroz

> Operational guide for versioning, publishing, and validating Tauri releases.
>
> For pending improvements roadmap, see `IMPROVEMENTS.md`.
> For migration closure reference, see `MIGRATION_TO_TAURI.md`.

---

## 1. Auto-Update Overview

The published signed updater feed currently supports only x86_64:

- **Windows NSIS**: `*.exe` + `*.exe.sig`; CI also publishes the v1-compatible `*.nsis.zip` + `*.nsis.zip.sig` archive.
- **Linux AppImage**: `*.AppImage.tar.gz` + `*.AppImage.tar.gz.sig`; CI also publishes `*.AppImage` + `*.AppImage.sig`.

Not published as updater payloads: Windows formats other than x86_64 NSIS,
Linux `deb` / `rpm` / AUR or non-x86_64 builds, macOS, and development builds.

Updater metadata source:

- `latest.json` (uploaded as a release asset)
- Built/merged from signed Windows and Linux assets by `sync-latest-json` job

---

## 2. Release Flow

### Step 1 — Prepare Version

1. Define target version (example: `<version>`).
2. Update both changelogs for this version:
   - `CHANGELOG.md` (EN)
   - `CHANGELOG.pt.md` (PT)
3. Keep next version as `A definir` / `TBD`; set final date only on release day.
4. In AI-assisted flow, the agent must set `YYYY-MM-DD` in both changelog headers before suggesting release scripts.
5. Run release script:
   - Unix: `./scripts/release.sh <version>`
   - PowerShell: `./scripts/release.ps1 -Version <version>`
6. Optional dry run:
   - Unix: `./scripts/release.sh --dry-run <version>`
   - PowerShell: `./scripts/release.ps1 -Version <version> -DryRun`
7. Optional emergency bypass (use only when preflight has already been validated externally):
   - Unix: `./scripts/release.sh --skip-validate <version>`
   - PowerShell: `./scripts/release.ps1 -Version <version> -SkipValidate`
   - Non-interactive runs require explicit ack: `POMODOROZ_RELEASE_SKIP_VALIDATE_ACK=1`

### Step 2 — CI Publish (Tag)

1. Push tag `v<version>`.
2. Workflow `.github/workflows/release-autoupdate.yml` runs:
   - `release-windows` (build NSIS + upload signed updater assets)
   - `release-linux` (build AppImage + upload signed updater assets)
   - `sync-latest-json` (merge and upload `latest.json`)
3. GitHub Release body is auto-filled from the matching section in `CHANGELOG.md` (EN, `## [x.y.z] - ...`) and kept in sync on reruns.
4. Workflow can also be started manually (`workflow_dispatch`) with target:
   - `all`
   - `windows`
   - `linux`
5. Manual single-platform dispatch is allowed only when the same release already
   contains valid signed assets for the other supported channel. `sync-latest-json`
   preserves an existing feed when available, but fails without uploading when
   `windows-x86_64` and `linux-x86_64` cannot both be produced.

Required repository secrets:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

GitHub Release uploads use the automatic GitHub Actions token exposed to `gh` as
`GH_TOKEN`; no custom repository secret named `GH_TOKEN` is required.

### Step 3 — Validate Published Release

Do not consider the release ready until `release-windows`, `release-linux`, and
`sync-latest-json` have succeeded. Check the GitHub Release contains:

- Windows x86_64 NSIS signed payload (`*.exe` + `*.exe.sig`) and compatibility archive (`*.nsis.zip` + `*.nsis.zip.sig`)
- Linux x86_64 AppImage signed payload (`*.AppImage.tar.gz` + `*.AppImage.tar.gz.sig`) and raw AppImage pair (`*.AppImage` + `*.AppImage.sig`)
- `latest.json` with the tag version and non-empty `windows-x86_64` and `linux-x86_64` platform entries whose URLs reference the corresponding release assets

---

## 3. Local Validation Commands

Main local validation script (rich menu; `./scripts/validar-tudo.sh` remains as a
non-interactive transition alias of the same gate):

```sh
./scripts/dev-full.sh
```

Useful direct modes:

```sh
./scripts/dev-full.sh --quick-dev
./scripts/dev-full.sh --run-packed
./scripts/dev-full.sh --installers
./scripts/dev-full.sh --installers --installers-full
```

Windows equivalent:

```powershell
./scripts/validar-tudo.ps1
```

Local preflight intentionally sets `bundle.createUpdaterArtifacts=false`; it
does not generate or validate signed updater assets. Validate those assets in
release CI and through the N -> N+1 E2E gate below.

---

## 4. Mandatory E2E Update Gate (N -> N+1)

Every new public version must be validated from the previous public version:

1. Install version **N** in clean environment.
2. Publish **N+1**.
3. Open app on N and trigger update check.
4. Confirm update is detected and installed.
5. Confirm app restarts on N+1.

Minimum required E2E channels:

- Windows x86_64 NSIS
- Linux x86_64 AppImage

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
