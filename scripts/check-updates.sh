#!/usr/bin/env bash
#
# Verificador de Updates para Pomodoroz (JS/TS + Rust)
#
# Uso:
#   ./scripts/check-updates.sh                      # Modo interativo (padrao)
#   ./scripts/check-updates.sh report               # Modo relatorio (sem interacao)
#   ./scripts/check-updates.sh [interactive|report] [none|cargo|full]
#
# Modo de log:
#   - none: sem logs em arquivo
#   - cargo: logs de cargo outdated/audit (padrao atual)
#   - full: log geral + logs de cargo outdated/audit
#
# Modo interativo:
#   - Lista dependencias JS/TS desatualizadas por escopo (projeto raiz)
#   - Permite selecionar updates seguros (patch/minor) e major separadamente
#
# Modo relatorio:
#   - Apenas exibe o status (sem alterar arquivos)
#   - Inclui bloco Rust (cargo outdated/audit) em resumo compacto
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POMODOROZ_DIR="$ROOT_DIR"
ORIGINAL_ARGC=$#

MODE="interactive"
LOG_MODE="cargo"
LOG_TIMESTAMP=""
GENERAL_LOG_FILE=""
CARGO_OUTDATED_LOG_FILE=""
CARGO_AUDIT_LOG_FILE=""

if [[ $# -gt 0 ]]; then
  case "$1" in
    interactive|report)
      MODE="$1"
      shift
      ;;
    none|log-none|--log-none)
      LOG_MODE="none"
      shift
      ;;
    cargo|log-cargo|--log-cargo)
      LOG_MODE="cargo"
      shift
      ;;
    full|log-full|--log-full)
      LOG_MODE="full"
      shift
      ;;
    *)
      echo "Uso: $0 [interactive|report] [none|cargo|full]"
      echo ""
      echo "  interactive  - Modo interativo com selecao de updates (padrao)"
      echo "  report       - Modo relatorio, sem alteracoes"
      echo ""
      echo "  none         - Sem log em arquivo"
      echo "  cargo        - Apenas logs de cargo outdated/audit (default)"
      echo "  full         - Log geral + logs de cargo"
      exit 1
      ;;
  esac
fi

if [[ $# -gt 0 ]]; then
  case "$1" in
    none|log-none|--log-none)
      LOG_MODE="none"
      shift
      ;;
    cargo|log-cargo|--log-cargo)
      LOG_MODE="cargo"
      shift
      ;;
    full|log-full|--log-full)
      LOG_MODE="full"
      shift
      ;;
    *)
      echo "Uso: $0 [interactive|report] [none|cargo|full]"
      exit 1
      ;;
  esac
fi

if [[ $# -gt 0 ]]; then
  echo "Uso: $0 [interactive|report] [none|cargo|full]"
  exit 1
fi

WORKSPACES=(
  "root|$POMODOROZ_DIR"
)

OUTDATED_ROWS=()
declare -A OUTDATED_SEEN=()
OUTDATED_CHECK_FAILED=0
PNPM_VERSION_CURRENT=""
PNPM_VERSION_LATEST=""
CRITICAL_EXACT_PACKAGES=(
  "typescript"
  "@tauri-apps/cli"
  "@tauri-apps/api"
)

print_header() {
  printf "\n===============================================\n"
  printf " Pomodoroz · Verificador de Updates\n"
  if [ "$MODE" = "report" ]; then
    printf " (Modo Relatorio)\n"
  fi
  printf "===============================================\n\n"
}

require_cmd() {
  local cmd="$1"
  local msg="$2"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "[$cmd] $msg"
    return 1
  fi
}

version_gt() {
  local left="$1"
  local right="$2"
  local max_version
  max_version="$(printf "%s\n%s\n" "$left" "$right" | sort -V | tail -n 1)"
  [ "$max_version" = "$left" ] && [ "$left" != "$right" ]
}

collect_release_workflow_pnpm_pins() {
  local workflow_file="$POMODOROZ_DIR/.github/workflows/release-autoupdate.yml"
  if [ ! -f "$workflow_file" ]; then
    return
  fi

  awk '
    /uses:[[:space:]]*pnpm\/action-setup@/ {
      in_setup = 1
      next
    }
    in_setup && /^[[:space:]]*version:[[:space:]]*/ {
      value = $2
      gsub(/"/, "", value)
      print value
      in_setup = 0
      next
    }
    in_setup && /^[[:space:]]*-[[:space:]]+name:/ {
      in_setup = 0
    }
    {
      line = $0
      if (match(line, /corepack[[:space:]]+prepare[[:space:]]+pnpm@([0-9][0-9A-Za-z._-]*)[[:space:]]+--activate/, m)) {
        print m[1]
      }
    }
  ' "$workflow_file" | sort -u
}

check_release_workflow_pnpm_pin() {
  local pins_raw
  pins_raw="$(collect_release_workflow_pnpm_pins || true)"
  if [ -z "$pins_raw" ]; then
    echo "  Release workflow pin (pnpm): ⚠ nao encontrado"
    echo "    Arquivo esperado: .github/workflows/release-autoupdate.yml"
    return
  fi

  local pin_count
  pin_count="$(printf "%s\n" "$pins_raw" | wc -l | tr -d '[:space:]')"
  local pins_display
  pins_display="$(printf "%s\n" "$pins_raw" | paste -sd', ' -)"
  echo "  Release workflow pin (pnpm): ${pins_display}"

  local first_pin
  first_pin="$(printf "%s\n" "$pins_raw" | head -n 1)"

  if [ "$pin_count" -gt 1 ]; then
    echo "    ⚠ Inconsistencia: workflow possui mais de um pin de versao para pnpm."
  fi

  if [ -n "$PNPM_VERSION_CURRENT" ] && [ "$first_pin" != "$PNPM_VERSION_CURRENT" ]; then
    echo "    Aviso: pnpm local (${PNPM_VERSION_CURRENT}) difere do pin do workflow (${first_pin})."
  fi

  if [ -n "$PNPM_VERSION_LATEST" ] && version_gt "$PNPM_VERSION_LATEST" "$first_pin"; then
    echo "    Suggestion: update workflow pin ${first_pin} -> ${PNPM_VERSION_LATEST}"
    echo "    File: .github/workflows/release-autoupdate.yml"
  fi
}

update_release_workflow_pnpm_pin() {
  local target_version="$1"
  local workflow_file="$POMODOROZ_DIR/.github/workflows/release-autoupdate.yml"

  if [ ! -f "$workflow_file" ]; then
    echo "  ⚠ Arquivo de workflow nao encontrado: .github/workflows/release-autoupdate.yml"
    return 1
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "  ⚠ Node nao encontrado para atualizar pin no workflow."
    return 1
  fi

  local node_code
  node_code='
const fs = require("fs");
const file = process.argv[1];
const target = process.argv[2];
const source = fs.readFileSync(file, "utf8");
const lines = source.split(/\r?\n/);
const hadFinalNewline = /\r?\n$/.test(source);
let inSetup = false;
let found = false;
let changed = false;

const out = lines.map((line) => {
  if (/uses:\s*pnpm\/action-setup@/.test(line)) {
    inSetup = true;
    return line;
  }

  if (inSetup && /^\s*version:\s*/.test(line)) {
    found = true;
    const next = line.replace(/version:\s*.*/, `version: ${target}`);
    if (next !== line) changed = true;
    inSetup = false;
    return next;
  }

  if (inSetup && /^\s*-\s+name:/.test(line)) {
    inSetup = false;
  }

  if (/corepack\s+prepare\s+pnpm@/.test(line) && /--activate/.test(line)) {
    found = true;
    const next = line.replace(/(corepack\s+prepare\s+pnpm@)([0-9][0-9A-Za-z._-]*)/, `$1${target}`);
    if (next !== line) changed = true;
    return next;
  }

  return line;
});

if (!found) process.exit(3);
if (!changed) process.exit(0);
fs.writeFileSync(file, out.join("\n") + (hadFinalNewline ? "\n" : ""), "utf8");
'

  if ! node -e "$node_code" "$workflow_file" "$target_version" >/dev/null 2>&1; then
    echo "  ⚠ Falha ao atualizar pin no workflow."
    return 1
  fi

  return 0
}

maybe_offer_release_workflow_pnpm_pin_update() {
  if [ "$MODE" != "interactive" ]; then
    return
  fi

  if [ -z "$PNPM_VERSION_LATEST" ]; then
    return
  fi

  local pins_raw
  pins_raw="$(collect_release_workflow_pnpm_pins || true)"
  if [ -z "$pins_raw" ]; then
    return
  fi

  local pin_count
  pin_count="$(printf "%s\n" "$pins_raw" | wc -l | tr -d '[:space:]')"
  if [ "$pin_count" -ne 1 ]; then
    echo "  ⚠ Pulando atualizacao automatica do pin do workflow: multiplos pins detectados."
    return
  fi

  local current_pin
  current_pin="$(printf "%s\n" "$pins_raw" | head -n 1)"
  if ! version_gt "$PNPM_VERSION_LATEST" "$current_pin"; then
    return
  fi

  echo ""
  local confirm
  if ! read -r -p "Atualizar pin do workflow de release para pnpm@${PNPM_VERSION_LATEST}? (s/N): " confirm; then
    die "falha ao ler confirmacao para update de pin do workflow."
  fi

  if [[ "$confirm" =~ ^[sS]$ ]]; then
    update_release_workflow_pnpm_pin "$PNPM_VERSION_LATEST"
    echo "  ✓ Workflow atualizado: pnpm ${PNPM_VERSION_LATEST}"
  else
    echo "  Pin do workflow mantido em ${current_pin}."
  fi
}

die() {
  echo "ERRO: $1" >&2
  exit 1
}

show_log_menu() {
  cat <<'EOF'
Tipo de log:
- 1) Sem log em arquivo.
- 2) Apenas logs de cargo outdated/audit (padrao).
- 3) Log geral + logs de cargo.
EOF
  local choice=""
  if ! read -r -p "Opcao de log [1-3]: " choice; then
    die "falha ao ler opcao de log."
  fi

  case "$choice" in
    1) LOG_MODE="none" ;;
    2) LOG_MODE="cargo" ;;
    3) LOG_MODE="full" ;;
    *) die "Opcao de log invalida: $choice" ;;
  esac
}

