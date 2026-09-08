# Pomodoroz — Agent Rules

> Operational rules for AI agents working on this codebase.
> For project overview, stack, and commands, see `CLAUDE.md`.
> For pending improvements roadmap, see `docs/IMPROVEMENTS.md`.

---

## Scope

- Platform: Tauri desktop app.
- Architecture: standalone, no server, no cloud. All data is local.
- Direction: incremental evolution with focus on stability, security, and predictability.

---

## Mission

1. Preserve functional stability (timer, tasks, settings, tray, compact mode).
2. Maintain security hardening (Tauri commands/capabilities/CSP).
3. Evolve dependencies in small, testable, reversible blocks.
4. Keep cross-platform builds green (Windows, macOS, Linux).
5. Log changes in CHANGELOG; track decisions in docs.

---

## Rules

1. Work in small, testable, reversible blocks.
2. Preserve UX and behavior of timer/tasks/settings.
3. Before adding a new library: present options, impact, and wait for confirmation.
4. Never swap technology silently.
5. Code in English. Comments/logs in Portuguese (PT-BR) where appropriate.
6. Commit messages and PR titles must be in English (Conventional Commits).
7. At the end of each finalized implementation, AI agents must suggest a ready-to-use commit message (Conventional Commits, English).

---

## Documentation Policy

| What                         | Where                                          |
| ---------------------------- | ---------------------------------------------- |
| Implemented changes          | `CHANGELOG.md` (EN) and `CHANGELOG.pt.md` (PT) |
| Pending improvements roadmap | `docs/IMPROVEMENTS.md`                         |
| Migration closure reference  | `docs/MIGRATION_TO_TAURI.md`                   |
| Release/update operations    | `docs/RELEASE_OPERATIONS.md`                   |
| Versions and update policy   | `docs/VERSIONS.md`                             |
| Agent operational rules      | This file (`AGENTS.md`)                        |
| Claude Code guide            | `CLAUDE.md`                                    |
| Session handoff state        | `RETOMADA.md`                                  |
| Session handoff template     | `RETOMADA.example.md`                          |

Do not create loose specs/checklists for topics already covered in the documents above.

### RETOMADA.md Rules

`RETOMADA.md` is an operational handoff document — a lean snapshot to resume work in a new chat without rebuilding context. It is **not** a source of truth for governance (that is `AGENTS.md`) and **not** a planning document (that is `docs/IMPROVEMENTS.md`).

1. Update `RETOMADA.md` at the end of each major phase, relevant operational fix, or real/manual validation that changes the next step.
2. Use `RETOMADA.example.md` only as the reset template if `RETOMADA.md` needs to be recreated.
3. Replace old context with current context; **do not accumulate history**.
4. Keep it lean — it should contain only what the next session needs to pick up where work stopped.
5. Do not store secrets, tokens, credentials, private endpoints, or personal data in `RETOMADA.md`.

### Changelog Rules

1. Source of truth for GitHub Release notes: `CHANGELOG.md` section `## [x.y.z]`.
2. Before creating a tag/release, update both `CHANGELOG.md` and `CHANGELOG.pt.md`.
3. Never edit items of an already-published version; new changes go in the next version.
4. Keep the next version at the top as `A definir` (PT) / `TBD` (EN); set date only on release day.
5. Do not create tag `v*` without a valid entry in both changelogs.
6. When an AI agent suggests running `./scripts/release.sh` or `./scripts/release.ps1`, it must first set the target version date (`YYYY-MM-DD`) in both changelog headers for that version.

---

## MCP (Recommended Usage)

| MCP                 | When to use                              |
| ------------------- | ---------------------------------------- |
| context7            | API and official documentation questions |
| sequential-thinking | Planning larger migrations               |
| playwright          | UI behavior investigation                |

Use MCP as decision support; do not duplicate history or roadmap in this file.

## OpenSpec

Politica comum: [OpenSpec nos projetos](../../OPENSPEC_PROJETOS.md).

Depois de qualquer `openspec update`, revisar este `AGENTS.md`, `CLAUDE.md` e
as citacoes do projeto conforme a secao "Procedimento completo apos
`openspec update`" da politica central. A validacao OpenSpec e a validacao
documental sao estados separados.

Este projeto usa OpenSpec, schema `spec-driven`, somente para trabalho que vai
construir ou alterar entrega operacional verificavel.

Regra de corte obrigatoria:

