#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT"

INSTALL_ROOT="${HOME}/.local/opt/pomodoroz"
APPIMAGE_PATH="${INSTALL_ROOT}/Pomodoroz.AppImage"
APPIMAGE_PREVIOUS_PATH="${INSTALL_ROOT}/Pomodoroz.AppImage.previous"
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
  cat <<'EOF'
Uso:
  ./scripts/install.sh [--skip-build]

O que faz:
  1) (Padrao) roda pre-check completo (lint + build:dir)
  2) gera AppImage
  3) instala AppImage em ~/.local/opt/pomodoroz
  4) cria launcher em ~/.local/bin/pomodoroz
  5) cria atalho de menu em ~/.local/share/applications/pomodoroz.desktop
  6) instala icone local em ~/.local/share/icons/hicolor/256x256/apps/pomodoroz.png

Com --skip-build:
  - Pula pre-check/build e apenas instala um AppImage ja existente em dist/

Comportamento de atualizacao:
  - Se ja existir instalacao local, o AppImage anterior e salvo em
    ~/.local/opt/pomodoroz/Pomodoroz.AppImage.previous e o novo substitui o atual.

Remocao:
  - Use ./scripts/uninstall.sh para remover somente a instalacao local criada
    por este script.
EOF
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

for cmd in node pnpm; do
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
  ARCH_RAW="$(uname -m)"
  case "$ARCH_RAW" in
    x86_64) ELECTRON_ARCH_FLAG="--x64" ;;
    aarch64|arm64) ELECTRON_ARCH_FLAG="--arm64" ;;
    *)
      die "Arquitetura nao suportada para build automatico: ${ARCH_RAW}"
      ;;
  esac

  step "Lint completo (ESLint renderer + TypeScript)"
  ( cd "$APP_DIR" && pnpm lint )

  step "Build empacotado (build:dir)"
  ( cd "$APP_DIR" && pnpm build:dir )

  step "Gerando AppImage (${ARCH_RAW})"
  (
    cd "$APP_DIR" &&
      pnpm eb --linux AppImage "$ELECTRON_ARCH_FLAG" --publish=never
  )
else
  step "Pulando pre-check/build (--skip-build)"
fi

DIST_DIR="${APP_DIR}/app/electron/dist"
[[ -d "$DIST_DIR" ]] || die "Diretorio de dist nao encontrado: $DIST_DIR"

ARCH_RAW="$(uname -m)"
case "$ARCH_RAW" in
  x86_64) ARCH_PATTERN="x86_64" ;;
  aarch64|arm64) ARCH_PATTERN="arm64" ;;
  *)
    step "Arquitetura nao mapeada ($ARCH_RAW), usando fallback automatico"
    ARCH_PATTERN=""
    ;;
esac

if [[ -n "$ARCH_PATTERN" ]]; then
  APPIMAGE_CANDIDATE="$(
    find "$DIST_DIR" -maxdepth 1 -type f \
      -name "Pomodoroz-v*-linux-${ARCH_PATTERN}.AppImage" |
      sort -V |
      tail -n 1 || true
  )"
else
  APPIMAGE_CANDIDATE=""
fi

if [[ -z "${APPIMAGE_CANDIDATE}" ]]; then
  APPIMAGE_CANDIDATE="$(
    find "$DIST_DIR" -maxdepth 1 -type f \
      -name "Pomodoroz-v*-linux-*.AppImage" |
      sort -V |
      tail -n 1 || true
  )"
fi

[[ -n "${APPIMAGE_CANDIDATE}" ]] || die "Nenhum AppImage encontrado em ${DIST_DIR}."

ICON_SOURCE=""
for candidate in \
  "${APP_DIR}/app/electron/build/assets/logo-dark256x256.png" \
  "${APP_DIR}/app/electron/src/assets/logo-dark256x256.png" \
  "${APP_DIR}/app/electron/src/assets/logo-dark@2x.png"
do
  if [[ -f "$candidate" ]]; then
    ICON_SOURCE="$candidate"
    break
  fi
done

[[ -n "$ICON_SOURCE" ]] || die "Icone nao encontrado."

step "Instalando localmente (menu + icone)"
mkdir -p "$INSTALL_ROOT" "$BIN_DIR" "$DESKTOP_DIR" "$ICON_DIR"

if [[ -f "$APPIMAGE_PATH" ]]; then
  cp -f "$APPIMAGE_PATH" "$APPIMAGE_PREVIOUS_PATH"
  printf "Backup do AppImage anterior salvo em: %s\n" "$APPIMAGE_PREVIOUS_PATH"
fi

cp -f "$APPIMAGE_CANDIDATE" "$APPIMAGE_PATH"
chmod +x "$APPIMAGE_PATH"

cp -f "$ICON_SOURCE" "$ICON_PATH"

cat > "$BIN_PATH" <<EOF
#!/usr/bin/env bash
exec "${APPIMAGE_PATH}" "\$@"
EOF
chmod +x "$BIN_PATH"

cat > "$DESKTOP_PATH" <<EOF
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
Categories=Utility;Productivity;
StartupNotify=true
EOF
# Cleanup de versoes anteriores que criavam alias local extra.
rm -f "$DESKTOP_PATH_LOCAL"

{
  echo "$APPIMAGE_PATH"
  echo "$APPIMAGE_PREVIOUS_PATH"
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

step "Concluido"
printf "Atalho de menu: %s\n" "$DESKTOP_PATH"
printf "Execucao direta: %s\n" "$BIN_PATH"
printf "Desinstalar: ./scripts/uninstall.sh\n"
