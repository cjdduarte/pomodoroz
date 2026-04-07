#!/usr/bin/env bash
set -euo pipefail

INSTALL_ROOT="${HOME}/.local/opt/pomodoroz"
MANIFEST_PATH="${INSTALL_ROOT}/install-manifest.txt"

BIN_PATH="${HOME}/.local/bin/pomodoroz"
DESKTOP_PATH="${HOME}/.local/share/applications/pomodoroz.desktop"
DESKTOP_PATH_LOCAL="${HOME}/.local/share/applications/pomodoroz-local.desktop"
ICON_PATH="${HOME}/.local/share/icons/hicolor/256x256/apps/pomodoroz.png"
APPIMAGE_PATH="${INSTALL_ROOT}/Pomodoroz.AppImage"
APPIMAGE_PREVIOUS_PATH="${INSTALL_ROOT}/Pomodoroz.AppImage.previous"

USER_DATA_PATHS=(
  "${HOME}/.config/pomodoroz"
  "${HOME}/.cache/pomodoroz"
)

PURGE=0
ASSUME_YES=0

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
  ./scripts/uninstall.sh [--purge] [--yes]

Padrao:
  Remove somente a instalacao local criada por scripts/install.sh.
  Sem parametros em terminal interativo, mostra um menu de opcoes.

Opcoes:
  --purge   Remove tambem dados locais em ~/.config e ~/.cache.
  --yes     Pula confirmacao interativa exigida por --purge.
  -h, --help
EOF
}

remove_path_if_exists() {
  local path="$1"
  if [[ -e "$path" || -L "$path" ]]; then
    rm -rf "$path"
    printf "Removido: %s\n" "$path"
  fi
}

show_mode_menu() {
  cat <<'EOF'
Menu de desinstalacao:
Escolha o nivel de limpeza.
- Padrao: remove apenas app/atalho/icone instalados localmente.
- Purge: faz o padrao + remove dados locais (config/cache).

Escolha o modo de desinstalacao:
  1) Padrao  - remove apenas instalacao local do pomodoroz
  2) Purge   - padrao + dados locais (~/.config e ~/.cache)
  3) Cancelar
EOF

  read -r -p "Opcao [1-3]: " MENU_OPTION
  case "$MENU_OPTION" in
    1|"")
      ;;
    2)
      PURGE=1
      ;;
    3)
      echo "Operacao cancelada."
      exit 0
      ;;
    *)
      die "Opcao invalida: $MENU_OPTION"
      ;;
  esac
}

if (( $# == 0 )) && [[ -t 0 ]]; then
  show_mode_menu
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --purge)
      PURGE=1
      shift
      ;;
    --yes)
      ASSUME_YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Argumento invalido: $1 (use --help)"
      ;;
  esac
done

if (( PURGE == 1 )) && (( ASSUME_YES == 0 )); then
  if [[ -t 0 ]]; then
    read -r -p "Confirmar limpeza completa (inclui dados locais)? [y/N]: " CONFIRM
    CONFIRM="${CONFIRM:-N}"
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
      echo "Operacao cancelada."
      exit 0
    fi
  else
    die "Modo nao interativo com --purge requer --yes."
  fi
fi

step "Removendo instalacao local do Pomodoroz (install.sh)"

if [[ -f "$MANIFEST_PATH" ]]; then
  while IFS= read -r path; do
    [[ -n "$path" ]] && remove_path_if_exists "$path"
  done < "$MANIFEST_PATH"
  remove_path_if_exists "$MANIFEST_PATH"
else
  :
fi

# Always enforce cleanup of current known paths, even when manifest is old.
remove_path_if_exists "$BIN_PATH"
remove_path_if_exists "$DESKTOP_PATH"
remove_path_if_exists "$DESKTOP_PATH_LOCAL"
remove_path_if_exists "$ICON_PATH"
remove_path_if_exists "$APPIMAGE_PATH"
remove_path_if_exists "$APPIMAGE_PREVIOUS_PATH"

if [[ -d "$INSTALL_ROOT" ]]; then
  rmdir "$INSTALL_ROOT" 2>/dev/null || true
fi

if (( PURGE == 1 )); then
  step "Removendo dados locais (config/cache)"
  for path in "${USER_DATA_PATHS[@]}"; do
    remove_path_if_exists "$path"
  done
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "${HOME}/.local/share/applications" >/dev/null 2>&1 || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -q "${HOME}/.local/share/icons/hicolor" >/dev/null 2>&1 || true
fi

step "Concluido"
if (( PURGE == 1 )); then
  printf "Instalacao local e dados locais foram removidos.\n"
else
  printf "Somente a instalacao local criada por scripts/install.sh foi removida.\n"
fi
