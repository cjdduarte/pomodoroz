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
    Step "[1/4] Ambiente de Desenvolvimento"

    if (Check-Command "node") {
        $nodeVersion = (node --version) -replace '^v', ''
        $nodeMajor = 0
        [void][int]::TryParse(($nodeVersion -split '\.')[0], [ref]$nodeMajor)
        if ($nodeMajor -ge 24) {
            Write-Host "  Node.js: v$nodeVersion ✓" -ForegroundColor Green
        } else {
            Write-Host "  Node.js: v$nodeVersion ⚠ (recomendado: v24 LTS)" -ForegroundColor Yellow
            Write-Host "    Sugestao: nvm install 24 && nvm use 24" -ForegroundColor Gray
        }
    } else {
        Write-Host "  Node.js: ❌ nao encontrado" -ForegroundColor Red
    }

    if (Check-Command "yarn") {
        $yarnVersion = yarn --version
        if ($yarnVersion -like "1.*") {
            Write-Host "  Yarn: $yarnVersion ✓ (Classic)" -ForegroundColor Green
        } else {
            Write-Host "  Yarn: $yarnVersion ⚠ (projeto usa Yarn Classic 1.x)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Yarn: ❌ nao encontrado" -ForegroundColor Red
    }
}

function Check-StackVersions {
    Step "`n[2/4] Stack Atual do Projeto"

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
    Step "`n[3/4] Inventario de Frameworks e Ferramentas"

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
        $raw = yarn outdated --json 2>&1
        $status = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($status -gt 1) {
        $script:OutdatedCheckFailed = $true
        Write-Host "  ⚠ [$WorkspaceName] falha ao consultar updates (rede/registry)." -ForegroundColor Yellow
        return $rows
    }

    # Em alguns cenarios, o Yarn retorna exit code 1 tanto para "ha updates"
    # quanto para erro de rede/registry. Detectamos erro no payload JSON.
    $errorLine = $raw | Where-Object { $_ -match '"type":"error"' } | Select-Object -First 1
    if ($null -ne $errorLine -and "$errorLine" -ne "") {
        $script:OutdatedCheckFailed = $true
        $errorText = $null
        try {
            $errorObj = $errorLine | ConvertFrom-Json
            if ($null -ne $errorObj -and $errorObj.type -eq "error") {
                $errorText = "$($errorObj.data)"
            }
        } catch {
            $errorText = $null
        }

        if ([string]::IsNullOrWhiteSpace($errorText)) {
            Write-Host "  ⚠ [$WorkspaceName] falha ao consultar updates (erro retornado pelo Yarn)." -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠ [$WorkspaceName] falha ao consultar updates: $errorText" -ForegroundColor Yellow
        }
        return $rows
    }

    foreach ($line in $raw) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }
        try {
            $obj = $line | ConvertFrom-Json
        } catch {
            continue
        }

        if ($obj.type -ne "table") {
            continue
        }
        if ($null -eq $obj.data -or $null -eq $obj.data.body) {
            continue
        }

        $head = @()
        if ($null -ne $obj.data.head) {
            $head = @($obj.data.head)
        }

        $workspaceIndex = [Array]::IndexOf($head, "Workspace")
        $packageIndex = [Array]::IndexOf($head, "Package")
        $currentIndex = [Array]::IndexOf($head, "Current")
        $wantedIndex = [Array]::IndexOf($head, "Wanted")
        $latestIndex = [Array]::IndexOf($head, "Latest")
        $packageTypeIndex = [Array]::IndexOf($head, "Package Type")

        if ($packageIndex -lt 0) {
            # fallback para formato antigo sem head mapeado
            $packageIndex = 0
            $currentIndex = 1
            $wantedIndex = 2
            $latestIndex = 3
            $packageTypeIndex = 4
        }

        foreach ($row in $obj.data.body) {
            if ($row.Count -le $packageIndex) {
                continue
            }

            $workspaceRaw = ""
            if ($workspaceIndex -ge 0 -and $workspaceIndex -lt $row.Count) {
                $workspaceRaw = "$($row[$workspaceIndex])"
            }

            $workspace = if ([string]::IsNullOrWhiteSpace($workspaceRaw)) {
                $WorkspaceName
            } else {
                Normalize-WorkspaceName -WorkspaceName $workspaceRaw
            }

            $package = if ($packageIndex -lt $row.Count) { "$($row[$packageIndex])" } else { "" }
            $current = if ($currentIndex -ge 0 -and $currentIndex -lt $row.Count) { "$($row[$currentIndex])" } else { "" }
            $wanted = if ($wantedIndex -ge 0 -and $wantedIndex -lt $row.Count) { "$($row[$wantedIndex])" } else { "" }
            $latest = if ($latestIndex -ge 0 -and $latestIndex -lt $row.Count) { "$($row[$latestIndex])" } else { "" }
            $packageType = if ($packageTypeIndex -ge 0 -and $packageTypeIndex -lt $row.Count) { "$($row[$packageTypeIndex])" } else { "" }

            if ([string]::IsNullOrWhiteSpace($package)) {
                continue
            }

            $dedupeKey = "$workspace`t$package`t$current`t$wanted`t$latest`t$packageType"
            if ($script:OutdatedSeen.Contains($dedupeKey)) {
                continue
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
            $rows += $item
        }
    }

    if ($status -eq 1 -and $rows.Count -eq 0) {
        $script:OutdatedCheckFailed = $true
        Write-Host "  ⚠ [$WorkspaceName] resultado inconclusivo: Yarn retornou status 1, mas nao foi possivel parsear tabela de updates." -ForegroundColor Yellow
    }

    return $rows
}

