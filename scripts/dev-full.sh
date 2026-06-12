#!/usr/bin/env bash
# =====================================================================
# dev-full.sh — Pomodoroz (Tauri: Rust + TS)
# Menu rico + gates do projeto (nome unico do menu na UnidadeD —
# LEVANTAMENTO_MENUS_DEV.md §10). Ex-validar-tudo.sh (renomeado em
# 2026-06-12); 'scripts/validar-tudo.sh' segue como alias fino.
#   - Interativo (sem args, stdin tty): abre o menu rico.
#   - Com flags ou stdin nao-tty: roda o fluxo direto (CI/check/alias).
# =====================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT"
SCRIPT_INSTALL="$ROOT/scripts/install.sh"
LOCAL_INSTALL_BINARY=""

if [[ -n "${HOME:-}" ]]; then
  LOCAL_INSTALL_BINARY="${HOME}/.local/opt/pomodoroz/pomodoroz_tauri"
fi

SKIP_INSTALL=0
RUN_DEV=0
RUN_PACKED=0
RUN_INSTALLERS=0
INSTALLERS_PROFILE="slim"
RUN_INSTALL_LOCAL=0
RUN_QUICK_DEV=0
LOG_MODE="none"
LOG_TIMESTAMP=""
GENERAL_LOG_FILE=""
CARGO_FMT_LOG_FILE=""
CARGO_CLIPPY_LOG_FILE=""
CARGO_CHECK_LOG_FILE=""
ORIGINAL_ARGC=$#

step() {
  printf "\n==> %s\n" "$1"
}

die() {
  printf "Erro: %s\n" "$1" >&2
  exit 1
}

local_install_runtime_is_running() {
  local exe_link=""
  local exe_path=""

  [[ "$(uname -s)" == "Linux" ]] || return 1
  [[ -n "$LOCAL_INSTALL_BINARY" ]] || return 1

  for exe_link in /proc/[0-9]*/exe; do
    [[ -L "$exe_link" ]] || continue

    exe_path="$(readlink "$exe_link" 2>/dev/null || true)"
    exe_path="${exe_path% (deleted)}"

    if [[ "$exe_path" == "$LOCAL_INSTALL_BINARY" ]]; then
      return 0
    fi
  done

  return 1
}

abort_if_local_install_runtime_is_running() {
  if local_install_runtime_is_running; then
    printf "Instancia ja executando. Abortado.\n" >&2
    printf "Feche o aplicativo instalado antes de iniciar esta execucao.\n" >&2
    exit 1
  fi
}

run_dev_runtime_allow_interrupt() {
  local interrupted=0
  local rc=0

  abort_if_local_install_runtime_is_running

  trap 'interrupted=1' INT
  set +e
  (
    cd "$APP_DIR" &&
      pnpm tauri dev
  )
  rc=$?
  set -e
  trap - INT

  if (( interrupted == 1 || rc == 130 )); then
    echo "Execucao dev interrompida pelo usuario (Ctrl+C)."
    return 0
  fi

  return "$rc"
}

tauri_installers_bundles() {
  local profile="$1"
  case "$(uname -s)" in
    Linux*)
      if [[ "$profile" == "full" ]]; then
        echo "appimage,deb,rpm"
      else
        echo "appimage,deb"
      fi
      ;;
    Darwin*)
      if [[ "$profile" == "full" ]]; then
        echo "app,dmg"
      else
        echo "dmg"
      fi
      ;;
    *)
      if [[ "$profile" == "full" ]]; then
        echo "nsis,msi"
      else
        echo "nsis"
      fi
      ;;
  esac
}

tauri_bundles_include_appimage() {
  local bundles_csv="$1"
  case ",${bundles_csv}," in
    *,appimage,*) return 0 ;;
    *) return 1 ;;
  esac
}

tauri_bundles_without_appimage() {
  local bundles_csv="$1"
  echo "$bundles_csv" | tr ',' '\n' | awk '
    $1 == "appimage" { next }
    NF > 0 { print $1 }
  ' | paste -sd, -
}