setup_logging() {
  if [[ "$LOG_MODE" != "full" ]]; then
    return
  fi

  local logs_dir="$POMODOROZ_DIR/logs"
  mkdir -p "$logs_dir"
  LOG_TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  GENERAL_LOG_FILE="$logs_dir/check-updates-$LOG_TIMESTAMP.log"
  exec > >(tee -a "$GENERAL_LOG_FILE") 2>&1
}

show_generated_logs() {
  if [[ "$LOG_MODE" == "none" ]]; then
    return
  fi

  if [[ -z "$GENERAL_LOG_FILE" && -z "$CARGO_OUTDATED_LOG_FILE" && -z "$CARGO_AUDIT_LOG_FILE" ]]; then
    return
  fi

  echo ""
  echo "Logs gerados:"
  if [[ -n "$GENERAL_LOG_FILE" ]]; then
    echo "  - Geral: $GENERAL_LOG_FILE"
  fi
  if [[ -n "$CARGO_OUTDATED_LOG_FILE" ]]; then
    echo "  - Cargo outdated: $CARGO_OUTDATED_LOG_FILE"
  fi
  if [[ -n "$CARGO_AUDIT_LOG_FILE" ]]; then
    echo "  - Cargo audit: $CARGO_AUDIT_LOG_FILE"
  fi
}

choose_items() {
  local -n __items=$1
  local prompt="$2"
  local -n __result=$3
  __result=()

  if [ ${#__items[@]} -eq 0 ]; then
    return
  fi

  printf "%s\n" "$prompt"
  for i in "${!__items[@]}"; do
    local ws pkg current wanted latest ptype
    IFS=$'\t' read -r ws pkg current wanted latest ptype <<< "${__items[$i]}"
    printf "  %d) [%s] %s (%s -> %s)\n" \
      "$((i+1))" "$ws" "$pkg" "$current" "$latest"
  done
  printf "  0) Nenhum\n"

  local input=""
  if ! read -r -p "Selecione (ex.: 1 3 4) > " input; then
    die "falha ao ler entrada do usuario."
  fi

  for choice in $input; do
    if [[ $choice =~ ^[0-9]+$ ]] && (( choice >= 1 && choice <= ${#__items[@]} )); then
      __result+=("${__items[$((choice-1))]}")
    fi
  done
}

workspace_dir_by_name() {
  local name
  name="$(normalize_workspace_name "$1")"
  local pair
  for pair in "${WORKSPACES[@]}"; do
    local ws="${pair%%|*}"
    local dir="${pair#*|}"
    if [ "$ws" = "$name" ]; then
      echo "$dir"
      return 0
    fi
  done
  return 1
}

normalize_workspace_name() {
  local ws="$1"
  case "$ws" in
    "" | "root")
      echo "root"
      ;;
    "pomodoroz")
      echo "root"
      ;;
    *)
      echo "$ws"
      ;;
  esac
}

should_preserve_exact_version() {
  local pkg="$1"
  local pinned_pkg
  for pinned_pkg in "${CRITICAL_EXACT_PACKAGES[@]}"; do
    if [ "$pkg" = "$pinned_pkg" ]; then
      return 0
    fi
  done
  return 1
}

get_declared_dependency_spec() {
  local ws_dir="$1"
  local pkg="$2"
  local ptype="$3"
  local pkg_json="$ws_dir/package.json"

  if [ ! -f "$pkg_json" ]; then
    echo ""
    return
  fi

  node -e '
const fs = require("fs");
const file = process.argv[1];
const dependencyType = process.argv[2];
const pkgName = process.argv[3];
try {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const source = json[dependencyType];
  const value = source && source[pkgName];
  if (typeof value === "string") {
    process.stdout.write(value);
  }
} catch {}
' "$pkg_json" "$ptype" "$pkg" 2>/dev/null || true
}

get_supported_semver_prefix() {
  local declared="$1"
  case "$declared" in
    ^*) echo "^" ;;
    ~*) echo "~" ;;
    *) echo "" ;;
  esac
}

