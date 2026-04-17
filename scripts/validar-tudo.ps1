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
    [ValidateSet("electron", "tauri")]
    [string]$DevRuntime = "electron",
    [switch]$DevElectron,
    [switch]$DevTauri,
    [ValidateSet("none", "full", "full-cargo")]
    [string]$LogMode = "none",
    [switch]$Help
)

$ErrorActionPreference = "Stop"

$ROOT = Split-Path -Parent $PSScriptRoot
$APP_DIR = $ROOT
$INSTALL_SCRIPT = Join-Path $ROOT "scripts/install.ps1"
$PNPM_WRAPPER = Join-Path $ROOT "scripts/pnpmw.mjs"
$IS_WINDOWS_OS = ($env:OS -eq "Windows_NT")
$script:LogModeSelection = $LogMode
$script:LogTimestamp = ""
$script:GeneralLogFile = ""
$script:CargoFmtLogFile = ""
$script:CargoClippyLogFile = ""
$script:TranscriptStarted = $false

function Step($message) {
    Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Stop-ValidationTranscript {
    if ($script:TranscriptStarted) {
        try {
            Stop-Transcript | Out-Null
        } catch {
            # ignora falha de finalizacao de transcript
        } finally {
            $script:TranscriptStarted = $false
        }
    }
}

function Die($message) {
    Write-Host "Erro: $message" -ForegroundColor Red
    Stop-ValidationTranscript
    exit 1
}

function Ensure-ElectronRuntimeForDev {
    $electronWorkspace = Join-Path $APP_DIR "app/electron"
    $checkScript = "try { require('electron'); process.exit(0); } catch (error) { console.error(error.message); process.exit(1); }"

    Push-Location $electronWorkspace
    try {
        & node -e $checkScript *> $null
        if ($LASTEXITCODE -eq 0) {
            return
        }

        Step "Reparando runtime do Electron para modo dev"

        $pkgPathRaw = (& node -e "try { process.stdout.write(require.resolve('electron/package.json')); } catch (error) { process.exit(1); }" | Select-Object -First 1)
        $pkgPath = "$pkgPathRaw".Trim()
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pkgPath)) {
            throw "Pacote electron nao encontrado no workspace app/electron. Rode: pnpm install"
        }

        $installScript = Join-Path (Split-Path -Parent $pkgPath) "install.js"
        & node $installScript
        if ($LASTEXITCODE -ne 0) {
            throw "Falha no reparo automatico do Electron (install.js)."
        }

        & node -e $checkScript
        if ($LASTEXITCODE -ne 0) {
            throw "Electron continua indisponivel apos reparo automatico."
        }
    } catch {
        Die $_.Exception.Message
    } finally {
        Pop-Location
    }
}

function Get-DevRuntimeLabel {
    if ($DevRuntime -eq "tauri") {
        return "Tauri"
    }
    return "Electron + Vite"
}

function Show-DevRuntimeMenu {
    Write-Host "Runtime para modo dev:"
    Write-Host "- 1) Electron + Vite (padrao atual)"
    Write-Host "- 2) Tauri (pnpm tauri dev)"
    Write-Host ""

    $choice = Read-Host "Opcao de runtime [1-2]"
    switch ($choice) {
        "1" { $script:DevRuntime = "electron" }
        "2" { $script:DevRuntime = "tauri" }
        default { Die "Opcao de runtime invalida: $choice" }
    }
}

function Ensure-DevRuntimeForMode {
    switch ($DevRuntime) {
        "electron" {
            Ensure-ElectronRuntimeForDev
            return
        }
        "tauri" {
            $tauriDir = Join-Path $APP_DIR "src-tauri"
            if (-not (Test-Path $tauriDir)) {
                Die "src-tauri nao encontrado para dev runtime tauri."
            }
            if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
                Die "Cargo nao encontrado para dev runtime tauri."
            }
            return
        }
        default {
            Die "Runtime dev invalido: $DevRuntime"
        }
    }
}

