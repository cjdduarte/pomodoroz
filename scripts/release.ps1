param(
    [string]$Version,
    [switch]$DryRun,
    [switch]$SkipValidate,
    [switch]$NoPush
)

$ErrorActionPreference = "Stop"

function Step {
    param([string]$Message)
    Write-Host "`n==> $Message"
}

function Fail {
    param([string]$Message)
    Write-Host "Erro: $Message" -ForegroundColor Red
    exit 1
}

function Show-Usage {
    @"
Uso:
  ./scripts/release.ps1 [-Version <versao>] [-DryRun] [-SkipValidate] [-NoPush]

Fluxo:
  1) valida repo limpo e branch atual
  2) sincroniza versao (package.json raiz/electron/renderer)
  3) valida changelog da versao
  4) (opcional) preflight local (validar-tudo --skip-install)
  5) commit de release
  6) cria tag v<versao>
  7) push branch + tag (opcional)

Opcoes:
  -DryRun        Mostra as acoes sem executar mudancas
  -SkipValidate  Pula preflight local
  -NoPush        Nao faz push de branch/tag
  -h, --help     Mostra esta ajuda
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

function Ensure-Command {
    param([string]$Command)
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Fail "$Command nao encontrado."
    }
}

function Invoke-CommandChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,
        [Parameter(Mandatory = $false)]
        [string[]]$Arguments = @()
    )

    $display = "$FilePath $($Arguments -join ' ')".Trim()
    if ($DryRun) {
        Write-Host "[dry-run] $display"
        return
    }

    $global:LASTEXITCODE = 0
    & $FilePath @Arguments
    if (-not $?) {
        Fail "Falha ao executar: $display"
    }
    if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
        Fail "Falha ao executar: $display"
    }
}

if ($Version -eq "-h" -or $Version -eq "--help") {
    Show-Usage
    exit 0
}

$ROOT = Split-Path -Parent $PSScriptRoot
$SUGGESTED_VERSION = Get-Date -Format "yy.M.d"
$versionFromPrompt = $false

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

$targetVersionRaw = $Version
$targetVersion = Normalize-Version -RawVersion $targetVersionRaw
$targetTag = "v$targetVersion"

if ($targetVersion -notmatch '^[0-9]+\.[0-9]+\.[0-9]+([-.+][0-9A-Za-z.-]+)?$') {
    Fail "Versao invalida: $targetVersion"
}

Write-Host "Versao sugerida de hoje: $SUGGESTED_VERSION"
if ($targetVersionRaw -ne $targetVersion) {
    Write-Host "Versao normalizada: $targetVersionRaw -> $targetVersion"
}

if ($versionFromPrompt -and [Environment]::UserInteractive) {
    $confirm = Read-Host "Confirmar release $targetTag? [Y/n]"
    if ([string]::IsNullOrWhiteSpace($confirm)) {
        $confirm = "Y"
    }

    if ($confirm -notmatch '^[Yy]$') {
        Write-Host "Operacao cancelada."
        exit 0
    }
}

Ensure-Command git
Ensure-Command yarn
Ensure-Command rg

$currentBranch = (& git -C $ROOT branch --show-current).Trim()
if ([string]::IsNullOrWhiteSpace($currentBranch)) {
    Fail "HEAD destacado (detached). Faca checkout em uma branch antes do release."
}

if (-not $DryRun) {
    & git -C $ROOT diff --quiet
    if ($LASTEXITCODE -ne 0) {
        Fail "Working tree nao esta limpo. Commit/stash suas mudancas antes do release."
    }

    & git -C $ROOT diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        Fail "Index com mudancas staged. Commit/stash suas mudancas antes do release."
    }
}

& git -C $ROOT rev-parse -q --verify "refs/tags/$targetTag" *> $null
if ($LASTEXITCODE -eq 0) {
    Fail "Tag local $targetTag ja existe."
}

& git -C $ROOT ls-remote --exit-code --tags origin "refs/tags/$targetTag" *> $null
if ($LASTEXITCODE -eq 0) {
    Fail "Tag remota $targetTag ja existe em origin."
}

Step "Sincronizando versao para $targetVersion"
Invoke-CommandChecked -FilePath yarn -Arguments @("version:sync", $targetVersion)

Step "Validando entradas de changelog para $targetVersion"
$escapedVersion = [regex]::Escape($targetVersion)
if (-not (Select-String -Path (Join-Path $ROOT "CHANGELOG.md") -Pattern "^## \[$escapedVersion\]" -Quiet)) {
    Fail "CHANGELOG.md sem secao da versao [$targetVersion]."
}
if (-not (Select-String -Path (Join-Path $ROOT "CHANGELOG.en.md") -Pattern "^## \[$escapedVersion\]" -Quiet)) {
    Fail "CHANGELOG.en.md sem secao da versao [$targetVersion]."
}

if (-not $SkipValidate) {
    Step "Preflight local (validar-tudo --skip-install)"
    Invoke-CommandChecked -FilePath (Join-Path $ROOT "scripts/validar-tudo.ps1") -Arguments @("-SkipInstall")
} else {
    Step "Pulando preflight local (-SkipValidate)"
}

Step "Criando commit de release"
Invoke-CommandChecked -FilePath git -Arguments @(
    "-C", $ROOT,
    "add",
    "package.json",
    "app/electron/package.json",
    "app/renderer/package.json",
    "CHANGELOG.md",
    "CHANGELOG.en.md"
)

if (-not $DryRun) {
    & git -C $ROOT diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Fail "Nenhuma mudanca staged para commit de release."
    }
}

Invoke-CommandChecked -FilePath git -Arguments @("-C", $ROOT, "commit", "-m", "chore(release): $targetTag")

Step "Criando tag $targetTag"
Invoke-CommandChecked -FilePath git -Arguments @("-C", $ROOT, "tag", $targetTag)

if (-not $NoPush) {
    Step "Enviando branch e tag para origin"
    Invoke-CommandChecked -FilePath git -Arguments @("-C", $ROOT, "push", "origin", $currentBranch)
    Invoke-CommandChecked -FilePath git -Arguments @("-C", $ROOT, "push", "origin", $targetTag)
} else {
    Step "Push pulado (-NoPush)"
}

Step "Release preparado"
Write-Host "Branch: $currentBranch"
Write-Host "Tag: $targetTag"
if ($NoPush) {
    Write-Host "Para publicar depois:"
    Write-Host "  git push origin $currentBranch"
    Write-Host "  git push origin $targetTag"
}
