# Pomodoroz - Verificador de Updates (Windows PowerShell)
#
# Uso:
#   .\scripts\check-updates.ps1                      # Modo interativo (padrao)
#   .\scripts\check-updates.ps1 report               # Modo relatorio (sem interacao)
#   .\scripts\check-updates.ps1 [interactive|report] [none|cargo|full]

param(
    [Parameter(Position = 0)]
    [ValidateSet("interactive", "report")]
    [string]$Mode = "interactive",
    [Parameter(Position = 1)]
    [ValidateSet("none", "cargo", "full")]
    [string]$LogMode = "cargo"
)

$ErrorActionPreference = "Continue"

$ROOT = Split-Path -Parent $PSScriptRoot
$POMODOROZ = $ROOT

$Workspaces = @(
    @{ Name = "root"; Path = $POMODOROZ }
)

$script:OutdatedCheckFailed = $false
$script:OutdatedSeen = [System.Collections.Generic.HashSet[string]]::new()
$script:PnpmVersionCurrent = ""
$script:PnpmVersionLatest = ""
$script:LogModeSelection = $LogMode
$script:LogTimestamp = ""
$script:GeneralLogFile = ""
$script:CargoOutdatedLogFile = ""
$script:CargoAuditLogFile = ""
$script:TranscriptStarted = $false
$CriticalExactPackages = @(
    "electron",
    "typescript",
    "@electron/notarize"
)

function Print-Header {
    Write-Host "`n===============================================" -ForegroundColor Cyan
    Write-Host " Pomodoroz · Verificador de Updates" -ForegroundColor Cyan
    if ($Mode -eq "report") {
        Write-Host " (Modo Relatorio)" -ForegroundColor Yellow
    }
    Write-Host "===============================================`n" -ForegroundColor Cyan
}

function Step([string]$Message) {
    Write-Host $Message -ForegroundColor Cyan
}

function Stop-CheckUpdatesTranscript {
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

function Show-LogMenu {
    Write-Host "Tipo de log:"
    Write-Host "- 1) Sem log em arquivo."
    Write-Host "- 2) Apenas logs de cargo outdated/audit (padrao)."
    Write-Host "- 3) Log geral + logs de cargo."
    Write-Host ""

    $choice = Read-Host "Opcao de log [1-3]"
    switch ($choice) {
        "1" { $script:LogModeSelection = "none" }
        "2" { $script:LogModeSelection = "cargo" }
        "3" { $script:LogModeSelection = "full" }
        default { throw "Opcao de log invalida: $choice" }
    }
}

function Initialize-Logging {
    if ($script:LogModeSelection -ne "full") {
        return
    }

    $logsDir = Join-Path $POMODOROZ "logs"
    if (-not (Test-Path $logsDir)) {
        [void](New-Item -ItemType Directory -Path $logsDir -Force)
    }

    $script:LogTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $script:GeneralLogFile = Join-Path $logsDir "check-updates-$($script:LogTimestamp).log"

    try {
        Start-Transcript -Path $script:GeneralLogFile -Force | Out-Null
        $script:TranscriptStarted = $true
    } catch {
        Write-Host "Aviso: nao foi possivel iniciar transcript para log geral." -ForegroundColor Yellow
    }
}

function Show-GeneratedLogs {
    if ($script:LogModeSelection -eq "none") {
        return
    }

    if ([string]::IsNullOrWhiteSpace($script:GeneralLogFile) -and [string]::IsNullOrWhiteSpace($script:CargoOutdatedLogFile) -and [string]::IsNullOrWhiteSpace($script:CargoAuditLogFile)) {
        return
    }

    Write-Host ""
    Write-Host "Logs gerados:" -ForegroundColor Cyan
    if (-not [string]::IsNullOrWhiteSpace($script:GeneralLogFile)) {
        Write-Host "  - Geral: $($script:GeneralLogFile)"
    }
    if (-not [string]::IsNullOrWhiteSpace($script:CargoOutdatedLogFile)) {
        Write-Host "  - Cargo outdated: $($script:CargoOutdatedLogFile)"
    }
    if (-not [string]::IsNullOrWhiteSpace($script:CargoAuditLogFile)) {
        Write-Host "  - Cargo audit: $($script:CargoAuditLogFile)"
    }
}

function Check-Command([string]$Cmd) {
    return $null -ne (Get-Command $Cmd -ErrorAction SilentlyContinue)
}

$script:PnpmWrapper = Join-Path $POMODOROZ "scripts/pnpmw.mjs"

function Invoke-PnpmWrapper {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    if (-not (Check-Command "node")) {
        throw "Node nao encontrado para executar pnpmw."
    }
    if (-not (Test-Path $script:PnpmWrapper)) {
        throw "Wrapper pnpmw nao encontrado em $script:PnpmWrapper"
    }

    & node $script:PnpmWrapper @Args
    $exitCode = $LASTEXITCODE
    $global:LASTEXITCODE = $exitCode
}

function pnpm {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    Invoke-PnpmWrapper @Args
}

function Get-PackageJson {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        return $null
    }
    try {
        return (Get-Content $Path -Raw | ConvertFrom-Json)
    } catch {
        return $null
    }
}

function Get-PackageJsonVersion {
    param(
        [string]$PackageJsonPath,
        [string]$DependencyName
    )

    $json = Get-PackageJson -Path $PackageJsonPath
    if ($null -eq $json) {
        return "n/a"
    }

    $sources = @(
        $json.dependencies,
        $json.devDependencies,
        $json.peerDependencies
    )
    foreach ($src in $sources) {
        if ($null -ne $src) {
            $value = $src.$DependencyName
            if ($null -ne $value -and "$value" -ne "") {
                return "$value"
            }
        }
    }
    return "n/a"
}

function Extract-Major {
    param([string]$VersionText)
    if ([string]::IsNullOrWhiteSpace($VersionText)) {
        return $null
    }
    if ($VersionText -match '(\d+)') {
        return [int]$Matches[1]
    }
    return $null
}

function Is-MajorUpdate {
    param(
        [string]$Current,
        [string]$Latest
    )
    $currentMajor = Extract-Major -VersionText $Current
    $latestMajor = Extract-Major -VersionText $Latest
    if ($null -eq $currentMajor -or $null -eq $latestMajor) {
        return $true
    }
    return $currentMajor -ne $latestMajor
}

function Get-SemverTuple {
    param([string]$VersionText)

    if ([string]::IsNullOrWhiteSpace($VersionText)) {
        return @(0, 0, 0)
    }

    $clean = ($VersionText -replace '^[^\d]*', '' -replace '[^\d.].*$', '').Trim()
    if ([string]::IsNullOrWhiteSpace($clean)) {
        return @(0, 0, 0)
    }

    $parts = $clean.Split('.')
    $result = @(0, 0, 0)

    for ($i = 0; $i -lt 3; $i++) {
        if ($i -lt $parts.Length) {
            $parsed = 0
            if ([int]::TryParse($parts[$i], [ref]$parsed)) {
                $result[$i] = $parsed
            }
        }
    }

    return $result
}

function Compare-Semver {
    param(
        [string]$Left,
        [string]$Right
    )

    $leftTuple = Get-SemverTuple -VersionText $Left
    $rightTuple = Get-SemverTuple -VersionText $Right

    for ($i = 0; $i -lt 3; $i++) {
        if ($leftTuple[$i] -lt $rightTuple[$i]) {
            return -1
        }
        if ($leftTuple[$i] -gt $rightTuple[$i]) {
            return 1
        }
    }

    return 0
}

