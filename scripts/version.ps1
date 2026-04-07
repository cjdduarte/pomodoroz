param(
    [string]$Version,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Show-Usage {
    @"
Uso:
  ./scripts/version.ps1 [-Version <versao>] [-DryRun]

Sem -Version, sugere automaticamente a data de hoje (yy.m.d)
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

$ROOT = Split-Path -Parent $PSScriptRoot
$APP_DIR = $ROOT
$SUGGESTED_VERSION = Get-Date -Format "yy.M.d"
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

$command = "yarn version:sync $Version"
Write-Host "Versao sugerida de hoje: $SUGGESTED_VERSION"
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
yarn version:sync $Version
Pop-Location