apply_declared_semver_prefix() {
  local ws_dir="$1"
  local pkg="$2"
  local ptype="$3"
  local target="$4"
  local declared prefix

  if [ -z "$target" ]; then
    echo ""
    return
  fi

  case "$target" in
    ^*|~*)
      echo "$target"
      return
      ;;
  esac

  declared="$(get_declared_dependency_spec "$ws_dir" "$pkg" "$ptype")"
  prefix="$(get_supported_semver_prefix "$declared")"

  if [ -z "$prefix" ]; then
    echo "$target"
    return
  fi

  case "$target" in
    [0-9]*)
      echo "${prefix}${target}"
      ;;
    *)
      echo "$target"
      ;;
  esac
}

apply_exact_update_by_type() {
  local ws="$1"
  local ws_dir="$2"
  local pkg="$3"
  local latest="$4"
  local ptype="$5"

  case "$ptype" in
    devDependencies)
      echo "  -> [$ws] aplicando exato: pnpm add -D -E $pkg@$latest"
      ( cd "$ws_dir" && pnpm add -D -E "$pkg@$latest" )
      ;;
    dependencies)
      echo "  -> [$ws] aplicando exato: pnpm add -E $pkg@$latest"
      ( cd "$ws_dir" && pnpm add -E "$pkg@$latest" )
      ;;
    optionalDependencies)
      echo "  -> [$ws] aplicando exato: pnpm add -O -E $pkg@$latest"
      ( cd "$ws_dir" && pnpm add -O -E "$pkg@$latest" )
      ;;
    *)
      echo "  -> [$ws] tipo '$ptype' sem suporte direto para -E; fallback: pnpm add -E $pkg@$latest"
      ( cd "$ws_dir" && pnpm add -E "$pkg@$latest" )
      ;;
  esac
}

apply_update_by_type() {
  local ws="$1"
  local ws_dir="$2"
  local pkg="$3"
  local target="$4"
  local ptype="$5"

  case "$ptype" in
    devDependencies)
      echo "  -> [$ws] pnpm add -D $pkg@$target"
      ( cd "$ws_dir" && pnpm add -D "$pkg@$target" )
      ;;
    dependencies)
      echo "  -> [$ws] pnpm add $pkg@$target"
      ( cd "$ws_dir" && pnpm add "$pkg@$target" )
      ;;
    optionalDependencies)
      echo "  -> [$ws] pnpm add -O $pkg@$target"
      ( cd "$ws_dir" && pnpm add -O "$pkg@$target" )
      ;;
    *)
      echo "  -> [$ws] tipo '$ptype' sem suporte direto; fallback: pnpm add $pkg@$target"
      ( cd "$ws_dir" && pnpm add "$pkg@$target" )
      ;;
  esac
}

add_outdated_row() {
  local ws="$1"
  local pkg="$2"
  local current="$3"
  local wanted="$4"
  local latest="$5"
  local ptype="$6"

  local key="${ws}"$'\t'"${pkg}"$'\t'"${current}"$'\t'"${wanted}"$'\t'"${latest}"$'\t'"${ptype}"
  if [[ -n "${OUTDATED_SEEN[$key]:-}" ]]; then
    return
  fi

  OUTDATED_SEEN["$key"]=1
  OUTDATED_ROWS+=("$key")
}

extract_major() {
  local v="$1"
  # remove prefixos comuns (^, ~, >=, etc.) e sufixos
  v="$(echo "$v" | sed -E 's/^[^0-9]*//; s/[^0-9.].*$//')"
  local major="${v%%.*}"
  if [[ "$major" =~ ^[0-9]+$ ]]; then
    echo "$major"
  else
    echo ""
  fi
}

is_major_update() {
  local current="$1"
  local latest="$2"
  local current_major latest_major current_minor latest_minor
  current_major="$(extract_major "$current")"
  latest_major="$(extract_major "$latest")"

  # Se nao conseguir inferir major, trata como major por seguranca.
  if [ -z "$current_major" ] || [ -z "$latest_major" ]; then
    return 0
  fi

  if [ "$current_major" != "$latest_major" ]; then
    return 0
  fi

  # Em versoes 0.x, mudanca de minor pode quebrar.
  if [ "$current_major" = "0" ] && [ "$latest_major" = "0" ]; then
    current_minor="$(echo "$current" | sed -E 's/^[^0-9]*[0-9]+\.([0-9]+).*/\1/')"
    latest_minor="$(echo "$latest" | sed -E 's/^[^0-9]*[0-9]+\.([0-9]+).*/\1/')"
    if [[ "$current_minor" =~ ^[0-9]+$ ]] && [[ "$latest_minor" =~ ^[0-9]+$ ]] && [ "$current_minor" != "$latest_minor" ]; then
      return 0
    fi
  fi

  return 1
}