function Invoke-Pnpm {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    if (-not (Test-Path $PNPM_WRAPPER)) {
        Die "Wrapper pnpmw nao encontrado: $PNPM_WRAPPER"
    }

    & node $PNPM_WRAPPER @Args
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Invoke-PnpmAllowCtrlC {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    if (-not (Test-Path $PNPM_WRAPPER)) {
        Die "Wrapper pnpmw nao encontrado: $PNPM_WRAPPER"
    }

    try {
        & node $PNPM_WRAPPER @Args
        $exitCode = $LASTEXITCODE
        if ($exitCode -eq 0 -or $exitCode -eq 130) {
            if ($exitCode -eq 130) {
                Write-Host "Execucao dev interrompida pelo usuario (Ctrl+C)." -ForegroundColor Yellow
            }
            return
        }
        exit $exitCode
    } catch [System.Management.Automation.PipelineStoppedException] {
        Write-Host "Execucao dev interrompida pelo usuario (Ctrl+C)." -ForegroundColor Yellow
        return
    }
}

function Invoke-DevRuntimeAllowCtrlC {
    if ($DevRuntime -eq "tauri") {
        Invoke-PnpmAllowCtrlC tauri dev
        return
    }
    Invoke-PnpmAllowCtrlC dev:app
}

function Get-TauriInstallerBundles {
    param(
        [ValidateSet("slim", "full")]
        [string]$Profile = "slim"
    )

    if ($IS_WINDOWS_OS) {
        if ($Profile -eq "full") { return "nsis,msi" }
        return "nsis"
    }

    if ((Get-Variable IsMacOS -ErrorAction SilentlyContinue) -and $IsMacOS) {
        if ($Profile -eq "full") { return "app,dmg" }
        return "dmg"
    }

    if ($Profile -eq "full") { return "appimage,deb,rpm" }
    return "appimage,deb"
}

function Test-TauriAppImagePrerequisites {
  param(
        [string]$BundlesCsv
    )

    if (-not ((Get-Variable IsLinux -ErrorAction SilentlyContinue) -and $IsLinux)) {
        return $true
    }

    if ("," + $BundlesCsv + "," -notmatch ",appimage,") {
        return $true
    }

    return $true
}

function Invoke-TauriAppImageBuild {
    param(
        [string[]]$ExtraArgs = @()
    )

    $hadNoStrip = Test-Path Env:NO_STRIP
    $hadExtractAndRun = Test-Path Env:APPIMAGE_EXTRACT_AND_RUN
    $hadPkgConfigPath = Test-Path Env:PKG_CONFIG_PATH
    $oldNoStrip = $env:NO_STRIP
    $oldExtractAndRun = $env:APPIMAGE_EXTRACT_AND_RUN
    $oldPkgConfigPath = $env:PKG_CONFIG_PATH
    $gdkPkgFixDir = $null

    try {
        $env:NO_STRIP = "1"
        $env:APPIMAGE_EXTRACT_AND_RUN = "1"

        if ((Get-Variable IsLinux -ErrorAction SilentlyContinue) -and $IsLinux -and (Get-Command pkgconf -ErrorAction SilentlyContinue)) {
            $gdkBinaryDir = (& pkgconf --variable=gdk_pixbuf_binarydir gdk-pixbuf-2.0 2>$null)
            $gdkBinaryVersion = (& pkgconf --variable=gdk_pixbuf_binary_version gdk-pixbuf-2.0 2>$null)
            $gdkBinaryDir = if ($null -eq $gdkBinaryDir) { "" } else { $gdkBinaryDir.Trim() }
            $gdkBinaryVersion = if ($null -eq $gdkBinaryVersion -or [string]::IsNullOrWhiteSpace($gdkBinaryVersion.Trim())) { "2.10.0" } else { $gdkBinaryVersion.Trim() }

            if (-not [string]::IsNullOrWhiteSpace($gdkBinaryDir) -and -not (Test-Path $gdkBinaryDir)) {
                if (-not (Get-Command gdk-pixbuf-query-loaders -ErrorAction SilentlyContinue)) {
                    Die "gdk-pixbuf-query-loaders nao encontrado para workaround de AppImage."
                }

                $gdkPkgFixDir = Join-Path ([System.IO.Path]::GetTempPath()) ("pomodoroz-appimage-gdkpixbuf-" + [System.Guid]::NewGuid().ToString("N"))
                $pkgconfigDir = Join-Path $gdkPkgFixDir "pkgconfig"
                $gdkBinaryDirOverride = Join-Path (Join-Path $gdkPkgFixDir "gdk-pixbuf-2.0") $gdkBinaryVersion
                $loadersDir = Join-Path $gdkBinaryDirOverride "loaders"
                New-Item -ItemType Directory -Path $pkgconfigDir -Force | Out-Null
                New-Item -ItemType Directory -Path $loadersDir -Force | Out-Null

                $pcPath = Join-Path $pkgconfigDir "gdk-pixbuf-2.0.pc"
                Copy-Item "/usr/lib/pkgconfig/gdk-pixbuf-2.0.pc" $pcPath -Force
                (Get-Content $pcPath) `
                    -replace '^gdk_pixbuf_binarydir=.*', "gdk_pixbuf_binarydir=$gdkBinaryDirOverride" `
                    -replace '^gdk_pixbuf_moduledir=.*', 'gdk_pixbuf_moduledir=${gdk_pixbuf_binarydir}/loaders' `
                    -replace '^gdk_pixbuf_cache_file=.*', 'gdk_pixbuf_cache_file=${gdk_pixbuf_binarydir}/loaders.cache' | Set-Content $pcPath
                & gdk-pixbuf-query-loaders | Set-Content (Join-Path $gdkBinaryDirOverride "loaders.cache")

                if ($hadPkgConfigPath -and -not [string]::IsNullOrWhiteSpace($oldPkgConfigPath)) {
                    $env:PKG_CONFIG_PATH = "$pkgconfigDir:$oldPkgConfigPath"
                } else {
                    $env:PKG_CONFIG_PATH = $pkgconfigDir
                }

                Write-Host ("Info: AppImage usando workaround de gdk-pixbuf em {0}" -f $gdkBinaryDirOverride)
            }
        }

        Push-Location $APP_DIR
        try {
            Invoke-Pnpm tauri build --bundles appimage @ExtraArgs
        } finally {
            Pop-Location
        }
    } finally {
        if ($hadNoStrip) { $env:NO_STRIP = $oldNoStrip } else { Remove-Item Env:NO_STRIP -ErrorAction SilentlyContinue }
        if ($hadExtractAndRun) { $env:APPIMAGE_EXTRACT_AND_RUN = $oldExtractAndRun } else { Remove-Item Env:APPIMAGE_EXTRACT_AND_RUN -ErrorAction SilentlyContinue }
        if ($hadPkgConfigPath) { $env:PKG_CONFIG_PATH = $oldPkgConfigPath } else { Remove-Item Env:PKG_CONFIG_PATH -ErrorAction SilentlyContinue }
        if ($null -ne $gdkPkgFixDir -and (Test-Path $gdkPkgFixDir)) {
            Remove-Item -LiteralPath $gdkPkgFixDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

function Invoke-Cargo {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    & cargo @Args
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Invoke-CargoClippyStrict {
    param(
        [string]$LogPath = ""
    )

    $previousRustFlags = $env:RUSTFLAGS
    try {
        $env:RUSTFLAGS = "-D warnings"
        if ([string]::IsNullOrWhiteSpace($LogPath)) {
            Invoke-Cargo clippy --all-targets --all-features
        } else {
            & cargo clippy --all-targets --all-features *>&1 | Tee-Object -FilePath $LogPath
            if ($LASTEXITCODE -ne 0) {
                exit $LASTEXITCODE
            }
        }
    } finally {
        if ($null -eq $previousRustFlags) {
            Remove-Item Env:RUSTFLAGS -ErrorAction SilentlyContinue
        } else {
            $env:RUSTFLAGS = $previousRustFlags
        }
    }
}

function Invoke-ElectronBuilderViaScript {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    Push-Location $APP_DIR
    try {
        # Usa o script `eb` raiz (electron-builder via workspace app/electron).
        Invoke-Pnpm run eb -- @Args
    } finally {
        Pop-Location
    }
}

function Show-Usage {
@"
Uso:
  ./scripts/validar-tudo.ps1 [-SkipInstall] [-Dev | -RunPacked | -BuildInstallers [-InstallersProfile slim|full] | -InstallLocal | -QuickDev] [-DevRuntime electron|tauri | -DevElectron | -DevTauri] [-LogMode none|full|full-cargo]
  ./scripts/validar-tudo.ps1    (menu interativo)

Fluxo padrao:
  1) valida Node + pnpm
  2) pnpm install (sincroniza lockfile)
  3) pnpm lint (renderer + electron)
  4) pnpm typecheck:renderer
  5) cargo fmt --check (src-tauri)
  6) cargo clippy -D warnings (src-tauri)
  7) build empacotado no runtime selecionado (electron-builder --dir ou tauri build --no-bundle)

Opcoes:
  -SkipInstall   Nao roda pnpm install
  -Dev           Apos validar, inicia o runtime dev selecionado
  -RunPacked     Apos validar, executa binario empacotado local
  -BuildInstallers  Apos validar, gera instaladores da plataforma atual
  -InstallersProfile  Perfil para -BuildInstallers: slim (default) ou full
  -InstallLocal  Executa ./scripts/install.ps1 com runtime selecionado
  -QuickDev      Fluxo rapido: lint + typecheck renderer + dev runtime
  -DevRuntime    Runtime da execucao final: electron (default) ou tauri
  -DevElectron   Atalho para -DevRuntime electron
  -DevTauri      Atalho para -DevRuntime tauri
  -LogMode       Tipo de log: none (default), full, full-cargo
  -Help
"@
}

function Show-LogMenu {
    Write-Host "Tipo de log:"
    Write-Host "- 1) Sem log em arquivo."
    Write-Host "- 2) Log geral da execucao (validar-tudo-<timestamp>.log)."
    Write-Host "- 3) Log geral + logs separados do Rust gate (fmt/clippy)."
    Write-Host ""

    $choice = Read-Host "Opcao de log [1-3]"
    switch ($choice) {
        "1" { $script:LogModeSelection = "none" }
        "2" { $script:LogModeSelection = "full" }
        "3" { $script:LogModeSelection = "full-cargo" }
        default { Die "Opcao de log invalida: $choice" }
    }
}

function Initialize-Logging {
    if ($script:LogModeSelection -eq "none") {
        return
    }

    $logsDir = Join-Path $APP_DIR "logs"
    if (-not (Test-Path $logsDir)) {
        [void](New-Item -ItemType Directory -Path $logsDir -Force)
    }

    $script:LogTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $script:GeneralLogFile = Join-Path $logsDir "validar-tudo-$($script:LogTimestamp).log"

    if ($script:LogModeSelection -eq "full-cargo") {
        $script:CargoFmtLogFile = Join-Path $logsDir "validar-tudo-cargo-fmt-$($script:LogTimestamp).log"
        $script:CargoClippyLogFile = Join-Path $logsDir "validar-tudo-cargo-clippy-$($script:LogTimestamp).log"
    }

    try {
        Start-Transcript -Path $script:GeneralLogFile -Force | Out-Null
        $script:TranscriptStarted = $true
    } catch {
        Write-Host "Aviso: nao foi possivel iniciar transcript para log geral." -ForegroundColor Yellow
    }

    Step "Logs ativados"
    Write-Host "Log geral: $($script:GeneralLogFile)"
    if ($script:LogModeSelection -eq "full-cargo") {
        Write-Host "Log cargo fmt: $($script:CargoFmtLogFile)"
        Write-Host "Log cargo clippy: $($script:CargoClippyLogFile)"
    }
}

function Show-LogSummary {
    if ($script:LogModeSelection -eq "none") {
        return
    }

    Step "Logs gerados"
    Write-Host "Log geral: $($script:GeneralLogFile)"
    if ($script:LogModeSelection -eq "full-cargo") {
        Write-Host "Log cargo fmt: $($script:CargoFmtLogFile)"
        Write-Host "Log cargo clippy: $($script:CargoClippyLogFile)"
    }
}

function Show-ModeMenu {
    Write-Host "Menu de validacao:"
    Write-Host "Escada de execucao (simples -> completo):"
    Write-Host "- 1) Quick run (lint + typecheck renderer + dev runtime)."
    Write-Host "- 2) Preflight sem install."
    Write-Host "- 3) Preflight completo (com install)."
    Write-Host "- 4) Preflight completo + Quick run (lint + dev runtime)."
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
    if ($DevRuntime -eq "tauri") {
        if ($IS_WINDOWS_OS) {
            return Join-Path $APP_DIR "src-tauri/target/release/pomodoroz_tauri.exe"
        }
        return Join-Path $APP_DIR "src-tauri/target/release/pomodoroz_tauri"
    }

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
    Stop-ValidationTranscript
    exit 0
}

if ($PSBoundParameters.Count -eq 0 -and [Environment]::UserInteractive) {
    Show-LogMenu
    Show-ModeMenu
    if ($QuickDev -or $Dev -or $RunPacked -or $BuildInstallers -or $InstallLocal) {
        Show-DevRuntimeMenu
    }
}

if ($DevElectron -and $DevTauri) {
    Die "-DevElectron e -DevTauri nao podem ser usados juntos."
}
if ($DevElectron) {
    $DevRuntime = "electron"
}
if ($DevTauri) {
    $DevRuntime = "tauri"
}

Initialize-Logging

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
    Step ("Instalacao local (install.ps1, runtime: {0})" -f $DevRuntime)
    & $INSTALL_SCRIPT -Runtime $DevRuntime
    Show-LogSummary
    Stop-ValidationTranscript
    exit $LASTEXITCODE
}

Step "Verificando ambiente (Node + pnpm)"
try {
    $nodeVersion = (node --version) -replace '^v', ''
    $nodeMajor = [int]($nodeVersion -split '\.')[0]
    if ($nodeMajor -lt 24) {
        Write-Host "Node atual: v$nodeVersion (recomendado: v24 LTS)." -ForegroundColor Yellow
        Write-Host "Use: nvm install 24; nvm use 24" -ForegroundColor Yellow
    } else {
        Write-Host "Node v$nodeVersion" -ForegroundColor Green
    }
} catch {
    Die "Node nao encontrado."
}

if (-not (Test-Path $PNPM_WRAPPER)) {
    Die "Wrapper pnpmw nao encontrado: $PNPM_WRAPPER"
}
$pnpmVersionRaw = (& node $PNPM_WRAPPER --version | Select-Object -First 1)
if ($null -eq $pnpmVersionRaw) {
    $pnpmVersionRaw = ""
}
$pnpmVersion = "$pnpmVersionRaw".Trim()
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($pnpmVersion)) {
    Die "Nao foi possivel obter versao do pnpm via pnpmw/corepack."
}
Write-Host "pnpm $pnpmVersion" -ForegroundColor Green

if (-not $SkipInstall) {
    Step "Sincronizando dependencias (pnpm install)"
    Push-Location $APP_DIR
    Invoke-Pnpm install
    Pop-Location
} else {
    Step "Pulando pnpm install (-SkipInstall)"
}

if ($QuickDev) {
    Step "Quick run: lint"
    Push-Location $APP_DIR
    Invoke-Pnpm lint
    Pop-Location

    Step "Quick run: typecheck renderer"
    Push-Location $APP_DIR
    Invoke-Pnpm typecheck:renderer
    Pop-Location

    Ensure-DevRuntimeForMode
    Step ("Quick run: dev ({0})" -f (Get-DevRuntimeLabel))
    Push-Location $APP_DIR
    Invoke-DevRuntimeAllowCtrlC
    Pop-Location
    Step "Quick run concluido"
    Show-LogSummary
    Stop-ValidationTranscript
    exit 0
}

Step "Lint completo (ESLint renderer + TypeScript)"
Push-Location $APP_DIR
Invoke-Pnpm lint
Pop-Location

Step "Typecheck do renderer (TypeScript)"
Push-Location $APP_DIR
Invoke-Pnpm typecheck:renderer
Pop-Location

$tauriDir = Join-Path $APP_DIR "src-tauri"
if (Test-Path $tauriDir) {
    Step "Rust quality gate (fmt + clippy)"
    if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
        Die "Cargo nao encontrado."
    }

    Push-Location $tauriDir
    if ($script:LogModeSelection -eq "full-cargo") {
        & cargo fmt --all -- --check *>&1 | Tee-Object -FilePath $script:CargoFmtLogFile
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
        Invoke-CargoClippyStrict -LogPath $script:CargoClippyLogFile
    } else {
        Invoke-Cargo fmt --all -- --check
        Invoke-CargoClippyStrict
    }
    Pop-Location
}

if ($BuildInstallers) {
    if ($DevRuntime -eq "tauri") {
        $bundles = Get-TauriInstallerBundles -Profile $InstallersProfile
        $bundleList = $bundles -split "," | ForEach-Object { $_.Trim() } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        $baseBundles = ($bundleList | Where-Object { $_ -ne "appimage" }) -join ","
        $hasAppImage = $bundleList -contains "appimage"

        if (-not [string]::IsNullOrWhiteSpace($baseBundles)) {
            Step ("Gerando instaladores Tauri (bundles base: {0})" -f $baseBundles)
            Push-Location $APP_DIR
            if (((Get-Variable IsLinux -ErrorAction SilentlyContinue) -and $IsLinux) -and $hasAppImage) {
                # Sem appimage no lote base, o updater do Tauri pode falhar ao tentar gerar artefatos.
                Invoke-Pnpm tauri build --bundles $baseBundles --config '{"bundle":{"createUpdaterArtifacts":false}}'
            } else {
                Invoke-Pnpm tauri build --bundles $baseBundles
            }
            Pop-Location
        }

        if ($hasAppImage -and (Test-TauriAppImagePrerequisites -BundlesCsv $bundles)) {
            Step "Gerando instalador Tauri adicional (bundle: appimage)"
            # Fluxo local de instaladores nao precisa gerar artefato de updater assinado.
            Invoke-TauriAppImageBuild -ExtraArgs @("--config", '{"bundle":{"createUpdaterArtifacts":false}}')
        }
    } else {
        if ($IS_WINDOWS_OS) {
            Step ("Gerando instaladores Windows ({0}: --win --ia32 --x64 --publish=never)" -f $InstallersProfile)
            Push-Location $APP_DIR
            Invoke-Pnpm build
            Pop-Location
            Invoke-ElectronBuilderViaScript --win --ia32 --x64 --publish=never
        } elseif ((Get-Variable IsLinux -ErrorAction SilentlyContinue) -and $IsLinux) {
            if ($InstallersProfile -eq "full") {
                Step "Gerando instaladores Linux (full: AppImage+deb+rpm x64/arm64)"
                Push-Location $APP_DIR
                Invoke-Pnpm build
                Pop-Location
                Invoke-ElectronBuilderViaScript --linux --x64 --arm64 --publish=never
            } else {
                Step "Gerando instaladores Linux (slim: AppImage+deb x64/arm64 + rpm x64)"
                Push-Location $APP_DIR
                Invoke-Pnpm build
                Pop-Location
                Invoke-ElectronBuilderViaScript --linux AppImage deb --x64 --arm64 --publish=never
                Invoke-ElectronBuilderViaScript --linux rpm --x64 --publish=never
            }
        } elseif ((Get-Variable IsMacOS -ErrorAction SilentlyContinue) -and $IsMacOS) {
            Step ("Gerando instaladores macOS ({0}: --mac --publish=never)" -f $InstallersProfile)
            Push-Location $APP_DIR
            Invoke-Pnpm build
            Pop-Location
            Invoke-ElectronBuilderViaScript --mac --publish=never
        } else {
            Step "Gerando instaladores (build)"
            Push-Location $APP_DIR
            Invoke-Pnpm build
            Pop-Location
        }
    }
} else {
    if ($DevRuntime -eq "tauri") {
        Step "Build release Tauri sem bundle (pnpm tauri build --no-bundle)"
        Push-Location $APP_DIR
        Invoke-Pnpm tauri build --no-bundle
        Pop-Location
    } else {
        Step "Build empacotado (pnpm build + electron-builder --dir)"
        Push-Location $APP_DIR
        Invoke-Pnpm build
        Pop-Location
        Invoke-ElectronBuilderViaScript --dir
    }
}

if ($Dev) {
    Ensure-DevRuntimeForMode
    Step ("Iniciando app em modo dev ({0})" -f (Get-DevRuntimeLabel))
    Push-Location $APP_DIR
    Invoke-DevRuntimeAllowCtrlC
    Pop-Location
    Show-LogSummary
    Stop-ValidationTranscript
    exit 0
}

if ($RunPacked) {
    $binaryPath = Get-PackagedBinaryPath
    if (-not (Test-Path $binaryPath)) {
        Die "Binario empacotado nao encontrado: $binaryPath"
    }

    if ($DevRuntime -eq "tauri") {
        Step "Executando binario Tauri local (release)"
    } else {
        Step "Executando binario empacotado local"
    }
    & $binaryPath
    Show-LogSummary
    Stop-ValidationTranscript
    exit $LASTEXITCODE
}

if ($BuildInstallers) {
    Step "Instaladores gerados"
    if ($DevRuntime -eq "tauri") {
        Write-Host "Arquivos em: $APP_DIR/src-tauri/target/release/bundle"
    } else {
        Write-Host "Arquivos em: $APP_DIR/app/electron/dist"
    }
    Show-LogSummary
    Stop-ValidationTranscript
    exit 0
}

Step "Validacao concluida"
Write-Host "Sem execucao final. Para abrir o app:"
Write-Host "  Dev (Electron): ./scripts/validar-tudo.ps1 -Dev -DevElectron"
Write-Host "  Dev (Tauri): ./scripts/validar-tudo.ps1 -Dev -DevTauri"
Write-Host "  Empacotado: ./scripts/validar-tudo.ps1 -RunPacked"
Show-LogSummary
Stop-ValidationTranscript
