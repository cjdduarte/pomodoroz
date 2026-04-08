#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT"

get_suggested_version() {
  local current_major current_minor
  local max_patch=0
  local found=0

  current_major="$((10#$(date +%y)))"
  current_minor="$((10#$(date +%m)))"

  if command -v git >/dev/null 2>&1 && git -C "$APP_DIR" rev-parse --git-dir >/dev/null 2>&1; then
    while IFS= read -r tag; do
      [[ -z "$tag" ]] && continue
      tag="${tag#v}"

      if [[ "$tag" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
        local tag_major tag_minor tag_patch
        tag_major="$((10#${BASH_REMATCH[1]}))"
        tag_minor="$((10#${BASH_REMATCH[2]}))"
        tag_patch="$((10#${BASH_REMATCH[3]}))"

        if (( tag_major == current_major && tag_minor == current_minor )); then
          if (( found == 0 || tag_patch > max_patch )); then
            max_patch="$tag_patch"
            found=1
          fi
        fi
      fi
    done < <(git -C "$APP_DIR" tag -l "v[0-9]*.[0-9]*.[0-9]*")
  fi

  if (( found == 1 )); then
    printf "%s.%s.%s" "$current_major" "$current_minor" "$((max_patch + 1))"
  else
    printf "%s.%s.1" "$current_major" "$current_minor"
  fi
}

SUGGESTED_VERSION="$(get_suggested_version)"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/version.sh [versao]
  ./scripts/version.sh --dry-run [versao]

Sem argumento, sugere automaticamente usando:
  ano/mes atual (yy.m) + ultimo patch de tag local vyy.m.*
  exemplo: v26.4.10 -> sugestao 26.4.11; ao virar mes sem tag, 26.5.1
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

printf "Versao sugerida (data + tags locais): %s\n" "$SUGGESTED_VERSION"
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
