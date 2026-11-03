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

- A baseline publicada é `26.9.2`. A próxima release é `26.11.1` (changelogs datados de 2026-11-03); o commit `chore(release): v26.10.1` em `origin/main` nunca foi publicado e a tag local `v26.10.1` foi removida.
- O changelog consolidado e as atualizações aplicadas pelo operador (React 19.3, styled-components 6.6, RTK 2.13, i18next/react-i18next, `log`), mais `async-executor` 1.14.1 no lugar da versão yanked, estão commitados localmente em `main`, sem push.
- `cargo audit --deny warnings` passa; as exceções restantes estão em `src-tauri/.cargo/audit.toml` (zbus sem manutenção: RUSTSEC-2026-0370/0371/0372).
- A change `complete-updater-task-cleanup` está em 9/10 tarefas.
- A change `align-rust-toolchain-automation` está pronta para leitura guiada e decisão de archive.

## Bloqueios

- Sem `pwsh` local: `scripts/check-updates.ps1`, `scripts/install.ps1` e `scripts/uninstall.ps1` só foram revisados estaticamente.
- Validações manuais pendentes no app: reset de foco com "mover para Ocioso" após mais de 2 min de foco; alerta de armazenamento cheio; pausa especial ao reabrir o app dentro da janela; link Markdown da descrição abrindo no navegador; segunda instância sem tray duplicado; modo compacto ao redimensionar a janela e campos de texto (React 19.3/styled-components 6.6); drag durante foco, popup de Tasks e updater N→N+1 para NSIS/AppImage.

## Próximo passo

Executar as validações manuais acima; rodar `./scripts/release.sh --dry-run 26.11.1` e depois `./scripts/release.sh --no-push 26.11.1`; publicar com `git push origin main && git push origin v26.11.1`; decidir o archive de `align-rust-toolchain-automation`.
