#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT"
SUGGESTED_VERSION="$((10#$(date +%y))).$((10#$(date +%m))).$((10#$(date +%d)))"

DRY_RUN=0
SKIP_VALIDATE=0
NO_PUSH=0
INPUT_VERSION=""
VERSION_FROM_PROMPT=0

step() {
  printf "\n==> %s\n" "$1"
}

die() {
  printf "Erro: %s\n" "$1" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Uso:
  ./scripts/release.sh [versao]
  ./scripts/release.sh --dry-run [versao]
  ./scripts/release.sh --skip-validate [versao]
  ./scripts/release.sh --no-push [versao]

Fluxo:
  1) valida repo limpo e branch atual
  2) sincroniza versao (package.json raiz/electron/renderer)
  3) valida changelog da versao
  4) (opcional) preflight local (validar-tudo --skip-install)
  5) commit de release
  6) cria tag v<versao>
  7) push branch + tag (opcional)

Opcoes:
  --dry-run        Mostra as acoes sem executar mudancas
  --skip-validate  Pula preflight local
  --no-push        Nao faz push de branch/tag
  -h, --help       Mostra esta ajuda
EOF
}

normalize_version() {
  local raw_version="$1"

  if [[ "$raw_version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(.*)$ ]]; then
    local major minor patch suffix
    major="$((10#${BASH_REMATCH[1]}))"
    minor="$((10#${BASH_REMATCH[2]}))"
    patch="$((10#${BASH_REMATCH[3]}))"
    suffix="${BASH_REMATCH[4]}"

    printf "%s.%s.%s%s" "$major" "$minor" "$patch" "$suffix"
    return
  fi

  printf "%s" "$raw_version"
}

run_cmd() {
  local cmd="$1"
  if (( DRY_RUN == 1 )); then
    printf "[dry-run] %s\n" "$cmd"
  else
    bash -lc "$cmd"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-validate)
      SKIP_VALIDATE=1
      shift
      ;;
    --no-push)
      NO_PUSH=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$INPUT_VERSION" ]]; then
        die "Apenas uma versao pode ser informada."
      fi
      INPUT_VERSION="$1"
      shift
      ;;
  esac
done

if [[ -z "$INPUT_VERSION" ]]; then
  if [[ -t 0 ]]; then
    read -r -p "Versao [$SUGGESTED_VERSION]: " INPUT_VERSION
    VERSION_FROM_PROMPT=1
  fi
fi

TARGET_VERSION_RAW="${INPUT_VERSION:-$SUGGESTED_VERSION}"
TARGET_VERSION="$(normalize_version "$TARGET_VERSION_RAW")"
TARGET_TAG="v$TARGET_VERSION"

if ! [[ "$TARGET_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.+][0-9A-Za-z.-]+)?$ ]]; then
  die "Versao invalida: $TARGET_VERSION"
fi

printf "Versao sugerida de hoje: %s\n" "$SUGGESTED_VERSION"
if [[ "$TARGET_VERSION_RAW" != "$TARGET_VERSION" ]]; then
  printf "Versao normalizada: %s -> %s\n" "$TARGET_VERSION_RAW" "$TARGET_VERSION"
fi

if (( VERSION_FROM_PROMPT == 1 )) && [[ -t 0 ]]; then
  read -r -p "Confirmar release $TARGET_TAG? [Y/n]: " CONFIRM
  CONFIRM="${CONFIRM:-Y}"
  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Operacao cancelada."
    exit 0
  fi
fi

command -v git >/dev/null 2>&1 || die "git nao encontrado."
command -v yarn >/dev/null 2>&1 || die "yarn nao encontrado."
command -v rg >/dev/null 2>&1 || die "rg nao encontrado."

CURRENT_BRANCH="$(git -C "$APP_DIR" branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  die "HEAD destacado (detached). Faça checkout em uma branch antes do release."
fi

if ! git -C "$APP_DIR" diff --quiet || ! git -C "$APP_DIR" diff --cached --quiet; then
  die "Working tree nao esta limpo. Commit/stash suas mudancas antes do release."
fi

if git -C "$APP_DIR" rev-parse -q --verify "refs/tags/$TARGET_TAG" >/dev/null; then
  die "Tag local $TARGET_TAG ja existe."
fi

if git -C "$APP_DIR" ls-remote --exit-code --tags origin "refs/tags/$TARGET_TAG" >/dev/null 2>&1; then
  die "Tag remota $TARGET_TAG ja existe em origin."
fi

step "Sincronizando versao para $TARGET_VERSION"
run_cmd "cd \"$APP_DIR\" && yarn version:sync \"$TARGET_VERSION\""

step "Validando entradas de changelog para $TARGET_VERSION"
if ! rg -q "^## \\[$TARGET_VERSION\\]" "$APP_DIR/CHANGELOG.md"; then
  die "CHANGELOG.md sem secao da versao [$TARGET_VERSION]."
fi
if ! rg -q "^## \\[$TARGET_VERSION\\]" "$APP_DIR/CHANGELOG.en.md"; then
  die "CHANGELOG.en.md sem secao da versao [$TARGET_VERSION]."
fi

if (( SKIP_VALIDATE == 0 )); then
  step "Preflight local (validar-tudo --skip-install)"
  run_cmd "cd \"$APP_DIR\" && ./scripts/validar-tudo.sh --skip-install"
else
  step "Pulando preflight local (--skip-validate)"
fi

step "Criando commit de release"
run_cmd "cd \"$APP_DIR\" && git add package.json app/electron/package.json app/renderer/package.json CHANGELOG.md CHANGELOG.en.md"
if (( DRY_RUN == 0 )); then
  if git -C "$APP_DIR" diff --cached --quiet; then
    die "Nenhuma mudanca staged para commit de release."
  fi
fi
run_cmd "cd \"$APP_DIR\" && git commit -m \"chore(release): $TARGET_TAG\""

step "Criando tag $TARGET_TAG"
run_cmd "cd \"$APP_DIR\" && git tag \"$TARGET_TAG\""

if (( NO_PUSH == 0 )); then
  step "Enviando branch e tag para origin"
  run_cmd "cd \"$APP_DIR\" && git push origin \"$CURRENT_BRANCH\""
  run_cmd "cd \"$APP_DIR\" && git push origin \"$TARGET_TAG\""
else
  step "Push pulado (--no-push)"
fi

step "Release preparado"
printf "Branch: %s\n" "$CURRENT_BRANCH"
printf "Tag: %s\n" "$TARGET_TAG"
if (( NO_PUSH == 1 )); then
  printf "Para publicar depois:\n"
  printf "  git push origin %s\n" "$CURRENT_BRANCH"
  printf "  git push origin %s\n" "$TARGET_TAG"
fi
