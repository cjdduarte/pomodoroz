# Pomodoroz - Uninstall Local (PowerShell, Linux/Windows)
# Equivalente ao ./scripts/uninstall.sh (Linux) + suporte Windows user-scope

param(
    [switch]$Purge,
    [switch]$Yes,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Step($message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Die($message) {
    Write-Host "Erro: $message" -ForegroundColor Red
    exit 1
}

function Remove-IfExists($path) {
    if ([string]::IsNullOrWhiteSpace($path)) {
        return
    }

    if (Test-Path -LiteralPath $path) {
        try {
            Remove-Item -Recurse -Force -LiteralPath $path -ErrorAction Stop
            Write-Host "Removido: $path"
        } catch {
            Write-Host "Aviso: nao foi possivel remover $path" -ForegroundColor Yellow
        }
    }
}

function Join-IfBasePath($basePath, $childPath) {
    if ([string]::IsNullOrWhiteSpace($basePath)) {
        return $null
    }

    return Join-Path $basePath $childPath
}

function Show-Usage {
    @"
Uso:
  ./scripts/uninstall.ps1 [-Purge] [-Yes]

Padrao:
  Linux: remove somente a instalacao local criada por scripts/install.ps1/install.sh.
  Windows: remove instalacao local user-scope e atalhos do usuario atual.
  Sem parametros em terminal interativo, mostra um menu de opcoes.

Opcoes:
  -Purge   Remove tambem dados locais da aplicacao (Linux/Windows).
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

function Run-LinuxUninstall {
    $installRoot = Join-Path $HOME ".local/opt/pomodoroz"
    $manifestPath = Join-Path $installRoot "install-manifest.txt"

    $knownInstallPaths = @(
        (Join-Path $HOME ".local/bin/pomodoroz"),
        (Join-Path $HOME ".local/share/applications/pomodoroz.desktop"),
        (Join-Path $HOME ".local/share/applications/pomodoroz-local.desktop"),
        (Join-Path $HOME ".config/autostart/pomodoroz.desktop"),
        (Join-Path $HOME ".config/autostart/com.cjdduarte.pomodoroz.desktop"),
        (Join-Path $HOME ".local/share/icons/hicolor/256x256/apps/pomodoroz.png"),
        (Join-Path $installRoot "Pomodoroz.AppImage"),
        (Join-Path $installRoot "Pomodoroz.AppImage.previous"),
        (Join-Path $installRoot "pomodoroz_tauri"),
        (Join-Path $installRoot "pomodoroz_tauri.previous")
    )

    $userDataPaths = @(
        (Join-Path $HOME ".config/pomodoroz"),
        (Join-Path $HOME ".cache/pomodoroz"),
        (Join-Path $HOME ".local/share/pomodoroz"),
        (Join-Path $HOME ".config/com.cjdduarte.pomodoroz"),
        (Join-Path $HOME ".cache/com.cjdduarte.pomodoroz"),
        (Join-Path $HOME ".local/share/com.cjdduarte.pomodoroz")
    )

    Step "Removendo instalacao local do Pomodoroz (install.ps1/install.sh)"

    if (Test-Path $manifestPath) {
        Get-Content $manifestPath | ForEach-Object {
            if (-not [string]::IsNullOrWhiteSpace($_)) {
                Remove-IfExists $_
            }
        }
        Remove-IfExists $manifestPath
    }

    # Sempre reforca limpeza dos paths atuais conhecidos, mesmo com manifesto antigo.
    foreach ($path in $knownInstallPaths) {
        Remove-IfExists $path
    }

    if (Test-Path $installRoot) {
        try {
            Remove-Item $installRoot -Force
        } catch {
            # Ignora caso o diretorio nao esteja vazio por arquivos externos ao script
        }
    }

    if ($Purge) {
        Step "Removendo dados locais (config/cache/share)"
        foreach ($path in $userDataPaths) {
            Remove-IfExists $path
        }
    }

    if (Get-Command update-desktop-database -ErrorAction SilentlyContinue) {
        & update-desktop-database (Join-Path $HOME ".local/share/applications") *> $null
    }

    if (Get-Command gtk-update-icon-cache -ErrorAction SilentlyContinue) {
        & gtk-update-icon-cache -f -q (Join-Path $HOME ".local/share/icons/hicolor") *> $null
    }
}

function Run-WindowsUninstall {
    $startMenuPrograms = Join-IfBasePath $env:APPDATA "Microsoft\\Windows\\Start Menu\\Programs"

    $windowsInstallPaths = @(
        (Join-IfBasePath $env:LOCALAPPDATA "Programs\\Pomodoroz"),
        (Join-IfBasePath $env:LOCALAPPDATA "Programs\\pomodoroz"),
        (Join-IfBasePath $env:LOCALAPPDATA "Programs\\com.cjdduarte.pomodoroz"),
        (Join-IfBasePath $env:LOCALAPPDATA "Programs\\Pomodoroz Tauri"),
        (Join-IfBasePath $env:LOCALAPPDATA "Pomodoroz"),
        (Join-IfBasePath $env:LOCALAPPDATA "pomodoroz")
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

    $windowsShortcutPaths = @(
        (Join-IfBasePath $startMenuPrograms "Pomodoroz.lnk"),
        (Join-IfBasePath $startMenuPrograms "Pomodoroz"),
        (Join-IfBasePath $startMenuPrograms "com.cjdduarte.pomodoroz.lnk"),
        (Join-IfBasePath $env:USERPROFILE "Desktop\\Pomodoroz.lnk"),
        (Join-IfBasePath $env:PUBLIC "Desktop\\Pomodoroz.lnk")
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

    $windowsUserDataPaths = @(
        (Join-IfBasePath $env:APPDATA "pomodoroz"),
        (Join-IfBasePath $env:LOCALAPPDATA "pomodoroz"),
        (Join-IfBasePath $env:APPDATA "com.cjdduarte.pomodoroz"),
        (Join-IfBasePath $env:LOCALAPPDATA "com.cjdduarte.pomodoroz")
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

    Step "Removendo instalacao local do Pomodoroz (Windows user-scope)"
    foreach ($path in $windowsInstallPaths) {
        Remove-IfExists $path
    }

    foreach ($path in $windowsShortcutPaths) {
        Remove-IfExists $path
    }

    if ($Purge) {
        Step "Removendo dados locais (AppData/LocalAppData)"
        foreach ($path in $windowsUserDataPaths) {
            Remove-IfExists $path
        }
    }
}

if ($Help) {
    Show-Usage
    exit 0
}

$isLinuxVar = Get-Variable IsLinux -ErrorAction SilentlyContinue
$isWindowsVar = Get-Variable IsWindows -ErrorAction SilentlyContinue
$isLinuxOs = ($null -ne $isLinuxVar -and [bool]$isLinuxVar.Value)
$isWindowsOs = ($null -ne $isWindowsVar -and [bool]$isWindowsVar.Value) -or ($env:OS -eq "Windows_NT")

if (-not $isLinuxOs -and -not $isWindowsOs) {
    Die "Este script suporta apenas Linux ou Windows."
}

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

if ($isLinuxOs) {
    Run-LinuxUninstall
} else {
    Run-WindowsUninstall
}

Step "Concluido"
if ($Purge) {
    Write-Host "Instalacao local e dados locais foram removidos."
} else {
    Write-Host "Somente a instalacao local (user-scope) foi removida."
}
