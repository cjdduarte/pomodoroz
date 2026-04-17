# Pomodoroz - Install Local (PowerShell, Linux)
# Equivalente ao ./scripts/install.sh

param(
    [switch]$SkipBuild,
    [ValidateSet("electron", "tauri")]
    [string]$Runtime = "electron"
)

$ErrorActionPreference = "Stop"

function Step($message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Die($message) {
    Write-Host "Erro: $message" -ForegroundColor Red
    exit 1
}

function Get-LatestAppImageCandidate {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Filter
    )

    return Get-ChildItem -Path $Path -Filter $Filter -File |
        Sort-Object `
            @{ Expression = {
                    if ($_.Name -match '^Pomodoroz-v(?<ver>\d+\.\d+\.\d+)-linux-') {
                        [version]$Matches.ver
                    }
                    else {
                        [version]"0.0.0"
                    }
                }
            }, `
            @{ Expression = { $_.Name } } |
        Select-Object -Last 1
}

if (-not $IsLinux) {
    Die "Este script suporta apenas Linux."
}

$ROOT = Split-Path -Parent $PSScriptRoot
$APP_DIR = $ROOT

$INSTALL_ROOT = Join-Path $HOME ".local/opt/pomodoroz"
$APPIMAGE_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage"
$APPIMAGE_PREVIOUS_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage.previous"
$TAURI_BINARY_PATH = Join-Path $INSTALL_ROOT "pomodoroz_tauri"
$TAURI_BINARY_PREVIOUS_PATH = Join-Path $INSTALL_ROOT "pomodoroz_tauri.previous"
$BIN_DIR = Join-Path $HOME ".local/bin"
$BIN_PATH = Join-Path $BIN_DIR "pomodoroz"
$DESKTOP_DIR = Join-Path $HOME ".local/share/applications"
$DESKTOP_PATH = Join-Path $DESKTOP_DIR "pomodoroz.desktop"
$DESKTOP_PATH_LOCAL = Join-Path $DESKTOP_DIR "pomodoroz-local.desktop"
$ICON_DIR = Join-Path $HOME ".local/share/icons/hicolor/256x256/apps"
$ICON_PATH = Join-Path $ICON_DIR "pomodoroz.png"
$MANIFEST_PATH = Join-Path $INSTALL_ROOT "install-manifest.txt"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Die "node nao encontrado."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Die "pnpm nao encontrado."
}

$nodeVersion = (node --version) -replace '^v', ''
$nodeMajor = [int](($nodeVersion -split '\.')[0])
if ($nodeMajor -lt 24) {
    Write-Host "Aviso: Node atual v$nodeVersion (recomendado v24 LTS)." -ForegroundColor Yellow
}

if (-not (Test-Path (Join-Path $APP_DIR "node_modules"))) {
    Step "Instalando dependencias pnpm"
    Push-Location $APP_DIR
    pnpm install
    Pop-Location
}

$archRaw = (& uname -m).Trim()
$binarySource = $null
$launchTarget = $null

switch ($Runtime) {
    "electron" {
        $electronArchFlag = $null
        $appImageArchPattern = $null
        switch ($archRaw) {
            "x86_64" {
                $electronArchFlag = "--x64"
                $appImageArchPattern = "x86_64"
            }
            "aarch64" {
                $electronArchFlag = "--arm64"
                $appImageArchPattern = "arm64"
            }
            "arm64" {
                $electronArchFlag = "--arm64"
                $appImageArchPattern = "arm64"
            }
            default {
                Die "Arquitetura nao suportada para build automatico: $archRaw"
            }
        }

        if (-not $SkipBuild) {
            Step "Lint completo (ESLint renderer + TypeScript)"
            Push-Location $APP_DIR
            pnpm lint
            Pop-Location

            Step "Build empacotado (build:dir)"
            Push-Location $APP_DIR
            pnpm build:dir
            Pop-Location

            Step "Gerando AppImage ($archRaw)"
            Push-Location $APP_DIR
            pnpm eb --linux AppImage $electronArchFlag --publish=never
            Pop-Location
        } else {
            Step "Pulando pre-check/build (--SkipBuild)"
        }

        $distDir = Join-Path $APP_DIR "app/electron/dist"
        if (-not (Test-Path $distDir)) {
            Die "Diretorio de dist nao encontrado: $distDir"
        }

        $appImageCandidate = Get-LatestAppImageCandidate -Path $distDir -Filter "Pomodoroz-v*-linux-$appImageArchPattern.AppImage"
        if (-not $appImageCandidate) {
            $appImageCandidate = Get-LatestAppImageCandidate -Path $distDir -Filter "Pomodoroz-v*-linux-*.AppImage"
        }

        if (-not $appImageCandidate) {
            Die "Nenhum AppImage encontrado em $distDir."
        }

        $binarySource = $appImageCandidate.FullName
    }
    "tauri" {
        if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
            Die "Cargo nao encontrado para runtime tauri."
        }

        if (-not $SkipBuild) {
            Step "Lint completo (ESLint renderer + TypeScript)"
            Push-Location $APP_DIR
            pnpm lint
            Pop-Location

            Step "Typecheck do renderer (TypeScript)"
            Push-Location $APP_DIR
            pnpm typecheck:renderer
            Pop-Location

            Step "Build release Tauri sem bundle (--no-bundle)"
            Push-Location $APP_DIR
            pnpm tauri build --no-bundle
            Pop-Location
        } else {
            Step "Pulando pre-check/build (--SkipBuild)"
        }

        $binarySource = Join-Path $APP_DIR "src-tauri/target/release/pomodoroz_tauri"
        if (-not (Test-Path $binarySource)) {
            Die "Binario Tauri release nao encontrado: $binarySource"
        }
    }
    default {
        Die "Runtime invalido: $Runtime"
    }
}

