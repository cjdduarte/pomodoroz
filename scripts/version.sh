#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT"
SUGGESTED_VERSION="$((10#$(date +%y))).$((10#$(date +%m))).$((10#$(date +%d)))"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/version.sh [versao]
  ./scripts/version.sh --dry-run [versao]

Sem argumento, sugere automaticamente a data de hoje (yy.m.d)
e pede confirmacao antes de executar.

Obs.: se informar com zero a esquerda (ex.: 26.03.25), sera normalizado para 26.3.25.

Exemplos:
  ./scripts/version.sh
  ./scripts/version.sh 26.3.25
  ./scripts/version.sh --dry-run
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

DRY_RUN=0
INPUT_VERSION=""
VERSION_FROM_PROMPT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      INPUT_VERSION="$1"
      shift
      ;;
  esac
done

if [[ -z "$INPUT_VERSION" ]]; then
  if [[ -t 0 ]]; then
    read -r -p "Versao [${SUGGESTED_VERSION}]: " INPUT_VERSION
    VERSION_FROM_PROMPT=1
  else
    INPUT_VERSION="$SUGGESTED_VERSION"
  fi
fi

TARGET_VERSION_RAW="${INPUT_VERSION:-$SUGGESTED_VERSION}"
TARGET_VERSION="$(normalize_version "$TARGET_VERSION_RAW")"
COMMAND="yarn version:sync ${TARGET_VERSION}"

printf "Versao sugerida de hoje: %s\n" "$SUGGESTED_VERSION"
if [[ "$TARGET_VERSION" != "$TARGET_VERSION_RAW" ]]; then
  printf "Versao normalizada: %s -> %s\n" "$TARGET_VERSION_RAW" "$TARGET_VERSION"
fi
printf "Executando: %s\n" "$COMMAND"

if (( DRY_RUN == 1 )); then
  exit 0
fi

if (( VERSION_FROM_PROMPT == 1 )) && [[ -t 0 ]]; then
  read -r -p "Confirmar versao ${TARGET_VERSION}? [Y/n]: " CONFIRM
  CONFIRM="${CONFIRM:-Y}"
  if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Operacao cancelada."
    exit 0
  fi
fi

( cd "$APP_DIR" && yarn version:sync "$TARGET_VERSION" )
