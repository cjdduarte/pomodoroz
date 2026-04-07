#!/usr/bin/env bash
#
# Verificador de Updates para Pomodoroz (Electron-only)
#
# Uso:
#   ./scripts/check-updates.sh              # Modo interativo (padrao)
#   ./scripts/check-updates.sh report       # Modo relatorio (sem interacao)
#
# Modo interativo:
#   - Lista dependencias JS/TS desatualizadas por workspace
#   - Permite selecionar updates seguros (patch/minor) e major separadamente
#
# Modo relatorio:
#   - Apenas exibe o status (sem alterar arquivos)
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POMODOROZ_DIR="$ROOT_DIR"

MODE="${1:-interactive}"
if [[ "$MODE" != "interactive" && "$MODE" != "report" ]]; then
  echo "Uso: $0 [interactive|report]"
  echo ""
  echo "  interactive  - Modo interativo com selecao de updates (padrao)"
  echo "  report       - Modo relatorio, sem alteracoes"
  exit 1
fi

WORKSPACES=(
  "root|$POMODOROZ_DIR"
  "app/electron|$POMODOROZ_DIR/app/electron"
  "app/renderer|$POMODOROZ_DIR/app/renderer"
  "app/shareables|$POMODOROZ_DIR/app/shareables"
)

OUTDATED_ROWS=()
declare -A OUTDATED_SEEN=()
OUTDATED_CHECK_FAILED=0
CRITICAL_EXACT_PACKAGES=(
  "electron"
  "typescript"
  "@electron/notarize"
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

die() {
  echo "ERRO: $1" >&2
  exit 1
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
      echo "app/electron"
      ;;
    "@pomodoroz/renderer")
      echo "app/renderer"
      ;;
    "@pomodoroz/shareables")
      echo "app/shareables"
      ;;
    "app/electron" | "app/renderer" | "app/shareables")
      echo "$ws"
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
      echo "  -> [$ws] aplicando exato: yarn add -D --exact $pkg@$latest"
      ( cd "$ws_dir" && yarn add -D --exact "$pkg@$latest" )
      ;;
    dependencies)
      echo "  -> [$ws] aplicando exato: yarn add --exact $pkg@$latest"
      ( cd "$ws_dir" && yarn add --exact "$pkg@$latest" )
      ;;
    optionalDependencies)
      echo "  -> [$ws] aplicando exato: yarn add --optional --exact $pkg@$latest"
      ( cd "$ws_dir" && yarn add --optional --exact "$pkg@$latest" )
      ;;
    *)
      echo "  -> [$ws] tipo '$ptype' sem suporte direto para --exact; fallback: yarn upgrade --latest $pkg@$latest"
      ( cd "$ws_dir" && yarn upgrade --latest "$pkg@$latest" )
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
      echo "  -> [$ws] yarn add -D $pkg@$target"
      ( cd "$ws_dir" && yarn add -D "$pkg@$target" )
      ;;
    dependencies)
      echo "  -> [$ws] yarn add $pkg@$target"
      ( cd "$ws_dir" && yarn add "$pkg@$target" )
      ;;
    optionalDependencies)
      echo "  -> [$ws] yarn add --optional $pkg@$target"
      ( cd "$ws_dir" && yarn add --optional "$pkg@$target" )
      ;;
    *)
      echo "  -> [$ws] tipo '$ptype' sem suporte direto; fallback: yarn upgrade $pkg@$target"
      ( cd "$ws_dir" && yarn upgrade "$pkg@$target" )
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
  echo "[1/4] Ambiente de Desenvolvimento"

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

  if command -v yarn >/dev/null 2>&1; then
    local yarn_version
    yarn_version="$(yarn --version)"
    printf "  Yarn: %s" "$yarn_version"
    if [[ "$yarn_version" == 1.* ]]; then
      echo " ✓ (Classic)"
    else
      echo " ⚠ (projeto atualmente usa Yarn Classic 1.x)"
    fi
  else
    echo "  Yarn: ❌ nao encontrado"
  fi
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
  echo "[2/4] Stack Atual do Projeto"

  if ! require_cmd node "Node nao encontrado para leitura de package.json."; then
    return
  fi

  local electron_version react_version ts_version
  electron_version="$(node -e "const p=require('$POMODOROZ_DIR/app/electron/package.json'); console.log((p.devDependencies&&p.devDependencies.electron)||(p.dependencies&&p.dependencies.electron)||'n/a');" 2>/dev/null || true)"
  react_version="$(node -e "const p=require('$POMODOROZ_DIR/app/renderer/package.json'); console.log((p.dependencies&&p.dependencies.react)||'n/a');" 2>/dev/null || true)"
  ts_version="$(node -e "const p=require('$POMODOROZ_DIR/package.json'); console.log((p.devDependencies&&p.devDependencies.typescript)||'n/a');" 2>/dev/null || true)"

  echo "  Electron (app/electron): ${electron_version:-n/a}"
  echo "  React (app/renderer): ${react_version:-n/a}"
  echo "  TypeScript (root): ${ts_version:-n/a}"
}