check_dev_environment() {
  echo "[1/5] Ambiente de Desenvolvimento"

  if command -v node >/dev/null 2>&1; then
    local node_version
    local node_major
    node_version="$(node --version | sed 's/^v//')"
    node_major="$(echo "$node_version" | cut -d. -f1)"
    printf "  Node.js: v%s" "$node_version"
    if (( node_major >= 24 )); then
      echo " ✓"
    else
      echo " ⚠ (recomendado: v24 LTS)"
      echo "    Sugestao: nvm install 24 && nvm use 24"
    fi
  else
    echo "  Node.js: ❌ nao encontrado"
  fi

  if command -v pnpm >/dev/null 2>&1; then
    local pnpm_version pnpm_latest
    local lookup_status
    pnpm_version="$(pnpm --version)"
    PNPM_VERSION_CURRENT="$pnpm_version"
    echo "  pnpm: ${pnpm_version} ✓"

    if command -v npm >/dev/null 2>&1; then
      set +e
      pnpm_latest="$(
        npm view pnpm version --fetch-retries=0 --fetch-timeout=3000 2>/dev/null \
          | head -n 1 \
          | tr -d '[:space:]'
      )"
      lookup_status=$?
      set -e

      if [ "$lookup_status" -eq 0 ] && [ -n "$pnpm_latest" ]; then
        PNPM_VERSION_LATEST="$pnpm_latest"
      fi

      if [ -n "$PNPM_VERSION_LATEST" ] && version_gt "$PNPM_VERSION_LATEST" "$pnpm_version"; then
        echo "    Update available: ${pnpm_version} -> ${PNPM_VERSION_LATEST}"
        if command -v corepack >/dev/null 2>&1; then
          echo "    To update: corepack use pnpm@${PNPM_VERSION_LATEST}"
        else
          echo "    Corepack nao encontrado no PATH."
          echo "    To update (fallback sem root): npm install -g pnpm@${PNPM_VERSION_LATEST} --prefix \"\$HOME/.local\""
          echo "    Se necessario, adicione ao PATH: export PATH=\"\$HOME/.local/bin:\$PATH\""
        fi
      fi
    fi
  else
    echo "  pnpm: ❌ nao encontrado"
  fi

  check_release_workflow_pnpm_pin
  maybe_offer_release_workflow_pnpm_pin_update
}

get_pkg_version() {
  local pkg_json="$1"
  local dep_name="$2"
  node -e '
    const p = require(process.argv[1]);
    const dep = process.argv[2];
    const v =
      (p.dependencies && p.dependencies[dep]) ||
      (p.devDependencies && p.devDependencies[dep]) ||
      (p.peerDependencies && p.peerDependencies[dep]) ||
      "n/a";
    process.stdout.write(v);
  ' "$pkg_json" "$dep_name" 2>/dev/null || echo "n/a"
}

check_stack_versions() {
  echo ""
  echo "[2/5] Stack Atual do Projeto"

  if ! require_cmd node "Node nao encontrado para leitura de package.json."; then
    return
  fi

  local tauri_cli_version react_version ts_version
  local root_pkg
  root_pkg="$POMODOROZ_DIR/package.json"
  tauri_cli_version="$(node -e "const p=require('$root_pkg'); console.log((p.devDependencies&&p.devDependencies['@tauri-apps/cli'])||(p.dependencies&&p.dependencies['@tauri-apps/cli'])||'n/a');" 2>/dev/null || true)"
  react_version="$(get_pkg_version "$root_pkg" "react")"
  ts_version="$(node -e "const p=require('$root_pkg'); console.log((p.devDependencies&&p.devDependencies.typescript)||'n/a');" 2>/dev/null || true)"

  echo "  Tauri CLI (root): ${tauri_cli_version:-n/a}"
  echo "  React (root/src): ${react_version:-n/a}"
  echo "  TypeScript (root): ${ts_version:-n/a}"
}

check_framework_inventory() {
  echo ""
  echo "[3/5] Inventario de Frameworks e Ferramentas"

  local root_pkg="$POMODOROZ_DIR/package.json"

  echo "  [Renderer]"
  echo "    react: $(get_pkg_version "$root_pkg" "react")"
  echo "    react-dom: $(get_pkg_version "$root_pkg" "react-dom")"
  echo "    react-router: $(get_pkg_version "$root_pkg" "react-router")"
  echo "    react-router-dom: $(get_pkg_version "$root_pkg" "react-router-dom")"
  echo "    @reduxjs/toolkit: $(get_pkg_version "$root_pkg" "@reduxjs/toolkit")"
  echo "    styled-components: $(get_pkg_version "$root_pkg" "styled-components")"
  echo "    i18next: $(get_pkg_version "$root_pkg" "i18next")"
  echo "    @dnd-kit/sortable: $(get_pkg_version "$root_pkg" "@dnd-kit/sortable")"
  echo "    @dnd-kit/core: $(get_pkg_version "$root_pkg" "@dnd-kit/core")"
  echo "    vite: $(get_pkg_version "$root_pkg" "vite")"
  echo "    @vitejs/plugin-react: $(get_pkg_version "$root_pkg" "@vitejs/plugin-react")"

  echo "  [Tauri]"
  echo "    @tauri-apps/cli: $(get_pkg_version "$root_pkg" "@tauri-apps/cli")"
  echo "    @tauri-apps/api: $(get_pkg_version "$root_pkg" "@tauri-apps/api")"
  echo "    @tauri-apps/plugin-updater: $(get_pkg_version "$root_pkg" "@tauri-apps/plugin-updater")"
  echo "    @tauri-apps/plugin-dialog: $(get_pkg_version "$root_pkg" "@tauri-apps/plugin-dialog")"

  echo "  [Tooling]"
  echo "    typescript: $(get_pkg_version "$root_pkg" "typescript")"
  echo "    prettier: $(get_pkg_version "$root_pkg" "prettier")"

  local dev_app_script
  dev_app_script="$(node -e "const p=require('$root_pkg'); console.log((p.scripts&&p.scripts['dev:app'])||'n/a');" 2>/dev/null || true)"

  echo "  [Fluxo Atual]"
  echo "    dev:app: ${dev_app_script:-n/a}"
  if node -e '
    const p = require(process.argv[1]);
    const scripts = p.scripts || {};
    const hasTauri = Object.prototype.hasOwnProperty.call(scripts, "tauri");
    process.exit(hasTauri ? 0 : 1);
  ' "$root_pkg" 2>/dev/null; then
    echo "    Runtime principal: Tauri"
  else
    echo "    Runtime principal: nao detectado"
  fi
}

