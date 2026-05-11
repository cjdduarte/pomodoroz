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
- Nao criar arquivos de rascunho, spec ou checklist avulsos - usar `docs/IMPROVEMENTS.md` para roadmap.
- Nao alterar silenciosamente comportamento do timer, tarefas ou configuracoes.
- Changelog: nunca editar versao ja publicada; proximo item fica no topo como `TBD` / `A definir`.

---

## Ponto atual

- Ultimo commit conhecido: `170a55a chore(release): v26.5.5`.
- Versao atual publicada: `v26.5.5`.
- A correcao da pausa em tela cheia no Tauri foi finalizada, commitada e tagueada em `v26.5.5`.
- `CHANGELOG.md` e `CHANGELOG.pt.md` registram a versao `26.5.5` com data `2026-05-06`.
- Trabalho local da `26.5.6`: tela de Relatorio reorganizada para separar metricas filtradas por periodo de progresso de longo prazo.
- O combo de periodo agora fica dentro do cabecalho `Relatorio do periodo`; os cartoes de tempo de foco, pausa, ocioso e ciclos completos continuam visiveis antes do bloco de progresso.
- O bloco de progresso usa historico local para sequencia, nivel/XP, meta de hoje, marcos explicitos, heatmap de 30 dias e barras dos ultimos 7 dias.
- Nao foram adicionadas dependencias nem novos campos de storage.
- `CHANGELOG.md` e `CHANGELOG.pt.md` ja registram a mudanca em `26.5.6` como `TBD` / `A definir`.

---

## Intencao de ajuste agora

Revisar visualmente a tela de Relatorio no app desktop e commitar o incremento `26.5.6` se o layout estiver adequado.

---

## Validado

- `cargo fmt --all --manifest-path src-tauri/Cargo.toml -- --check` passa.
- `cargo check --manifest-path src-tauri/Cargo.toml` passa.
- `./scripts/validar-tudo.sh --skip-install` passa; inclui lint, typecheck, Vitest, Rust `fmt + clippy + check` e build Tauri release sem bundle.
- Validacao manual confirmada: pausa em tela cheia volta para frente quando a janela esta visivel atras de outros apps.
- Release `v26.5.5` criada no commit `170a55a`.
- `pnpm lint` passa apos a separacao entre Relatorio do periodo e Progresso.
- `pnpm typecheck:renderer` passa apos a separacao entre Relatorio do periodo e Progresso.
- `pnpm build:renderer` passa apos a separacao entre Relatorio do periodo e Progresso.
- Smoke visual via Vite/browser em `#/statistics` confirmou o combo dentro de `Relatorio do periodo` e o bloco `Progresso` separado; avisos de IPC eram esperados fora do runtime Tauri.

---

## Estado pendente

- Pendente validacao visual/manual da tela de Relatorio no desktop.
- Pendente commitar a mudanca da `26.5.6`.

---

## Retomar

1. Revisar `git status --short`.
2. Abrir o app e validar a tela de Relatorio com historico real.
3. Se necessario, ajustar espacamento/rotulos do resumo gamificado.
4. Commitar com mensagem Conventional Commits em ingles.
