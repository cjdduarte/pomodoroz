param(
    [string]$Version,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Invoke-Pnpm {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw "node nao encontrado."
    }
    if (-not (Test-Path $script:PnpmWrapper)) {
        throw "Wrapper pnpmw nao encontrado: $script:PnpmWrapper"
    }

    & node $script:PnpmWrapper @Arguments

    if (-not $?) {
        throw "Falha ao executar pnpmw $($Arguments -join ' ')"
    }
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
        throw "Falha ao executar pnpmw $($Arguments -join ' ')"
    }
}

function Show-Usage {
    @"
Uso:
  ./scripts/version.ps1 [-Version <versao>] [-DryRun]

Sem -Version, sugere automaticamente usando:
  ano/mes atual (yy.m) + ultimo patch de tag local vyy.m.*
  exemplo: v26.4.10 -> sugestao 26.4.11; ao virar mes sem tag, 26.5.1
e pede confirmacao antes de executar.

Obs.: se informar com zero a esquerda (ex.: 26.03.25), sera normalizado para 26.3.25.

Exemplos:
  ./scripts/version.ps1
  ./scripts/version.ps1 -Version 26.3.25
  ./scripts/version.ps1 -DryRun
"@
}

function Normalize-Version {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RawVersion
    )

    $trimmedVersion = $RawVersion.Trim()
    $match = [regex]::Match(
        $trimmedVersion,
        '^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?<suffix>(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)$'
    )

    if (-not $match.Success) {
        return $trimmedVersion
    }

    $major = [int]$match.Groups["major"].Value
    $minor = [int]$match.Groups["minor"].Value
    $patch = [int]$match.Groups["patch"].Value
    $suffix = $match.Groups["suffix"].Value

    return "$major.$minor.$patch$suffix"
}

function Get-SuggestedVersion {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RepoRoot
    )

    $now = Get-Date
    $currentMajor = [int]$now.ToString("yy")
    $currentMinor = [int]$now.ToString("MM")
    $maxPatch = $null

    try {
        $tags = & git -C $RepoRoot tag -l "v[0-9]*.[0-9]*.[0-9]*" 2>$null
        if ($LASTEXITCODE -eq 0 -and $tags) {
            foreach ($tag in $tags) {
                $normalizedTag = $tag.Trim()
                if (-not $normalizedTag) {
                    continue
                }

                if ($normalizedTag.StartsWith("v")) {
                    $normalizedTag = $normalizedTag.Substring(1)
                }

                $tagMatch = [regex]::Match(
                    $normalizedTag,
                    '^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)$'
                )

                if (-not $tagMatch.Success) {
                    continue
                }

                $tagMajor = [int]$tagMatch.Groups["major"].Value
                $tagMinor = [int]$tagMatch.Groups["minor"].Value
                $tagPatch = [int]$tagMatch.Groups["patch"].Value

                if ($tagMajor -ne $currentMajor -or $tagMinor -ne $currentMinor) {
                    continue
                }

                if ($null -eq $maxPatch -or $tagPatch -gt $maxPatch) {
                    $maxPatch = $tagPatch
                }
            }
        }
    } catch {
        # Fallback: sem tags legiveis, inicia patch em 1 no mes atual.
    }

    if ($null -eq $maxPatch) {
        return "$currentMajor.$currentMinor.1"
    }

    return "$currentMajor.$currentMinor.$($maxPatch + 1)"
}

$ROOT = Split-Path -Parent $PSScriptRoot
$APP_DIR = $ROOT
$script:PnpmWrapper = Join-Path $ROOT "scripts/pnpmw.mjs"
$SUGGESTED_VERSION = Get-SuggestedVersion -RepoRoot $ROOT
$versionFromPrompt = $false

if ($Version -eq "-h" -or $Version -eq "--help") {
    Show-Usage
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Version)) {
    if ([Environment]::UserInteractive -and -not $DryRun) {
        $inputVersion = Read-Host "Versao [$SUGGESTED_VERSION]"
        $Version = if ([string]::IsNullOrWhiteSpace($inputVersion)) {
            $SUGGESTED_VERSION
        } else {
            $inputVersion.Trim()
        }
        $versionFromPrompt = $true
    } else {
        $Version = $SUGGESTED_VERSION
    }
}

$rawVersion = $Version
$Version = Normalize-Version -RawVersion $rawVersion

$command = "node ./scripts/pnpmw.mjs version:sync $Version"
Write-Host "Versao sugerida (data + tags locais): $SUGGESTED_VERSION"
if ($rawVersion -ne $Version) {
    Write-Host "Versao normalizada: $rawVersion -> $Version"
}
Write-Host "Executando: $command"

if ($DryRun) {
    exit 0
}

if ($versionFromPrompt) {
    $confirm = Read-Host "Confirmar versao $Version? [Y/n]"
    if ([string]::IsNullOrWhiteSpace($confirm)) {
        $confirm = "Y"
    }

    if ($confirm -notmatch "^[Yy]$") {
        Write-Host "Operacao cancelada."
        exit 0
    }
}

Push-Location $APP_DIR
Invoke-Pnpm -Arguments @("version:sync", $Version)
Pop-Location
