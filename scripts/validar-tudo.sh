#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT"
SCRIPT_INSTALL="$ROOT/scripts/install.sh"

SKIP_INSTALL=0
RUN_DEV=0
RUN_PACKED=0
RUN_INSTALLERS=0
INSTALLERS_PROFILE="slim"
RUN_INSTALL_LOCAL=0
RUN_QUICK_DEV=0
DEV_RUNTIME="electron"
LOG_MODE="none"
LOG_TIMESTAMP=""
GENERAL_LOG_FILE=""
CARGO_FMT_LOG_FILE=""
CARGO_CLIPPY_LOG_FILE=""
ORIGINAL_ARGC=$#

step() {
  printf "\n==> %s\n" "$1"
}

die() {
  printf "Erro: %s\n" "$1" >&2
  exit 1
}

ensure_electron_runtime_for_dev() {
  if (
    cd "$APP_DIR/app/electron" &&
      node -e "try { require('electron'); process.exit(0); } catch (error) { console.error(error.message); process.exit(1); }" >/dev/null 2>&1
  ); then
    return
  fi

  step "Reparando runtime do Electron para modo dev"

  local electron_pkg_path=""
  electron_pkg_path="$(
    cd "$APP_DIR/app/electron" &&
      node -e "try { process.stdout.write(require.resolve('electron/package.json')); } catch (error) { process.exit(1); }"
  )" || die "Pacote electron nao encontrado no workspace app/electron. Rode: pnpm install"

  local install_script
  install_script="$(dirname "$electron_pkg_path")/install.js"

  (
    cd "$APP_DIR/app/electron" &&
      node "$install_script"
  ) || die "Falha no reparo automatico do Electron (install.js)."

  (
    cd "$APP_DIR/app/electron" &&
      node -e "try { require('electron'); process.exit(0); } catch (error) { console.error(error.message); process.exit(1); }"
  ) || die "Electron continua indisponivel apos reparo automatico."
}

runtime_label() {
  case "$DEV_RUNTIME" in
    tauri) echo "Tauri" ;;
    *) echo "Electron + Vite" ;;
  esac
}

show_runtime_menu() {
  cat <<'EOF'
Runtime para validacao:
- 1) Electron + Vite (padrao atual)
- 2) Tauri (pnpm tauri dev)
EOF
  local runtime_choice=""
  if ! read -r -p "Opcao de runtime [1-2]: " runtime_choice; then
    die "falha ao ler opcao de runtime."
  fi

  case "$runtime_choice" in
    1) DEV_RUNTIME="electron" ;;
    2) DEV_RUNTIME="tauri" ;;
    *) die "Opcao de runtime invalida: $runtime_choice" ;;
  esac
}

ensure_runtime_for_mode() {
  case "$DEV_RUNTIME" in
    electron)
      ensure_electron_runtime_for_dev
      ;;
    tauri)
      [[ -d "$APP_DIR/src-tauri" ]] || die "src-tauri nao encontrado para dev runtime tauri."
      command -v cargo >/dev/null 2>&1 || die "Cargo nao encontrado para dev runtime tauri."
      ;;
    *)
      die "Runtime dev invalido: $DEV_RUNTIME"
      ;;
  esac
}

run_dev_runtime_allow_interrupt() {
  local interrupted=0
  local rc=0

  trap 'interrupted=1' INT
  set +e
  (
    cd "$APP_DIR" &&
      if [[ "$DEV_RUNTIME" == "tauri" ]]; then
        pnpm tauri dev
      else
        pnpm dev:app
      fi
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

tauri_appimage_prereqs_ok() {
  local bundles_csv="$1"
  case "$(uname -s)" in
    Linux*) ;;
    *) return 0 ;;
  esac

  if ! tauri_bundles_include_appimage "$bundles_csv"; then
    return 0
  fi

  return 0
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
      command -v gdk-pixbuf-query-loaders >/dev/null 2>&1 || die "gdk-pixbuf-query-loaders nao encontrado para workaround de AppImage."
      gdk_pkgfix_dir="$(mktemp -d /tmp/pomodoroz-appimage-gdkpixbuf.XXXXXX)"
      gdk_binary_version="${gdk_binary_version:-2.10.0}"
      gdk_binary_dir="$gdk_pkgfix_dir/gdk-pixbuf-2.0/$gdk_binary_version"
      mkdir -p "$gdk_pkgfix_dir/pkgconfig" "$gdk_binary_dir/loaders"
      cp /usr/lib/pkgconfig/gdk-pixbuf-2.0.pc "$gdk_pkgfix_dir/pkgconfig/gdk-pixbuf-2.0.pc"
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
  cat <<'EOF'
Uso:
  ./scripts/validar-tudo.sh [--skip-install] [--dev | --run-packed | --installers [--installers-full|--installers-slim] | --install-local | --quick-dev] [--dev-runtime electron|tauri | --dev-electron | --dev-tauri] [--log-none|--log-full|--log-full-cargo]
  ./scripts/validar-tudo.sh                  # menu interativo (quando TTY)

Fluxo padrao:
  1) valida Node + pnpm
  2) pnpm install (sincroniza lockfile)
  3) pnpm lint (renderer + electron)
  4) pnpm typecheck:renderer
  5) cargo fmt --check (src-tauri)
  6) cargo clippy -D warnings (src-tauri)
  7) build empacotado no runtime selecionado (electron-builder --dir ou tauri build --no-bundle)