collect_workspace_outdated() {
  local ws_name="$1"
  local ws_dir="$2"

  if [ ! -d "$ws_dir" ] || [ ! -f "$ws_dir/package.json" ]; then
    return
  fi

  local raw status
  set +e
  raw="$(cd "$ws_dir" && pnpm outdated --format json 2>&1)"
  status=$?
  set -e

  # pnpm outdated:
  # 0 = sem updates
  # 1 = existem updates
  # >1 = falha
  if [ "$status" -gt 1 ]; then
    OUTDATED_CHECK_FAILED=1
    echo "  ⚠ [$ws_name] falha ao consultar updates (verifique rede/registry)."
    return
  fi

  if printf "%s\n" "$raw" | grep -q "ERR_PNPM"; then
    OUTDATED_CHECK_FAILED=1
    local err
    err="$(printf "%s\n" "$raw" | sed -n '1,5p' | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g')"
    if [ -n "$err" ]; then
      echo "  ⚠ [$ws_name] falha ao consultar updates: $err"
    else
      echo "  ⚠ [$ws_name] falha ao consultar updates (erro retornado pelo pnpm)."
    fi
    return
  fi

  local parsed
  parsed="$(
    printf "%s\n" "$raw" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
if (!raw) process.exit(0);

let data;
try {
  data = JSON.parse(raw);
} catch {
  process.exit(0);
}

const rows = [];
const pushRow = (pkgName, obj) => {
  if (!obj || typeof obj !== "object") return;
  const pkg = String(pkgName || obj.name || obj.package || "").trim();
  if (!pkg) return;
  const current = String(obj.current ?? "").replace(/\t/g, " ");
  const wanted = String(obj.wanted ?? "").replace(/\t/g, " ");
  const latest = String(obj.latest ?? "").replace(/\t/g, " ");
  const packageType = String(obj.dependencyType ?? obj.packageType ?? obj.type ?? "").replace(/\t/g, " ");
  const workspaceRaw = String(obj.workspace ?? obj.project ?? obj.location ?? "").replace(/\t/g, " ");
  // Evita linha iniciando com TAB (workspace vazio), que desloca colunas no `read`.
  const workspace = workspaceRaw || "__unknown__";
  rows.push([workspace, pkg, current, wanted, latest, packageType].join("\t"));
};

if (Array.isArray(data)) {
  for (const obj of data) pushRow("", obj);
} else if (data && typeof data === "object") {
  if (Array.isArray(data.packages)) {
    for (const obj of data.packages) pushRow("", obj);
  } else {
    for (const [pkgName, obj] of Object.entries(data)) {
      pushRow(pkgName, obj);
    }
  }
}

if (rows.length > 0) {
  process.stdout.write(rows.join("\n"));
}
'
  )"

  if [ -z "$parsed" ]; then
    if [ "$status" -eq 1 ]; then
      OUTDATED_CHECK_FAILED=1
      echo "  ⚠ [$ws_name] resultado inconclusivo: pnpm retornou status 1, mas nao foi possivel parsear tabela de updates."
    fi
    return
  fi

  while IFS=$'\t' read -r ws_from_tool pkg current wanted latest ptype; do
    [ -z "$pkg" ] && continue
    local effective_ws="$ws_name"
    if [ -n "${ws_from_tool:-}" ] && [ "$ws_from_tool" != "__unknown__" ]; then
      local normalized_ws
      normalized_ws="$(normalize_workspace_name "$ws_from_tool")"
      if workspace_dir_by_name "$normalized_ws" >/dev/null 2>&1; then
        effective_ws="$normalized_ws"
      else
        continue
      fi
    fi
    add_outdated_row "$effective_ws" "$pkg" "$current" "$wanted" "$latest" "$ptype"
  done <<< "$parsed"
}

