# Pomodoroz - Validacao Completa (PowerShell)

param(
    [switch]$SkipInstall,
    [switch]$Dev,
    [switch]$RunPacked,
    [switch]$BuildInstallers,
    [ValidateSet("slim", "full")]
    [string]$InstallersProfile = "slim",
    [switch]$InstallLocal,
    [switch]$QuickDev,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $PSScriptRoot
$APP_DIR = $ROOT
$INSTALL_SCRIPT = Join-Path $ROOT "scripts/install.ps1"
$IS_WINDOWS_OS = ($env:OS -eq "Windows_NT")

function Step($message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Die($message) {
    Write-Host "Erro: $message" -ForegroundColor Red
    exit 1
}

function Invoke-Yarn {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    if ($script:USE_COREPACK_YARN) {
        & corepack yarn @Args
    } else {
        & yarn @Args
    }

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Show-Usage {
@"
Uso:
  ./scripts/validar-tudo.ps1 [-SkipInstall] [-Dev | -RunPacked | -BuildInstallers [-InstallersProfile slim|full] | -InstallLocal | -QuickDev]
  ./scripts/validar-tudo.ps1    (menu interativo)

Fluxo padrao:
  1) valida Node + Yarn
  2) yarn install (sincroniza lockfile)
  3) yarn workspace @pomodoroz/shareables run build
  4) yarn lint
  5) yarn build:dir

Opcoes:
  -SkipInstall   Nao roda yarn install
  -Dev           Apos validar, inicia yarn dev:app
  -RunPacked     Apos validar, executa binario empacotado local
  -BuildInstallers  Apos validar, gera instaladores da plataforma atual
  -InstallersProfile  Perfil para -BuildInstallers: slim (default) ou full
  -InstallLocal  Executa ./scripts/install.ps1
  -QuickDev      Fluxo rapido: yarn lint + yarn dev:app
  -Help
"@
}

function Show-ModeMenu {
    Write-Host "Menu de validacao:"
    Write-Host "Escada de execucao (simples -> completo):"
    Write-Host "- 1) Quick run (lint + dev:app)."
    Write-Host "- 2) Preflight sem install."
    Write-Host "- 3) Preflight completo (com install)."
    Write-Host "- 4) Preflight completo + Quick run (lint + dev:app)."
    Write-Host "- 5) (3) + empacotado."
    Write-Host "- 6) Instalar localmente."
    Write-Host "- 7) Gerar instaladores da plataforma atual."
    Write-Host ""
    Write-Host "Escolha o fluxo:"
    Write-Host "  1) Quick run"
    Write-Host "  2) Preflight sem install"
    Write-Host "  3) Preflight completo"
    Write-Host "  4) Preflight completo + Quick run"
    Write-Host "  5) Preflight completo + empacotado"
    Write-Host "  6) Instalar localmente"
    Write-Host "  7) Gerar instaladores"
    Write-Host "  8) Cancelar"

    $choice = Read-Host "Opcao [1-8]"
    switch ($choice) {
        "1" {
            $script:QuickDev = $true
            $script:SkipInstall = $true
        }
        "2" { $script:SkipInstall = $true }
        "3" { }
        "4" { $script:Dev = $true }
        "5" { $script:RunPacked = $true }
        "6" { $script:InstallLocal = $true }
        "7" {
            $script:BuildInstallers = $true
            Write-Host ""
            Write-Host "Perfil dos instaladores:"
            Write-Host "  1) Enxuto (Windows x64; Linux sem rpm arm64)"
            Write-Host "  2) Completo (targets padrao do projeto)"
            $installerChoice = Read-Host "Opcao [1-2]"
            switch ($installerChoice) {
                "1" { $script:InstallersProfile = "slim" }
                "2" { $script:InstallersProfile = "full" }
                default { Die "Opcao invalida de perfil: $installerChoice" }
            }
        }
        "8" {
            Write-Host "Cancelado."
            exit 0
        }
        default { Die "Opcao invalida: $choice" }
    }
}

function Get-PackagedBinaryPath {
    if ($IS_WINDOWS_OS) {
        return Join-Path $APP_DIR "app/electron/dist/win-unpacked/Pomodoroz.exe"
    }

    if ((Get-Variable IsMacOS -ErrorAction SilentlyContinue) -and $IsMacOS) {
        return Join-Path $APP_DIR "app/electron/dist/mac/Pomodoroz.app/Contents/MacOS/Pomodoroz"
    }

    return Join-Path $APP_DIR "app/electron/dist/linux-unpacked/pomodoroz"
}

if ($Help) {
    Show-Usage
    exit 0
}

if ($PSBoundParameters.Count -eq 0 -and [Environment]::UserInteractive) {
    Show-ModeMenu
}

if (($Dev -and $RunPacked) -or ($Dev -and $BuildInstallers) -or ($RunPacked -and $BuildInstallers)) {
    Die "Use apenas um modo final: -Dev, -RunPacked ou -BuildInstallers."
}

if ((-not $BuildInstallers) -and $PSBoundParameters.ContainsKey("InstallersProfile")) {
    Die "-InstallersProfile requer -BuildInstallers."
}

if ($InstallLocal -and ($Dev -or $RunPacked -or $BuildInstallers -or $QuickDev -or $SkipInstall)) {
    Die "-InstallLocal nao pode ser combinado com -Dev, -RunPacked, -BuildInstallers, -QuickDev ou -SkipInstall."
}

if ($QuickDev -and ($Dev -or $RunPacked -or $BuildInstallers)) {
    Die "-QuickDev nao pode ser combinado com -Dev, -RunPacked ou -BuildInstallers."
}

