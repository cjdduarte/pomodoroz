# Pomodoroz - Install Local (PowerShell, Linux)
# Equivalente ao ./scripts/install.sh

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
$APPIMAGE_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage"
$APPIMAGE_PREVIOUS_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage.previous"
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

if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    Die "yarn nao encontrado."
}

$nodeVersion = (node --version) -replace '^v', ''
$nodeMajor = [int](($nodeVersion -split '\.')[0])
if ($nodeMajor -lt 24) {
    Write-Host "Aviso: Node atual v$nodeVersion (recomendado v24 LTS)." -ForegroundColor Yellow
}

if (-not (Test-Path (Join-Path $APP_DIR "node_modules"))) {
    Step "Instalando dependencias Yarn"
    Push-Location $APP_DIR
    yarn install
    Pop-Location
}

$archRaw = (& uname -m).Trim()
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
    Step "Preparando @pomodoroz/shareables (tipos para dependencias internas)"
    Push-Location $APP_DIR
    yarn workspace @pomodoroz/shareables run build
    Pop-Location

    Step "Lint completo (ESLint renderer + TypeScript workspaces)"
    Push-Location $APP_DIR
    yarn lint
    Pop-Location

    Step "Build empacotado (build:dir)"
    Push-Location $APP_DIR
    yarn build:dir
    Pop-Location

    Step "Gerando AppImage ($archRaw)"
    Push-Location (Join-Path $APP_DIR "app/electron")
    yarn electron-builder --linux AppImage $electronArchFlag --publish=never
    Pop-Location
}
else {
    Step "Pulando pre-check/build (--SkipBuild)"
}

$distDir = Join-Path $APP_DIR "app/electron/dist"
if (-not (Test-Path $distDir)) {
    Die "Diretorio de dist nao encontrado: $distDir"
}

$appImageCandidate = Get-ChildItem -Path $distDir -Filter "Pomodoroz-v*-linux-$appImageArchPattern.AppImage" -File |
    Sort-Object Name |
    Select-Object -Last 1

if (-not $appImageCandidate) {
    $appImageCandidate = Get-ChildItem -Path $distDir -Filter "Pomodoroz-v*-linux-*.AppImage" -File |
        Sort-Object Name |
        Select-Object -Last 1
}

if (-not $appImageCandidate) {
    Die "Nenhum AppImage encontrado em $distDir."
}

$iconCandidates = @(
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

if (Test-Path $APPIMAGE_PATH) {
    Copy-Item -Force $APPIMAGE_PATH $APPIMAGE_PREVIOUS_PATH
    Write-Host "Backup do AppImage anterior salvo em: $APPIMAGE_PREVIOUS_PATH" -ForegroundColor Yellow
}

Copy-Item -Force $appImageCandidate.FullName $APPIMAGE_PATH
chmod +x $APPIMAGE_PATH | Out-Null

Copy-Item -Force $iconSource $ICON_PATH

$binScript = @"
#!/usr/bin/env bash
exec "$APPIMAGE_PATH" "`$@"
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

@(
    $APPIMAGE_PATH
    $APPIMAGE_PREVIOUS_PATH
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
Write-Host "Atalho de menu: $DESKTOP_PATH"
Write-Host "Execucao direta: $BIN_PATH"
Write-Host "Desinstalar: ./scripts/uninstall.ps1"
