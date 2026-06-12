#!/usr/bin/env bash
# =====================================================================
# validar-tudo.sh — ALIAS de transicao (2026-06-12)
# O menu rico e os gates do projeto moram agora em scripts/dev-full.sh
# (nome unico do menu na UnidadeD — LEVANTAMENTO_MENUS_DEV.md §10).
# Este alias roda o dev-full em modo NAO-interativo (stdin sem tty, para
# nao abrir o menu) e existe so para nao quebrar quem chama
# 'validar-tudo.sh' (docs, dev.sh check, release.sh, CI).
# Prefira: ./scripts/dev.sh check   |   menu: ./scripts/dev-full.sh
# =====================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"

# '</dev/null': garante stdin nao-tty, entao o dev-full pula o menu
# (linha 'ORIGINAL_ARGC==0 && -t 0') e executa direto o fluxo pedido
# (sem flags: preflight completo).
exec "$ROOT_DIR/scripts/dev-full.sh" "$@" </dev/null