check_framework_inventory() {
  echo ""
  echo "[3/4] Inventario de Frameworks e Ferramentas"

  local root_pkg="$POMODOROZ_DIR/package.json"
  local renderer_pkg="$POMODOROZ_DIR/app/renderer/package.json"
  local electron_pkg="$POMODOROZ_DIR/app/electron/package.json"

  echo "  [Renderer]"
  echo "    react: $(get_pkg_version "$renderer_pkg" "react")"
  echo "    react-dom: $(get_pkg_version "$renderer_pkg" "react-dom")"
  echo "    react-router: $(get_pkg_version "$renderer_pkg" "react-router")"
  echo "    react-router-dom: $(get_pkg_version "$renderer_pkg" "react-router-dom")"
  echo "    @reduxjs/toolkit: $(get_pkg_version "$renderer_pkg" "@reduxjs/toolkit")"
  echo "    styled-components: $(get_pkg_version "$renderer_pkg" "styled-components")"
  echo "    i18next: $(get_pkg_version "$renderer_pkg" "i18next")"
  echo "    @dnd-kit/sortable: $(get_pkg_version "$renderer_pkg" "@dnd-kit/sortable")"
  echo "    @dnd-kit/core: $(get_pkg_version "$renderer_pkg" "@dnd-kit/core")"
  echo "    vite: $(get_pkg_version "$renderer_pkg" "vite")"
  echo "    @vitejs/plugin-react: $(get_pkg_version "$renderer_pkg" "@vitejs/plugin-react")"

  echo "  [Electron]"
  echo "    electron: $(get_pkg_version "$electron_pkg" "electron")"
  echo "    electron-builder: $(get_pkg_version "$electron_pkg" "electron-builder")"
  echo "    electron-updater: $(get_pkg_version "$electron_pkg" "electron-updater")"
  echo "    electron-store: $(get_pkg_version "$electron_pkg" "electron-store")"

  echo "  [Monorepo/Tooling]"
  echo "    lerna: $(get_pkg_version "$root_pkg" "lerna")"
  echo "    typescript: $(get_pkg_version "$root_pkg" "typescript")"
  echo "    prettier: $(get_pkg_version "$root_pkg" "prettier")"

  local dev_app_script
  dev_app_script="$(node -e "const p=require('$root_pkg'); console.log((p.scripts&&p.scripts['dev:app'])||'n/a');" 2>/dev/null || true)"

  echo "  [Fluxo Atual]"
  echo "    dev:app: ${dev_app_script:-n/a}"
  if node -e '
    const p = require(process.argv[1]);
    const scripts = p.scripts || {};
    const hasViteRenderer = Object.prototype.hasOwnProperty.call(scripts, "dev:app:vite");
    process.exit(hasViteRenderer ? 0 : 1);
  ' "$root_pkg" 2>/dev/null; then
    echo "    Vite no fluxo principal: ativo"
  else
    echo "    Vite no fluxo principal: nao detectado"
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
  raw="$(cd "$ws_dir" && yarn outdated --json 2>&1)"
  status=$?
  set -e

  # yarn outdated:
  # 0 = sem updates
  # 1 = existem updates
  # >1 = falha
  if [ "$status" -gt 1 ]; then
    OUTDATED_CHECK_FAILED=1
    echo "  ⚠ [$ws_name] falha ao consultar updates (verifique rede/registry)."
    return
  fi

  # Em alguns cenarios, yarn retorna exit code 1 tanto para "ha updates"
  # quanto para erro de rede/registry. Detectamos erro explicitamente no JSON.
  if printf "%s\n" "$raw" | grep -q '"type":"error"'; then
    OUTDATED_CHECK_FAILED=1
    local err
    err="$(printf "%s\n" "$raw" | sed -n 's/.*"type":"error","data":"\(.*\)".*/\1/p' | head -n 1)"
    if [ -n "$err" ]; then
      echo "  ⚠ [$ws_name] falha ao consultar updates: $err"
    else
      echo "  ⚠ [$ws_name] falha ao consultar updates (erro retornado pelo yarn)."
    fi
    return
  fi

  local parsed
  parsed="$(
    printf "%s\n" "$raw" | node -e '
const fs = require("fs");

const lines = fs.readFileSync(0, "utf8").split(/\r?\n/);
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  let obj;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    continue;
  }

  if (obj.type !== "table") continue;

  const data = obj.data || {};
  const head = Array.isArray(data.head) ? data.head : [];
  const body = Array.isArray(data.body) ? data.body : [];
  const idx = new Map(head.map((name, i) => [String(name), i]));

  const val = (row, key) => {
    const i = idx.get(key);
    if (typeof i !== "number" || i >= row.length) return "";
    const value = row[i];
    return value == null ? "" : String(value).replace(/\t/g, " ");
  };

  for (const row of body) {
    process.stdout.write(
      [
        val(row, "Workspace"),
        val(row, "Package"),
        val(row, "Current"),
        val(row, "Wanted"),
        val(row, "Latest"),
        val(row, "Package Type"),
      ].join("\t") + "\n"
    );
  }
}
'
  )"

  if [ -z "$parsed" ]; then
    if [ "$status" -eq 1 ]; then
      OUTDATED_CHECK_FAILED=1
      echo "  ⚠ [$ws_name] resultado inconclusivo: yarn retornou status 1, mas nao foi possivel parsear tabela de updates."
    fi
    return
  fi

  while IFS=$'\t' read -r ws_from_yarn pkg current wanted latest ptype; do
    [ -z "$pkg" ] && continue
    local effective_ws="$ws_name"
    if [ -n "${ws_from_yarn:-}" ]; then
      effective_ws="$(normalize_workspace_name "$ws_from_yarn")"
    fi
    add_outdated_row "$effective_ws" "$pkg" "$current" "$wanted" "$latest" "$ptype"
  done <<< "$parsed"
}

