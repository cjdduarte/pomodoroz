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
ORIGINAL_ARGC=$#

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
  ./scripts/validar-tudo.sh [--skip-install] [--dev | --run-packed | --installers [--installers-full|--installers-slim] | --install-local | --quick-dev]
  ./scripts/validar-tudo.sh                  # menu interativo (quando TTY)

Fluxo padrao:
  1) valida Node + Yarn
  2) yarn install (sincroniza lockfile)
  3) yarn workspace @pomodoroz/shareables run build
  4) yarn lint
  5) yarn workspace @pomodoroz/renderer exec tsc --noEmit -p tsconfig.json
  6) cargo fmt --check (src-tauri)
  7) cargo clippy -D warnings (src-tauri)
  8) yarn build:dir

Opcoes:
  --skip-install   Nao roda yarn install
  --dev            Apos validar, inicia yarn dev:app
  --run-packed     Apos validar, executa o binario empacotado local
  --installers     Apos validar, gera instaladores da plataforma atual
  --installers-full Perfil completo (targets padrao do projeto)
  --installers-slim Perfil enxuto (default)
  --install-local  Executa ./scripts/install.sh
  --quick-dev      Fluxo rapido: yarn lint + typecheck renderer + yarn dev:app
  -h, --help       Mostra esta ajuda
EOF
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
  show_menu
fi

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

step "Verificando ambiente (Node + Yarn)"
command -v node >/dev/null 2>&1 || die "Node nao encontrado."
command -v yarn >/dev/null 2>&1 || die "Yarn nao encontrado."

NODE_VERSION="$(node --version | sed 's/^v//')"
NODE_MAJOR="$(echo "$NODE_VERSION" | cut -d. -f1)"
if (( NODE_MAJOR < 24 )); then
  printf "Node atual: v%s (recomendado: v24 LTS).\n" "$NODE_VERSION"
  printf "Use: nvm install 24 && nvm use 24\n"
else
  printf "Node v%s\n" "$NODE_VERSION"
fi

if (( SKIP_INSTALL == 0 )); then
  step "Sincronizando dependencias (yarn install)"
  ( cd "$APP_DIR" && yarn install )
else
  step "Pulando yarn install (--skip-install)"
fi

if (( RUN_QUICK_DEV == 1 )); then
  step "Quick run: preparando @pomodoroz/shareables"
  ( cd "$APP_DIR" && yarn workspace @pomodoroz/shareables run build )
  step "Quick run: lint"
  ( cd "$APP_DIR" && yarn lint )
  step "Quick run: typecheck renderer"
  (
    cd "$APP_DIR" &&
      yarn workspace @pomodoroz/renderer exec tsc --noEmit -p tsconfig.json
  )
  step "Quick run: dev:app"
  exec bash -lc "cd \"$APP_DIR\" && yarn dev:app"
fi

step "Preparando @pomodoroz/shareables (tipos para dependencias internas)"
( cd "$APP_DIR" && yarn workspace @pomodoroz/shareables run build )

step "Lint completo (ESLint renderer + TypeScript workspaces)"
( cd "$APP_DIR" && yarn lint )

step "Typecheck do renderer (TypeScript)"
(
  cd "$APP_DIR" &&
    yarn workspace @pomodoroz/renderer exec tsc --noEmit -p tsconfig.json
)

if [[ -d "$APP_DIR/src-tauri" ]]; then
  step "Rust quality gate (fmt + clippy)"
  command -v cargo >/dev/null 2>&1 || die "Cargo nao encontrado."
  (
    cd "$APP_DIR/src-tauri" &&
      cargo fmt --all -- --check
  )
  (
    cd "$APP_DIR/src-tauri" &&
      cargo clippy --all-targets --all-features -- -D warnings
  )
fi

if (( RUN_INSTALLERS == 1 )); then
  case "$(uname -s)" in
    Linux*)
      if [[ "$INSTALLERS_PROFILE" == "full" ]]; then
        step "Gerando instaladores Linux (full: build:linux)"
        ( cd "$APP_DIR" && yarn build:linux )
      else
        step "Gerando instaladores Linux (slim: AppImage+deb x64/arm64 + rpm x64)"
        ( cd "$APP_DIR" && yarn build )
        ( cd "$APP_DIR" && yarn workspace pomodoroz run eb --linux AppImage deb --x64 --arm64 --publish=never )
        ( cd "$APP_DIR" && yarn workspace pomodoroz run eb --linux rpm --x64 --publish=never )
      fi
      ;;
    Darwin*)
      step "Gerando instaladores macOS (build:mac)"
      ( cd "$APP_DIR" && yarn build:mac )
      ;;
    *)
      step "Gerando instaladores (build)"
      ( cd "$APP_DIR" && yarn build )
      ;;
  esac
else
  step "Build empacotado (build:dir)"
  ( cd "$APP_DIR" && yarn build:dir )
fi

if (( RUN_DEV == 1 )); then
  step "Iniciando app em modo dev (Electron + Vite)"
  ( cd "$APP_DIR" && yarn dev:app )
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
