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

- Ultimo commit conhecido: `8ec5965 chore(testing): adopt vitest and expand renderer unit coverage`.
- Versao atual publicada: `v26.5.1`.
- Trabalho recente: adocao do Vitest e expansao de cobertura de testes unitarios do renderer; nenhuma funcionalidade de usuario alterada.
- Estado do repositorio: limpo (working tree clean, sem pendencias no staging).

---

## Intencao de ajuste agora

Nenhum trabalho em andamento. Proximo passo a definir pelo operador.

---

## Validado

- `pnpm lint` passa sem erros.
- `pnpm typecheck:renderer` passa.
- `pnpm build:renderer` gera assets sem erros.
- Suite Vitest adotada e passando (`pnpm test`).
- Scrollbar visivelmente padronizada (fix `0c9521f`).
- Validacao de changelog por script funcional (fixes `5516ca1`, `e8f2fd5`).
- v26.5.1 publicada e anotada no CHANGELOG (ambos PT e EN).

---

## Estado pendente

- Nenhum item critico aberto no momento.
- Consultar `docs/IMPROVEMENTS.md` para o roadmap de features e melhorias tecnicas pendentes.

---

## Retomar

1. Revisar `git status --short` e `git log --oneline -5`.
2. Ler `docs/IMPROVEMENTS.md` para entender o que esta aberto/em progresso.
3. Perguntar ao operador qual e o proximo foco antes de comecar qualquer implementacao.
4. Ao iniciar implementacao relevante, atualizar este arquivo com o ponto atual e a intencao.
5. Ao concluir fase grande ou validacao manual, atualizar `Validado` e `Estado pendente` antes de encerrar o chat.