tauri_release_binary_path() {
  case "$(uname -s)" in
    Linux*|Darwin*) echo "$APP_DIR/src-tauri/target/release/pomodoroz_tauri" ;;
    *) echo "$APP_DIR/src-tauri/target/release/pomodoroz_tauri.exe" ;;
  esac
}

run_tauri_appimage_build() {
  local extra_args=("$@")
  local gdk_pkgfix_dir=""
  local gdk_binary_dir=""
  local gdk_binary_version=""
  local old_no_strip="${NO_STRIP-__UNSET__}"
  local old_extract_run="${APPIMAGE_EXTRACT_AND_RUN-__UNSET__}"
  local old_pkg_config_path="${PKG_CONFIG_PATH-__UNSET__}"
  local rc=0

  export NO_STRIP=1
  export APPIMAGE_EXTRACT_AND_RUN=1

  if [[ "$(uname -s)" == "Linux" ]] && command -v pkgconf >/dev/null 2>&1; then
    gdk_binary_dir="$(pkgconf --variable=gdk_pixbuf_binarydir gdk-pixbuf-2.0 2>/dev/null || true)"
    gdk_binary_version="$(pkgconf --variable=gdk_pixbuf_binary_version gdk-pixbuf-2.0 2>/dev/null || true)"
    if [[ -n "$gdk_binary_dir" && ! -d "$gdk_binary_dir" ]]; then
      local gdk_pc_path
      gdk_pc_path="$(pkgconf --path gdk-pixbuf-2.0 2>/dev/null || true)"
      [[ -n "$gdk_pc_path" && -f "$gdk_pc_path" ]] || die "gdk-pixbuf-2.0.pc nao encontrado para workaround de AppImage."
      command -v gdk-pixbuf-query-loaders >/dev/null 2>&1 || die "gdk-pixbuf-query-loaders nao encontrado para workaround de AppImage."

      gdk_pkgfix_dir="$(mktemp -d /tmp/pomodoroz-appimage-gdkpixbuf.XXXXXX)"
      gdk_binary_version="${gdk_binary_version:-2.10.0}"
      gdk_binary_dir="$gdk_pkgfix_dir/gdk-pixbuf-2.0/$gdk_binary_version"
      mkdir -p "$gdk_pkgfix_dir/pkgconfig" "$gdk_binary_dir/loaders"
      cp "$gdk_pc_path" "$gdk_pkgfix_dir/pkgconfig/gdk-pixbuf-2.0.pc"
      sed -i "s|^gdk_pixbuf_binarydir=.*|gdk_pixbuf_binarydir=$gdk_binary_dir|" "$gdk_pkgfix_dir/pkgconfig/gdk-pixbuf-2.0.pc"
      sed -i 's|^gdk_pixbuf_moduledir=.*|gdk_pixbuf_moduledir=${gdk_pixbuf_binarydir}/loaders|' "$gdk_pkgfix_dir/pkgconfig/gdk-pixbuf-2.0.pc"
      sed -i 's|^gdk_pixbuf_cache_file=.*|gdk_pixbuf_cache_file=${gdk_pixbuf_binarydir}/loaders.cache|' "$gdk_pkgfix_dir/pkgconfig/gdk-pixbuf-2.0.pc"
      gdk-pixbuf-query-loaders >"$gdk_binary_dir/loaders.cache"
      if [[ "$old_pkg_config_path" == "__UNSET__" ]]; then
        export PKG_CONFIG_PATH="$gdk_pkgfix_dir/pkgconfig"
      else
        export PKG_CONFIG_PATH="$gdk_pkgfix_dir/pkgconfig:$old_pkg_config_path"
      fi
      printf "Info: AppImage usando workaround de gdk-pixbuf em %s\n" "$gdk_binary_dir"
    fi
  fi

  (
    cd "$APP_DIR" &&
      pnpm tauri build --bundles appimage "${extra_args[@]}"
  ) || rc=$?

  if [[ "$old_no_strip" == "__UNSET__" ]]; then
    unset NO_STRIP
  else
    export NO_STRIP="$old_no_strip"
  fi

  if [[ "$old_extract_run" == "__UNSET__" ]]; then
    unset APPIMAGE_EXTRACT_AND_RUN
  else
    export APPIMAGE_EXTRACT_AND_RUN="$old_extract_run"
  fi

  if [[ "$old_pkg_config_path" == "__UNSET__" ]]; then
    unset PKG_CONFIG_PATH
  else
    export PKG_CONFIG_PATH="$old_pkg_config_path"
  fi

  if [[ -n "$gdk_pkgfix_dir" && -d "$gdk_pkgfix_dir" ]]; then
    rm -rf "$gdk_pkgfix_dir"
  fi

  return "$rc"
}

