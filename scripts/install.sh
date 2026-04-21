#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT"

INSTALL_ROOT="${HOME}/.local/opt/pomodoroz"
TAURI_BINARY_PATH="${INSTALL_ROOT}/pomodoroz_tauri"
TAURI_BINARY_PREVIOUS_PATH="${INSTALL_ROOT}/pomodoroz_tauri.previous"
LEGACY_APPIMAGE_PATH="${INSTALL_ROOT}/Pomodoroz.AppImage"
LEGACY_APPIMAGE_PREVIOUS_PATH="${INSTALL_ROOT}/Pomodoroz.AppImage.previous"
BIN_DIR="${HOME}/.local/bin"
BIN_PATH="${BIN_DIR}/pomodoroz"
DESKTOP_DIR="${HOME}/.local/share/applications"
DESKTOP_PATH="${DESKTOP_DIR}/pomodoroz.desktop"
DESKTOP_PATH_LOCAL="${DESKTOP_DIR}/pomodoroz-local.desktop"
ICON_DIR="${HOME}/.local/share/icons/hicolor/256x256/apps"
ICON_PATH="${ICON_DIR}/pomodoroz.png"
MANIFEST_PATH="${INSTALL_ROOT}/install-manifest.txt"

SKIP_BUILD=0

step() {
  printf "\n==> %s\n" "$1"
}

die() {
  printf "Erro: %s\n" "$1" >&2
  exit 1
}

usage() {
  cat <<'EOF2'
Uso:
  ./scripts/install.sh [--skip-build]

Fluxo (Tauri-only):
  1) roda pre-check (lint + typecheck renderer)
  2) gera binario release (pnpm tauri build --no-bundle)
  3) instala binario em ~/.local/opt/pomodoroz/pomodoroz_tauri
  4) cria launcher em ~/.local/bin/pomodoroz
  5) cria atalho de menu em ~/.local/share/applications/pomodoroz.desktop
  6) instala icone local em ~/.local/share/icons/hicolor/256x256/apps/pomodoroz.png

Nota sobre updater in-app:
  - Esta instalacao local usa binario `--no-bundle`.
  - O fluxo de instalacao automatica via updater in-app fica desativado
    neste canal; ao solicitar update, o app abre a pagina de release.

Com --skip-build:
  - instala binario ja existente em src-tauri/target/release/

Comportamento de atualizacao:
  - backup em ~/.local/opt/pomodoroz/pomodoroz_tauri.previous

Remocao:
  - Use ./scripts/uninstall.sh para remover somente a instalacao local criada
    por este script.
EOF2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=1
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

if [[ "$(uname -s)" != "Linux" ]]; then
  die "Este script suporta apenas Linux."
fi

for cmd in node pnpm cargo; do
  command -v "$cmd" >/dev/null 2>&1 || die "$cmd nao encontrado."
done

NODE_VERSION="$(node --version | sed 's/^v//')"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"
if (( NODE_MAJOR < 24 )); then
  printf "Aviso: Node atual v%s (recomendado v24 LTS)\n" "$NODE_VERSION"
fi

if [[ ! -d "${APP_DIR}/node_modules" ]]; then
  step "Instalando dependencias pnpm"
  ( cd "$APP_DIR" && pnpm install )
fi

if (( SKIP_BUILD == 0 )); then
  step "Lint completo (ESLint renderer)"
  ( cd "$APP_DIR" && pnpm lint )

  step "Typecheck do renderer (TypeScript)"
  ( cd "$APP_DIR" && pnpm typecheck:renderer )

  step "Build release Tauri sem bundle (--no-bundle)"
  ( cd "$APP_DIR" && pnpm tauri build --no-bundle )
else
  step "Pulando pre-check/build (--skip-build)"
fi

APP_BINARY_SOURCE="${APP_DIR}/src-tauri/target/release/pomodoroz_tauri"
[[ -f "$APP_BINARY_SOURCE" ]] || die "Binario Tauri release nao encontrado: $APP_BINARY_SOURCE"

ICON_SOURCE="${APP_DIR}/src-tauri/icons/icon.png"
[[ -f "$ICON_SOURCE" ]] || die "Icone nao encontrado: $ICON_SOURCE"

step "Instalando localmente (menu + icone)"
mkdir -p "$INSTALL_ROOT" "$BIN_DIR" "$DESKTOP_DIR" "$ICON_DIR"

if [[ -f "$TAURI_BINARY_PATH" ]]; then
  cp -f "$TAURI_BINARY_PATH" "$TAURI_BINARY_PREVIOUS_PATH"
  printf "Backup do binario Tauri anterior salvo em: %s\n" "$TAURI_BINARY_PREVIOUS_PATH"
fi

cp -f "$APP_BINARY_SOURCE" "$TAURI_BINARY_PATH"
chmod +x "$TAURI_BINARY_PATH"

# Limpa artefatos legados de instalacoes antigas.
rm -f "$LEGACY_APPIMAGE_PATH" "$LEGACY_APPIMAGE_PREVIOUS_PATH"

cp -f "$ICON_SOURCE" "$ICON_PATH"

cat > "$BIN_PATH" <<EOF2
#!/usr/bin/env bash
exec "${TAURI_BINARY_PATH}" "\$@"
EOF2
chmod +x "$BIN_PATH"

cat > "$DESKTOP_PATH" <<EOF2
[Desktop Entry]
Type=Application
Version=1.0
Name=Pomodoroz
Comment=Pomodoroz Timer
Comment[en]=Pomodoroz Timer
Comment[pt_BR]=Temporizador Pomodoroz
Comment[pt_PT]=Temporizador Pomodoroz
Comment[es]=Temporizador Pomodoroz
Comment[ja]=Pomodoroz タイマー
Comment[zh]=Pomodoroz 计时器
Comment[zh_CN]=Pomodoroz 计时器
Comment[zh_TW]=Pomodoroz 計時器
Exec=${BIN_PATH} %U
Icon=pomodoroz
Terminal=false
Categories=Utility;
StartupNotify=true
StartupWMClass=pomodoroz_tauri
X-GNOME-WMClass=pomodoroz_tauri
EOF2

# Cleanup de versoes anteriores que criavam alias local extra.
rm -f "$DESKTOP_PATH_LOCAL"

{
  echo "$TAURI_BINARY_PATH"
  echo "$TAURI_BINARY_PREVIOUS_PATH"
  echo "$BIN_PATH"
  echo "$DESKTOP_PATH"
  echo "$ICON_PATH"
} > "$MANIFEST_PATH"

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -q "${HOME}/.local/share/icons/hicolor" >/dev/null 2>&1 || true
fi

if command -v kbuildsycoca6 >/dev/null 2>&1; then
  kbuildsycoca6 >/dev/null 2>&1 || true
elif command -v kbuildsycoca5 >/dev/null 2>&1; then
  kbuildsycoca5 >/dev/null 2>&1 || true
fi

step "Concluido"
printf "Runtime instalado: tauri\n"
printf "Atalho de menu: %s\n" "$DESKTOP_PATH"
printf "Execucao direta: %s\n" "$BIN_PATH"
printf "Desinstalar: ./scripts/uninstall.sh\n"
printf "Nota: canal local (--no-bundle) nao instala update in-app automaticamente.\n"
