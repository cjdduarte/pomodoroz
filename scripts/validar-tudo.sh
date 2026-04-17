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

usage() {
  cat <<'EOF'
Uso:
  ./scripts/validar-tudo.sh [--skip-install] [--dev | --run-packed | --installers [--installers-full|--installers-slim] | --install-local | --quick-dev] [--log-none|--log-full|--log-full-cargo]
  ./scripts/validar-tudo.sh                  # menu interativo (quando TTY)

Fluxo padrao:
  1) valida Node + pnpm
  2) pnpm install (sincroniza lockfile)
  3) pnpm lint (renderer + electron)
  4) pnpm typecheck:renderer
  5) cargo fmt --check (src-tauri)
  6) cargo clippy -D warnings (src-tauri)
  7) pnpm build + pnpm exec electron-builder --dir

Opcoes:
  --skip-install   Nao roda pnpm install
  --dev            Apos validar, inicia pnpm dev:app
  --run-packed     Apos validar, executa o binario empacotado local
  --installers     Apos validar, gera instaladores da plataforma atual
  --installers-full Perfil completo (targets padrao do projeto)
  --installers-slim Perfil enxuto (default)
  --install-local  Executa ./scripts/install.sh
  --quick-dev      Fluxo rapido: lint + typecheck renderer + pnpm dev:app
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
- 1) Quick run (lint + typecheck renderer + dev:app).
- 2) Preflight sem install.
- 3) Preflight completo (com install).
- 4) Preflight completo + Quick run (lint + dev:app).
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
fi

setup_logging

if (( RUN_DEV + RUN_PACKED + RUN_INSTALLERS > 1 )); then
  die "Use apenas uma opcao de execucao final: --dev, --run-packed ou --installers."
fi

if (( RUN_INSTALL_LOCAL == 1 )) && (( RUN_DEV == 1 || RUN_PACKED == 1 || RUN_INSTALLERS == 1 || SKIP_INSTALL == 1 || RUN_QUICK_DEV == 1 )); then
  die "--install-local nao pode ser combinado com --dev, --run-packed, --installers, --quick-dev ou --skip-install."
fi

if (( RUN_INSTALL_LOCAL == 1 )); then
  step "Instalacao local (install.sh)"
  exec "$SCRIPT_INSTALL"
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
  ensure_electron_runtime_for_dev
  step "Quick run: dev:app"
  exec bash -lc "cd \"$APP_DIR\" && pnpm dev:app"
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
else
  step "Build empacotado (pnpm build + electron-builder --dir)"
  ( cd "$APP_DIR" && pnpm build )
  ( cd "$APP_DIR" && pnpm eb --dir )
fi

if (( RUN_DEV == 1 )); then
  ensure_electron_runtime_for_dev
  step "Iniciando app em modo dev (Electron + Vite)"
  ( cd "$APP_DIR" && pnpm dev:app )
elif (( RUN_PACKED == 1 )); then
  step "Executando binario empacotado local"
  ( cd "$APP_DIR" && ./app/electron/dist/linux-unpacked/pomodoroz )
elif (( RUN_INSTALLERS == 1 )); then
  step "Instaladores gerados"
  printf "Arquivos em: %s/app/electron/dist\n" "$APP_DIR"
else
  step "Validacao concluida"
  printf "Sem execucao final. Para abrir o app:\n"
  printf "  Dev: ./scripts/validar-tudo.sh --dev\n"
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