Opcoes:
  --skip-install   Nao roda pnpm install
  --dev            Apos validar, inicia o runtime dev selecionado
  --run-packed     Apos validar, executa o binario empacotado local
  --installers     Apos validar, gera instaladores da plataforma atual
  --installers-full Perfil completo (targets padrao do projeto)
  --installers-slim Perfil enxuto (default)
  --install-local  Executa ./scripts/install.sh com runtime selecionado
  --quick-dev      Fluxo rapido: lint + typecheck renderer + dev runtime
  --dev-runtime    Runtime da execucao final: electron (default) ou tauri
  --dev-electron   Atalho para --dev-runtime electron
  --dev-tauri      Atalho para --dev-runtime tauri
  --log-none       Nao grava logs em arquivo (default)
  --log-full       Grava log geral em logs/validar-tudo-<timestamp>.log
  --log-full-cargo Grava log geral + logs separados do gate Rust (fmt/clippy)
  -h, --help       Mostra esta ajuda
EOF
}

show_log_menu() {
  cat <<'EOF'
Tipo de log:
- 1) Sem log em arquivo.
- 2) Log geral da execucao (validar-tudo-<timestamp>.log).
- 3) Log geral + logs separados do Rust gate (fmt/clippy).
EOF
  local log_choice=""
  if ! read -r -p "Opcao de log [1-3]: " log_choice; then
    die "falha ao ler opcao de log."
  fi

  case "$log_choice" in
    1) LOG_MODE="none" ;;
    2) LOG_MODE="full" ;;
    3) LOG_MODE="full-cargo" ;;
    *) die "Opcao de log invalida: $log_choice" ;;
  esac
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
  fi

  exec > >(tee -a "$GENERAL_LOG_FILE") 2>&1
  step "Logs ativados"
  printf "Log geral: %s\n" "$GENERAL_LOG_FILE"
  if [[ "$LOG_MODE" == "full-cargo" ]]; then
    printf "Log cargo fmt: %s\n" "$CARGO_FMT_LOG_FILE"
    printf "Log cargo clippy: %s\n" "$CARGO_CLIPPY_LOG_FILE"
  fi
}

show_menu() {
  cat <<'EOF'
Menu de validacao:
Escada de execucao (simples -> completo):
- 1) Quick run (lint + typecheck renderer + dev runtime).
- 2) Preflight sem install.
- 3) Preflight completo (com install).
- 4) Preflight completo + Quick run (lint + dev runtime).
- 5) (3) + empacotado.
- 6) Instalar localmente.
- 7) Gerar instaladores da plataforma atual.
EOF
  echo "Escolha o fluxo:"
  echo "  1) Quick run"
  echo "  2) Preflight sem install"
  echo "  3) Preflight completo"
  echo "  4) Preflight completo + Quick run"
  echo "  5) Preflight completo + empacotado"
  echo "  6) Instalar localmente"
  echo "  7) Gerar instaladores"
  echo "  8) Cancelar"
  local choice=""
  if ! read -r -p "Opcao [1-8]: " choice; then
    die "falha ao ler opcao."
  fi

  case "$choice" in
    1)
      RUN_QUICK_DEV=1
      SKIP_INSTALL=1
      ;;
    2)
      SKIP_INSTALL=1
      ;;
    3)
      ;;
    4)
      RUN_DEV=1
      ;;
    5)
      RUN_PACKED=1
      ;;
    6)
      RUN_INSTALL_LOCAL=1
      ;;
    7)
      RUN_INSTALLERS=1
      echo ""
      echo "Perfil dos instaladores:"
      echo "  1) Enxuto (Windows x64; Linux sem rpm arm64)"
      echo "  2) Completo (targets padrao do projeto)"
      local installer_choice=""
      if ! read -r -p "Opcao [1-2]: " installer_choice; then
        die "falha ao ler opcao de perfil."
      fi
      case "$installer_choice" in
        1) INSTALLERS_PROFILE="slim" ;;
        2) INSTALLERS_PROFILE="full" ;;
        *) die "Opcao invalida de perfil: $installer_choice" ;;
      esac
      ;;
    8)
      echo "Cancelado."
      exit 0
      ;;
    *)
      die "Opcao invalida: $choice"
      ;;
  esac
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
    --dev-runtime)
      shift
      [[ $# -gt 0 ]] || die "Informe runtime apos --dev-runtime (electron|tauri)."
      case "$1" in
        electron|tauri) DEV_RUNTIME="$1" ;;
        *) die "Runtime invalido para --dev-runtime: $1 (use electron|tauri)." ;;
      esac
      shift
      ;;
    --dev-electron)
      DEV_RUNTIME="electron"
      shift
      ;;
    --dev-tauri)
      DEV_RUNTIME="tauri"
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