function Get-ReleaseWorkflowPnpmPins {
    $workflowFile = Join-Path $POMODOROZ ".github/workflows/release-autoupdate.yml"
    if (-not (Test-Path $workflowFile)) {
        return @()
    }

    $pins = [System.Collections.Generic.HashSet[string]]::new()
    $inSetup = $false
    foreach ($line in (Get-Content $workflowFile)) {
        if ($line -match 'uses:\s*pnpm/action-setup@') {
            $inSetup = $true
            continue
        }

        if ($inSetup -and $line -match '^\s*version:\s*(.+?)\s*$') {
            $value = $Matches[1].Trim().Trim('"').Trim("'")
            if (-not [string]::IsNullOrWhiteSpace($value)) {
                [void]$pins.Add($value)
            }
            $inSetup = $false
            continue
        }

        if ($inSetup -and $line -match '^\s*-\s+name:') {
            $inSetup = $false
        }

        if ($line -match 'corepack\s+prepare\s+pnpm@([0-9][0-9A-Za-z._-]*)\s+--activate') {
            $value = "$($Matches[1])".Trim().Trim('"').Trim("'")
            if (-not [string]::IsNullOrWhiteSpace($value)) {
                [void]$pins.Add($value)
            }
        }
    }

    return @($pins | Sort-Object)
}

function Show-ReleaseWorkflowPnpmPinStatus {
    $pins = @(Get-ReleaseWorkflowPnpmPins)
    if (-not $pins -or $pins.Count -eq 0) {
        Write-Host "  Release workflow pin (pnpm): [WARN] nao encontrado" -ForegroundColor Yellow
        Write-Host "    Arquivo esperado: .github/workflows/release-autoupdate.yml" -ForegroundColor Yellow
        return
    }

    $pinsDisplay = ($pins -join ", ")
    Write-Host "  Release workflow pin (pnpm): $pinsDisplay"

    if ($pins.Count -gt 1) {
        Write-Host "    [WARN] Inconsistencia: workflow possui mais de um pin de versao para pnpm." -ForegroundColor Yellow
    }

    $firstPin = "$($pins[0])"
    if (-not [string]::IsNullOrWhiteSpace($script:PnpmVersionCurrent) -and $firstPin -ne $script:PnpmVersionCurrent) {
        Write-Host "    Aviso: pnpm local ($($script:PnpmVersionCurrent)) difere do pin do workflow ($firstPin)." -ForegroundColor Yellow
    }

    if (-not [string]::IsNullOrWhiteSpace($script:PnpmVersionLatest) -and (Compare-Semver -Left $firstPin -Right $script:PnpmVersionLatest) -lt 0) {
        Write-Host "    Suggestion: update workflow pin $firstPin -> $($script:PnpmVersionLatest)" -ForegroundColor Yellow
        Write-Host "    File: .github/workflows/release-autoupdate.yml" -ForegroundColor Gray
    }
}

function Update-ReleaseWorkflowPnpmPin {
    param([string]$TargetVersion)

    $workflowFile = Join-Path $POMODOROZ ".github/workflows/release-autoupdate.yml"
    if (-not (Test-Path $workflowFile)) {
        Write-Host "  [WARN] Arquivo de workflow nao encontrado: .github/workflows/release-autoupdate.yml" -ForegroundColor Yellow
        return $false
    }

    if (-not (Check-Command "node")) {
        Write-Host "  [WARN] Node nao encontrado para atualizar pin do workflow." -ForegroundColor Yellow
        return $false
    }

    $nodeCode = @'
const fs = require("fs");
const file = process.argv[1];
const target = process.argv[2];
const source = fs.readFileSync(file, "utf8");
const lines = source.split(/\r?\n/);
const hadFinalNewline = /\r?\n$/.test(source);
let inSetup = false;
let found = false;
let changed = false;

const out = lines.map((line) => {
  if (/uses:\s*pnpm\/action-setup@/.test(line)) {
    inSetup = true;
    return line;
  }

  if (inSetup && /^\s*version:\s*/.test(line)) {
    found = true;
    const next = line.replace(/version:\s*.*/, `version: ${target}`);
    if (next !== line) changed = true;
    inSetup = false;
    return next;
  }

  if (inSetup && /^\s*-\s+name:/.test(line)) {
    inSetup = false;
  }

  if (/corepack\s+prepare\s+pnpm@/.test(line) && /--activate/.test(line)) {
    found = true;
    const next = line.replace(/(corepack\s+prepare\s+pnpm@)([0-9][0-9A-Za-z._-]*)/, `$1${target}`);
    if (next !== line) changed = true;
    return next;
  }

  return line;
});

if (!found) {
  process.exit(3);
}

if (!changed) {
  process.exit(0);
}

fs.writeFileSync(file, out.join("\n") + (hadFinalNewline ? "\n" : ""), "utf8");
'@

    & node -e $nodeCode $workflowFile $TargetVersion *> $null
    return $LASTEXITCODE -eq 0
}

function Maybe-OfferReleaseWorkflowPnpmPinUpdate {
    if ($Mode -ne "interactive") {
        return
    }

    if ([string]::IsNullOrWhiteSpace($script:PnpmVersionLatest)) {
        return
    }

    $pins = @(Get-ReleaseWorkflowPnpmPins)
    if (-not $pins -or $pins.Count -eq 0) {
        return
    }

    if ($pins.Count -ne 1) {
        Write-Host "  [WARN] Pulando atualizacao automatica do pin do workflow: multiplos pins detectados." -ForegroundColor Yellow
        return
    }

    $currentPin = "$($pins[0])"
    if ((Compare-Semver -Left $currentPin -Right $script:PnpmVersionLatest) -ge 0) {
        return
    }

    Write-Host ""
    $confirm = Read-Host "Atualizar pin do workflow de release para pnpm@$($script:PnpmVersionLatest)? (s/N)"
    if ($confirm -match '^[sS]$') {
        if (Update-ReleaseWorkflowPnpmPin -TargetVersion $script:PnpmVersionLatest) {
            Write-Host "  [OK] Workflow atualizado: pnpm $($script:PnpmVersionLatest)" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] Falha ao atualizar pin do workflow." -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Pin do workflow mantido em $currentPin."
    }
}

function Normalize-WorkspaceName {
    param([string]$WorkspaceName)

    switch ($WorkspaceName) {
        "" { return "root" }
        "root" { return "root" }
        "pomodoroz" { return "root" }
        default { return $WorkspaceName }
    }
}

function Should-PreserveExactVersion {
    param([string]$PackageName)
    return $CriticalExactPackages -contains $PackageName
}

function Get-DeclaredDependencySpec {
    param(
        [string]$WorkspacePath,
        [string]$PackageType,
        [string]$PackageName
    )

    $pkgJsonPath = Join-Path $WorkspacePath "package.json"
    $json = Get-PackageJson -Path $pkgJsonPath
    if ($null -eq $json) {
        return ""
    }

    $source = $null
    switch ($PackageType) {
        "devDependencies" { $source = $json.devDependencies }
        "dependencies" { $source = $json.dependencies }
        "optionalDependencies" { $source = $json.optionalDependencies }
        default { $source = $null }
    }

    if ($null -eq $source) {
        return ""
    }

    $value = $source.$PackageName
    if ($null -eq $value) {
        return ""
    }

    return "$value"
}

function Get-SupportedSemverPrefix {
    param([string]$DeclaredVersionSpec)

    if ([string]::IsNullOrWhiteSpace($DeclaredVersionSpec)) {
        return ""
    }
    if ($DeclaredVersionSpec.StartsWith("^")) {
        return "^"
    }
    if ($DeclaredVersionSpec.StartsWith("~")) {
        return "~"
    }
    return ""
}