show_outdated_table() {
  if [ ${#OUTDATED_ROWS[@]} -eq 0 ]; then
    if [ "$OUTDATED_CHECK_FAILED" -eq 1 ]; then
      echo "  ⚠ Resultado inconclusivo: houve falha ao consultar o registry em um ou mais escopos."
    else
      echo "  Nenhuma dependencia desatualizada encontrada."
    fi
    return
  fi

  printf "  %-15s %-35s %-12s %-12s %-12s %-10s\n" \
    "Escopo" "Pacote" "Atual" "Wanted" "Latest" "Tipo"
  printf "  %-15s %-35s %-12s %-12s %-12s %-10s\n" \
    "---------" "------" "-----" "------" "------" "----"

  local row ws pkg current wanted latest ptype
  for row in "${OUTDATED_ROWS[@]}"; do
    IFS=$'\t' read -r ws pkg current wanted latest ptype <<< "$row"
    printf "  %-15s %-35s %-12s %-12s %-12s %-10s\n" \
      "$ws" "$pkg" "$current" "$wanted" "$latest" "$ptype"
  done
}

run_updates_for_selected() {
  local -n __rows=$1
  local mode="$2" # safe | major

  local row ws pkg current wanted latest ptype ws_dir target_version
  for row in "${__rows[@]}"; do
    IFS=$'\t' read -r ws pkg current wanted latest ptype <<< "$row"
    ws_dir="$(workspace_dir_by_name "$ws" || true)"
    if [ -z "$ws_dir" ]; then
      echo "  ⚠ Escopo desconhecido: $ws"
      continue
    fi

    if [ "$mode" = "safe" ]; then
      # Ex.: versao fixa sem prefixo semver (range fixa). Precisamos aplicar target explicito.
      # Quando current==wanted e latest!=current, aplicamos versao explicita.
      if [ "$current" = "$wanted" ] && [ "$latest" != "$current" ]; then
        echo "  -> [$ws] versao fixa detectada para $pkg"
        apply_exact_update_by_type "$ws" "$ws_dir" "$pkg" "$latest" "$ptype"
      else
        # Usa "wanted" para patch/minor e preserva o tipo do pacote no package.json.
        target_version="$wanted"
        if [ -z "$target_version" ] || [ "$target_version" = "$current" ]; then
          target_version="$latest"
        fi

        if [ -n "$target_version" ]; then
          target_version="$(apply_declared_semver_prefix "$ws_dir" "$pkg" "$ptype" "$target_version")"
          apply_update_by_type "$ws" "$ws_dir" "$pkg" "$target_version" "$ptype"
        else
          echo "  -> [$ws] sem target inferido; fallback: pnpm add $pkg"
          ( cd "$ws_dir" && pnpm add "$pkg" )
        fi
      fi
    else
      if should_preserve_exact_version "$pkg"; then
        echo "  -> [$ws] pacote critico ($pkg): preservando versao exata no major."
        apply_exact_update_by_type "$ws" "$ws_dir" "$pkg" "$latest" "$ptype"
      else
        target_version="$(apply_declared_semver_prefix "$ws_dir" "$pkg" "$ptype" "$latest")"
        apply_update_by_type "$ws" "$ws_dir" "$pkg" "$target_version" "$ptype"
      fi
    fi
  done
}

check_js_dependencies() {
  echo ""
  echo "[4/5] Dependencias JS/TS (pnpm)"

  if ! require_cmd pnpm "pnpm nao encontrado."; then
    return
  fi
  if ! require_cmd node "Node nao encontrado (necessario para parse do pnpm outdated --format json)."; then
    return
  fi
  if [ ! -f "$POMODOROZ_DIR/pnpm-lock.yaml" ]; then
    echo "  ⚠ pnpm-lock.yaml nao encontrado em $POMODOROZ_DIR."
    echo "    Execute: cd \"$POMODOROZ_DIR\" && pnpm install"
    return
  fi

  OUTDATED_ROWS=()
  OUTDATED_SEEN=()
  OUTDATED_CHECK_FAILED=0

  local pair ws_name ws_dir
  for pair in "${WORKSPACES[@]}"; do
    ws_name="${pair%%|*}"
    ws_dir="${pair#*|}"
    echo "  - Checando [$ws_name]..."
    collect_workspace_outdated "$ws_name" "$ws_dir"
  done

  show_outdated_table

  if [ "$MODE" = "report" ]; then
    if [ ${#OUTDATED_ROWS[@]} -gt 0 ]; then
      echo "  INFO: modo report nao aplica updates."
      echo "        Para selecionar/aplicar updates JS/TS: ./scripts/check-updates.sh"
    fi
    return
  fi

  if [ ${#OUTDATED_ROWS[@]} -eq 0 ]; then
    return
  fi

  local safe_candidates=()
  local major_candidates=()
  local row ws pkg current wanted latest ptype
  for row in "${OUTDATED_ROWS[@]}"; do
    IFS=$'\t' read -r ws pkg current wanted latest ptype <<< "$row"
    if is_major_update "$current" "$latest"; then
      major_candidates+=("$row")
    else
      safe_candidates+=("$row")
    fi
  done

  local selected_safe=()
  local selected_major=()

  if [ ${#safe_candidates[@]} -gt 0 ]; then
    echo ""
    choose_items safe_candidates "Atualizacoes SEGURAS (patch/minor):" selected_safe
  fi
  if [ ${#major_candidates[@]} -gt 0 ]; then
    echo ""
    choose_items major_candidates "Atualizacoes MAJOR (podem quebrar):" selected_major
  fi

  if [ ${#selected_safe[@]} -eq 0 ] && [ ${#selected_major[@]} -eq 0 ]; then
    echo "Nenhum pacote selecionado."
    return
  fi

  echo ""
  if ! read -r -p "Aplicar updates selecionados agora? (s/N): " confirm; then
    die "falha ao ler confirmacao."
  fi
  if [[ ! "$confirm" =~ ^[sS]$ ]]; then
    echo "Atualizacao cancelada."
    return
  fi

  if [ ${#selected_safe[@]} -gt 0 ]; then
    echo ""
    echo "Aplicando updates seguros..."
    run_updates_for_selected selected_safe "safe"
  fi
  if [ ${#selected_major[@]} -gt 0 ]; then
    echo ""
    echo "Aplicando updates major..."
    run_updates_for_selected selected_major "major"
  fi

  echo ""
  echo "✓ Updates concluidos."
  echo "Recomendado:"
  echo "  cd \"$POMODOROZ_DIR\" && pnpm install"
  echo "  cd \"$POMODOROZ_DIR\" && pnpm build"
  echo "  cd \"$POMODOROZ_DIR\" && pnpm tauri dev"
}

cargo_subcommand_available() {
  local subcommand="$1"
  cargo "$subcommand" --version >/dev/null 2>&1
}

show_cargo_outdated_report_summary() {
  local raw_json="$1"
  printf "%s\n" "$raw_json" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
if (!raw) {
  console.log("  Nenhum update de crate root detectado.");
  process.exit(0);
}

let data;
try {
  data = JSON.parse(raw);
} catch {
  console.log("  ⚠ Nao foi possivel parsear a saida JSON de cargo outdated.");
  process.exit(0);
}

const deps = Array.isArray(data.dependencies) ? data.dependencies : [];
if (deps.length === 0) {
  console.log("  Nenhum update de crate root detectado.");
  process.exit(0);
}

console.log("  Root crates com update disponivel:");
console.log("  Crate                           Atual        Latest");
for (const dep of deps) {
  const name = String(dep.name ?? dep.crate ?? dep.package ?? "n/a");
  const current = String(dep.project ?? dep.current ?? dep.version ?? "n/a");
  const latest = String(dep.latest ?? dep.newest ?? dep.target ?? "n/a");
  const n = name.padEnd(31, " ");
  const c = current.padEnd(12, " ");
  console.log(`  ${n} ${c} ${latest}`);
}
'
}

cargo_outdated_root_rows_tsv() {
  local raw_json="$1"
  printf "%s\n" "$raw_json" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
if (!raw) process.exit(0);

let data;
try {
  data = JSON.parse(raw);
} catch {
  process.exit(0);
}

const deps = Array.isArray(data.dependencies) ? data.dependencies : [];
for (const dep of deps) {
  const name = String(dep.name ?? dep.crate ?? dep.package ?? "").trim();
  if (!name) continue;
  const project = String(dep.project ?? dep.current ?? dep.version ?? "n/a").trim();
  const compat = String(dep.compat ?? dep.wanted ?? dep.compatible ?? "n/a").trim();
  const latest = String(dep.latest ?? dep.newest ?? dep.target ?? "n/a").trim();
  process.stdout.write([name, project, compat, latest].join("\t") + "\n");
}
'
}

run_rust_updates_for_selected() {
  local tauri_dir="$1"
  local -n __rows=$2
  local row ws crate current compat target update_kind

  for row in "${__rows[@]}"; do
    IFS=$'\t' read -r ws crate current compat target update_kind <<< "$row"
    if [ -z "$crate" ] || [ -z "$target" ]; then
      continue
    fi

    echo "  -> [$ws] cargo update -p $crate --precise $target"
    local status=0
    set +e
    (
      cd "$tauri_dir" &&
        cargo update -p "$crate" --precise "$target"
    )
    status=$?
    set -e

    if [ "$status" -eq 0 ]; then
      echo "     ✓ atualizado: $crate => $target"
    else
      echo "     ⚠ falha ao aplicar automaticamente para $crate (target $target)."
      echo "       Dica: cd \"$tauri_dir\" && cargo add \"$crate@$target\""
    fi
  done
}

maybe_offer_rust_root_updates() {
  local raw_json="$1"
  local tauri_dir="$2"

  if [ "$MODE" != "interactive" ]; then
    return
  fi
  if [ -z "$raw_json" ]; then
    return
  fi

  local parsed_rows
  parsed_rows="$(cargo_outdated_root_rows_tsv "$raw_json")"
  if [ -z "$parsed_rows" ]; then
    return
  fi

  local safe_candidates=()
  local major_candidates=()
  local crate project compat latest

  while IFS=$'\t' read -r crate project compat latest; do
    [ -z "$crate" ] && continue

    if [ -n "$compat" ] && [ "$compat" != "n/a" ] && [ "$compat" != "Removed" ] && [ "$compat" != "$project" ]; then
      if ! is_major_update "$project" "$compat"; then
        safe_candidates+=("src-tauri"$'\t'"$crate"$'\t'"$project"$'\t'"$compat"$'\t'"$compat"$'\t'"safe")
      fi
    fi

    if [ -n "$latest" ] && [ "$latest" != "n/a" ] && [ "$latest" != "Removed" ] && [ "$latest" != "$project" ]; then
      if is_major_update "$project" "$latest"; then
        major_candidates+=("src-tauri"$'\t'"$crate"$'\t'"$project"$'\t'"$latest"$'\t'"$latest"$'\t'"major")
      fi
    fi
  done <<< "$parsed_rows"

  local selected_safe=()
  local selected_major=()

  if [ ${#safe_candidates[@]} -gt 0 ]; then
    echo ""
    choose_items safe_candidates "Atualizacoes Rust SEGURAS (root crates, patch/minor):" selected_safe
  fi
  if [ ${#major_candidates[@]} -gt 0 ]; then
    echo ""
    choose_items major_candidates "Atualizacoes Rust MAJOR (root crates, podem quebrar):" selected_major
  fi

  if [ ${#selected_safe[@]} -eq 0 ] && [ ${#selected_major[@]} -eq 0 ]; then
    if [ ${#safe_candidates[@]} -eq 0 ] && [ ${#major_candidates[@]} -eq 0 ]; then
      echo "  Nenhum update Rust root elegivel para selecao automatica."
    else
      echo "Nenhum pacote selecionado."
    fi
    return
  fi

  echo ""
  local confirm=""
  if ! read -r -p "Aplicar updates Rust selecionados agora? (s/N): " confirm; then
    die "falha ao ler confirmacao de update Rust."
  fi
  if [[ ! "$confirm" =~ ^[sS]$ ]]; then
    echo "Atualizacao Rust cancelada."
    return
  fi

  if [ ${#selected_safe[@]} -gt 0 ]; then
    echo ""
    echo "Aplicando updates Rust seguros..."
    run_rust_updates_for_selected "$tauri_dir" selected_safe
  fi
  if [ ${#selected_major[@]} -gt 0 ]; then
    echo ""
    echo "Aplicando updates Rust major..."
    run_rust_updates_for_selected "$tauri_dir" selected_major
  fi

  echo "  Recomendado apos updates Rust:"
  echo "    cd \"$tauri_dir\" && cargo check"
}

show_cargo_audit_report_summary() {
  local raw_json="$1"
  printf "%s\n" "$raw_json" | node -e '
const fs = require("fs");
const raw = fs.readFileSync(0, "utf8").trim();
if (!raw) {
  console.log("  ⚠ cargo audit sem saida.");
  process.exit(0);
}

let data;
try {
  data = JSON.parse(raw);
} catch {
  console.log("  ⚠ Nao foi possivel parsear a saida JSON de cargo audit.");
  process.exit(0);
}

const vulnerabilities = data.vulnerabilities?.list ?? [];
const vulnCount = Number(data.vulnerabilities?.count ?? vulnerabilities.length);
const warnings = data.warnings ?? {};
const unmaintained = Array.isArray(warnings.unmaintained) ? warnings.unmaintained : [];
const unsound = Array.isArray(warnings.unsound) ? warnings.unsound : [];
const yanked = Array.isArray(warnings.yanked) ? warnings.yanked : [];
const notice = Array.isArray(warnings.notice) ? warnings.notice : [];

console.log(`  Vulnerabilities: ${vulnCount}`);
console.log(`  Warnings: unmaintained=${unmaintained.length}, unsound=${unsound.length}, yanked=${yanked.length}, notice=${notice.length}`);

const all = [];
const add = (kind, list) => {
  for (const item of list || []) {
    const adv = item.advisory || {};
    const pkg = item.package || {};
    const id = String(adv.id || "n/a");
    const name = String(pkg.name || adv.package || "n/a");
    const version = String(pkg.version || "n/a");
    all.push({ kind, id, name, version });
  }
};
add("vuln", vulnerabilities);
add("unsound", unsound);
add("unmaintained", unmaintained);
add("yanked", yanked);
add("notice", notice);

const seen = new Set();
const unique = [];
for (const item of all) {
  const key = `${item.kind}|${item.id}|${item.name}|${item.version}`;
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(item);
}

if (unique.length === 0) {
  process.exit(0);
}

console.log("  Advisories (resumo):");
for (const item of unique.slice(0, 20)) {
  console.log(`  - [${item.kind}] ${item.id} :: ${item.name}@${item.version}`);
}
if (unique.length > 20) {
  console.log(`  ... (+${unique.length - 20} itens; use cargo audit para detalhes completos)`);
}
'
}

check_rust_dependencies() {
  echo ""
  echo "[5/5] Dependencias Rust (Cargo)"

  if ! require_cmd cargo "Cargo nao encontrado."; then
    return
  fi

  local tauri_dir="$POMODOROZ_DIR/src-tauri"
  local logs_dir="$POMODOROZ_DIR/logs"
  local write_cargo_logs=0
  local log_stamp
  local outdated_log
  local audit_log
  local outdated_json_for_selection=""
  if [ ! -f "$tauri_dir/Cargo.toml" ]; then
    echo "  src-tauri/Cargo.toml nao encontrado; pulando verificacao Rust."
    return
  fi

  if [ "$MODE" != "report" ] && [ "$LOG_MODE" != "none" ]; then
    write_cargo_logs=1
    mkdir -p "$logs_dir"
    log_stamp="$(date +%Y%m%d-%H%M%S)"
    outdated_log="$logs_dir/check-updates-cargo-outdated-$log_stamp.log"
    audit_log="$logs_dir/check-updates-cargo-audit-$log_stamp.log"
    CARGO_OUTDATED_LOG_FILE="$outdated_log"
    CARGO_AUDIT_LOG_FILE="$audit_log"
  fi

  echo "  - Escopo Rust: $tauri_dir"

  if [ "$MODE" = "report" ]; then
    if cargo_subcommand_available outdated; then
      echo "  - Checando crates desatualizados (cargo outdated --root-deps-only --format json)..."
      local outdated_json=""
      local outdated_status=0
      set +e
      outdated_json="$(
        cd "$tauri_dir" &&
          cargo outdated --root-deps-only --format json 2>/dev/null
      )"
      outdated_status=$?
      set -e
      if [ "$outdated_status" -eq 0 ]; then
        show_cargo_outdated_report_summary "$outdated_json"
      else
        echo "  ⚠ Falha ao executar cargo outdated em modo resumo."
        echo "    Dica: verifique rede/crates.io e lock do cache Cargo."
      fi
    else
      echo "  ⚠ cargo-outdated nao instalado."
      echo "    Instale com: cargo install cargo-outdated"
    fi

    if cargo_subcommand_available audit; then
      echo "  - Checando vulnerabilidades (cargo audit --json --no-fetch)..."
      local audit_json=""
      local audit_status=0
      set +e
      audit_json="$(
        cd "$tauri_dir" &&
          cargo audit --json --no-fetch 2>/dev/null
      )"
      audit_status=$?
      set -e
      if [ "$audit_status" -eq 0 ] && [ -n "$audit_json" ]; then
        show_cargo_audit_report_summary "$audit_json"
      else
        echo "  ⚠ Falha ao executar cargo audit em modo resumo."
        echo "    Dica: verifique lock do advisory-db em ~/.cargo."
        echo "    Dica: rode manualmente para detalhes: cd \"$tauri_dir\" && cargo audit"
      fi
    else
      echo "  ⚠ cargo-audit nao instalado."
      echo "    Instale com: cargo install cargo-audit"
    fi

    echo "  Atualizacao manual recomendada:"
    echo "    cd \"$tauri_dir\" && cargo outdated --root-deps-only"
    echo "    cd \"$tauri_dir\" && cargo audit"
    echo "    cd \"$tauri_dir\" && cargo add <crate>@<versao>"
    echo "    cd \"$tauri_dir\" && cargo update -p <crate> --precise <versao>"
    echo "    cd \"$tauri_dir\" && cargo check"
    return
  fi

  if cargo_subcommand_available outdated; then
    local outdated_json=""
    local outdated_json_status=0
    if [ "$write_cargo_logs" -eq 1 ]; then
      echo "  - Checando crates desatualizados (resumo + log)..."
      local outdated_full_status=0
      local outdated_log_mode="full"
      set +e
      outdated_json="$(
        cd "$tauri_dir" &&
          cargo outdated --root-deps-only --format json 2>/dev/null
      )"
      outdated_json_status=$?
      (
        cd "$tauri_dir" &&
          cargo outdated >"$outdated_log" 2>&1
      )
      outdated_full_status=$?
      if [ "$outdated_full_status" -ne 0 ]; then
        (
          cd "$tauri_dir" &&
            cargo outdated --root-deps-only --format json >"$outdated_log" 2>&1
        )
        outdated_full_status=$?
        if [ "$outdated_full_status" -eq 0 ]; then
          outdated_log_mode="fallback"
        fi
      fi
      set -e

      if [ "$outdated_json_status" -eq 0 ]; then
        show_cargo_outdated_report_summary "$outdated_json"
        outdated_json_for_selection="$outdated_json"
      else
        echo "  ⚠ Falha ao executar resumo de cargo outdated."
        echo "    Dica: verifique rede/crates.io e lock do cache Cargo."
      fi

      if [ "$outdated_full_status" -eq 0 ]; then
        if [ "$outdated_log_mode" = "fallback" ]; then
          echo "  Detalhes (modo fallback root-deps-only): $outdated_log"
        else
          echo "  Detalhes completos: $outdated_log"
        fi
      elif [ -s "$outdated_log" ]; then
        echo "  Detalhes (com erro de execucao): $outdated_log"
      else
        echo "  ⚠ Falha ao gerar log completo de cargo outdated."
        echo "    Verifique: $outdated_log"
      fi
    else
      echo "  - Checando crates desatualizados (resumo)..."
      set +e
      outdated_json="$(
        cd "$tauri_dir" &&
          cargo outdated --root-deps-only --format json 2>/dev/null
      )"
      outdated_json_status=$?
      set -e
      if [ "$outdated_json_status" -eq 0 ]; then
        show_cargo_outdated_report_summary "$outdated_json"
        outdated_json_for_selection="$outdated_json"
      else
        echo "  ⚠ Falha ao executar resumo de cargo outdated."
        echo "    Dica: verifique rede/crates.io e lock do cache Cargo."
      fi
    fi
  else
    echo "  ⚠ cargo-outdated nao instalado."
    echo "    Instale com: cargo install cargo-outdated"
  fi

  if cargo_subcommand_available audit; then
    local audit_json=""
    local audit_json_status=0
    if [ "$write_cargo_logs" -eq 1 ]; then
      echo "  - Checando vulnerabilidades (resumo + log)..."
      local audit_full_status=0
      local audit_log_mode="full"
      set +e
      audit_json="$(
        cd "$tauri_dir" &&
          cargo audit --json --no-fetch 2>/dev/null
      )"
      audit_json_status=$?
      (
        cd "$tauri_dir" &&
          cargo audit >"$audit_log" 2>&1
      )
      audit_full_status=$?
      if [ "$audit_full_status" -ne 0 ]; then
        (
          cd "$tauri_dir" &&
            cargo audit --json --no-fetch >"$audit_log" 2>&1
        )
        audit_full_status=$?
        if [ "$audit_full_status" -eq 0 ]; then
          audit_log_mode="fallback"
        fi
      fi
      set -e

      if [ "$audit_json_status" -eq 0 ] && [ -n "$audit_json" ]; then
        show_cargo_audit_report_summary "$audit_json"
      else
        echo "  ⚠ Falha ao executar resumo de cargo audit."
        echo "    Dica: verifique lock do advisory-db em ~/.cargo."
        echo "    Dica: rode manualmente para detalhes: cd \"$tauri_dir\" && cargo audit"
      fi

      if [ "$audit_full_status" -eq 0 ]; then
        if [ "$audit_log_mode" = "fallback" ]; then
          echo "  Detalhes (modo fallback --no-fetch): $audit_log"
        else
          echo "  Detalhes completos: $audit_log"
        fi
      elif [ -s "$audit_log" ]; then
        echo "  Detalhes (com erro de execucao): $audit_log"
      else
        echo "  ⚠ Falha ao gerar log completo de cargo audit."
        echo "    Verifique: $audit_log"
      fi
    else
      echo "  - Checando vulnerabilidades (resumo)..."
      set +e
      audit_json="$(
        cd "$tauri_dir" &&
          cargo audit --json --no-fetch 2>/dev/null
      )"
      audit_json_status=$?
      set -e
      if [ "$audit_json_status" -eq 0 ] && [ -n "$audit_json" ]; then
        show_cargo_audit_report_summary "$audit_json"
      else
        echo "  ⚠ Falha ao executar resumo de cargo audit."
        echo "    Dica: verifique lock do advisory-db em ~/.cargo."
        echo "    Dica: rode manualmente para detalhes: cd \"$tauri_dir\" && cargo audit"
      fi
    fi
  else
    echo "  ⚠ cargo-audit nao instalado."
    echo "    Instale com: cargo install cargo-audit"
  fi

  maybe_offer_rust_root_updates "$outdated_json_for_selection" "$tauri_dir"

  echo "  Atualizacao manual recomendada:"
  echo "    cd \"$tauri_dir\" && cargo add <crate>@<versao>"
  echo "    cd \"$tauri_dir\" && cargo update -p <crate> --precise <versao>"
  echo "    cd \"$tauri_dir\" && cargo check"
}

if (( ORIGINAL_ARGC == 0 )) && [[ -t 0 ]] && [ "$MODE" = "interactive" ]; then
  show_log_menu
fi

setup_logging

print_header
check_dev_environment
check_stack_versions
check_framework_inventory
check_js_dependencies
check_rust_dependencies
show_generated_logs
echo ""
echo "OK: Verificacao concluida!"
