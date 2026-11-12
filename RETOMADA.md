# RETOMADA — Pomodoroz

Status: snapshot operacional da sessão atual.
Última revisão: 2026-11-12.

## Fontes canônicas

- `AGENTS.md`
- `docs/IMPROVEMENTS.md`
- `docs/VERSIONS.md`
- `CHANGELOG.md`
- `openspec/changes/`

## Estado atual da sessão

- A baseline publicada é `26.11.1`. A próxima versão é `26.11.2` (`TBD` nos changelogs), sem tag.
- A branch local `chore/deps-upgrade` (sem push) tem a migração de dependências em um commit por bloco: patches/minors JS e Rust, pnpm 12.18.0, `@types/node` 26, vitest 5, i18next 27/react-i18next 18, react-router 8, rodio 0.23, limpeza do `tsconfig.json`, Rust 1.99.1, edition 2024, Actions v7 e lockfiles JS/Rust renovados.
- O gate do CI (lint, typecheck, testes, build, fmt, clippy, check, test e `cargo audit --deny warnings`) passou localmente em cada bloco, só no Linux; as exceções do audit continuam as de `src-tauri/.cargo/audit.toml`.
- Segurados, com motivo em `docs/VERSIONS.md`: TypeScript 6.0.3, Node 24 e OpenSpec CLI 1.14.1.
- A change `complete-updater-task-cleanup` está em 9/10 tarefas; `align-rust-toolchain-automation`, `patch-event-listener-advisory` e `address-audit-hardening-findings` estão completas, aguardando leitura guiada e decisão de archive.

## Bloqueios

- Sem `pwsh` local: `scripts/check-updates.ps1` (inclusive a correção do `^`), `scripts/install.ps1` e `scripts/uninstall.ps1` só foram revisados estaticamente.
- Nenhuma tela foi exercitada nesta migração. Validações manuais pendentes no app: toggles de modo compacto e rotas lazy de Tasks/Statistics (React 19.3 + react-router 8); campos de texto e textarea de detalhes da task (styled-components 6.6); troca de idioma (i18next 27); sons de fim de sessão (rodio 0.23); notificação nativa (lockfile Rust); e as herdadas da 26.11.1: reset de foco com "mover para Ocioso" após mais de 2 min de foco, alerta de armazenamento cheio, pausa especial ao reabrir o app dentro da janela, link Markdown abrindo no navegador, segunda instância sem tray duplicado, drag durante foco, popup de Tasks e updater N→N+1 para NSIS/AppImage.

## Próximo passo

Fazer push de `chore/deps-upgrade` e abrir o PR para o CI rodar em Linux e Windows; executar as validações manuais acima com `pnpm dev:app`; só então fazer merge na `main`.