function Apply-DeclaredSemverPrefix {
    param(
        [string]$WorkspacePath,
        [object]$Row,
        [string]$TargetVersion
    )

    if ([string]::IsNullOrWhiteSpace($TargetVersion)) {
        return $TargetVersion
    }
    if ($TargetVersion.StartsWith("^") -or $TargetVersion.StartsWith("~")) {
        return $TargetVersion
    }

    $declaredSpec = Get-DeclaredDependencySpec -WorkspacePath $WorkspacePath -PackageType "$($Row.PackageType)" -PackageName "$($Row.Package)"
    $prefix = Get-SupportedSemverPrefix -DeclaredVersionSpec $declaredSpec
    if ([string]::IsNullOrWhiteSpace($prefix)) {
        return $TargetVersion
    }

    if ($TargetVersion -match '^\d') {
        return "$prefix$TargetVersion"
    }

    return $TargetVersion
}

function Check-DevEnvironment {
    Step "[1/5] Ambiente de Desenvolvimento"

    if (Check-Command "node") {
        $nodeVersion = (node --version) -replace '^v', ''
        $nodeMajor = 0
        [void][int]::TryParse(($nodeVersion -split '\.')[0], [ref]$nodeMajor)
        if ($nodeMajor -ge 24) {
            Write-Host "  Node.js: v$nodeVersion [OK]" -ForegroundColor Green
        } else {
            Write-Host "  Node.js: v$nodeVersion [WARN] (recomendado: v24 LTS)" -ForegroundColor Yellow
            Write-Host "    Sugestao: nvm install 24; nvm use 24" -ForegroundColor Gray
        }
    } else {
        Write-Host "  Node.js: [ERROR] nao encontrado" -ForegroundColor Red
    }

    $pnpmVersion = ""
    try {
        $pnpmVersion = (& pnpm --version | Select-Object -First 1).Trim()
    } catch {
        $pnpmVersion = ""
    }

    if (-not [string]::IsNullOrWhiteSpace($pnpmVersion)) {
        $script:PnpmVersionCurrent = $pnpmVersion
        Write-Host "  pnpm: $pnpmVersion [OK]" -ForegroundColor Green

        if (Check-Command "npm") {
            $pnpmLatest = ""
            try {
                $pnpmLatest = (& npm view pnpm version --fetch-retries=0 --fetch-timeout=3000 2>$null | Select-Object -First 1).Trim()
            } catch {
                $pnpmLatest = ""
            }

            if (-not [string]::IsNullOrWhiteSpace($pnpmLatest)) {
                $script:PnpmVersionLatest = $pnpmLatest
                if ((Compare-Semver -Left $pnpmVersion -Right $pnpmLatest) -lt 0) {
                    Write-Host "    Update available: $pnpmVersion -> $pnpmLatest" -ForegroundColor Yellow
                    if (Check-Command "corepack") {
                        Write-Host "    To update: corepack use pnpm@$pnpmLatest" -ForegroundColor Gray
                    } else {
                        Write-Host "    Corepack nao encontrado no PATH." -ForegroundColor Yellow
                        Write-Host ('    To update (fallback sem root): npm install -g pnpm@{0} --prefix $HOME/.local' -f $pnpmLatest) -ForegroundColor Gray
                        Write-Host '    Se necessario, adicione ao PATH: $env:PATH="$HOME/.local/bin;$env:PATH"' -ForegroundColor Gray
                    }
                }
            }
        }
    } else {
        Write-Host "  pnpm: [ERROR] nao encontrado (nem via corepack/pnpmw)." -ForegroundColor Red
    }

    Show-ReleaseWorkflowPnpmPinStatus
    Maybe-OfferReleaseWorkflowPnpmPinUpdate
}

function Check-StackVersions {
    Step "`n[2/5] Stack Atual do Projeto"

    $rootPkg = Join-Path $POMODOROZ "package.json"
    $electron = Get-PackageJsonVersion -PackageJsonPath $rootPkg -DependencyName "electron"
    $react = Get-PackageJsonVersion -PackageJsonPath $rootPkg -DependencyName "react"
    $typescript = Get-PackageJsonVersion -PackageJsonPath $rootPkg -DependencyName "typescript"

    Write-Host "  Electron (root): $electron"
    Write-Host "  React (root/src): $react"
    Write-Host "  TypeScript (root): $typescript"
}

function Check-FrameworkInventory {
    Step "`n[3/5] Inventario de Frameworks e Ferramentas"

    $rootPkg = Join-Path $POMODOROZ "package.json"
    Write-Host "  [Renderer]"
    Write-Host "    react: $(Get-PackageJsonVersion $rootPkg 'react')"
    Write-Host "    react-dom: $(Get-PackageJsonVersion $rootPkg 'react-dom')"
    Write-Host "    react-router: $(Get-PackageJsonVersion $rootPkg 'react-router')"
    Write-Host "    react-router-dom: $(Get-PackageJsonVersion $rootPkg 'react-router-dom')"
    Write-Host "    @reduxjs/toolkit: $(Get-PackageJsonVersion $rootPkg '@reduxjs/toolkit')"
    Write-Host "    styled-components: $(Get-PackageJsonVersion $rootPkg 'styled-components')"
    Write-Host "    i18next: $(Get-PackageJsonVersion $rootPkg 'i18next')"
    Write-Host "    @dnd-kit/sortable: $(Get-PackageJsonVersion $rootPkg '@dnd-kit/sortable')"
    Write-Host "    @dnd-kit/core: $(Get-PackageJsonVersion $rootPkg '@dnd-kit/core')"
    Write-Host "    vite: $(Get-PackageJsonVersion $rootPkg 'vite')"
    Write-Host "    @vitejs/plugin-react: $(Get-PackageJsonVersion $rootPkg '@vitejs/plugin-react')"

    Write-Host "  [Electron]"
    Write-Host "    electron: $(Get-PackageJsonVersion $rootPkg 'electron')"
    Write-Host "    electron-builder: $(Get-PackageJsonVersion $rootPkg 'electron-builder')"
    Write-Host "    electron-updater: $(Get-PackageJsonVersion $rootPkg 'electron-updater')"
    Write-Host "    electron-store: $(Get-PackageJsonVersion $rootPkg 'electron-store')"

    Write-Host "  [Monorepo/Tooling]"
    Write-Host "    typescript: $(Get-PackageJsonVersion $rootPkg 'typescript')"
    Write-Host "    prettier: $(Get-PackageJsonVersion $rootPkg 'prettier')"

    $rootJson = Get-PackageJson -Path $rootPkg
    $devAppScript = "n/a"
    if ($null -ne $rootJson -and $null -ne $rootJson.scripts -and $null -ne $rootJson.scripts.'dev:app') {
        $devAppScript = "$($rootJson.scripts.'dev:app')"
    }

    Write-Host "  [Fluxo Atual]"
    Write-Host "    dev:app: $devAppScript"
    if ($null -ne $rootJson -and $null -ne $rootJson.scripts -and $null -ne $rootJson.scripts.'dev:app:vite') {
        Write-Host "    Vite no fluxo principal: ativo" -ForegroundColor Green
    } else {
        Write-Host "    Vite no fluxo principal: nao detectado" -ForegroundColor Yellow
    }
}