if (( ORIGINAL_ARGC == 0 )) && [[ -t 0 ]]; then
  show_log_menu
  show_menu
  if (( RUN_QUICK_DEV == 1 || RUN_DEV == 1 || RUN_PACKED == 1 || RUN_INSTALLERS == 1 || RUN_INSTALL_LOCAL == 1 )); then
    show_runtime_menu
  fi
fi

setup_logging

if (( RUN_DEV + RUN_PACKED + RUN_INSTALLERS > 1 )); then
  die "Use apenas uma opcao de execucao final: --dev, --run-packed ou --installers."
fi

if (( RUN_INSTALL_LOCAL == 1 )) && (( RUN_DEV == 1 || RUN_PACKED == 1 || RUN_INSTALLERS == 1 || SKIP_INSTALL == 1 || RUN_QUICK_DEV == 1 )); then
  die "--install-local nao pode ser combinado com --dev, --run-packed, --installers, --quick-dev ou --skip-install."
fi

if (( RUN_INSTALL_LOCAL == 1 )); then
  step "Instalacao local (install.sh, runtime: $DEV_RUNTIME)"
  exec "$SCRIPT_INSTALL" --runtime "$DEV_RUNTIME"
fi

if (( RUN_QUICK_DEV == 1 )); then
  if (( RUN_DEV == 1 || RUN_PACKED == 1 || RUN_INSTALLERS == 1 )); then
    die "--quick-dev nao pode ser combinado com --dev, --run-packed ou --installers."
  fi
fi

step "Verificando ambiente (Node + pnpm)"
command -v node >/dev/null 2>&1 || die "Node nao encontrado."
command -v pnpm >/dev/null 2>&1 || die "pnpm nao encontrado."

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
  step "Pulando pnpm install (--skip-install)"
fi

if (( RUN_QUICK_DEV == 1 )); then
  step "Quick run: lint"
  (
    cd "$APP_DIR" &&
      pnpm lint
  )
  step "Quick run: typecheck renderer"
  (
    cd "$APP_DIR" &&
      pnpm typecheck:renderer
  )
  ensure_runtime_for_mode
  step "Quick run: dev ($(runtime_label))"
  run_dev_runtime_allow_interrupt || die "Falha ao executar runtime dev ($DEV_RUNTIME) no quick run."
  step "Quick run concluido"
  exit 0
fi

step "Lint completo (ESLint renderer + TypeScript)"
(
  cd "$APP_DIR" &&
    pnpm lint
)

step "Typecheck do renderer (TypeScript)"
(
  cd "$APP_DIR" &&
    pnpm typecheck:renderer
)