usage() {
  cat <<'EOF2'
Uso:
  ./scripts/dev-full.sh [--skip-install] [--dev | --run-packed | --installers [--installers-full|--installers-slim] | --install-local | --quick-dev] [--log-none|--log-full|--log-full-cargo]
  ./scripts/dev-full.sh                      # menu rico interativo (quando TTY)
  ./scripts/validar-tudo.sh [flags]          # alias de transicao (sempre sem menu)

Fluxo padrao:
  1) valida Node + pnpm
  2) pnpm install (sincroniza lockfile)
  3) pnpm lint (renderer)
  4) pnpm typecheck:renderer
  5) pnpm test:run (renderer)
  6) cargo fmt --check (src-tauri)
  7) cargo clippy -D warnings (src-tauri)
  8) cargo check (src-tauri)
  9) build release tauri sem bundle (pnpm tauri build --no-bundle)

Opcoes:
  --skip-install   Nao roda pnpm install
  --dev            Apos validar, inicia runtime dev (pnpm tauri dev)
  --run-packed     Apos validar, executa o binario release local
  --installers     Apos validar, gera instaladores da plataforma atual
  --installers-full Perfil completo (targets padrao do projeto)
  --installers-slim Perfil enxuto (default)
  --install-local  Executa ./scripts/install.sh
  --quick-dev      Fluxo rapido: lint + typecheck renderer + tauri dev
  --log-none       Nao grava logs em arquivo (default)
  --log-full       Grava log geral em logs/validar-tudo-<timestamp>.log
  --log-full-cargo Grava log geral + logs separados do gate Rust (fmt/clippy/check)
  -h, --help       Mostra esta ajuda
EOF2
}

# =====================================================================
# MENU RICO (padrao UnidadeD — LEVANTAMENTO_MENUS_DEV.md §8): secoes por
# capacidade, status no topo, atalhos mnemonicos fixos, descricao inline.
# Cada opcao chama 'scripts/dev.sh <verbo>' ou reinvoca este script de
# forma nao-interativa com as flags do fluxo — zero redundancia.
# =====================================================================
menu_cyan=$'\033[36m'; menu_gray=$'\033[90m'; menu_yellow=$'\033[33m'; menu_reset=$'\033[0m'
MENU_LOG_FLAG=""

menu_warn() { printf '  %b[ AVISO ]%b %s\n' "$menu_yellow" "$menu_reset" "$*"; }

menu_log_label() {
  case "$MENU_LOG_FLAG" in
    "")               echo "none" ;;
    --log-full)       echo "full" ;;
    --log-full-cargo) echo "full-cargo" ;;
  esac
}