function Get-WorkspaceOutdatedRows {
    param(
        [string]$WorkspaceName,
        [string]$WorkspacePath
    )

    $rows = @()
    $pkgJson = Join-Path $WorkspacePath "package.json"
    if (-not (Test-Path $pkgJson)) {
        return $rows
    }

    Write-Host "  - Checando [$WorkspaceName]..."

    Push-Location $WorkspacePath
    try {
        $rawLines = pnpm outdated --format json 2>&1
        $status = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($status -gt 1) {
        $script:OutdatedCheckFailed = $true
        Write-Host "  [WARN] [$WorkspaceName] falha ao consultar updates (rede/registry)." -ForegroundColor Yellow
        return $rows
    }

    $rawText = (($rawLines | ForEach-Object { "$_" }) -join "`n").Trim()
    if ($rawText -match "ERR_PNPM") {
        $script:OutdatedCheckFailed = $true
        $preview = ($rawText -split "`n" | Select-Object -First 4) -join " "
        if ([string]::IsNullOrWhiteSpace($preview)) {
            Write-Host "  [WARN] [$WorkspaceName] falha ao consultar updates (erro retornado pelo pnpm)." -ForegroundColor Yellow
        } else {
            Write-Host "  [WARN] [$WorkspaceName] falha ao consultar updates: $preview" -ForegroundColor Yellow
        }
        return $rows
    }

    if ([string]::IsNullOrWhiteSpace($rawText)) {
        if ($status -eq 1) {
            $script:OutdatedCheckFailed = $true
            Write-Host "  [WARN] [$WorkspaceName] resultado inconclusivo: pnpm retornou status 1, mas sem payload JSON." -ForegroundColor Yellow
        }
        return $rows
    }

    $parsed = $null
    try {
        $parsed = $rawText | ConvertFrom-Json
    } catch {
        if ($status -eq 1) {
            $script:OutdatedCheckFailed = $true
            Write-Host "  [WARN] [$WorkspaceName] resultado inconclusivo: pnpm retornou status 1, mas o JSON nao foi parseado." -ForegroundColor Yellow
        }
        return $rows
    }

    $rowsList = New-Object 'System.Collections.Generic.List[object]'

    function Get-EntryFieldValue {
        param(
            [object]$Entry,
            [string[]]$FieldNames
        )

        foreach ($fieldName in $FieldNames) {
            if ([string]::IsNullOrWhiteSpace($fieldName)) {
                continue
            }

            if ($Entry -is [System.Collections.IDictionary]) {
                if ($Entry.Contains($fieldName)) {
                    $value = $Entry[$fieldName]
                    if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace("$value")) {
                        return "$value"
                    }
                }
            }

            if ($null -ne $Entry.PSObject) {
                $prop = $Entry.PSObject.Properties[$fieldName]
                if ($null -ne $prop) {
                    $value = $prop.Value
                    if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace("$value")) {
                        return "$value"
                    }
                }
            }
        }

        return ""
    }

    function Add-RowFromEntry {
        param(
            [string]$FallbackPackageName,
            [object]$Entry
        )

        if ($null -eq $Entry) {
            return
        }

        $package = Get-EntryFieldValue -Entry $Entry -FieldNames @("name", "package")
        if ([string]::IsNullOrWhiteSpace($package)) {
            $package = $FallbackPackageName
        }
        if ([string]::IsNullOrWhiteSpace($package)) {
            return
        }

        $workspace = $WorkspaceName
        $workspaceRaw = Get-EntryFieldValue -Entry $Entry -FieldNames @("workspace", "project", "location")
        if (-not [string]::IsNullOrWhiteSpace($workspaceRaw)) {
            $candidateWorkspace = Normalize-WorkspaceName -WorkspaceName $workspaceRaw
            $workspaceExists = $Workspaces | Where-Object { $_.Name -eq $candidateWorkspace } | Select-Object -First 1
            if ($null -ne $workspaceExists) {
                $workspace = $candidateWorkspace
            } else {
                return
            }
        }

        $current = Get-EntryFieldValue -Entry $Entry -FieldNames @("current")
        $wanted = Get-EntryFieldValue -Entry $Entry -FieldNames @("wanted")
        $latest = Get-EntryFieldValue -Entry $Entry -FieldNames @("latest")
        $packageType = Get-EntryFieldValue -Entry $Entry -FieldNames @("dependencyType", "packageType", "type")

        $dedupeKey = "$workspace`t$package`t$current`t$wanted`t$latest`t$packageType"
        if ($script:OutdatedSeen.Contains($dedupeKey)) {
            return
        }
        [void]$script:OutdatedSeen.Add($dedupeKey)

        $item = [PSCustomObject]@{
            Workspace   = $workspace
            Package     = $package
            Current     = $current
            Wanted      = $wanted
            Latest      = $latest
            PackageType = $packageType
        }
        $item | Add-Member -NotePropertyName "IsMajor" -NotePropertyValue (Is-MajorUpdate -Current $item.Current -Latest $item.Latest)
        [void]$rowsList.Add($item)
    }

    if ($parsed -is [System.Collections.IDictionary]) {
        foreach ($entry in $parsed.GetEnumerator()) {
            Add-RowFromEntry -FallbackPackageName "$($entry.Key)" -Entry $entry.Value
        }
    } elseif ($null -ne $parsed.PSObject -and $null -ne $parsed.PSObject.Properties["packages"] -and $parsed.packages -is [System.Collections.IEnumerable] -and -not ($parsed.packages -is [string])) {
        foreach ($entry in $parsed.packages) {
            Add-RowFromEntry -FallbackPackageName "" -Entry $entry
        }
    } elseif ($parsed -is [PSCustomObject]) {
        foreach ($property in $parsed.PSObject.Properties) {
            Add-RowFromEntry -FallbackPackageName "$($property.Name)" -Entry $property.Value
        }
    } elseif ($parsed -is [System.Collections.IEnumerable] -and -not ($parsed -is [string])) {
        foreach ($entry in $parsed) {
            Add-RowFromEntry -FallbackPackageName "" -Entry $entry
        }
    }

    $rows = $rowsList.ToArray()

    if ($status -eq 1 -and $rows.Count -eq 0) {
        $script:OutdatedCheckFailed = $true
        Write-Host "  [WARN] [$WorkspaceName] resultado inconclusivo: pnpm retornou status 1, mas nao foi possivel montar a tabela de updates." -ForegroundColor Yellow
    }

    return $rows
}

