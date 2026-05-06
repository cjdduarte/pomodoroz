# RETOMADA.md

Status: **handoff operacional**.

Este arquivo existe para retomar trabalho em um novo chat sem precisar reconstruir o ponto atual. Ele **nao** substitui `AGENTS.md` como fonte de verdade de governanca/fluxo e **nao** substitui `docs/IMPROVEMENTS.md` como planejamento.

Atualizar este arquivo ao final de cada fase grande, correcao operacional relevante ou validacao real/manual que mude o proximo passo. Revisar e substituir contexto antigo; **nao acumular historico**.

---

## Regras rapidas

- Alvo exclusivo: `pomodoroz`.
- Ler primeiro: `AGENTS.md` e `docs/IMPROVEMENTS.md`.
- Nao adicionar novas dependencias sem apresentar opcoes e aguardar confirmacao.
- Validacoes de renderer: `pnpm lint` + `pnpm typecheck:renderer`.
- Build renderer: `pnpm build:renderer`.
- Dev completo: `pnpm dev:app`.
- Mensagens de commit em ingles (Conventional Commits); logs/comentarios em PT-BR quando apropriado.
- Nao criar arquivos de rascunho, spec ou checklist avulsos — usar `docs/IMPROVEMENTS.md` para roadmap.
- Nao alterar silenciosamente comportamento do timer, tarefas ou configuracoes.
- Changelog: nunca editar versao ja publicada; proximo item fica no topo como `TBD` / `A definir`.

---

## Ponto atual

- Ultimo commit conhecido: `98ed527 chore(release): fix Rust formatting preflight`.
- Versao atual publicada: `v26.5.3`.
- Trabalho da `26.5.4`: correcao dos menus de tarefa do Timer e polimento do destaque da tarefa ativa no grid ja commitados em `f39b12f` e `9a07b85`.
- Tentativa de release `26.5.4` falhou no preflight local em `cargo fmt --all -- --check`, por formatacao do bloco `use commands::window_bridge` em `src-tauri/src/lib.rs`; a correcao Rust foi commitada em `98ed527`.
- Estado do repositorio: alterado apenas para registrar a correcao nos changelogs e atualizar este handoff.

---

## Intencao de ajuste agora

Desbloquear o `release.sh` da `26.5.4`: `cargo fmt --all` aplicado, preflight local validado e correcao Rust commitada; proximo passo e revisar/commitar changelogs/handoff e rerodar `./scripts/release.sh 26.5.4`.

---

## Validado

- Reproducao visual em Vite/browser com viewport normal `340x508`: botao de grid abre o painel acima do rodape sem recorte.
- Reproducao visual em Vite/browser com viewport normal `340x508`: botao de acoes abre o menu acima do rodape sem recorte.
- Reproducao visual em Vite/browser no modo compacto: botao de acoes abre painel mais curto abaixo do rodape.
- Reproducao visual em Vite/browser no modo compacto: acao `Lista de prioridade` troca para painel abaixo do rodape.
- Reproducao visual em Vite/browser no modo compacto: botao de grid continua abrindo painel abaixo do rodape.
- Destaque da tarefa ativa no `TaskListGrid` ajustado no estilo compartilhado, cobrindo grid normal e grid compacto.
- `pnpm lint` passa sem erros.
- `pnpm typecheck:renderer` passa.
- `pnpm build:renderer` gera assets sem erros.
- `cargo check --manifest-path src-tauri/Cargo.toml` passa sem erros.
- `./scripts/validar-tudo.sh --skip-install` passa apos aplicar `cargo fmt --all`; inclui lint, typecheck, Vitest, Rust `fmt + clippy + check` e build Tauri release sem bundle.

---

## Estado pendente

- Pendente revisar/commitar `CHANGELOG.md`, `CHANGELOG.pt.md` e `RETOMADA.md`.
- Depois do commit, rerodar `./scripts/release.sh 26.5.4`.
- Consultar `docs/IMPROVEMENTS.md` para o roadmap de features e melhorias tecnicas pendentes.

---

## Retomar

1. Revisar `git status --short` e `git log --oneline -5`.
2. Conferir o diff em `CHANGELOG.md`, `CHANGELOG.pt.md` e `RETOMADA.md`.
3. Commitar changelogs/handoff e executar novamente `./scripts/release.sh 26.5.4`.