choose_menu_log_mode() {
  printf '\nModo de log dos fluxos do gate (atual: %s):\n' "$(menu_log_label)"
  printf '  1) Sem log em arquivo\n'
  printf '  2) Log geral da execucao (logs/validar-tudo-<timestamp>.log)\n'
  printf '  3) Log geral + logs separados do gate Rust (fmt/clippy/check)\n'
  local log_choice=""
  if ! read -r -p "  Opcao de log [1-3]: " log_choice; then
    return 0
  fi
  case "$log_choice" in
    1) MENU_LOG_FLAG="" ;;
    2) MENU_LOG_FLAG="--log-full" ;;
    3) MENU_LOG_FLAG="--log-full-cargo" ;;
    *) menu_warn "opcao de log invalida: $log_choice" ;;
  esac
}

run_gate_flow() {
  # Reinvoca este script (nao-interativo: argc > 0 ou stdin /dev/null),
  # anexando o modo de log escolhido em [l]. Nao reimplementa fluxo.
  local args=("$@")
  if [[ -n "$MENU_LOG_FLAG" ]]; then
    args+=("$MENU_LOG_FLAG")
  fi
  if (( ${#args[@]} > 0 )); then
    bash "$ROOT/scripts/dev-full.sh" "${args[@]}"
  else
    bash "$ROOT/scripts/dev-full.sh" </dev/null
  fi
}

show_rich_menu() {
  printf '\n%b===============================================%b\n' "$menu_cyan" "$menu_reset"
  printf '%b Pomodoroz - Dev Full%b\n' "$menu_cyan" "$menu_reset"
  printf '%b===============================================%b\n\n' "$menu_cyan" "$menu_reset"
  bash "$ROOT/scripts/dev.sh" status || true
  printf '\n  %b--- Uso diario ---%b\n' "$menu_gray" "$menu_reset"
  printf '  [1]  Quick run (sem install)   %b(lint + typecheck renderer + tauri dev)%b\n' "$menu_gray" "$menu_reset"
  printf '  [2]  Subir app dev             %b(pnpm run dev:app; tauri dev direto, sem gate)%b\n' "$menu_gray" "$menu_reset"
  printf '  [c]  Validar sem install       %b(gate: lint + types + testes + cargo + build)%b\n' "$menu_gray" "$menu_reset"
  printf '  [3]  Preflight completo        %b(pnpm install + gate completo)%b\n' "$menu_gray" "$menu_reset"
  printf '  [4]  Preflight completo + dev  %b(gate completo e depois tauri dev)%b\n' "$menu_gray" "$menu_reset"
  printf '  [u]  Ver libs desatualizadas   %b(check-updates.sh report, read-only)%b\n' "$menu_gray" "$menu_reset"
  printf '  [s]  Status local              %b(toolchain e node_modules)%b\n' "$menu_gray" "$menu_reset"
  printf '  [l]  Modo de log dos fluxos    %b(atual: %s; grava em logs/)%b\n' "$menu_gray" "$(menu_log_label)" "$menu_reset"
  printf '\n  %b--- Setup / dependencias ---%b\n' "$menu_gray" "$menu_reset"
  printf '  [i]  Instalar dependencias     %b(pnpm install)%b\n' "$menu_gray" "$menu_reset"
  printf '  [6]  Instalar app no desktop   %b(scripts/install.sh: release + atalho local)%b\n' "$menu_gray" "$menu_reset"
  printf '\n  %b--- Empacotamento ---%b\n' "$menu_gray" "$menu_reset"
  printf '  [b]  Build release             %b(pnpm run build:tauri, direto sem gate)%b\n' "$menu_gray" "$menu_reset"
  printf '  [v]  Rodar empacotado          %b(preflight completo + executa binario release)%b\n' "$menu_gray" "$menu_reset"
  printf '  [g]  Gerar instaladores        %b(preflight + bundles; pergunta perfil slim/full)%b\n' "$menu_gray" "$menu_reset"
  printf '\n  %b--- Saida ---%b\n' "$menu_gray" "$menu_reset"
  printf '  [0]  Sair                      %b(fecha so o menu)%b\n\n' "$menu_gray" "$menu_reset"
}

menu_installers_flow() {
  printf '\nPerfil dos instaladores:\n'
  printf '  1) Enxuto (Linux: AppImage + deb)\n'
  printf '  2) Completo (targets padrao da plataforma)\n'
  local installer_choice=""
  if ! read -r -p "  Opcao [1-2]: " installer_choice; then
    return 0
  fi
  case "$installer_choice" in
    1) run_gate_flow --installers-slim ;;
    2) run_gate_flow --installers-full ;;
    *) menu_warn "opcao invalida de perfil: $installer_choice"; return 1 ;;
  esac
}