function Show-OutdatedTable {
    param([object[]]$Rows)

    if (-not $Rows -or $Rows.Count -eq 0) {
        if ($script:OutdatedCheckFailed) {
            Write-Host "  ⚠ Resultado inconclusivo: houve falha ao consultar o registry em um ou mais workspaces." -ForegroundColor Yellow
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
                Write-Host "  -> [$($row.Workspace)] yarn add -D --exact $($row.Package)@$TargetVersion"
                yarn add -D --exact "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] yarn add -D $($row.Package)@$TargetVersion"
                yarn add -D "$($row.Package)@$TargetVersion"
            }
            break
        }
        "dependencies" {
            if ($Exact) {
                Write-Host "  -> [$($row.Workspace)] yarn add --exact $($row.Package)@$TargetVersion"
                yarn add --exact "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] yarn add $($row.Package)@$TargetVersion"
                yarn add "$($row.Package)@$TargetVersion"
            }
            break
        }
        "optionalDependencies" {
            if ($Exact) {
                Write-Host "  -> [$($row.Workspace)] yarn add --optional --exact $($row.Package)@$TargetVersion"
                yarn add --optional --exact "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] yarn add --optional $($row.Package)@$TargetVersion"
                yarn add --optional "$($row.Package)@$TargetVersion"
            }
            break
        }
        default {
            if ($Exact) {
                Write-Host "  -> [$($row.Workspace)] tipo '$($row.PackageType)' sem suporte direto para --exact; fallback: yarn upgrade --latest $($row.Package)@$TargetVersion"
                yarn upgrade --latest "$($row.Package)@$TargetVersion"
            } else {
                Write-Host "  -> [$($row.Workspace)] tipo '$($row.PackageType)' sem suporte direto; fallback: yarn upgrade $($row.Package)@$TargetVersion"
                yarn upgrade "$($row.Package)@$TargetVersion"
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
            Write-Host "  ⚠ Workspace desconhecido: $($row.Workspace)" -ForegroundColor Yellow
            continue
        }

        Push-Location $wsPath
        try {
            $targetVersion = Get-TargetVersion -Row $row -UseLatest:$UseLatest
            if ([string]::IsNullOrWhiteSpace($targetVersion)) {
                if ($UseLatest) {
                    Write-Host "  -> [$($row.Workspace)] sem target inferido; fallback: yarn upgrade --latest $($row.Package)"
                    yarn upgrade --latest $row.Package
                } else {
                    Write-Host "  -> [$($row.Workspace)] sem target inferido; fallback: yarn upgrade $($row.Package)"
                    yarn upgrade $row.Package
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
    Step "`n[4/4] Dependencias JS/TS (Yarn)"

    if (-not (Check-Command "yarn")) {
        Write-Host "  Yarn nao encontrado." -ForegroundColor Red
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

    Write-Host "`n✓ Updates concluidos." -ForegroundColor Green
    Write-Host 'Recomendado:' -ForegroundColor Gray
    Write-Host "  cd `"$POMODOROZ`" && yarn build" -ForegroundColor Gray
    Write-Host "  cd `"$POMODOROZ`" && yarn dev:app" -ForegroundColor Gray
}

Print-Header
Check-DevEnvironment
Check-StackVersions
Check-FrameworkInventory
Check-JsDependencies
Write-Host "`nOK: Verificacao concluida!" -ForegroundColor Green