$iconCandidates = @(
    (Join-Path $APP_DIR "src-tauri/icons/icon.png"),
    (Join-Path $APP_DIR "app/electron/build/assets/logo-dark256x256.png"),
    (Join-Path $APP_DIR "app/electron/src/assets/logo-dark256x256.png"),
    (Join-Path $APP_DIR "app/electron/src/assets/logo-dark@2x.png")
)

$iconSource = $iconCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $iconSource) {
    Die "Icone nao encontrado."
}

Step "Instalando localmente (menu + icone)"
New-Item -ItemType Directory -Force -Path $INSTALL_ROOT, $BIN_DIR, $DESKTOP_DIR, $ICON_DIR | Out-Null

if ($Runtime -eq "electron") {
    if (Test-Path $APPIMAGE_PATH) {
        Copy-Item -Force $APPIMAGE_PATH $APPIMAGE_PREVIOUS_PATH
        Write-Host "Backup do AppImage anterior salvo em: $APPIMAGE_PREVIOUS_PATH" -ForegroundColor Yellow
    }
    Copy-Item -Force $binarySource $APPIMAGE_PATH
    chmod +x $APPIMAGE_PATH | Out-Null
    $launchTarget = $APPIMAGE_PATH

    if (Test-Path $TAURI_BINARY_PATH) {
        Remove-Item -Force -LiteralPath $TAURI_BINARY_PATH
    }
    if (Test-Path $TAURI_BINARY_PREVIOUS_PATH) {
        Remove-Item -Force -LiteralPath $TAURI_BINARY_PREVIOUS_PATH
    }
} else {
    if (Test-Path $TAURI_BINARY_PATH) {
        Copy-Item -Force $TAURI_BINARY_PATH $TAURI_BINARY_PREVIOUS_PATH
        Write-Host "Backup do binario Tauri anterior salvo em: $TAURI_BINARY_PREVIOUS_PATH" -ForegroundColor Yellow
    }
    Copy-Item -Force $binarySource $TAURI_BINARY_PATH
    chmod +x $TAURI_BINARY_PATH | Out-Null
    $launchTarget = $TAURI_BINARY_PATH

    if (Test-Path $APPIMAGE_PATH) {
        Remove-Item -Force -LiteralPath $APPIMAGE_PATH
    }
    if (Test-Path $APPIMAGE_PREVIOUS_PATH) {
        Remove-Item -Force -LiteralPath $APPIMAGE_PREVIOUS_PATH
    }
}

Copy-Item -Force $iconSource $ICON_PATH

$binScript = @"
#!/usr/bin/env bash
exec "$launchTarget" "`$@"
"@
Set-Content -Path $BIN_PATH -Value $binScript -NoNewline
chmod +x $BIN_PATH | Out-Null

$desktopFile = @"
[Desktop Entry]
Type=Application
Version=1.0
Name=Pomodoroz
Comment=Pomodoroz Timer
Comment[en]=Pomodoroz Timer
Comment[pt_BR]=Temporizador Pomodoroz
Comment[pt_PT]=Temporizador Pomodoroz
Comment[es]=Temporizador Pomodoroz
Comment[ja]=Pomodoroz タイマー
Comment[zh]=Pomodoroz 计时器
Comment[zh_CN]=Pomodoroz 计时器
Comment[zh_TW]=Pomodoroz 計時器
Exec=$BIN_PATH %U
Icon=pomodoroz
Terminal=false
Categories=Utility;Productivity;
StartupNotify=true
"@
Set-Content -Path $DESKTOP_PATH -Value $desktopFile -NoNewline

# Cleanup de versoes anteriores que criavam alias local extra.
if (Test-Path -LiteralPath $DESKTOP_PATH_LOCAL) {
    Remove-Item -Force -LiteralPath $DESKTOP_PATH_LOCAL
}

$runtimePrimaryPath = if ($Runtime -eq "electron") { $APPIMAGE_PATH } else { $TAURI_BINARY_PATH }
$runtimeBackupPath = if ($Runtime -eq "electron") { $APPIMAGE_PREVIOUS_PATH } else { $TAURI_BINARY_PREVIOUS_PATH }

@(
    $runtimePrimaryPath
    $runtimeBackupPath
    $BIN_PATH
    $DESKTOP_PATH
    $ICON_PATH
) | Set-Content -Path $MANIFEST_PATH

if (Get-Command update-desktop-database -ErrorAction SilentlyContinue) {
    & update-desktop-database $DESKTOP_DIR *> $null
}

if (Get-Command gtk-update-icon-cache -ErrorAction SilentlyContinue) {
    & gtk-update-icon-cache -f -q (Join-Path $HOME ".local/share/icons/hicolor") *> $null
}

Step "Concluido"
Write-Host "Runtime instalado: $Runtime"
Write-Host "Atalho de menu: $DESKTOP_PATH"
Write-Host "Execucao direta: $BIN_PATH"
Write-Host "Desinstalar: ./scripts/uninstall.ps1"