run_rich_menu() {
  local choice=""
  while true; do
    show_rich_menu
    if ! read -r -p "  Opcao: " choice; then
      echo ""
      return 0
    fi
    case "$choice" in
      1)     run_gate_flow --quick-dev || menu_warn "quick run terminou com erro; veja acima" ;;
      2)     bash "$ROOT/scripts/dev.sh" up || menu_warn "up terminou com erro; veja acima" ;;
      c|C)   run_gate_flow --skip-install || menu_warn "validacao falhou; veja acima" ;;
      3)     run_gate_flow || menu_warn "preflight falhou; veja acima" ;;
      4)     run_gate_flow --dev || menu_warn "preflight + dev falhou; veja acima" ;;
      u|U)   bash "$ROOT/scripts/dev.sh" update || menu_warn "auditoria falhou; veja acima" ;;
      s|S)   bash "$ROOT/scripts/dev.sh" status || menu_warn "status falhou; veja acima" ;;
      l|L)   choose_menu_log_mode ;;
      i|I)   bash "$ROOT/scripts/dev.sh" setup || menu_warn "setup falhou; veja acima" ;;
      6)     bash "$ROOT/scripts/install.sh" || menu_warn "instalacao desktop falhou; veja acima" ;;
      b|B)   bash "$ROOT/scripts/dev.sh" build || menu_warn "build falhou; veja acima" ;;
      v|V)   run_gate_flow --run-packed || menu_warn "rodar empacotado falhou; veja acima" ;;
      g|G)   menu_installers_flow || menu_warn "fluxo de instaladores nao concluido; veja acima" ;;
      0|q|Q) return 0 ;;
      *)     menu_warn "opcao invalida" ;;
    esac
  done
}

setup_logging() {
  if [[ "$LOG_MODE" == "none" ]]; then
    return
  fi

  local logs_dir="$APP_DIR/logs"
  mkdir -p "$logs_dir"

  LOG_TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  GENERAL_LOG_FILE="$logs_dir/validar-tudo-$LOG_TIMESTAMP.log"

  if [[ "$LOG_MODE" == "full-cargo" ]]; then
    CARGO_FMT_LOG_FILE="$logs_dir/validar-tudo-cargo-fmt-$LOG_TIMESTAMP.log"
    CARGO_CLIPPY_LOG_FILE="$logs_dir/validar-tudo-cargo-clippy-$LOG_TIMESTAMP.log"
    CARGO_CHECK_LOG_FILE="$logs_dir/validar-tudo-cargo-check-$LOG_TIMESTAMP.log"
  fi

  exec > >(tee -a "$GENERAL_LOG_FILE") 2>&1
  step "Logs ativados"
  printf "Log geral: %s\n" "$GENERAL_LOG_FILE"
  if [[ "$LOG_MODE" == "full-cargo" ]]; then
    printf "Log cargo fmt: %s\n" "$CARGO_FMT_LOG_FILE"
    printf "Log cargo clippy: %s\n" "$CARGO_CLIPPY_LOG_FILE"
    printf "Log cargo check: %s\n" "$CARGO_CHECK_LOG_FILE"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --dev)
      RUN_DEV=1
      shift
      ;;
    --run-packed)
      RUN_PACKED=1
      shift
      ;;
    --installers)
      RUN_INSTALLERS=1
      shift
      ;;
    --installers-full)
      RUN_INSTALLERS=1
      INSTALLERS_PROFILE="full"
      shift
      ;;
    --installers-slim)
      RUN_INSTALLERS=1
      INSTALLERS_PROFILE="slim"
      shift
      ;;
    --install-local)
      RUN_INSTALL_LOCAL=1
      shift
      ;;
    --quick-dev)
      RUN_QUICK_DEV=1
      SKIP_INSTALL=1
      shift
      ;;
    --log-none)
      LOG_MODE="none"
      shift
      ;;
    --log-full)
      LOG_MODE="full"
      shift
      ;;
    --log-full-cargo)
      LOG_MODE="full-cargo"
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

