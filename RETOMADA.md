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

- Ultimo commit conhecido: `6dd5120 fix(timer): prevent compact panel resize jitter`.
- Versao atual publicada: `v26.5.3`.
- Trabalho atual: correcao dos menus de tarefa do Timer e polimento do destaque da tarefa ativa no grid. No modo normal, grid/acoes voltaram a abrir acima do rodape sem recorte; no modo compacto, acoes abre como painel expandido mais curto abaixo do rodape, enquanto grid/lista de prioridade usam o painel mais alto. O destaque da tarefa em execucao no grid agora usa halo mais fino e sem sombra extra no grid normal e compacto.
- Estado do repositorio: alterado em `src/routes/Timer/CompactTaskDisplay.tsx`, `src/routes/Tasks/TaskListGrid.styles.ts`, `src/ipc/index.ts`, `src/contexts/connectors/TauriInvokeConnector.ts`, `src-tauri/src/commands/window_bridge.rs`, `src-tauri/src/lib.rs`, `CHANGELOG.md`, `CHANGELOG.pt.md` e este `RETOMADA.md`.

---

## Intencao de ajuste agora

Correcao visual dos menus de tarefa do Timer e do destaque ativo no grid concluida e validada; changelogs da `26.5.4` datados em `2026-05-06`; proximo passo e revisar/commitar o diff.

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

---

## Estado pendente

- Nenhum item critico aberto no momento; pendente apenas revisar/commitar a correcao.
- Consultar `docs/IMPROVEMENTS.md` para o roadmap de features e melhorias tecnicas pendentes.

---

## Retomar

1. Revisar `git status --short` e `git log --oneline -5`.
2. Conferir o diff em `src/routes/Timer/CompactTaskDisplay.tsx`, `src/routes/Tasks/TaskListGrid.styles.ts`, `src/ipc/index.ts`, `src/contexts/connectors/TauriInvokeConnector.ts`, `src-tauri/src/commands/window_bridge.rs`, `src-tauri/src/lib.rs`, `CHANGELOG.md`, `CHANGELOG.pt.md` e `RETOMADA.md`.
3. Preparar commit convencional sugerido para a correcao.