if [[ -d "$APP_DIR/src-tauri" ]]; then
  step "Rust quality gate (fmt + clippy)"
  command -v cargo >/dev/null 2>&1 || die "Cargo nao encontrado."
  if [[ "$LOG_MODE" == "full-cargo" ]]; then
    (
      cd "$APP_DIR/src-tauri" &&
        cargo fmt --all -- --check 2>&1 | tee "$CARGO_FMT_LOG_FILE"
    )
    (
      cd "$APP_DIR/src-tauri" &&
        cargo clippy --all-targets --all-features -- -D warnings 2>&1 | tee "$CARGO_CLIPPY_LOG_FILE"
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
  fi
fi

if (( RUN_INSTALLERS == 1 )); then
  if [[ "$DEV_RUNTIME" == "tauri" ]]; then
    bundles=""
    bundles="$(tauri_installers_bundles "$INSTALLERS_PROFILE")"
    bundles_without_appimage=""
    bundles_without_appimage="$(tauri_bundles_without_appimage "$bundles")"

    if [[ -n "$bundles_without_appimage" ]]; then
      step "Gerando instaladores Tauri (bundles base: $bundles_without_appimage)"
      if [[ "$(uname -s)" == "Linux" ]] && tauri_bundles_include_appimage "$bundles"; then
        # Sem appimage no lote base, o updater do Tauri pode falhar ao tentar gerar artefatos.
        ( cd "$APP_DIR" && pnpm tauri build --bundles "$bundles_without_appimage" --config '{"bundle":{"createUpdaterArtifacts":false}}' )
      else
        ( cd "$APP_DIR" && pnpm tauri build --bundles "$bundles_without_appimage" )
      fi
    fi

    if tauri_bundles_include_appimage "$bundles"; then
      if tauri_appimage_prereqs_ok "$bundles"; then
        step "Gerando instalador Tauri adicional (bundle: appimage)"
        # Fluxo local de instaladores nao precisa gerar artefato de updater assinado.
        run_tauri_appimage_build --config '{"bundle":{"createUpdaterArtifacts":false}}' || die "Falha ao gerar AppImage Tauri."
      fi
    fi
  else
    case "$(uname -s)" in
      Linux*)
        if [[ "$INSTALLERS_PROFILE" == "full" ]]; then
          step "Gerando instaladores Linux (full: AppImage+deb+rpm x64/arm64)"
          ( cd "$APP_DIR" && pnpm build )
          ( cd "$APP_DIR" && pnpm eb --linux --x64 --arm64 --publish=never )
        else
          step "Gerando instaladores Linux (slim: AppImage+deb x64/arm64 + rpm x64)"
          ( cd "$APP_DIR" && pnpm build )
          ( cd "$APP_DIR" && pnpm eb --linux AppImage deb --x64 --arm64 --publish=never )
          ( cd "$APP_DIR" && pnpm eb --linux rpm --x64 --publish=never )
        fi
        ;;
      Darwin*)
        step "Gerando instaladores macOS (full/slim: --mac --publish=never)"
        ( cd "$APP_DIR" && pnpm build )
        ( cd "$APP_DIR" && pnpm eb --mac --publish=never )
        ;;
      *)
        step "Gerando instaladores Windows (full/slim: --win --ia32 --x64 --publish=never)"
        ( cd "$APP_DIR" && pnpm build )
        ( cd "$APP_DIR" && pnpm eb --win --ia32 --x64 --publish=never )
        ;;
    esac
  fi
else
  if [[ "$DEV_RUNTIME" == "tauri" ]]; then
    step "Build release Tauri sem bundle (pnpm tauri build --no-bundle)"
    ( cd "$APP_DIR" && pnpm tauri build --no-bundle )
  else
    step "Build empacotado (pnpm build + electron-builder --dir)"
    ( cd "$APP_DIR" && pnpm build )
    ( cd "$APP_DIR" && pnpm eb --dir )
  fi
fi

if (( RUN_DEV == 1 )); then
  ensure_runtime_for_mode
  step "Iniciando app em modo dev ($(runtime_label))"
  run_dev_runtime_allow_interrupt || die "Falha ao executar runtime dev ($DEV_RUNTIME)."
elif (( RUN_PACKED == 1 )); then
  if [[ "$DEV_RUNTIME" == "tauri" ]]; then
    tauri_bin=""
    tauri_bin="$(tauri_release_binary_path)"
    [[ -f "$tauri_bin" ]] || die "Binario Tauri release nao encontrado: $tauri_bin"
    step "Executando binario Tauri local (release)"
    ( cd "$APP_DIR" && "$tauri_bin" )
  else
    step "Executando binario empacotado local"
    ( cd "$APP_DIR" && ./app/electron/dist/linux-unpacked/pomodoroz )
  fi
elif (( RUN_INSTALLERS == 1 )); then
  step "Instaladores gerados"
  if [[ "$DEV_RUNTIME" == "tauri" ]]; then
    printf "Arquivos em: %s/src-tauri/target/release/bundle\n" "$APP_DIR"
  else
    printf "Arquivos em: %s/app/electron/dist\n" "$APP_DIR"
  fi
else
  step "Validacao concluida"
  printf "Sem execucao final. Para abrir o app:\n"
  printf "  Dev (Electron): ./scripts/validar-tudo.sh --dev --dev-electron\n"
  printf "  Dev (Tauri): ./scripts/validar-tudo.sh --dev --dev-tauri\n"
  printf "  Empacotado: ./scripts/validar-tudo.sh --run-packed\n"
fi

if [[ "$LOG_MODE" != "none" ]]; then
  step "Logs gerados"
  printf "Log geral: %s\n" "$GENERAL_LOG_FILE"
  if [[ "$LOG_MODE" == "full-cargo" ]]; then
    printf "Log cargo fmt: %s\n" "$CARGO_FMT_LOG_FILE"
    printf "Log cargo clippy: %s\n" "$CARGO_CLIPPY_LOG_FILE"
  fi
fi
