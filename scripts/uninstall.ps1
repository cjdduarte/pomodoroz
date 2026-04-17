# Pomodoroz - Uninstall Local (PowerShell, Linux)
# Equivalente ao ./scripts/uninstall.sh

param(
    [switch]$Purge,
    [switch]$Yes,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Step($message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Remove-IfExists($path) {
    if (Test-Path -LiteralPath $path) {
        Remove-Item -Recurse -Force -LiteralPath $path
        Write-Host "Removido: $path"
    }
}

function Die($message) {
    Write-Host "Erro: $message" -ForegroundColor Red
    exit 1
}

function Show-Usage {
    @"
Uso:
  ./scripts/uninstall.ps1 [-Purge] [-Yes]

Padrao:
  Remove somente a instalacao local criada por scripts/install.ps1/install.sh.
  Sem parametros em terminal interativo, mostra um menu de opcoes.

Opcoes:
  -Purge   Remove tambem dados locais em ~/.config, ~/.cache e ~/.local/share.
  -Yes     Pula confirmacao interativa exigida por -Purge.
  -Help
"@
}

function Show-ModeMenu {
    Write-Host "Menu de desinstalacao:"
    Write-Host "Escolha o nivel de limpeza."
    Write-Host "- Padrao: remove apenas app/atalho/icone instalados localmente."
    Write-Host "- Purge: faz o padrao + remove dados locais (config/cache/share)."
    Write-Host ""
    Write-Host "Escolha o modo de desinstalacao:"
    Write-Host "  1) Padrao  - remove apenas instalacao local do pomodoroz"
    Write-Host "  2) Purge   - padrao + dados locais (~/.config, ~/.cache e ~/.local/share)"
    Write-Host "  3) Cancelar"

    $menuOption = Read-Host "Opcao [1-3]"
    switch ($menuOption) {
        "" { }
        "1" { }
        "2" {
            $script:Purge = $true
        }
        "3" {
            Write-Host "Operacao cancelada."
            exit 0
        }
        default {
            Die "Opcao invalida: $menuOption"
        }
    }
}

if ($Help) {
    Show-Usage
    exit 0
}

if (-not $IsLinux) {
    Die "Este script suporta apenas Linux."
}

$INSTALL_ROOT = Join-Path $HOME ".local/opt/pomodoroz"
$MANIFEST_PATH = Join-Path $INSTALL_ROOT "install-manifest.txt"

$BIN_PATH = Join-Path $HOME ".local/bin/pomodoroz"
$DESKTOP_PATH = Join-Path $HOME ".local/share/applications/pomodoroz.desktop"
$DESKTOP_PATH_LOCAL = Join-Path $HOME ".local/share/applications/pomodoroz-local.desktop"
$AUTOSTART_PATH = Join-Path $HOME ".config/autostart/pomodoroz.desktop"
$AUTOSTART_PATH_TAURI = Join-Path $HOME ".config/autostart/com.cjdduarte.pomodoroz.desktop"
$ICON_PATH = Join-Path $HOME ".local/share/icons/hicolor/256x256/apps/pomodoroz.png"
$APPIMAGE_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage"
$APPIMAGE_PREVIOUS_PATH = Join-Path $INSTALL_ROOT "Pomodoroz.AppImage.previous"
$TAURI_BINARY_PATH = Join-Path $INSTALL_ROOT "pomodoroz_tauri"
$TAURI_BINARY_PREVIOUS_PATH = Join-Path $INSTALL_ROOT "pomodoroz_tauri.previous"

$USER_DATA_PATHS = @(
    (Join-Path $HOME ".config/pomodoroz"),
    (Join-Path $HOME ".cache/pomodoroz"),
    (Join-Path $HOME ".local/share/pomodoroz"),
    (Join-Path $HOME ".config/com.cjdduarte.pomodoroz"),
    (Join-Path $HOME ".cache/com.cjdduarte.pomodoroz"),
    (Join-Path $HOME ".local/share/com.cjdduarte.pomodoroz")
)

if ($PSBoundParameters.Count -eq 0 -and [Environment]::UserInteractive) {
    Show-ModeMenu
}

if ($Purge -and -not $Yes) {
    if ([Environment]::UserInteractive) {
        $confirm = Read-Host "Confirmar limpeza completa (inclui dados locais)? [y/N]"
        if ([string]::IsNullOrWhiteSpace($confirm)) {
            $confirm = "N"
        }

        if ($confirm -notmatch "^[Yy]$") {
            Write-Host "Operacao cancelada."
            exit 0
        }
    } else {
        Die "Modo nao interativo com -Purge requer -Yes."
    }
}

Step "Removendo instalacao local do Pomodoroz (install.ps1/install.sh)"

if (Test-Path $MANIFEST_PATH) {
    Get-Content $MANIFEST_PATH | ForEach-Object {
        if (-not [string]::IsNullOrWhiteSpace($_)) {
            Remove-IfExists $_
        }
    }
    Remove-IfExists $MANIFEST_PATH
}

# Sempre reforca limpeza dos paths atuais conhecidos, mesmo com manifesto antigo.
Remove-IfExists $BIN_PATH
Remove-IfExists $DESKTOP_PATH
Remove-IfExists $DESKTOP_PATH_LOCAL
Remove-IfExists $AUTOSTART_PATH
Remove-IfExists $AUTOSTART_PATH_TAURI
Remove-IfExists $ICON_PATH
Remove-IfExists $APPIMAGE_PATH
Remove-IfExists $APPIMAGE_PREVIOUS_PATH
Remove-IfExists $TAURI_BINARY_PATH
Remove-IfExists $TAURI_BINARY_PREVIOUS_PATH

if (Test-Path $INSTALL_ROOT) {
    try {
        Remove-Item $INSTALL_ROOT -Force
    } catch {
        # Ignora caso o diretorio nao esteja vazio por arquivos externos ao script
    }
}

if ($Purge) {
    Step "Removendo dados locais (config/cache/share)"
    foreach ($path in $USER_DATA_PATHS) {
        Remove-IfExists $path
    }
}

if (Get-Command update-desktop-database -ErrorAction SilentlyContinue) {
    & update-desktop-database (Join-Path $HOME ".local/share/applications") *> $null
}

if (Get-Command gtk-update-icon-cache -ErrorAction SilentlyContinue) {
    & gtk-update-icon-cache -f -q (Join-Path $HOME ".local/share/icons/hicolor") *> $null
}

Step "Concluido"
if ($Purge) {
    Write-Host "Instalacao local e dados locais foram removidos."
}
else {
    Write-Host "Somente a instalacao local criada por scripts/install.* foi removida."
}