function Show-OutdatedTable {
    param([object[]]$Rows)

    if (-not $Rows -or $Rows.Count -eq 0) {
        if ($script:OutdatedCheckFailed) {
            Write-Host "  [WARN] Resultado inconclusivo: houve falha ao consultar o registry em um ou mais workspaces." -ForegroundColor Yellow
        } else {
            Write-Host "  Nenhuma dependencia desatualizada encontrada." -ForegroundColor Green
        }
        return
    }

    $Rows |
        Sort-Object Workspace, Package |
        Format-Table `
            @{ Label = "Workspace"; Expression = { $_.Workspace } }, `
            @{ Label = "Pacote"; Expression = { $_.Package } }, `
            @{ Label = "Atual"; Expression = { $_.Current } }, `
            @{ Label = "Wanted"; Expression = { $_.Wanted } }, `
            @{ Label = "Latest"; Expression = { $_.Latest } }, `
            @{ Label = "Tipo"; Expression = { $_.PackageType } } `
            -AutoSize
}

function Select-UpdateRows {
    param(
        [object[]]$Rows,
        [string]$Prompt
    )

    if (-not $Rows -or $Rows.Count -eq 0) {
        return @()
    }

    Write-Host $Prompt -ForegroundColor Yellow
    for ($i = 0; $i -lt $Rows.Count; $i++) {
        $r = $Rows[$i]
        Write-Host ("  {0}) [{1}] {2} ({3} -> {4})" -f ($i + 1), $r.Workspace, $r.Package, $r.Current, $r.Latest)
    }
    Write-Host "  0) Nenhum"

    $input = Read-Host "Selecione (ex.: 1 3 4)"
    if ([string]::IsNullOrWhiteSpace($input)) {
        return @()
    }

    $selected = @()
    foreach ($token in ($input -split '\s+')) {
        if ($token -match '^\d+$') {
            $idx = [int]$token - 1
            if ($idx -ge 0 -and $idx -lt $Rows.Count) {
                $selected += $Rows[$idx]
            }
        }
    }
    return $selected
}

function Get-TargetVersion {
    param(
        [object]$Row,
        [switch]$UseLatest
    )

    if ($UseLatest) {
        return "$($Row.Latest)"
    }

    if (-not [string]::IsNullOrWhiteSpace($Row.Wanted) -and $Row.Wanted -ne $Row.Current) {
        return "$($Row.Wanted)"
    }

    if (-not [string]::IsNullOrWhiteSpace($Row.Latest)) {
        return "$($Row.Latest)"
    }

    return ""
}

function Invoke-WorkspaceTypedUpdate {
    param(
        [object]$Row,
        [string]$TargetVersion,
        [switch]$Exact
    )

    switch ("$($Row.PackageType)") {
        "devDependencies" {
            if ($Exact) {
                Write-Host "  -> [$($row.Workspace)] pnpm add -D -E $($row.Package)@$TargetVersion"
                pnpm add -D -E "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] pnpm add -D $($row.Package)@$TargetVersion"
                pnpm add -D "$($row.Package)@$TargetVersion"
            }
            break
        }
        "dependencies" {
            if ($Exact) {
                Write-Host "  -> [$($row.Workspace)] pnpm add -E $($row.Package)@$TargetVersion"
                pnpm add -E "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] pnpm add $($row.Package)@$TargetVersion"
                pnpm add "$($row.Package)@$TargetVersion"
            }
            break
        }
        "optionalDependencies" {
            if ($Exact) {
                Write-Host "  -> [$($row.Workspace)] pnpm add -O -E $($row.Package)@$TargetVersion"
                pnpm add -O -E "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] pnpm add -O $($row.Package)@$TargetVersion"
                pnpm add -O "$($row.Package)@$TargetVersion"
            }
            break
        }
        default {
            if ($Exact) {
                Write-Host "  -> [$($row.Workspace)] tipo '$($row.PackageType)' sem suporte direto para -E; fallback: pnpm add -E $($row.Package)@$TargetVersion"
                pnpm add -E "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] tipo '$($row.PackageType)' sem suporte direto; fallback: pnpm add $($row.Package)@$TargetVersion"
                pnpm add "$($row.Package)@$TargetVersion"
            }
        }
    }
}

function Invoke-WorkspaceUpdate {
    param(
        [object[]]$Rows,
        [switch]$UseLatest
    )

    foreach ($row in $Rows) {
        $wsPath = ($Workspaces | Where-Object { $_.Name -eq $row.Workspace } | Select-Object -First 1).Path
        if (-not $wsPath) {
            Write-Host "  [WARN] Workspace desconhecido: $($row.Workspace)" -ForegroundColor Yellow
            continue
        }

        Push-Location $wsPath
        try {
            $targetVersion = Get-TargetVersion -Row $row -UseLatest:$UseLatest
            if ([string]::IsNullOrWhiteSpace($targetVersion)) {
                if ($UseLatest) {
                    Write-Host "  -> [$($row.Workspace)] sem target inferido; fallback: pnpm add $($row.Package)"
                    pnpm add $row.Package
                } else {
                    Write-Host "  -> [$($row.Workspace)] sem target inferido; fallback: pnpm add $($row.Package)"
                    pnpm add $row.Package
                }
                continue
            }

            $useExact = $false
            if ((-not $UseLatest) -and ($row.Current -eq $row.Wanted) -and ($row.Latest -ne $row.Current) -and (-not [string]::IsNullOrWhiteSpace($row.Latest))) {
                # Versao fixa detectada: manter semver exata.
                $targetVersion = "$($row.Latest)"
                $useExact = $true
            } elseif ($UseLatest -and (Should-PreserveExactVersion -PackageName "$($row.Package)")) {
                # Pacotes criticos devem permanecer com versao exata.
                $useExact = $true
            }

            if (-not $useExact) {
                $targetVersion = Apply-DeclaredSemverPrefix -WorkspacePath $wsPath -Row $row -TargetVersion $targetVersion
            }

            Invoke-WorkspaceTypedUpdate -Row $row -TargetVersion $targetVersion -Exact:$useExact
        } finally {
            Pop-Location
        }
    }
}

function Check-JsDependencies {
    Step "`n[4/5] Dependencias JS/TS (pnpm)"

    if (-not (Check-Command "node")) {
        Write-Host "  Node nao encontrado; nao foi possivel executar pnpm/pnpmw." -ForegroundColor Red
        return
    }
    $pnpmLock = Join-Path $POMODOROZ "pnpm-lock.yaml"
    if (-not (Test-Path $pnpmLock)) {
        Write-Host "  [WARN] pnpm-lock.yaml nao encontrado em $POMODOROZ." -ForegroundColor Yellow
        Write-Host ('    Execute: Set-Location "{0}"; pnpm install' -f $POMODOROZ) -ForegroundColor Yellow
        return
    }

    $rows = @()
    $script:OutdatedCheckFailed = $false
    $script:OutdatedSeen = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($ws in $Workspaces) {
        $rows += Get-WorkspaceOutdatedRows -WorkspaceName $ws.Name -WorkspacePath $ws.Path
    }

    Show-OutdatedTable -Rows $rows

    if ($Mode -eq "report") {
        if ($rows -and $rows.Count -gt 0) {
            Write-Host "  INFO: modo report nao aplica updates." -ForegroundColor Gray
            Write-Host "        Para selecionar/aplicar updates JS/TS: .\scripts\check-updates.ps1" -ForegroundColor Gray
        }
        return
    }
    if (-not $rows -or $rows.Count -eq 0) {
        return
    }

    $safeRows = @($rows | Where-Object { -not $_.IsMajor })
    $majorRows = @($rows | Where-Object { $_.IsMajor })

    $selectedSafe = Select-UpdateRows -Rows $safeRows -Prompt "Atualizacoes SEGURAS (patch/minor):"
    $selectedMajor = Select-UpdateRows -Rows $majorRows -Prompt "Atualizacoes MAJOR (podem quebrar):"

    if (($selectedSafe.Count + $selectedMajor.Count) -eq 0) {
        Write-Host "Nenhum pacote selecionado."
        return
    }

    $confirm = Read-Host "Aplicar updates selecionados agora? (s/N)"
    if ($confirm -notmatch '^[sS]$') {
        Write-Host "Atualizacao cancelada."
        return
    }

    if ($selectedSafe.Count -gt 0) {
        Write-Host "`nAplicando updates seguros..."
        Invoke-WorkspaceUpdate -Rows $selectedSafe
    }
    if ($selectedMajor.Count -gt 0) {
        Write-Host "`nAplicando updates major..."
        Invoke-WorkspaceUpdate -Rows $selectedMajor -UseLatest
    }

    Write-Host "`n[OK] Updates concluidos." -ForegroundColor Green
    Write-Host 'Recomendado:' -ForegroundColor Gray
    Write-Host ('  Set-Location "{0}"; pnpm build' -f $POMODOROZ) -ForegroundColor Gray
    Write-Host ('  Set-Location "{0}"; pnpm dev:app' -f $POMODOROZ) -ForegroundColor Gray
}

function Test-CargoSubcommand {
    param([string]$Subcommand)

    if (-not (Check-Command "cargo")) {
        return $false
    }

    & cargo $Subcommand --version *> $null
    return $LASTEXITCODE -eq 0
}

