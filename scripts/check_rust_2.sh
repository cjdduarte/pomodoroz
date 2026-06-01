#!/usr/bin/env bash
#
# check_rust_2.sh - Porte para bash de scripts/scripts/check-updates.ps1
#
# Objetivo: reproduzir em bash o comportamento da versao PowerShell
# (versoes/toolchain, rustup check, cargo tree, cargo tree --duplicates,
# cargo outdated --root-deps-only em texto, cargo audit, e aplicacao via
# cargo update --dry-run + cargo update -p --precise) para comparar com
# check_rust.sh (logica do check-updates.sh).
#
# NOTA: assim como o .ps1 original, o escopo padrao e' a RAIZ do repo
# ($ROOT), nao src-tauri. Isso e' intencional para o porte fiel; veja o
# parametro [scope].
#
# Uso:
#   ./scripts/check_rust_2.sh                          # interativo (padrao)
#   ./scripts/check_rust_2.sh report                   # somente relatorio
#   ./scripts/check_rust_2.sh [interactive|report] [none|cargo|full]
#

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Escopo Rust: neste projeto o Cargo.toml fica em src-tauri/ (Tauri),
# nao na raiz. O .ps1 original veio de um projeto com Cargo.toml na raiz.
# Resolve o diretorio que realmente contem o manifesto.
if [ -f "$REPO_ROOT/src-tauri/Cargo.toml" ]; then
  ROOT="$REPO_ROOT/src-tauri"
else
  ROOT="$REPO_ROOT"
fi

MODE="interactive"
LOG_MODE_SELECTION="cargo"
LOG_TIMESTAMP=""
GENERAL_LOG_FILE=""
CARGO_OUTDATED_LOG_FILE=""
CARGO_AUDIT_LOG_FILE=""
CARGO_TREE_LOG_FILE=""
CARGO_DUPLICATES_LOG_FILE=""
LAST_CARGO_EXIT_CODE=0

CARGO_BIN_DIR=""
if [[ -n "${CARGO_HOME:-}" ]]; then
  CARGO_BIN_DIR="$CARGO_HOME/bin"
elif [[ -n "${HOME:-}" ]]; then
  CARGO_BIN_DIR="$HOME/.cargo/bin"
fi
if [[ -n "$CARGO_BIN_DIR" && -d "$CARGO_BIN_DIR" ]]; then
  export PATH="$CARGO_BIN_DIR:$PATH"
fi

LOG_MODE_EXPLICIT=0
if [[ $# -gt 0 ]]; then
  case "$1" in
    interactive|report) MODE="$1"; shift ;;
    none|cargo|full) LOG_MODE_SELECTION="$1"; LOG_MODE_EXPLICIT=1; shift ;;
    -h|--help)
      cat <<'EOF'
Uso:
  ./scripts/check_rust_2.sh
  ./scripts/check_rust_2.sh report
  ./scripts/check_rust_2.sh [interactive|report] [none|cargo|full]

Logs:
  none   Sem logs em arquivo.
  cargo  Logs separados de cargo outdated/audit/tree/duplicates.
  full   Log geral + logs separados de cargo.
EOF
      exit 0
      ;;
    *) echo "Uso: $0 [interactive|report] [none|cargo|full]"; exit 1 ;;
  esac
fi
if [[ $# -gt 0 ]]; then
  case "$1" in
    none|cargo|full) LOG_MODE_SELECTION="$1"; LOG_MODE_EXPLICIT=1; shift ;;
    *) echo "Uso: $0 [interactive|report] [none|cargo|full]"; exit 1 ;;
  esac
fi

# --- helpers de saida (equivalentes a Step/Warn/Info/Ok) ---
step() { printf "\n==> %s\n" "$1"; }
warn() { printf "  [WARN] %s\n" "$1"; }
info() { printf "  [INFO] %s\n" "$1"; }
ok()   { printf "  [OK] %s\n" "$1"; }

check_command() { command -v "$1" >/dev/null 2>&1; }

