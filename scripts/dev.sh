#!/usr/bin/env bash
# =====================================================================
# dev.sh — Pomodoroz (Tauri: Rust + TS)
# Contrato DEV_PROTOCOL (PADRAO_SCRIPTS_SH.md na raiz da UnidadeD):
#   dev.sh setup|up|check|build|update|status|stop|menu   (sem argumento: menu)
#
# Delega para os scripts/aliases existentes do projeto:
#   setup  -> pnpm install
#   up     -> pnpm run dev:app            (tauri dev)
#   check  -> ./scripts/dev-full.sh --skip-install  (gates completos;
#             'validar-tudo.sh' e alias de transicao deste gate)
#   build  -> pnpm run build:tauri        (tauri build --no-bundle)
#   update -> ./scripts/check-updates.sh report
#
# Menu rico: ./scripts/dev-full.sh (padrao UnidadeD). Este dev.sh expoe
# os verbos; cada item do menu chama o MESMO verbo (sem reimplementar).
# =====================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

green=$'\033[32m'; yellow=$'\033[33m'; red=$'\033[31m'; cyan=$'\033[36m'; gray=$'\033[90m'; reset=$'\033[0m'
ok()   { printf '  %b[ OK ]%b %s\n'    "$green"  "$reset" "$*"; }
warn() { printf '  %b[ AVISO ]%b %s\n' "$yellow" "$reset" "$*"; }
die()  { printf '  %b[ ERRO ]%b %s\n'  "$red"    "$reset" "$*" >&2; exit 1; }
require_cmd() { command -v "$1" >/dev/null 2>&1 || die "'$1' nao encontrado. $2"; }

v_setup() {
  require_cmd pnpm "Instale pnpm (corepack enable / npm i -g pnpm)."
  ( cd "$ROOT_DIR" && pnpm install )
  ok "dependencias instaladas"
}

v_up() {
  require_cmd pnpm "Instale pnpm (corepack enable / npm i -g pnpm)."
  cd "$ROOT_DIR"
  exec pnpm run dev:app
}

v_check()  { bash "$ROOT_DIR/scripts/dev-full.sh" --skip-install </dev/null; }   # gate, nao-interativo

v_build() {
  require_cmd pnpm "Instale pnpm (corepack enable / npm i -g pnpm)."
  ( cd "$ROOT_DIR" && pnpm run build:tauri )
}

v_update() { bash "$ROOT_DIR/scripts/check-updates.sh" report; }
v_stop()   { warn "sem processo gerenciado: Tauri dev roda em foreground; encerre no proprio terminal."; }

v_status() {
  printf 'Node:  %s\n' "$(node --version 2>/dev/null || echo 'ausente')"
  printf 'pnpm:  %s\n' "$(pnpm --version 2>/dev/null || echo 'ausente')"
  printf 'Rust:  %s\n' "$(rustc --version 2>/dev/null || echo 'ausente')"
  [[ -d "$ROOT_DIR/node_modules" ]] && ok "node_modules presente" || warn "node_modules ausente (rode: dev.sh setup)"
}

dispatch() {
  case "$1" in
    setup)  v_setup ;;
    up)     v_up ;;
    check)  v_check ;;
    build)  v_build ;;
    update) v_update ;;
    status) v_status ;;
    stop)   v_stop ;;
    *) die "verbo desconhecido: $1 (use setup|up|check|build|update|status|stop|menu)" ;;
  esac
}

# Menu rico: mora no dev-full.sh (nome unico do menu na UnidadeD —
# LEVANTAMENTO_MENUS_DEV.md §10). Aqui so delega, sem duplicar.
if [[ $# -eq 0 || "${1:-}" == "menu" ]]; then
  exec "$ROOT_DIR/scripts/dev-full.sh"
else
  dispatch "$1"
fi