function Get-ObjectFieldText {
    param(
        [object]$Entry,
        [string[]]$FieldNames
    )

    if ($null -eq $Entry) {
        return "n/a"
    }

    foreach ($fieldName in $FieldNames) {
        if ([string]::IsNullOrWhiteSpace($fieldName)) {
            continue
        }

        if ($Entry -is [System.Collections.IDictionary] -and $Entry.Contains($fieldName)) {
            $value = $Entry[$fieldName]
            if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace("$value")) {
                return "$value"
            }
        }

        if ($null -ne $Entry.PSObject) {
            $prop = $Entry.PSObject.Properties[$fieldName]
            if ($null -ne $prop) {
                $value = $prop.Value
                if ($null -ne $value -and -not [string]::IsNullOrWhiteSpace("$value")) {
                    return "$value"
                }
            }
        }
    }

    return "n/a"
}

function Show-CargoOutdatedReportSummary {
    param([string]$RawJson)

    if ([string]::IsNullOrWhiteSpace($RawJson)) {
        Write-Host "  Nenhum update de crate root detectado."
        return
    }

    $data = $null
    try {
        $data = $RawJson | ConvertFrom-Json
    } catch {
        Write-Host "  [WARN] Nao foi possivel parsear a saida JSON de cargo outdated." -ForegroundColor Yellow
        return
    }

    $deps = @()
    if ($null -ne $data -and $null -ne $data.PSObject.Properties["dependencies"]) {
        $deps = @($data.dependencies)
    }

    if (-not $deps -or $deps.Count -eq 0) {
        Write-Host "  Nenhum update de crate root detectado."
        return
    }

    Write-Host "  Root crates com update disponivel:"
    Write-Host "  Crate                           Atual        Latest"
    foreach ($dep in $deps) {
        $name = Get-ObjectFieldText -Entry $dep -FieldNames @("name", "crate", "package")
        $current = Get-ObjectFieldText -Entry $dep -FieldNames @("project", "current", "version")
        $latest = Get-ObjectFieldText -Entry $dep -FieldNames @("latest", "newest", "target")
        $namePadded = $name.PadRight(31)
        $currentPadded = $current.PadRight(12)
        Write-Host "  $namePadded $currentPadded $latest"
    }
}

function Get-CargoOutdatedRootRowsFromJson {
    param([string]$RawJson)

    if ([string]::IsNullOrWhiteSpace($RawJson)) {
        return @()
    }

    $data = $null
    try {
        $data = $RawJson | ConvertFrom-Json
    } catch {
        return @()
    }

    $deps = @()
    if ($null -ne $data -and $null -ne $data.PSObject.Properties["dependencies"]) {
        $deps = @($data.dependencies)
    }
    if (-not $deps) {
        return @()
    }

    $rows = @()
    foreach ($dep in $deps) {
        $name = Get-ObjectFieldText -Entry $dep -FieldNames @("name", "crate", "package")
        if ($name -eq "n/a") {
            continue
        }
        $project = Get-ObjectFieldText -Entry $dep -FieldNames @("project", "current", "version")
        $compat = Get-ObjectFieldText -Entry $dep -FieldNames @("compat", "wanted", "compatible")
        $latest = Get-ObjectFieldText -Entry $dep -FieldNames @("latest", "newest", "target")
        $rows += [PSCustomObject]@{
            Name = $name
            Project = $project
            Compat = $compat
            Latest = $latest
        }
    }

    return $rows
}

function Invoke-RustRootUpdates {
    param(
        [object[]]$Rows,
        [string]$TauriDir
    )

    foreach ($row in $Rows) {
        $target = "$($row.Target)"
        if ([string]::IsNullOrWhiteSpace($row.Package) -or [string]::IsNullOrWhiteSpace($target)) {
            continue
        }

        Write-Host "  -> [$($row.Workspace)] cargo update -p $($row.Package) --precise $target"
        Push-Location $TauriDir
        try {
            & cargo update -p $row.Package --precise $target
            if ($LASTEXITCODE -eq 0) {
                Write-Host "     [OK] atualizado: $($row.Package) => $target" -ForegroundColor Green
            } else {
                Write-Host "     [WARN] falha ao aplicar automaticamente para $($row.Package) (target $target)." -ForegroundColor Yellow
                Write-Host ('       Dica: Set-Location "{0}"; cargo add "{1}@{2}"' -f $TauriDir, $row.Package, $target) -ForegroundColor Yellow
            }
        } finally {
            Pop-Location
        }
    }
}