show_log_menu() {
  echo "Tipo de log:"
  echo "  1) Sem log em arquivo."
  echo "  2) Apenas logs de cargo outdated/audit/tree/duplicates (padrao)."
  echo "  3) Log geral + logs de cargo."
  echo ""
  local choice=""
  read -r -p "Opcao de log [1-3]: " choice
  case "$choice" in
    1) LOG_MODE_SELECTION="none" ;;
    ""|2) LOG_MODE_SELECTION="cargo" ;;
    3) LOG_MODE_SELECTION="full" ;;
    *) echo "Opcao de log invalida: $choice" >&2; exit 1 ;;
  esac
}

initialize_logging() {
  if [ "$LOG_MODE_SELECTION" = "none" ]; then
    return
  fi
  local logs_dir="$REPO_ROOT/logs"
  mkdir -p "$logs_dir"
  LOG_TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
  CARGO_OUTDATED_LOG_FILE="$logs_dir/check_rust_2-cargo-outdated-$LOG_TIMESTAMP.log"
  CARGO_AUDIT_LOG_FILE="$logs_dir/check_rust_2-cargo-audit-$LOG_TIMESTAMP.log"
  CARGO_TREE_LOG_FILE="$logs_dir/check_rust_2-cargo-tree-$LOG_TIMESTAMP.log"
  CARGO_DUPLICATES_LOG_FILE="$logs_dir/check_rust_2-cargo-duplicates-$LOG_TIMESTAMP.log"

  if [ "$LOG_MODE_SELECTION" = "full" ]; then
    GENERAL_LOG_FILE="$logs_dir/check_rust_2-$LOG_TIMESTAMP.log"
    exec > >(tee -a "$GENERAL_LOG_FILE") 2>&1
  fi
}

show_generated_logs() {
  if [ "$LOG_MODE_SELECTION" = "none" ]; then
    return
  fi
  step "Logs gerados"
  [ -n "$GENERAL_LOG_FILE" ] && echo "  Geral: $GENERAL_LOG_FILE"
  echo "  Cargo outdated: $CARGO_OUTDATED_LOG_FILE"
  echo "  Cargo audit: $CARGO_AUDIT_LOG_FILE"
  echo "  Cargo tree: $CARGO_TREE_LOG_FILE"
  echo "  Cargo duplicates: $CARGO_DUPLICATES_LOG_FILE"
}

test_cargo_subcommand() {
  local sub="$1"
  check_command cargo || return 1
  cargo "$sub" --version >/dev/null 2>&1
}

maybe_install_cargo_tool() {
  local tool_name="$1"
  local install_crate="$2"
  if [ "$MODE" != "interactive" ]; then
    return
  fi
  local confirm=""
  read -r -p "Instalar $tool_name agora com cargo install $install_crate? (s/N): " confirm
  if [[ "$confirm" =~ ^[sS]$ ]]; then
    cargo install "$install_crate" || warn "falha ao instalar $install_crate."
  fi
}

# Equivalente a Invoke-CargoLogged: roda cargo, opcionalmente com tee.
invoke_cargo_logged() {
  local log_file="$1"; shift
  if [ "$LOG_MODE_SELECTION" = "none" ] || [ -z "$log_file" ]; then
    cargo "$@"
    LAST_CARGO_EXIT_CODE=$?
    return
  fi
  set +e
  cargo "$@" 2>&1 | tee "$log_file"
  LAST_CARGO_EXIT_CODE=${PIPESTATUS[0]}
  set -e
}

