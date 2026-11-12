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

- A baseline publicada é `26.11.1`. A próxima release é `26.11.2`, com changelogs datados de 2026-11-12; a tag ainda não foi criada e `package.json`, `tauri.conf.json` e `Cargo.toml` seguem em `26.11.1` até o `release.sh` rodar o `version:sync`.
- A migração de dependências está na `main` local (sem push), um commit por bloco: patches/minors JS e Rust, pnpm 12.18.0, `@types/node` 26, vitest 5, i18next 27/react-i18next 18, react-router 8, rodio 0.23, limpeza do `tsconfig.json`, Rust 1.99.1, edition 2024, Actions v7 e lockfiles JS/Rust renovados.
- O gate do CI (lint, typecheck, testes, build, fmt, clippy, check, test e `cargo audit --deny warnings`) passou localmente em cada bloco, só no Linux; as exceções do audit continuam as de `src-tauri/.cargo/audit.toml`.
- Em 2026-11-12 o operador validou no app em modo dev (Linux): modo compacto, navegação Tasks/Statistics, edição de task e descrição, troca de idioma, som de fim de sessão e notificação nativa.
- Segurados, com motivo em `docs/VERSIONS.md`: TypeScript 6.0.3, Node 24 e OpenSpec CLI 1.14.1.
- A change `complete-updater-task-cleanup` está em 9/10 tarefas; `align-rust-toolchain-automation`, `patch-event-listener-advisory` e `address-audit-hardening-findings` estão completas, aguardando leitura guiada e decisão de archive.

## Bloqueios

- Sem `pwsh` local: `scripts/check-updates.ps1` (inclusive a correção do `^`), `scripts/install.ps1` e `scripts/uninstall.ps1` só foram revisados estaticamente.
- Windows ainda não foi exercitado: o build e as Actions v7 só são validados pelo CI no push da `main`.
- Validações manuais herdadas da 26.11.1 ainda pendentes: reset de foco com "mover para Ocioso" após mais de 2 min de foco, alerta de armazenamento cheio, pausa especial ao reabrir o app dentro da janela, link Markdown abrindo no navegador, segunda instância sem tray duplicado, drag durante foco, popup de Tasks e updater N→N+1 para NSIS/AppImage.

## Próximo passo

Fazer `git push origin main` e conferir o CI em Linux e Windows; com o CI verde, rodar `./scripts/release.sh 26.11.2` (ou `--no-push` e enviar à mão). Se o job Windows falhar, corrigir antes da tag.
