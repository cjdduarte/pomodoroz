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

- A baseline publicada é `26.9.2`; a seção `26.10.1` dos changelogs está datada de 2026-10-29, com a release ainda não executada.
- As correções da auditoria de defeitos de 2026-10-29, o patch de segurança Tauri 2.12.5, o pin do pnpm 12.16.1 e o lote JS de baixo risco estão em `origin/main` (CI verde informado até o patch Tauri/pnpm); os adiados estão no histórico de `docs/VERSIONS.md`.
- `cargo audit --deny warnings` passa; as exceções restantes estão em `src-tauri/.cargo/audit.toml` (zbus sem manutenção: RUSTSEC-2026-0370/0371/0372).
- A change `complete-updater-task-cleanup` está em 9/10 tarefas.
- A change `align-rust-toolchain-automation` está pronta para leitura guiada e decisão de archive.

## Bloqueios

- Sem `pwsh` local: `scripts/check-updates.ps1`, `scripts/install.ps1` e `scripts/uninstall.ps1` só foram revisados estaticamente.
- Validações manuais pendentes no app: reset de foco com "mover para Ocioso" após mais de 2 min de foco; alerta de armazenamento cheio; pausa especial ao reabrir o app dentro da janela; link Markdown da descrição abrindo no navegador; segunda instância sem tray duplicado; drag durante foco, popup de Tasks e updater N→N+1 para NSIS/AppImage.

## Próximo passo

Executar as validações manuais acima; commitar a data dos changelogs; rodar `./scripts/release.sh --dry-run 26.10.1` e depois `./scripts/release.sh --no-push 26.10.1`; publicar com `git push origin main && git push origin v26.10.1`; decidir o archive de `align-rust-toolchain-automation`.
