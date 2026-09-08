# RETOMADA.md

Status: **handoff operacional**.

Este arquivo existe para retomar a sessao atual em um novo chat sem reconstruir contexto.

Ele **nao** substitui `AGENTS.md` como fonte de verdade de governanca/fluxo e **nao** substitui `docs/IMPROVEMENTS.md` como planejamento.

Nao registrar segredos, tokens, credenciais, endpoints privados, dados pessoais ou informacoes que nao deveriam entrar no repositorio.

---

## Sessao atual

- Foco: preparar a manutencao da versao `26.9.1`.
- Implementado: CI e release usam Rust `1.98.1`, igual a `rust-toolchain.toml`; os READMEs declaram o requisito; `docs/VERSIONS.md` exige atualizar toolchain, MSRV e workflows juntos em cada bump; a versão `26.9.1` está sincronizada e o Vite usa configuração `.mts`.
- Validado: Rust `1.98.1`; `cargo fmt`, clippy, check e 16 testes passaram; `pnpm install --frozen-lockfile` no modo do CI, 38 testes do renderer, build Tauri sem bundle, Prettier dos arquivos alterados e `openspec validate --all --strict` passaram.
- Correção operacional: `pnpm-lock.yaml` passou a registrar `packageManagerDependencies` do pnpm `12.3.4`; `PNPM_CONFIG_PM_ON_FAIL=download pnpm install --frozen-lockfile` passa, igual ao modo usado pelo CI.
- Correção de segurança: `event-listener` transitivo foi atualizado de `5.4.1` para `5.4.2`; `cargo audit --deny warnings`, fmt, clippy, check e 16 testes Rust passaram sem novo ignore em `audit.toml`.

---

## Estado atual

- Branch atual: `main`.
- Baseline publicado: `26.9.1`; criar `TBD` / `A definir` apenas na próxima modificação.
- Alterações preexistentes no worktree incluem pins de pnpm, manifests e habilidades em `.agents/`; preservá-las ao continuar.
- A change `complete-updater-task-cleanup` permanece em 9/10 tarefas, aguardando validação de `scripts/check-updates.ps1` em Windows ou com `pwsh`.

---

## Proximos passos

1. Fazer leitura guiada e obter aprovação explícita antes de arquivar `align-rust-toolchain-automation`.
2. Validar `scripts/check-updates.ps1` com PowerShell em Windows ou ambiente que tenha `pwsh`.
3. Validar manualmente drag entre listas durante foco, popup de ações de Tasks e updater N->N+1 para NSIS/AppImage.