show_outdated_table() {
  if [ ${#OUTDATED_ROWS[@]} -eq 0 ]; then
    if [ "$OUTDATED_CHECK_FAILED" -eq 1 ]; then
      echo "  ⚠ Resultado inconclusivo: houve falha ao consultar o registry em um ou mais workspaces."
    else
      echo "  Nenhuma dependencia desatualizada encontrada."
    fi
    return
  fi

  printf "  %-15s %-35s %-12s %-12s %-12s %-10s\n" \
    "Workspace" "Pacote" "Atual" "Wanted" "Latest" "Tipo"
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
      echo "  ⚠ Workspace desconhecido: $ws"
      continue
    fi

    if [ "$mode" = "safe" ]; then
      # Ex.: "electron": "41.0.3" (range fixa). `yarn upgrade` nao altera esse caso.
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
          echo "  -> [$ws] sem target inferido; fallback: yarn upgrade $pkg"
          ( cd "$ws_dir" && yarn upgrade "$pkg" )
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
  echo "[4/4] Dependencias JS/TS (Yarn)"

  if ! require_cmd yarn "Yarn nao encontrado."; then
    return
  fi
  if ! require_cmd node "Node nao encontrado (necessario para parse do yarn outdated --json)."; then
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
  echo "  cd \"$POMODOROZ_DIR\" && yarn install"
  echo "  cd \"$POMODOROZ_DIR\" && yarn build"
  echo "  cd \"$POMODOROZ_DIR\" && yarn dev:app"
}

print_header
check_dev_environment
check_stack_versions
check_framework_inventory
check_js_dependencies
echo ""
echo "OK: Verificacao concluida!"