> Se nao termina em codigo, migration ou dado/artefato operacional novo, nao e
> change OpenSpec. E ADR de uma pagina. OpenSpec so se abre para construir.

Antes de agir, declare o caminho usado: direto para ajuste pequeno; ADR para
decisao sem entrega operacional; OpenSpec para construcao com codigo,
migration, dado ou artefato operacional verificavel.

Use OpenSpec para:

- feature nova;
- refactor relevante;
- mudanca arquitetural;
- correcao com risco ou escopo incerto;
- trabalho que precisa deixar proposta, requisitos, design e tarefas rastreaveis;
- somente quando a entrega terminar em codigo, migration, schema, dado, script,
  pipeline, endpoint, relatorio gerado, infra ou comportamento operacional verificavel.

Nao use OpenSpec para decidir, escolher, aprovar, registrar politica, contrato
conceitual, gate ou triagem sem entrega operacional. Para isso, use ADR em
`docs/decisions/ADR-XXXX-<slug>.md`.

Para mudancas pequenas, como typo, ajuste visual simples, import quebrado ou bug
pequeno e isolado, implemente direto sem abrir change OpenSpec.

Para decisoes sem entrega operacional, crie uma ADR curta em
`docs/decisions/ADR-XXXX-<slug>.md`.

Para revisar ou reconciliar o plano de uma change existente, sem editar codigo,
use `/opsx:update` (no OpenCode, `/opsx-update`). Use somente quando a change
continuar com entrega operacional verificavel; se a revisao resultar apenas em
decisao sem entrega, pare o fluxo e registre ADR.

Fluxo padrao:

1. Use `/opsx:explore` quando o pedido estiver vago.
2. Use `/opsx:propose <descricao>` para gerar os artefatos necessarios do schema
   `spec-driven`: `proposal` e `tasks` sempre, `specs` em Lite mode por padrao e
   `design` somente quando houver trade-off tecnico real.
3. Revise antes de codar: confira proposta, specs, design quando existir e
   tasks; rode `openspec status --change <change-id>` e espere completos os
   artefatos que a change realmente precisa. Se precisar revisar ou reconciliar
   o plano, use `/opsx:update`, confirme cada artefato proposto e refaca a
   revisao. Checkpoints: a proposta responde problema, solucao, escopo e
   riscos? As specs tem cenarios e deltas corretos? O design e necessario para
   implementar? As tasks sao numeradas e verificaveis?
4. Use `/opsx:apply` somente apos a revisao.
5. Use `/opsx:sync` se a implementacao alterar ou consolidar specs.
6. Rode `openspec validate --all --strict` antes de finalizar. Para uma change especifica, use `openspec validate <change-id> --strict`.
7. Use `/opsx:archive` quando a mudanca estiver concluida.

Aprovacao antes de arquivar:

Validacao OpenSpec nao substitui aprovacao do operador. Antes de arquivar uma
change ou trata-la como aprovada, o agente deve:

1. criar ou revisar a change;
2. fazer leitura guiada em PT-BR dos artefatos existentes (`proposal`, `specs`,
   `design` quando necessario e `tasks`);
3. apontar riscos, ambiguidades, o que a aprovacao autoriza e o que nao autoriza;
4. aguardar aprovacao explicita ou pedidos de ajuste;
5. so entao arquivar.

Artefatos:

- `proposal.md`: por que, o que muda, capabilities e impacto; inclua escopo e riscos quando forem decisivos.
- `specs/`: requisitos como delta (`ADDED`, `MODIFIED`, `REMOVED` ou `RENAMED Requirements`), com `#### Scenario:` e passos `WHEN`/`THEN`; use `GIVEN` so quando ajudar.
- `design.md`: abordagem tecnica necessaria para implementar; nao e ata de decisao.
- `tasks.md`: passos numerados, verificaveis de forma independente e em ordem de dependencia; evite tasks monoliticas.

A verificacao pratica e a revisao do passo 3 + `openspec validate --all --strict`.

No OpenCode, se os comandos gerados aparecerem com hifen, use os equivalentes:
`/opsx-explore`, `/opsx-propose`, `/opsx-apply`, `/opsx-update`, `/opsx-sync` e
`/opsx-archive`.

Nota de instalacao: se faltarem `openspec/AGENTS.md` ou `openspec/project.md`,
eles podem ser gerados por `openspec update` quando for decidido formalizar essas
instrucoes; sem acao automatica.
