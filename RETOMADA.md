# RETOMADA.md

Status: **handoff operacional**.

Este arquivo existe para retomar a sessao atual em um novo chat sem reconstruir contexto.

Ele **nao** substitui `AGENTS.md` como fonte de verdade de governanca/fluxo e **nao** substitui `docs/IMPROVEMENTS.md` como planejamento.

Nao registrar segredos, tokens, credenciais, endpoints privados, dados pessoais ou informacoes que nao deveriam entrar no repositorio.

Manter somente:

- o que foi feito na sessao atual;
- o estado operacional atual;
- os proximos passos objetivos.

Revisar e substituir contexto antigo; **nao acumular historico**.

---

## Sessao atual

- Avaliado este handoff e removido o contexto antigo que nao refletia mais o working tree atual.
- Atualizacao de tooling em andamento: pins de tooling do projeto atualizados nos manifests e workflows.
- Texto das tarefas nos cartoes do grid ajustado para manter estilo normal de texto do app, preservando o tamanho atual.
- Registrada a atualizacao de tecnologia na secao aberta `26.5.11` de `CHANGELOG.md` e `CHANGELOG.pt.md`, sem mudancas intencionais de comportamento.

---

## Estado atual

- Branch atual: `main`.
- Ultima tag local: `v26.5.10`.
- Manifesto do app ainda esta em `26.5.10`; changelog de `26.5.11` segue aberto como `TBD`/`A definir`.
- Working tree esperado desta etapa: `.github/workflows/ci.yml`, `.github/workflows/release-autoupdate.yml`, `package.json`, `pnpm-lock.yaml`, `src/routes/Tasks/TaskListGrid.styles.ts`, `CHANGELOG.md`, `CHANGELOG.pt.md` e `RETOMADA.md` modificados.
- Validacao automatizada ainda nao foi executada nesta etapa.

---

## Proximos passos

1. Validar a atualizacao de tooling com o gate local relevante.
2. Revisar o diff final antes do commit/release.