if ($InstallLocal) {
    Step "Instalacao local (install.ps1)"
    & $INSTALL_SCRIPT
    exit $LASTEXITCODE
}

Step "Verificando ambiente (Node + Yarn)"
try {
    $nodeVersion = (node --version) -replace '^v', ''
    $nodeMajor = [int]($nodeVersion -split '\.')[0]
    if ($nodeMajor -lt 24) {
        Write-Host "Node atual: v$nodeVersion (recomendado: v24 LTS)." -ForegroundColor Yellow
        Write-Host "Use: nvm install 24 && nvm use 24" -ForegroundColor Yellow
    } else {
        Write-Host "Node v$nodeVersion" -ForegroundColor Green
    }
} catch {
    Die "Node nao encontrado."
}

if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    if (Get-Command corepack -ErrorAction SilentlyContinue) {
        try {
            $yarnVersion = (& corepack yarn --version).Trim()
            if ($LASTEXITCODE -ne 0) {
                Die "Yarn nao encontrado e corepack yarn nao pode ser executado."
            }
            $script:USE_COREPACK_YARN = $true
            Write-Host "Yarn via Corepack v$yarnVersion" -ForegroundColor Green
            Write-Host "Obs: usando fallback 'corepack yarn' (sem 'corepack enable')." -ForegroundColor Yellow
        } catch {
            Die "Yarn nao encontrado e corepack yarn falhou. Instale Yarn 1.22.x ou execute como Administrador para habilitar corepack."
        }
    } else {
        Die "Yarn nao encontrado."
    }
} else {
    $yarnVersion = (yarn --version).Trim()
    Write-Host "Yarn $yarnVersion" -ForegroundColor Green
}

if (-not $SkipInstall) {
    Step "Sincronizando dependencias (yarn install)"
    Push-Location $APP_DIR
    Invoke-Yarn install
    Pop-Location
} else {
    Step "Pulando yarn install (-SkipInstall)"
}

if ($QuickDev) {
    Step "Quick run: preparando @pomodoroz/shareables"
    Push-Location $APP_DIR
    Invoke-Yarn workspace @pomodoroz/shareables run build
    Pop-Location

    Step "Quick run: lint"
    Push-Location $APP_DIR
    Invoke-Yarn lint
    Pop-Location

    Step "Quick run: dev:app"
    Push-Location $APP_DIR
    Invoke-Yarn dev:app
    Pop-Location
    exit 0
}

Step "Preparando @pomodoroz/shareables (tipos para dependencias internas)"
Push-Location $APP_DIR
Invoke-Yarn workspace @pomodoroz/shareables run build
Pop-Location

Step "Lint completo (ESLint renderer + TypeScript workspaces)"
Push-Location $APP_DIR
Invoke-Yarn lint
Pop-Location

if ($BuildInstallers) {
    if ($IS_WINDOWS_OS) {
        if ($InstallersProfile -eq "full") {
            Step "Gerando instaladores Windows (full: build:win)"
            Push-Location $APP_DIR
            Invoke-Yarn build:win
            Pop-Location
        } else {
            Step "Gerando instaladores Windows (slim: x64 setup+portable)"
            Push-Location $APP_DIR
            Invoke-Yarn build
            Invoke-Yarn workspace pomodoroz run build:win-x64
            Pop-Location
        }
    } elseif ((Get-Variable IsLinux -ErrorAction SilentlyContinue) -and $IsLinux) {
        if ($InstallersProfile -eq "full") {
            Step "Gerando instaladores Linux (full: build:linux)"
            Push-Location $APP_DIR
            Invoke-Yarn build:linux
            Pop-Location
        } else {
            Step "Gerando instaladores Linux (slim: AppImage+deb x64/arm64 + rpm x64)"
            Push-Location $APP_DIR
            Invoke-Yarn build
            Invoke-Yarn workspace pomodoroz run eb --linux AppImage deb --x64 --arm64 --publish=never
            Invoke-Yarn workspace pomodoroz run eb --linux rpm --x64 --publish=never
            Pop-Location
        }
    } elseif ((Get-Variable IsMacOS -ErrorAction SilentlyContinue) -and $IsMacOS) {
        Step "Gerando instaladores macOS (build:mac)"
        Push-Location $APP_DIR
        Invoke-Yarn build:mac
        Pop-Location
    } else {
        Step "Gerando instaladores (build)"
        Push-Location $APP_DIR
        Invoke-Yarn build
        Pop-Location
    }
} else {
    Step "Build empacotado (build:dir)"
    Push-Location $APP_DIR
    Invoke-Yarn build:dir
    Pop-Location
}

if ($Dev) {
    Step "Iniciando app em modo dev (Electron + Vite)"
    Push-Location $APP_DIR
    Invoke-Yarn dev:app
    Pop-Location
    exit 0
}

if ($RunPacked) {
    $binaryPath = Get-PackagedBinaryPath
    if (-not (Test-Path $binaryPath)) {
        Die "Binario empacotado nao encontrado: $binaryPath"
    }

    Step "Executando binario empacotado local"
    & $binaryPath
    exit $LASTEXITCODE
}

if ($BuildInstallers) {
    Step "Instaladores gerados"
    Write-Host "Arquivos em: $APP_DIR/app/electron/dist"
    exit 0
}

Step "Validacao concluida"
Write-Host "Sem execucao final. Para abrir o app:"
Write-Host "  Dev: ./scripts/validar-tudo.ps1 -Dev"
Write-Host "  Empacotado: ./scripts/validar-tudo.ps1 -RunPacked"