function Maybe-OfferRustRootUpdates {
    param(
        [string]$OutdatedJson,
        [string]$TauriDir
    )

    if ($Mode -ne "interactive") {
        return
    }
    if ([string]::IsNullOrWhiteSpace($OutdatedJson)) {
        return
    }

    $rootRows = @(Get-CargoOutdatedRootRowsFromJson -RawJson $OutdatedJson)
    if (-not $rootRows -or $rootRows.Count -eq 0) {
        return
    }

    $safeCandidates = @()
    $majorCandidates = @()
    foreach ($item in $rootRows) {
        $name = "$($item.Name)"
        $project = "$($item.Project)"
        $compat = "$($item.Compat)"
        $latest = "$($item.Latest)"

        if (-not [string]::IsNullOrWhiteSpace($compat) -and $compat -ne "n/a" -and $compat -ne "Removed" -and $compat -ne $project) {
            if (-not (Is-MajorUpdate -Current $project -Latest $compat)) {
                $safeCandidates += [PSCustomObject]@{
                    Workspace = "src-tauri"
                    Package = $name
                    Current = $project
                    Wanted = $compat
                    Latest = $compat
                    PackageType = "cargo"
                    Target = $compat
                    UpdateKind = "safe"
                }
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($latest) -and $latest -ne "n/a" -and $latest -ne "Removed" -and $latest -ne $project) {
            if (Is-MajorUpdate -Current $project -Latest $latest) {
                $majorCandidates += [PSCustomObject]@{
                    Workspace = "src-tauri"
                    Package = $name
                    Current = $project
                    Wanted = $latest
                    Latest = $latest
                    PackageType = "cargo"
                    Target = $latest
                    UpdateKind = "major"
                }
            }
        }
    }

    $selectedSafe = @()
    $selectedMajor = @()
    if ($safeCandidates.Count -gt 0) {
        $selectedSafe = Select-UpdateRows -Rows $safeCandidates -Prompt "Atualizacoes Rust SEGURAS (root crates, patch/minor):"
    }
    if ($majorCandidates.Count -gt 0) {
        $selectedMajor = Select-UpdateRows -Rows $majorCandidates -Prompt "Atualizacoes Rust MAJOR (root crates, podem quebrar):"
    }

    if (($selectedSafe.Count + $selectedMajor.Count) -eq 0) {
        if (($safeCandidates.Count + $majorCandidates.Count) -eq 0) {
            Write-Host "  Nenhum update Rust root elegivel para selecao automatica."
        } else {
            Write-Host "Nenhum pacote selecionado."
        }
        return
    }

    $confirm = Read-Host "Aplicar updates Rust selecionados agora? (s/N)"
    if ($confirm -notmatch '^[sS]$') {
        Write-Host "Atualizacao Rust cancelada."
        return
    }

    if ($selectedSafe.Count -gt 0) {
        Write-Host "`nAplicando updates Rust seguros..."
        Invoke-RustRootUpdates -Rows $selectedSafe -TauriDir $TauriDir
    }
    if ($selectedMajor.Count -gt 0) {
        Write-Host "`nAplicando updates Rust major..."
        Invoke-RustRootUpdates -Rows $selectedMajor -TauriDir $TauriDir
    }

    Write-Host "  Recomendado apos updates Rust:"
    Write-Host ('    Set-Location "{0}"; cargo check' -f $TauriDir)
}

function Add-CargoAdvisoryRows {
    param(
        [System.Collections.Generic.List[object]]$Rows,
        [string]$Kind,
        [object[]]$Items
    )

    if (-not $Items) {
        return
    }

    foreach ($item in $Items) {
        $advisory = $null
        $package = $null
        if ($null -ne $item.PSObject.Properties["advisory"]) {
            $advisory = $item.advisory
        }
        if ($null -ne $item.PSObject.Properties["package"]) {
            $package = $item.package
        }

        $id = Get-ObjectFieldText -Entry $advisory -FieldNames @("id")
        $name = Get-ObjectFieldText -Entry $package -FieldNames @("name")
        if ($name -eq "n/a") {
            $name = Get-ObjectFieldText -Entry $advisory -FieldNames @("package")
        }
        $version = Get-ObjectFieldText -Entry $package -FieldNames @("version")

        $Rows.Add([PSCustomObject]@{
            Kind = $Kind
            Id = $id
            Name = $name
            Version = $version
        }) | Out-Null
    }
}

function Show-CargoAuditReportSummary {
    param([string]$RawJson)

    if ([string]::IsNullOrWhiteSpace($RawJson)) {
        Write-Host "  [WARN] cargo audit sem saida." -ForegroundColor Yellow
        return
    }

    $data = $null
    try {
        $data = $RawJson | ConvertFrom-Json
    } catch {
        Write-Host "  [WARN] Nao foi possivel parsear a saida JSON de cargo audit." -ForegroundColor Yellow
        return
    }

    $vulnList = @()
    if ($null -ne $data.vulnerabilities -and $null -ne $data.vulnerabilities.PSObject.Properties["list"]) {
        $vulnList = @($data.vulnerabilities.list)
    }

    $vulnCount = $vulnList.Count
    if ($null -ne $data.vulnerabilities -and $null -ne $data.vulnerabilities.PSObject.Properties["count"] -and "$($data.vulnerabilities.count)" -match '^\d+$') {
        $vulnCount = [int]$data.vulnerabilities.count
    }

    $warnings = $data.warnings
    $unmaintained = @()
    $unsound = @()
    $yanked = @()
    $notice = @()
    if ($null -ne $warnings) {
        if ($null -ne $warnings.PSObject.Properties["unmaintained"]) { $unmaintained = @($warnings.unmaintained) }
        if ($null -ne $warnings.PSObject.Properties["unsound"]) { $unsound = @($warnings.unsound) }
        if ($null -ne $warnings.PSObject.Properties["yanked"]) { $yanked = @($warnings.yanked) }
        if ($null -ne $warnings.PSObject.Properties["notice"]) { $notice = @($warnings.notice) }
    }

    Write-Host "  Vulnerabilities: $vulnCount"
    Write-Host ("  Warnings: unmaintained={0}, unsound={1}, yanked={2}, notice={3}" -f $unmaintained.Count, $unsound.Count, $yanked.Count, $notice.Count)

    $allRows = New-Object 'System.Collections.Generic.List[object]'
    Add-CargoAdvisoryRows -Rows $allRows -Kind "vuln" -Items $vulnList
    Add-CargoAdvisoryRows -Rows $allRows -Kind "unsound" -Items $unsound
    Add-CargoAdvisoryRows -Rows $allRows -Kind "unmaintained" -Items $unmaintained
    Add-CargoAdvisoryRows -Rows $allRows -Kind "yanked" -Items $yanked
    Add-CargoAdvisoryRows -Rows $allRows -Kind "notice" -Items $notice

    $unique = @()
    $seen = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($row in $allRows) {
        $key = "$($row.Kind)|$($row.Id)|$($row.Name)|$($row.Version)"
        if ($seen.Contains($key)) {
            continue
        }
        [void]$seen.Add($key)
        $unique += $row
    }

    if (-not $unique -or $unique.Count -eq 0) {
        return
    }

    Write-Host "  Advisories (resumo):"
    $limit = [Math]::Min(20, $unique.Count)
    for ($i = 0; $i -lt $limit; $i++) {
        $item = $unique[$i]
        Write-Host "  - [$($item.Kind)] $($item.Id) :: $($item.Name)@$($item.Version)"
    }
    if ($unique.Count -gt 20) {
        Write-Host "  ... (+$($unique.Count - 20) itens; use cargo audit para detalhes completos)"
    }
}

function Check-RustDependencies {
    Step "`n[5/5] Dependencias Rust (Cargo)"

    if (-not (Check-Command "cargo")) {
        Write-Host "  Cargo nao encontrado." -ForegroundColor Red
        return
    }

    $tauriDir = Join-Path $POMODOROZ "src-tauri"
    $cargoToml = Join-Path $tauriDir "Cargo.toml"
    if (-not (Test-Path $cargoToml)) {
        Write-Host "  src-tauri/Cargo.toml nao encontrado; pulando verificacao Rust." -ForegroundColor Yellow
        return
    }

    Write-Host "  - Workspace Rust: $tauriDir"
    $writeCargoLogs = ($Mode -ne "report" -and $script:LogModeSelection -ne "none")
    $outdatedLog = ""
    $auditLog = ""
    $outdatedJsonForSelection = ""
    if ($writeCargoLogs) {
        $logsDir = Join-Path $POMODOROZ "logs"
        if (-not (Test-Path $logsDir)) {
            [void](New-Item -ItemType Directory -Path $logsDir -Force)
        }
        $logStamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $outdatedLog = Join-Path $logsDir "check-updates-cargo-outdated-$logStamp.log"
        $auditLog = Join-Path $logsDir "check-updates-cargo-audit-$logStamp.log"
        $script:CargoOutdatedLogFile = $outdatedLog
        $script:CargoAuditLogFile = $auditLog
    }

    if ($Mode -eq "report") {
        if (Test-CargoSubcommand "outdated") {
            Write-Host "  - Checando crates desatualizados (cargo outdated --root-deps-only --format json)..."
            Push-Location $tauriDir
            try {
                $outdatedJson = (& cargo outdated --root-deps-only --format json 2>$null | Out-String).Trim()
                if ($LASTEXITCODE -eq 0) {
                    Show-CargoOutdatedReportSummary -RawJson $outdatedJson
                } else {
                    Write-Host "  [WARN] Falha ao executar cargo outdated em modo resumo." -ForegroundColor Yellow
                    Write-Host "    Dica: verifique rede/crates.io e lock do cache Cargo." -ForegroundColor Yellow
                }
            } finally {
                Pop-Location
            }
        } else {
            Write-Host "  [WARN] cargo-outdated nao instalado." -ForegroundColor Yellow
            Write-Host "    Instale com: cargo install cargo-outdated" -ForegroundColor Yellow
        }

        if (Test-CargoSubcommand "audit") {
            Write-Host "  - Checando vulnerabilidades (cargo audit --json --no-fetch)..."
            Push-Location $tauriDir
            try {
                $auditJson = (& cargo audit --json --no-fetch 2>$null | Out-String).Trim()
                if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($auditJson)) {
                    Show-CargoAuditReportSummary -RawJson $auditJson
                } else {
                    Write-Host "  [WARN] Falha ao executar cargo audit em modo resumo." -ForegroundColor Yellow
                    Write-Host "    Dica: verifique lock do advisory-db em ~/.cargo." -ForegroundColor Yellow
                    Write-Host ('    Dica: Set-Location "{0}"; cargo audit' -f $tauriDir) -ForegroundColor Yellow
                }
            } finally {
                Pop-Location
            }
        } else {
            Write-Host "  [WARN] cargo-audit nao instalado." -ForegroundColor Yellow
            Write-Host "    Instale com: cargo install cargo-audit" -ForegroundColor Yellow
        }

        Write-Host "  Atualizacao manual recomendada:"
        Write-Host ('    Set-Location "{0}"; cargo outdated --root-deps-only' -f $tauriDir)
        Write-Host ('    Set-Location "{0}"; cargo audit' -f $tauriDir)
        Write-Host ('    Set-Location "{0}"; cargo add <crate>@<versao>' -f $tauriDir)
        Write-Host ('    Set-Location "{0}"; cargo update -p <crate> --precise <versao>' -f $tauriDir)
        Write-Host ('    Set-Location "{0}"; cargo check' -f $tauriDir)
        return
    }

    if (Test-CargoSubcommand "outdated") {
        $outdatedJson = ""
        $outdatedJsonStatus = 0

        if ($writeCargoLogs) {
            Write-Host "  - Checando crates desatualizados (resumo + log)..."
            $outdatedLogStatus = 0
            $outdatedLogMode = "full"
            Push-Location $tauriDir
            try {
                $outdatedJson = (& cargo outdated --root-deps-only --format json 2>$null | Out-String).Trim()
                $outdatedJsonStatus = $LASTEXITCODE

                & cargo outdated *> $outdatedLog
                $outdatedLogStatus = $LASTEXITCODE
                if ($outdatedLogStatus -ne 0) {
                    & cargo outdated --root-deps-only --format json *> $outdatedLog
                    $outdatedLogStatus = $LASTEXITCODE
                    if ($outdatedLogStatus -eq 0) {
                        $outdatedLogMode = "fallback"
                    }
                }
            } finally {
                Pop-Location
            }

            if ($outdatedJsonStatus -eq 0) {
                Show-CargoOutdatedReportSummary -RawJson $outdatedJson
                $outdatedJsonForSelection = $outdatedJson
            } else {
                Write-Host "  [WARN] Falha ao executar resumo de cargo outdated." -ForegroundColor Yellow
                Write-Host "    Dica: verifique rede/crates.io e lock do cache Cargo." -ForegroundColor Yellow
            }

            if ($outdatedLogStatus -eq 0) {
                if ($outdatedLogMode -eq "fallback") {
                    Write-Host "  Detalhes (modo fallback root-deps-only): $outdatedLog" -ForegroundColor Gray
                } else {
                    Write-Host "  Detalhes completos: $outdatedLog" -ForegroundColor Gray
                }
            } elseif ((Test-Path $outdatedLog) -and ((Get-Item $outdatedLog).Length -gt 0)) {
                Write-Host "  Detalhes (com erro de execucao): $outdatedLog" -ForegroundColor Yellow
            } else {
                Write-Host "  [WARN] Falha ao gerar log completo de cargo outdated." -ForegroundColor Yellow
                Write-Host "    Verifique: $outdatedLog" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  - Checando crates desatualizados (resumo)..."
            Push-Location $tauriDir
            try {
                $outdatedJson = (& cargo outdated --root-deps-only --format json 2>$null | Out-String).Trim()
                $outdatedJsonStatus = $LASTEXITCODE
            } finally {
                Pop-Location
            }

            if ($outdatedJsonStatus -eq 0) {
                Show-CargoOutdatedReportSummary -RawJson $outdatedJson
                $outdatedJsonForSelection = $outdatedJson
            } else {
                Write-Host "  [WARN] Falha ao executar resumo de cargo outdated." -ForegroundColor Yellow
                Write-Host "    Dica: verifique rede/crates.io e lock do cache Cargo." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  [WARN] cargo-outdated nao instalado." -ForegroundColor Yellow
        Write-Host "    Instale com: cargo install cargo-outdated" -ForegroundColor Yellow
    }

    if (Test-CargoSubcommand "audit") {
        $auditJson = ""
        $auditJsonStatus = 0

        if ($writeCargoLogs) {
            Write-Host "  - Checando vulnerabilidades (resumo + log)..."
            $auditLogStatus = 0
            $auditLogMode = "full"
            Push-Location $tauriDir
            try {
                $auditJson = (& cargo audit --json --no-fetch 2>$null | Out-String).Trim()
                $auditJsonStatus = $LASTEXITCODE

                & cargo audit *> $auditLog
                $auditLogStatus = $LASTEXITCODE
                if ($auditLogStatus -ne 0) {
                    & cargo audit --json --no-fetch *> $auditLog
                    $auditLogStatus = $LASTEXITCODE
                    if ($auditLogStatus -eq 0) {
                        $auditLogMode = "fallback"
                    }
                }
            } finally {
                Pop-Location
            }

            if ($auditJsonStatus -eq 0 -and -not [string]::IsNullOrWhiteSpace($auditJson)) {
                Show-CargoAuditReportSummary -RawJson $auditJson
            } else {
                Write-Host "  [WARN] Falha ao executar resumo de cargo audit." -ForegroundColor Yellow
                Write-Host "    Dica: verifique lock do advisory-db em ~/.cargo." -ForegroundColor Yellow
                Write-Host ('    Dica: Set-Location "{0}"; cargo audit' -f $tauriDir) -ForegroundColor Yellow
            }

            if ($auditLogStatus -eq 0) {
                if ($auditLogMode -eq "fallback") {
                    Write-Host "  Detalhes (modo fallback --no-fetch): $auditLog" -ForegroundColor Gray
                } else {
                    Write-Host "  Detalhes completos: $auditLog" -ForegroundColor Gray
                }
            } elseif ((Test-Path $auditLog) -and ((Get-Item $auditLog).Length -gt 0)) {
                Write-Host "  Detalhes (com erro de execucao): $auditLog" -ForegroundColor Yellow
            } else {
                Write-Host "  [WARN] Falha ao gerar log completo de cargo audit." -ForegroundColor Yellow
                Write-Host "    Verifique: $auditLog" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  - Checando vulnerabilidades (resumo)..."
            Push-Location $tauriDir
            try {
                $auditJson = (& cargo audit --json --no-fetch 2>$null | Out-String).Trim()
                $auditJsonStatus = $LASTEXITCODE
            } finally {
                Pop-Location
            }

            if ($auditJsonStatus -eq 0 -and -not [string]::IsNullOrWhiteSpace($auditJson)) {
                Show-CargoAuditReportSummary -RawJson $auditJson
            } else {
                Write-Host "  [WARN] Falha ao executar resumo de cargo audit." -ForegroundColor Yellow
                Write-Host "    Dica: verifique lock do advisory-db em ~/.cargo." -ForegroundColor Yellow
                Write-Host ('    Dica: Set-Location "{0}"; cargo audit' -f $tauriDir) -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  [WARN] cargo-audit nao instalado." -ForegroundColor Yellow
        Write-Host "    Instale com: cargo install cargo-audit" -ForegroundColor Yellow
    }

    Maybe-OfferRustRootUpdates -OutdatedJson $outdatedJsonForSelection -TauriDir $tauriDir

    Write-Host "  Atualizacao manual recomendada:"
    Write-Host ('    Set-Location "{0}"; cargo add <crate>@<versao>' -f $tauriDir)
    Write-Host ('    Set-Location "{0}"; cargo update -p <crate> --precise <versao>' -f $tauriDir)
    Write-Host ('    Set-Location "{0}"; cargo check' -f $tauriDir)
}

if ($PSBoundParameters.Count -eq 0 -and [Environment]::UserInteractive -and $Mode -eq "interactive") {
    Show-LogMenu
}

Initialize-Logging

try {
    Print-Header
    Check-DevEnvironment
    Check-StackVersions
    Check-FrameworkInventory
    Check-JsDependencies
    Check-RustDependencies
    Show-GeneratedLogs
    Write-Host "`nOK: Verificacao concluida!" -ForegroundColor Green
} finally {
    Stop-CheckUpdatesTranscript
}
