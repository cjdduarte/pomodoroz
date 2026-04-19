# Pomodoroz - Install Local (PowerShell, Linux, Tauri-only)

param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Step($message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Die($message) {
    Write-Host "Erro: $message" -ForegroundColor Red
    exit 1
}

if (-not $IsLinux) {
    Die "Este script suporta apenas Linux."
}

$ROOT = Split-Path -Parent $PSScriptRoot
$APP_DIR = $ROOT

$INSTALL_ROOT = Join-Path $HOME ".local/opt/pomodoroz"
$TAURI_BINARY_PATH = Join-Path $INSTALL_ROOT "pomodoroz_tauri"
$TAURI_BINARY_PREVIOUS_PATH = Join-Path $INSTALL_ROOT "pomodoroz_tauri.previous"
$LEGACY_APPIMAGE_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage"
$LEGACY_APPIMAGE_PREVIOUS_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage.previous"
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

if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Die "cargo nao encontrado."
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

if (-not $SkipBuild) {
    Step "Lint completo (ESLint renderer)"
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

$iconSource = Join-Path $APP_DIR "src-tauri/icons/icon.png"
if (-not (Test-Path $iconSource)) {
    Die "Icone nao encontrado: $iconSource"
}

Step "Instalando localmente (menu + icone)"
New-Item -ItemType Directory -Force -Path $INSTALL_ROOT, $BIN_DIR, $DESKTOP_DIR, $ICON_DIR | Out-Null

if (Test-Path $TAURI_BINARY_PATH) {
    Copy-Item -Force $TAURI_BINARY_PATH $TAURI_BINARY_PREVIOUS_PATH
    Write-Host "Backup do binario Tauri anterior salvo em: $TAURI_BINARY_PREVIOUS_PATH" -ForegroundColor Yellow
}

Copy-Item -Force $binarySource $TAURI_BINARY_PATH
chmod +x $TAURI_BINARY_PATH | Out-Null

if (Test-Path $LEGACY_APPIMAGE_PATH) {
    Remove-Item -Force -LiteralPath $LEGACY_APPIMAGE_PATH
}
if (Test-Path $LEGACY_APPIMAGE_PREVIOUS_PATH) {
    Remove-Item -Force -LiteralPath $LEGACY_APPIMAGE_PREVIOUS_PATH
}

Copy-Item -Force $iconSource $ICON_PATH

$binScript = @"
#!/usr/bin/env bash
exec "$TAURI_BINARY_PATH" "`$@"
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
StartupWMClass=pomodoroz_tauri
X-GNOME-WMClass=pomodoroz_tauri
"@
Set-Content -Path $DESKTOP_PATH -Value $desktopFile -NoNewline

if (Test-Path -LiteralPath $DESKTOP_PATH_LOCAL) {
    Remove-Item -Force -LiteralPath $DESKTOP_PATH_LOCAL
}

@(
    $TAURI_BINARY_PATH
    $TAURI_BINARY_PREVIOUS_PATH
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

if (Get-Command kbuildsycoca6 -ErrorAction SilentlyContinue) {
    & kbuildsycoca6 *> $null
} elseif (Get-Command kbuildsycoca5 -ErrorAction SilentlyContinue) {
    & kbuildsycoca5 *> $null
}

Step "Concluido"
Write-Host "Runtime instalado: tauri"
Write-Host "Atalho de menu: $DESKTOP_PATH"
Write-Host "Execucao direta: $BIN_PATH"
Write-Host "Desinstalar: ./scripts/uninstall.ps1"
