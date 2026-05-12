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

- Ultimo commit conhecido: `275f849 chore(release): v26.5.6`.
- Versao atual publicada/tagueada: `v26.5.6`.
- `CHANGELOG.md` e `CHANGELOG.pt.md` registram a versao `26.5.6` com data `2026-05-11`.
- A tela de Relatorio foi reorganizada para separar metricas filtradas por periodo de progresso de longo prazo.
- O combo de periodo fica dentro do cabecalho `Relatorio do periodo`; os cartoes de tempo de foco, pausa, ocioso e ciclos completos continuam visiveis antes do bloco de progresso.
- O bloco de progresso usa historico local para sequencia, nivel/XP, meta de hoje, marcos explicitos, heatmap de 30 dias e barras dos ultimos 7 dias.
- Janelas de semana/mes foram alinhadas a dias locais, o fluxo diario usa ordem cronologica em periodos fixos, e a tela aberta atualiza o "agora" periodicamente.
- Updates aplicados na `26.5.6`: pnpm `11.0.9`, deps JS/TS patch/minor selecionadas, `lint-staged` `17.0.4`, `tauri` `2.11.1` e `tauri-build` `2.6.1`.
- `scripts/check-updates.sh` prepara todos os pins Rust selecionados no `Cargo.toml` antes de rodar `cargo update`, evitando conflito transitorio em pares com pin exato.
- Nao foram adicionadas novas dependencias nem novos campos de storage.
- Trabalho local atual: sincronizacao documental de `README.md`, `README.pt-BR.md` e deste handoff com o estado da `26.5.6`.

---

## Intencao de ajuste agora

Finalizar a sincronizacao documental dos READMEs e commitar em um bloco pequeno de docs.

---

## Validado

- `cargo fmt --all --manifest-path src-tauri/Cargo.toml -- --check` passa.
- `cargo check --manifest-path src-tauri/Cargo.toml` passa.
- `./scripts/validar-tudo.sh --skip-install` passa; inclui lint, typecheck, Vitest, Rust `fmt + clippy + check` e build Tauri release sem bundle.
- Validacao manual confirmada: pausa em tela cheia volta para frente quando a janela esta visivel atras de outros apps.
- Apos as correcoes de Relatorio e updates de deps da `26.5.6`, `pnpm lint`, `pnpm typecheck:renderer`, `pnpm test:run`, `pnpm build:renderer` e `cargo check --manifest-path src-tauri/Cargo.toml` passam.
- `sh -n scripts/check-updates.sh` passa apos o ajuste do fluxo Rust.
- Smoke visual anterior via Vite/browser ficou limitado por modal de atualizacao e aviso de IPC fora do runtime Tauri; nao substitui a validacao desktop.
- Release `v26.5.6` criada no commit `275f849`.

---

## Estado pendente

- Pendente revisar `git diff` da sincronizacao documental.
- Pendente commitar o ajuste documental.

---

## Retomar

1. Revisar `git status --short`.
2. Revisar `git diff -- README.md README.pt-BR.md RETOMADA.md`.
3. Commitar a sincronizacao documental com mensagem Conventional Commits em ingles.
