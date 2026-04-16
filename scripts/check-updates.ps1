# Pomodoroz - Verificador de Updates (Windows PowerShell)
#
# Uso:
#   .\scripts\check-updates.ps1              # Modo interativo (padrao)
#   .\scripts\check-updates.ps1 report       # Modo relatorio (sem interacao)

param(
    [Parameter(Position = 0)]
    [ValidateSet("interactive", "report")]
    [string]$Mode = "interactive"
)

$ErrorActionPreference = "Continue"

$ROOT = Split-Path -Parent $PSScriptRoot
$POMODOROZ = $ROOT

$Workspaces = @(
    @{ Name = "root"; Path = $POMODOROZ },
    @{ Name = "app/electron"; Path = (Join-Path $POMODOROZ "app/electron") },
    @{ Name = "app/renderer"; Path = (Join-Path $POMODOROZ "app/renderer") },
    @{ Name = "app/shareables"; Path = (Join-Path $POMODOROZ "app/shareables") }
)

$script:OutdatedCheckFailed = $false
$script:OutdatedSeen = [System.Collections.Generic.HashSet[string]]::new()
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
    return $LASTEXITCODE
}

function pnpm {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    [void](Invoke-PnpmWrapper @Args)
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

function Normalize-WorkspaceName {
    param([string]$WorkspaceName)

    switch ($WorkspaceName) {
        "" { return "root" }
        "root" { return "root" }
        "pomodoroz" { return "app/electron" }
        "@pomodoroz/renderer" { return "app/renderer" }
        "@pomodoroz/shareables" { return "app/shareables" }
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
        Write-Host "  pnpm: $pnpmVersion [OK]" -ForegroundColor Green

        if (Check-Command "npm") {
            $pnpmLatest = ""
            try {
                $pnpmLatest = (& npm view pnpm version --fetch-retries=0 --fetch-timeout=3000 2>$null | Select-Object -First 1).Trim()
            } catch {
                $pnpmLatest = ""
            }

            if (-not [string]::IsNullOrWhiteSpace($pnpmLatest)) {
                if ((Compare-Semver -Left $pnpmVersion -Right $pnpmLatest) -lt 0) {
                    Write-Host "    Update available: $pnpmVersion -> $pnpmLatest" -ForegroundColor Yellow
                    Write-Host "    To update: corepack use pnpm@$pnpmLatest" -ForegroundColor Gray
                }
            }
        }
    } else {
        Write-Host "  pnpm: [ERROR] nao encontrado (nem via corepack/pnpmw)." -ForegroundColor Red
    }
}

function Check-StackVersions {
    Step "`n[2/5] Stack Atual do Projeto"

    $rootPkg = Join-Path $POMODOROZ "package.json"
    $rendererPkg = Join-Path $POMODOROZ "app/renderer/package.json"
    $electronPkg = Join-Path $POMODOROZ "app/electron/package.json"

    $electron = Get-PackageJsonVersion -PackageJsonPath $electronPkg -DependencyName "electron"
    $react = Get-PackageJsonVersion -PackageJsonPath $rendererPkg -DependencyName "react"
    $typescript = Get-PackageJsonVersion -PackageJsonPath $rootPkg -DependencyName "typescript"

    Write-Host "  Electron (app/electron): $electron"
    Write-Host "  React (app/renderer): $react"
    Write-Host "  TypeScript (root): $typescript"
}

function Check-FrameworkInventory {
    Step "`n[3/5] Inventario de Frameworks e Ferramentas"

    $rootPkg = Join-Path $POMODOROZ "package.json"
    $rendererPkg = Join-Path $POMODOROZ "app/renderer/package.json"
    $electronPkg = Join-Path $POMODOROZ "app/electron/package.json"

    Write-Host "  [Renderer]"
    Write-Host "    react: $(Get-PackageJsonVersion $rendererPkg 'react')"
    Write-Host "    react-dom: $(Get-PackageJsonVersion $rendererPkg 'react-dom')"
    Write-Host "    react-router: $(Get-PackageJsonVersion $rendererPkg 'react-router')"
    Write-Host "    react-router-dom: $(Get-PackageJsonVersion $rendererPkg 'react-router-dom')"
    Write-Host "    @reduxjs/toolkit: $(Get-PackageJsonVersion $rendererPkg '@reduxjs/toolkit')"
    Write-Host "    styled-components: $(Get-PackageJsonVersion $rendererPkg 'styled-components')"
    Write-Host "    i18next: $(Get-PackageJsonVersion $rendererPkg 'i18next')"
    Write-Host "    @dnd-kit/sortable: $(Get-PackageJsonVersion $rendererPkg '@dnd-kit/sortable')"
    Write-Host "    @dnd-kit/core: $(Get-PackageJsonVersion $rendererPkg '@dnd-kit/core')"
    Write-Host "    vite: $(Get-PackageJsonVersion $rendererPkg 'vite')"
    Write-Host "    @vitejs/plugin-react: $(Get-PackageJsonVersion $rendererPkg '@vitejs/plugin-react')"

    Write-Host "  [Electron]"
    Write-Host "    electron: $(Get-PackageJsonVersion $electronPkg 'electron')"
    Write-Host "    electron-builder: $(Get-PackageJsonVersion $electronPkg 'electron-builder')"
    Write-Host "    electron-updater: $(Get-PackageJsonVersion $electronPkg 'electron-updater')"
    Write-Host "    electron-store: $(Get-PackageJsonVersion $electronPkg 'electron-store')"

    Write-Host "  [Monorepo/Tooling]"
    Write-Host "    lerna: $(Get-PackageJsonVersion $rootPkg 'lerna')"
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

    function Add-RowFromEntry {
        param(
            [string]$FallbackPackageName,
            [object]$Entry
        )

        if ($null -eq $Entry) {
            return
        }

        $package = "$($Entry.name)"
        if ([string]::IsNullOrWhiteSpace($package)) {
            $package = "$($Entry.package)"
        }
        if ([string]::IsNullOrWhiteSpace($package)) {
            $package = $FallbackPackageName
        }
        if ([string]::IsNullOrWhiteSpace($package)) {
            return
        }

        $workspace = $WorkspaceName
        $workspaceRaw = "$($Entry.workspace)"
        if ([string]::IsNullOrWhiteSpace($workspaceRaw)) {
            $workspaceRaw = "$($Entry.project)"
        }
        if ([string]::IsNullOrWhiteSpace($workspaceRaw)) {
            $workspaceRaw = "$($Entry.location)"
        }
        if (-not [string]::IsNullOrWhiteSpace($workspaceRaw)) {
            $candidateWorkspace = Normalize-WorkspaceName -WorkspaceName $workspaceRaw
            $workspaceExists = $Workspaces | Where-Object { $_.Name -eq $candidateWorkspace } | Select-Object -First 1
            if ($null -ne $workspaceExists) {
                $workspace = $candidateWorkspace
            }
        }

        $current = "$($Entry.current)"
        $wanted = "$($Entry.wanted)"
        $latest = "$($Entry.latest)"
        $packageType = "$($Entry.dependencyType)"
        if ([string]::IsNullOrWhiteSpace($packageType)) {
            $packageType = "$($Entry.packageType)"
        }
        if ([string]::IsNullOrWhiteSpace($packageType)) {
            $packageType = "$($Entry.type)"
        }

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
    } elseif ($parsed -is [System.Collections.IEnumerable] -and -not ($parsed -is [string])) {
        foreach ($entry in $parsed) {
            Add-RowFromEntry -FallbackPackageName "" -Entry $entry
        }
    } elseif ($null -ne $parsed.packages -and $parsed.packages -is [System.Collections.IEnumerable]) {
        foreach ($entry in $parsed.packages) {
            Add-RowFromEntry -FallbackPackageName "" -Entry $entry
        }
    }

    $rows = @($rowsList)

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

    if (Test-CargoSubcommand "outdated") {
        Write-Host "  - Checando crates desatualizados (cargo outdated)..."
        Push-Location $tauriDir
        try {
            & cargo outdated
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  [WARN] Falha ao executar cargo outdated." -ForegroundColor Yellow
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "  [WARN] cargo-outdated nao instalado." -ForegroundColor Yellow
        Write-Host "    Instale com: cargo install cargo-outdated" -ForegroundColor Yellow
    }

    if (Test-CargoSubcommand "audit") {
        Write-Host "  - Checando vulnerabilidades (cargo audit)..."
        Push-Location $tauriDir
        try {
            & cargo audit
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  [WARN] Falha ao executar cargo audit." -ForegroundColor Yellow
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "  [WARN] cargo-audit nao instalado." -ForegroundColor Yellow
        Write-Host "    Instale com: cargo install cargo-audit" -ForegroundColor Yellow
    }

    Write-Host "  Atualizacao manual recomendada:"
    Write-Host ('    Set-Location "{0}"; cargo add <crate>@<versao>' -f $tauriDir)
    Write-Host ('    Set-Location "{0}"; cargo update -p <crate> --precise <versao>' -f $tauriDir)
    Write-Host ('    Set-Location "{0}"; cargo check' -f $tauriDir)
}

Print-Header
Check-DevEnvironment
Check-StackVersions
Check-FrameworkInventory
Check-JsDependencies
Check-RustDependencies
Write-Host "`nOK: Verificacao concluida!" -ForegroundColor Green