# Interativo (sem args + stdin tty) -> menu rico. Caso contrario (flags,
# alias com </dev/null, CI) segue direto para o fluxo nao-interativo.
if (( ORIGINAL_ARGC == 0 )) && [[ -t 0 ]]; then
  run_rich_menu
  exit 0
fi

setup_logging

if (( RUN_DEV + RUN_PACKED + RUN_INSTALLERS > 1 )); then
  die "Use apenas uma opcao de execucao final: --dev, --run-packed ou --installers."
fi

if (( RUN_INSTALL_LOCAL == 1 )) && (( RUN_DEV == 1 || RUN_PACKED == 1 || RUN_INSTALLERS == 1 || SKIP_INSTALL == 1 || RUN_QUICK_DEV == 1 )); then
  die "--install-local nao pode ser combinado com --dev, --run-packed, --installers, --quick-dev ou --skip-install."
fi

if (( RUN_INSTALL_LOCAL == 1 )); then
  step "Instalacao local (install.sh, runtime: tauri)"
  exec "$SCRIPT_INSTALL"
fi

if (( RUN_QUICK_DEV == 1 )); then
  if (( RUN_DEV == 1 || RUN_PACKED == 1 || RUN_INSTALLERS == 1 )); then
    die "--quick-dev nao pode ser combinado com --dev, --run-packed ou --installers."
  fi
fi

if (( RUN_QUICK_DEV == 1 || RUN_DEV == 1 || RUN_PACKED == 1 )); then
  abort_if_local_install_runtime_is_running
fi

step "Verificando ambiente (Node + pnpm)"
command -v node >/dev/null 2>&1 || die "Node nao encontrado."
command -v pnpm >/dev/null 2>&1 || die "pnpm nao encontrado."
command -v cargo >/dev/null 2>&1 || die "Cargo nao encontrado."

NODE_VERSION="$(node --version | sed 's/^v//')"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"
if (( NODE_MAJOR < 24 )); then
  printf "Node atual: v%s (recomendado: v24 LTS).\n" "$NODE_VERSION"
  printf "Use: nvm install 24 && nvm use 24\n"
else
  printf "Node v%s\n" "$NODE_VERSION"
fi

if (( SKIP_INSTALL == 0 )); then
  step "Sincronizando dependencias (pnpm install)"
  ( cd "$APP_DIR" && pnpm install )
else
  if [[ ! -d "$APP_DIR/node_modules" ]]; then
    die "node_modules ausente com --skip-install/quick run. Rode a opcao 3 (Preflight completo) primeiro, ou execute: node ./scripts/pnpmw.mjs install"
  fi
  step "Pulando pnpm install (--skip-install)"
fi

if (( RUN_QUICK_DEV == 1 )); then
  step "Quick run: lint"
  ( cd "$APP_DIR" && pnpm lint )

  step "Quick run: typecheck renderer"
  ( cd "$APP_DIR" && pnpm typecheck:renderer )

  step "Quick run: dev (Tauri)"
  run_dev_runtime_allow_interrupt || die "Falha ao executar runtime dev Tauri no quick run."
  step "Quick run concluido"
  exit 0
fi

step "Lint completo (ESLint renderer)"
(
  cd "$APP_DIR" &&
    pnpm lint
)

step "Typecheck do renderer (TypeScript)"
(
  cd "$APP_DIR" &&
    pnpm typecheck:renderer
)

