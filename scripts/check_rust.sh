#!/usr/bin/env bash
#
# check_rust.sh - Apenas a parte Rust extraida de check-updates.sh
#
# Objetivo: rodar isoladamente a logica Rust "madura" (escopo src-tauri,
# cargo outdated --format json + parse, classificacao safe/major,
# edicao do Cargo.toml e cargo update --precise) para comparar com
# check_rust_2.sh (porte do check-updates.ps1).
#
# Uso:
#   ./scripts/check_rust.sh                 # interativo (padrao)
#   ./scripts/check_rust.sh report          # somente relatorio
#   ./scripts/check_rust.sh [interactive|report] [none|cargo|full]
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POMODOROZ_DIR="$ROOT_DIR"
ORIGINAL_ARGC=$#

MODE="interactive"
LOG_MODE="cargo"
CARGO_OUTDATED_LOG_FILE=""
CARGO_AUDIT_LOG_FILE=""
CARGO_BIN_DIR=""

if [[ -n "${CARGO_HOME:-}" ]]; then
  CARGO_BIN_DIR="$CARGO_HOME/bin"
elif [[ -n "${HOME:-}" ]]; then
  CARGO_BIN_DIR="$HOME/.cargo/bin"
fi

if [[ -n "$CARGO_BIN_DIR" && -d "$CARGO_BIN_DIR" ]]; then
  export PATH="$CARGO_BIN_DIR:$PATH"
fi

if [[ $# -gt 0 ]]; then
  case "$1" in
    interactive|report)
      MODE="$1"
      shift
      ;;
    none|cargo|full)
      LOG_MODE="$1"
      shift
      ;;
    *)
      echo "Uso: $0 [interactive|report] [none|cargo|full]"
      exit 1
      ;;
  esac
fi

if [[ $# -gt 0 ]]; then
  case "$1" in
    none|cargo|full)
      LOG_MODE="$1"
      shift
      ;;
    *)
      echo "Uso: $0 [interactive|report] [none|cargo|full]"
      exit 1
      ;;
  esac
fi

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

extract_major() {
  local v="$1"
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

  if [ -z "$current_major" ] || [ -z "$latest_major" ]; then
    return 0
  fi

  if [ "$current_major" != "$latest_major" ]; then
    return 0
  fi

  if [ "$current_major" = "0" ] && [ "$latest_major" = "0" ]; then
    current_minor="$(echo "$current" | sed -E 's/^[^0-9]*[0-9]+\.([0-9]+).*/\1/')"
    latest_minor="$(echo "$latest" | sed -E 's/^[^0-9]*[0-9]+\.([0-9]+).*/\1/')"
    if [[ "$current_minor" =~ ^[0-9]+$ ]] && [[ "$latest_minor" =~ ^[0-9]+$ ]] && [ "$current_minor" != "$latest_minor" ]; then
      return 0
    fi
  fi

  return 1
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
const cleanVersion = (value) => {
  const text = String(value ?? "n/a").trim();
  return !text || text === "---" || text === "--" || text === "-" ? "n/a" : text;
};
for (const dep of deps) {
  const name = String(dep.name ?? dep.crate ?? dep.package ?? "").trim();
  if (!name) continue;
  const project = cleanVersion(dep.project ?? dep.current ?? dep.version);
  const compat = cleanVersion(dep.compat ?? dep.wanted ?? dep.compatible);
  const latest = cleanVersion(dep.latest ?? dep.newest ?? dep.target);
  process.stdout.write([name, project, compat, latest].join("\t") + "\n");
}
'
}

update_cargo_manifest_dependency_version() {
  local tauri_dir="$1"
  local crate="$2"
  local target="$3"
  local cargo_toml="$tauri_dir/Cargo.toml"

  if [ ! -f "$cargo_toml" ]; then
    return
  fi

  local status=0
  set +e
  node -e '
const fs = require("fs");
const [file, crateName, target] = process.argv.slice(1);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const keepExactIfPinned = (previous) =>
  String(previous).trim().startsWith("=") ? `=${target}` : target;

let text = fs.readFileSync(file, "utf8");
const original = text;
const name = escapeRegExp(crateName);
const inlinePattern = new RegExp(`(^\\s*${name}\\s*=\\s*\\{[^\\n}]*\\bversion\\s*=\\s*")([^"]+)(")`, "m");
const simplePattern = new RegExp(`(^\\s*${name}\\s*=\\s*")([^"]+)(")`, "m");

if (inlinePattern.test(text)) {
  text = text.replace(inlinePattern, (_match, before, previous, after) =>
    `${before}${keepExactIfPinned(previous)}${after}`
  );
} else if (simplePattern.test(text)) {
  text = text.replace(simplePattern, (_match, before, previous, after) =>
    `${before}${keepExactIfPinned(previous)}${after}`
  );
}

if (text === original) {
  process.exit(2);
}

fs.writeFileSync(file, text);
' "$cargo_toml" "$crate" "$target"
  status=$?
  set -e

  case "$status" in
    0)
      echo "     Cargo.toml atualizado: $crate => $target"
      ;;
    2)
      echo "     Cargo.toml sem declaracao root para $crate; atualizando lockfile apenas."
      ;;
    *)
      echo "     ⚠ falha ao atualizar Cargo.toml para $crate; tentando lockfile mesmo assim."
      ;;
  esac
}

