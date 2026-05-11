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
- Branch `main` alinhada com `origin/main` e sem mudancas locais pendentes na ultima verificacao.
- A correcao da pausa em tela cheia no Tauri foi finalizada, commitada e tagueada em `v26.5.5`.
- `CHANGELOG.md` e `CHANGELOG.pt.md` registram a versao `26.5.5` com data `2026-05-06`.

---

## Intencao de ajuste agora

Escolher o proximo bloco de trabalho a partir de `docs/IMPROVEMENTS.md`. Candidatos naturais:

- Ciclo de produto `B1 -> B2 -> B3`.
- Expansao de cobertura `A6` em pequenos lotes sem novas dependencias.
- Avaliacao do gate `A10`, sem migracao automatica se o ROI nao for claro.

---

## Validado

- `cargo fmt --all --manifest-path src-tauri/Cargo.toml -- --check` passa.
- `cargo check --manifest-path src-tauri/Cargo.toml` passa.
- `./scripts/validar-tudo.sh --skip-install` passa; inclui lint, typecheck, Vitest, Rust `fmt + clippy + check` e build Tauri release sem bundle.
- Validacao manual confirmada: pausa em tela cheia volta para frente quando a janela esta visivel atras de outros apps.
- Release `v26.5.5` criada no commit `170a55a`.

---

## Estado pendente

- Nao ha pendencia local conhecida da `26.5.5`.
- Consultar `docs/IMPROVEMENTS.md` para selecionar o proximo incremento.

---

## Retomar

1. Revisar `git status --short`.
2. Ler `docs/IMPROVEMENTS.md` e escolher o proximo bloco pequeno.
3. Antes de nova implementacao, confirmar se o bloco altera timer, tarefas, settings, tray ou compact mode.
4. Ao finalizar implementacao, atualizar changelogs e `RETOMADA.md` conforme as regras do projeto.
