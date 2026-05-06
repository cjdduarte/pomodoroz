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

- Ultimo commit conhecido: `3278741 chore(release): v26.5.3`.
- Versao atual publicada: `v26.5.3`.
- Trabalho atual: correcao dos menus de tarefa do Timer; no modo normal, grid/acoes voltaram a abrir acima do rodape sem recorte; no modo compacto, acoes e lista de prioridade agora abrem como painel expandido abaixo do rodape, igual ao grid. A expansao compacta voltou a ser disparada no clique antes de renderizar o painel, evitando compressao temporaria do relogio/controles durante o resize nativo.
- Estado do repositorio: alterado em `src/routes/Timer/CompactTaskDisplay.tsx`, `CHANGELOG.md`, `CHANGELOG.pt.md`, `package.json`, `pnpm-lock.yaml` e este `RETOMADA.md`.

---

## Intencao de ajuste agora

Correcao visual dos menus de tarefa do Timer concluida e validada; proximo passo e revisar/commitar o diff.

---

## Validado

- Reproducao visual em Vite/browser com viewport normal `340x508`: botao de grid abre o painel acima do rodape sem recorte.
- Reproducao visual em Vite/browser com viewport normal `340x508`: botao de acoes abre o menu acima do rodape sem recorte.
- Reproducao visual em Vite/browser no modo compacto: botao de acoes abre painel abaixo do rodape.
- Reproducao visual em Vite/browser no modo compacto: acao `Lista de prioridade` troca para painel abaixo do rodape.
- Reproducao visual em Vite/browser no modo compacto: botao de grid continua abrindo painel abaixo do rodape.
- `pnpm lint` passa sem erros.
- `pnpm typecheck:renderer` passa.
- `pnpm build:renderer` gera assets sem erros.

---

## Estado pendente

- Nenhum item critico aberto no momento; pendente apenas revisar/commitar a correcao.
- Consultar `docs/IMPROVEMENTS.md` para o roadmap de features e melhorias tecnicas pendentes.

---

## Retomar

1. Revisar `git status --short` e `git log --oneline -5`.
2. Conferir o diff em `src/routes/Timer/CompactTaskDisplay.tsx`, `CHANGELOG.md`, `CHANGELOG.pt.md`, `package.json`, `pnpm-lock.yaml` e `RETOMADA.md`.
3. Preparar commit convencional sugerido para a correcao.