run_rust_updates_for_selected() {
  local tauri_dir="$1"
  local -n __rows=$2
  local row ws crate current compat target update_kind

  echo "  Preparando Cargo.toml para os updates Rust selecionados..."
  for row in "${__rows[@]}"; do
    IFS=$'\t' read -r ws crate current compat target update_kind <<< "$row"
    if [ -z "$crate" ] || [ -z "$target" ]; then
      continue
    fi
    update_cargo_manifest_dependency_version "$tauri_dir" "$crate" "$target"
  done

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
  local safe_target

  while IFS=$'\t' read -r crate project compat latest; do
    [ -z "$crate" ] && continue

    safe_target=""
    if [ -n "$compat" ] && [ "$compat" != "n/a" ] && [ "$compat" != "Removed" ] && [ "$compat" != "$project" ]; then
      if ! is_major_update "$project" "$compat"; then
        safe_target="$compat"
      fi
    fi

    if [ -n "$latest" ] && [ "$latest" != "n/a" ] && [ "$latest" != "Removed" ] && [ "$latest" != "$project" ]; then
      if ! is_major_update "$project" "$latest"; then
        if [ -z "$safe_target" ]; then
          safe_target="$latest"
        fi
      else
        major_candidates+=("src-tauri"$'\t'"$crate"$'\t'"$project"$'\t'"$latest"$'\t'"$latest"$'\t'"major")
      fi
    fi

    if [ -n "$safe_target" ]; then
      safe_candidates+=("src-tauri"$'\t'"$crate"$'\t'"$project"$'\t'"$safe_target"$'\t'"$safe_target"$'\t'"safe")
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
  echo "[Rust] Dependencias (Cargo) - logica do check-updates.sh"

  if ! require_cmd cargo "Cargo nao encontrado."; then
    return
  fi
  if ! require_cmd node "Node nao encontrado (necessario para parse JSON)."; then
    return
  fi

  local tauri_dir="$POMODOROZ_DIR/src-tauri"
  local logs_dir="$POMODOROZ_DIR/logs"
  local write_cargo_logs=0
  local log_stamp outdated_log audit_log
  local outdated_json_for_selection=""
  local rust_outdated_check_failed=0

  if [ ! -f "$tauri_dir/Cargo.toml" ]; then
    echo "  src-tauri/Cargo.toml nao encontrado; pulando verificacao Rust."
    return
  fi

  if [ "$MODE" != "report" ] && [ "$LOG_MODE" != "none" ]; then
    write_cargo_logs=1
    mkdir -p "$logs_dir"
    log_stamp="$(date +%Y%m%d-%H%M%S)"
    outdated_log="$logs_dir/check_rust-cargo-outdated-$log_stamp.log"
    audit_log="$logs_dir/check_rust-cargo-audit-$log_stamp.log"
    CARGO_OUTDATED_LOG_FILE="$outdated_log"
    CARGO_AUDIT_LOG_FILE="$audit_log"
  fi

  echo "  - Escopo Rust: $tauri_dir"

  if cargo_subcommand_available outdated; then
    echo "  - Checando crates desatualizados (cargo outdated --root-deps-only --format json)..."
    local outdated_json="" outdated_json_status=0
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
      if [ "$write_cargo_logs" -eq 1 ]; then
        ( cd "$tauri_dir" && cargo outdated >"$outdated_log" 2>&1 ) || true
        echo "  Detalhes: $outdated_log"
      fi
    else
      rust_outdated_check_failed=1
      echo "  ⚠ Falha ao executar cargo outdated."
    fi
  else
    rust_outdated_check_failed=1
    echo "  ⚠ cargo-outdated nao instalado. Instale com: cargo install cargo-outdated"
  fi

  if cargo_subcommand_available audit; then
    echo "  - Checando vulnerabilidades (cargo audit --json --no-fetch)..."
    local audit_json="" audit_json_status=0
    set +e
    audit_json="$(
      cd "$tauri_dir" &&
        cargo audit --json --no-fetch 2>/dev/null
    )"
    audit_json_status=$?
    set -e
    if [ "$audit_json_status" -eq 0 ] && [ -n "$audit_json" ]; then
      show_cargo_audit_report_summary "$audit_json"
      if [ "$write_cargo_logs" -eq 1 ]; then
        ( cd "$tauri_dir" && cargo audit >"$audit_log" 2>&1 ) || true
        echo "  Detalhes: $audit_log"
      fi
    else
      echo "  ⚠ Falha ao executar cargo audit."
    fi
  else
    echo "  ⚠ cargo-audit nao instalado. Instale com: cargo install cargo-audit"
  fi

  if [ "$MODE" = "report" ]; then
    if [ "$rust_outdated_check_failed" -eq 1 ] || [ -n "$outdated_json_for_selection" ]; then
      echo "  Atualizacao manual recomendada:"
      echo "    cd \"$tauri_dir\" && cargo outdated --root-deps-only"
      echo "    cd \"$tauri_dir\" && cargo update -p <crate> --precise <versao>"
      echo "    cd \"$tauri_dir\" && cargo check"
    fi
    return
  fi

  maybe_offer_rust_root_updates "$outdated_json_for_selection" "$tauri_dir"
}

printf "\n===============================================\n"
printf " check_rust.sh (logica do check-updates.sh)\n"
if [ "$MODE" = "report" ]; then
  printf " (Modo Relatorio)\n"
fi
printf "===============================================\n"

check_rust_dependencies
echo ""
echo "OK: Verificacao Rust concluida!"