step "Testes do renderer (Vitest)"
(
  cd "$APP_DIR" &&
    pnpm test:run
)

if [[ -d "$APP_DIR/src-tauri" ]]; then
  step "Rust quality gate (fmt + clippy + check)"
  if [[ "$LOG_MODE" == "full-cargo" ]]; then
    (
      cd "$APP_DIR/src-tauri" &&
        cargo fmt --all -- --check 2>&1 | tee "$CARGO_FMT_LOG_FILE"
    )
    (
      cd "$APP_DIR/src-tauri" &&
        cargo clippy --all-targets --all-features -- -D warnings 2>&1 | tee "$CARGO_CLIPPY_LOG_FILE"
    )
    (
      cd "$APP_DIR/src-tauri" &&
        cargo check --all-targets --all-features 2>&1 | tee "$CARGO_CHECK_LOG_FILE"
    )
  else
    (
      cd "$APP_DIR/src-tauri" &&
        cargo fmt --all -- --check
    )
    (
      cd "$APP_DIR/src-tauri" &&
        cargo clippy --all-targets --all-features -- -D warnings
    )
    (
      cd "$APP_DIR/src-tauri" &&
        cargo check --all-targets --all-features
    )
  fi
fi

if (( RUN_INSTALLERS == 1 )); then
  bundles=""
  bundles="$(tauri_installers_bundles "$INSTALLERS_PROFILE")"
  bundles_without_appimage=""
  bundles_without_appimage="$(tauri_bundles_without_appimage "$bundles")"

  if [[ -n "$bundles_without_appimage" ]]; then
    step "Gerando instaladores Tauri (bundles base: $bundles_without_appimage)"
    (
      cd "$APP_DIR" &&
        pnpm tauri build --bundles "$bundles_without_appimage" --config '{"bundle":{"createUpdaterArtifacts":false}}'
    )
  fi

  if tauri_bundles_include_appimage "$bundles"; then
    step "Gerando instalador Tauri adicional (bundle: appimage)"
    run_tauri_appimage_build --config '{"bundle":{"createUpdaterArtifacts":false}}' || die "Falha ao gerar AppImage Tauri."
  fi
else
  step "Build release Tauri sem bundle (pnpm tauri build --no-bundle)"
  (
    cd "$APP_DIR" &&
      pnpm tauri build --no-bundle
  )
fi

if (( RUN_DEV == 1 )); then
  step "Iniciando app em modo dev (Tauri)"
  run_dev_runtime_allow_interrupt || die "Falha ao executar runtime dev Tauri."
elif (( RUN_PACKED == 1 )); then
  tauri_bin=""
  tauri_bin="$(tauri_release_binary_path)"
  [[ -f "$tauri_bin" ]] || die "Binario Tauri release nao encontrado: $tauri_bin"
  step "Executando binario Tauri local (release)"
  (
    cd "$APP_DIR" &&
      "$tauri_bin"
  )
elif (( RUN_INSTALLERS == 1 )); then
  step "Instaladores gerados"
  printf "Arquivos em: %s/src-tauri/target/release/bundle\n" "$APP_DIR"
else
  step "Validacao concluida"
  printf "Sem execucao final. Para abrir o app:\n"
  printf "  Dev: ./scripts/dev-full.sh --dev\n"
  printf "  Empacotado: ./scripts/dev-full.sh --run-packed\n"
fi

if [[ "$LOG_MODE" != "none" ]]; then
  step "Logs gerados"
  printf "Log geral: %s\n" "$GENERAL_LOG_FILE"
  if [[ "$LOG_MODE" == "full-cargo" ]]; then
    printf "Log cargo fmt: %s\n" "$CARGO_FMT_LOG_FILE"
    printf "Log cargo clippy: %s\n" "$CARGO_CLIPPY_LOG_FILE"
    printf "Log cargo check: %s\n" "$CARGO_CHECK_LOG_FILE"
  fi
fi
