# RETOMADA — Pomodoroz

Status: snapshot operacional da sessão atual.
Última revisão: 2026-10-29.

## Fontes canônicas

- `AGENTS.md`
- `docs/IMPROVEMENTS.md`
- `docs/VERSIONS.md`
- `CHANGELOG.md`
- `openspec/changes/`

## Estado atual da sessão

- A baseline publicada é `26.9.2`; a seção `26.10.1` (TBD/A definir) dos changelogs acumula as correções sem release.
- As correções da auditoria de defeitos de 2026-10-29, o patch de segurança Tauri 2.12.5 e o pin do pnpm 12.16.1 estão em `origin/main` com CI verde; ainda sem release (detalhes na seção `26.10.1`).
- O lote JS de baixo risco (tooling de build/lint, `react-redux` e `uuid`) está commitado localmente em `main`, sem push; os adiados estão no histórico de `docs/VERSIONS.md`.
- `cargo audit --deny warnings` passa; as exceções restantes estão em `src-tauri/.cargo/audit.toml` (zbus sem manutenção: RUSTSEC-2026-0370/0371/0372).
- A change `complete-updater-task-cleanup` está em 9/10 tarefas.
- A change `align-rust-toolchain-automation` está pronta para leitura guiada e decisão de archive.

## Bloqueios

- Sem `pwsh` local: `scripts/check-updates.ps1`, `scripts/install.ps1` e `scripts/uninstall.ps1` só foram revisados estaticamente.
- Validações manuais pendentes no app: reset de foco com "mover para Ocioso" após mais de 2 min de foco; alerta de armazenamento cheio; pausa especial ao reabrir o app dentro da janela; link Markdown da descrição abrindo no navegador; segunda instância sem tray duplicado; drag durante foco, popup de Tasks e updater N→N+1 para NSIS/AppImage.

## Próximo passo

Fazer push do lote JS e acompanhar o CI; executar as validações manuais acima; depois preparar a release `26.10.1` (data nos changelogs, `./scripts/release.sh --dry-run` e `--no-push`) e decidir o archive de `align-rust-toolchain-automation`.