show_project_versions() {
  step "Projeto Rust"

  local cargo_toml="$ROOT/Cargo.toml"
  if [ ! -f "$cargo_toml" ]; then
    warn "Cargo.toml nao encontrado em $ROOT"
    return
  fi

  local name="n/a" version="n/a" line
  while IFS= read -r line; do
    if [[ "$name" = "n/a" && "$line" =~ ^name[[:space:]]*=[[:space:]]*\"(.+)\" ]]; then
      name="${BASH_REMATCH[1]}"
    fi
    if [[ "$version" = "n/a" && "$line" =~ ^version[[:space:]]*=[[:space:]]*\"(.+)\" ]]; then
      version="${BASH_REMATCH[1]}"
    fi
  done < "$cargo_toml"

  echo "  Package: $name"
  echo "  Version: $version"

  if check_command rustc; then
    ok "rustc: $(rustc --version | head -n 1)"
  else
    warn "rustc nao encontrado."
  fi

  if check_command cargo; then
    ok "cargo: $(cargo --version | head -n 1)"
  else
    warn "cargo nao encontrado."
  fi

  if check_command rustup; then
    local toolchain
    toolchain="$(rustup show active-toolchain 2>/dev/null | head -n 1 || true)"
    [ -n "$toolchain" ] && echo "  Toolchain: $toolchain"
  fi
}

check_rustup_updates() {
  step "Rust toolchain"
  if ! check_command rustup; then
    warn "rustup nao encontrado; pulando rustup check."
    return
  fi
  set +e
  rustup check
  local code=$?
  set -e
  if [ "$code" -eq 100 ]; then
    info "rustup check indicou atualizacao disponivel para a toolchain."
  elif [ "$code" -ne 0 ]; then
    warn "rustup check retornou codigo $code."
  fi
}

check_cargo_tree() {
  step "Arvore direta de dependencias"
  if ! check_command cargo; then
    warn "cargo nao encontrado."
    return
  fi
  (
    cd "$ROOT" || exit 1
    invoke_cargo_logged "$CARGO_TREE_LOG_FILE" tree --depth 1
    [ "$LAST_CARGO_EXIT_CODE" -ne 0 ] && warn "cargo tree retornou codigo $LAST_CARGO_EXIT_CODE."
    true
  )
}

check_cargo_duplicates() {
  step "Dependencias duplicadas (cargo tree --duplicates)"
  if ! check_command cargo; then
    warn "cargo nao encontrado."
    return
  fi
  (
    cd "$ROOT" || exit 1
    invoke_cargo_logged "$CARGO_DUPLICATES_LOG_FILE" tree --duplicates
    [ "$LAST_CARGO_EXIT_CODE" -ne 0 ] && warn "cargo tree --duplicates retornou codigo $LAST_CARGO_EXIT_CODE."
    true
  )
}

check_cargo_outdated() {
  step "Dependencias diretas desatualizadas (cargo outdated --root-deps-only)"
  if ! check_command cargo; then
    warn "cargo nao encontrado."
    return
  fi
  if ! test_cargo_subcommand outdated; then
    warn "cargo-outdated nao instalado."
    echo "  Instalar: cargo install cargo-outdated"
    maybe_install_cargo_tool "cargo-outdated" "cargo-outdated"
    test_cargo_subcommand outdated || return
  fi
  (
    cd "$ROOT" || exit 1
    info "Mostrando apenas dependencias diretas; use cargo outdated para a arvore completa."
    invoke_cargo_logged "$CARGO_OUTDATED_LOG_FILE" outdated --root-deps-only
    [ "$LAST_CARGO_EXIT_CODE" -ne 0 ] && warn "cargo outdated retornou codigo $LAST_CARGO_EXIT_CODE."
    true
  )
}

check_cargo_audit() {
  step "Auditoria de vulnerabilidades (cargo audit)"
  if ! check_command cargo; then
    warn "cargo nao encontrado."
    return
  fi
  if ! test_cargo_subcommand audit; then
    warn "cargo-audit nao instalado."
    echo "  Instalar: cargo install cargo-audit"
    maybe_install_cargo_tool "cargo-audit" "cargo-audit"
    test_cargo_subcommand audit || return
  fi
  (
    cd "$ROOT" || exit 1
    invoke_cargo_logged "$CARGO_AUDIT_LOG_FILE" audit
    [ "$LAST_CARGO_EXIT_CODE" -ne 0 ] && warn "cargo audit retornou codigo $LAST_CARGO_EXIT_CODE."
    true
  )
}

invoke_safe_updates() {
  if [ "$MODE" != "interactive" ]; then
    return
  fi
  if [ ! -t 0 ]; then
    return
  fi
  if ! check_command cargo; then
    return
  fi

  step "Updates compativeis (patch/minor dentro do range semver)"

  cd "$ROOT" || return

  # cargo update --dry-run mostra apenas o que cabe no range do Cargo.toml.
  local dry_output dry_status
  set +e
  dry_output="$(cargo update --dry-run 2>&1)"
  dry_status=$?
  set -e
  if [ "$dry_status" -ne 0 ]; then
    warn "cargo update --dry-run falhou; pulando aplicacao de updates."
    return
  fi

  local names=() froms=() tos=()
  local line
  while IFS= read -r line; do
    if [[ "$line" =~ Updating[[:space:]]+([^[:space:]]+)[[:space:]]+v([^[:space:]]+)[[:space:]]+-\>[[:space:]]+v([^[:space:]]+) ]]; then
      names+=("${BASH_REMATCH[1]}")
      froms+=("${BASH_REMATCH[2]}")
      tos+=("${BASH_REMATCH[3]}")
    fi
  done <<< "$dry_output"

  if [ ${#names[@]} -eq 0 ]; then
    echo "  Nenhum update compativel para aplicar (o range ja esta atualizado)."
    info "Updates major/breaking (coluna Latest) sao manuais; veja AGENTS.md."
    return
  fi

  echo "  Updates compativeis disponiveis:"
  local i
  for i in "${!names[@]}"; do
    printf "    %d) %s  %s -> %s\n" "$((i+1))" "${names[$i]}" "${froms[$i]}" "${tos[$i]}"
  done
  echo "    a) Todos"
  echo "    Enter) Nenhum"

  local selection=""
  read -r -p "Selecione (ex.: 1 3 ou 'a' para todos): " selection
  if [ -z "$selection" ]; then
    echo "  Nenhum update aplicado."
    return
  fi

  if [[ "$selection" =~ ^[aAtT]$ ]]; then
    echo "  Aplicando todos os updates compativeis: cargo update"
    cargo update || warn "cargo update retornou erro."
  else
    local tok idx
    local chosen_idx=()
    for tok in $selection; do
      if [[ "$tok" =~ ^[0-9]+$ ]]; then
        idx=$tok
        if [ "$idx" -ge 1 ] && [ "$idx" -le ${#names[@]} ]; then
          chosen_idx+=("$((idx-1))")
        fi
      fi
    done
    if [ ${#chosen_idx[@]} -eq 0 ]; then
      echo "  Nenhuma selecao valida; nada aplicado."
      return
    fi
    for i in "${chosen_idx[@]}"; do
      # name@from desambigua quando ha versoes duplicadas (ex.: zip 4 e 7).
      local spec="${names[$i]}@${froms[$i]}"
      printf "  -> cargo update -p %s --precise %s\n" "$spec" "${tos[$i]}"
      cargo update -p "$spec" --precise "${tos[$i]}" \
        || warn "falha ao atualizar ${names[$i]}; tente: cargo update -p ${names[$i]}"
    done
  fi

  echo ""
  echo "  Recomendado apos aplicar:"
  echo "    ./scripts/validar-tudo.sh --quick-dev"
}

printf "\n===============================================\n"
printf " check_rust_2.sh (porte do check-updates.ps1)\n"
if [ "$MODE" = "report" ]; then
  printf " (Modo relatorio)\n"
fi
printf "===============================================\n"

if [ "$MODE" = "interactive" ] && [ -t 0 ] && [ "$LOG_MODE_EXPLICIT" -eq 0 ]; then
  show_log_menu
fi

initialize_logging
show_project_versions
check_rustup_updates
check_cargo_tree
check_cargo_duplicates
check_cargo_outdated
check_cargo_audit
invoke_safe_updates
show_generated_logs
echo ""
echo "OK: Verificacao concluida!"
