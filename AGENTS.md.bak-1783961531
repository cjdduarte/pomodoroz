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

<!-- ai-memory:start -->

## Long-term memory (ai-memory)

This project uses [ai-memory](https://github.com/akitaonrails/ai-memory)
for cross-session continuity.

**Default to the current project — always.** Every ai-memory tool
auto-scopes to the project resolved from your session's working
directory. **Do NOT pass `project`, `workspace`, or `cwd` arguments unless the user
explicitly references a _different_ project by name** (e.g. "what did we
decide in the `other-app` project?"). Phrases like "this project",
"here", "we", "our work", "where did we leave off" all mean the _current_
project — call the tool with no scoping args. If the user asks about a
handoff and the SessionStart auto-fetched block is already in your
context, just answer from it; do not re-call the tool to "find it again"
in another project.

**Lifecycle hooks already capture every prompt + tool call
automatically.** You never need to manually write routine notes; the
SessionStart hook auto-fetches pending handoffs, and on session end
ai-memory writes a session-summary page and a handoff.
LLM consolidation (compiling observations into topical wiki pages) runs
on PreCompact, on demand via `memory_consolidate`, and at session end
only when the server sets `AI_MEMORY_CONSOLIDATE_ON_SESSION_END`. Only
write a durable wiki page when the user explicitly asks to remember or
annotate something permanently.

### When to reach for each tool

The user can express any of the intents below in plain English —
match the intent to the tool. They do not need to name the tool.

| User says / situation                                                                                                                                  | Tool                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "have we discussed X?" / "search memory for Y" / before proposing architecture                                                                         | `memory_query` (current project; `scopes` for named siblings; `global=true` to search every project)                                                                                                                                                      |
| "what's been going on" / "show recent activity" (light)                                                                                                | `memory_recent`                                                                                                                                                                                                                                           |
| "is ai-memory healthy?" / "how big is the wiki?"                                                                                                       | `memory_status`                                                                                                                                                                                                                                           |
| "give me the stats" / structured snapshot for the agent to consume                                                                                     | `memory_briefing` (read-only; never creates handoffs)                                                                                                                                                                                                     |
| "catch me up" / "I've been away" / "what's important right now?" / open-ended exploration                                                              | `memory_explore`                                                                                                                                                                                                                                          |
| "where did we leave off?" — and you see a `📥 ai-memory: pending handoff` block in your context                                                        | already done — answer from that block; do NOT re-call `memory_handoff_accept`                                                                                                                                                                             |
| "where did we leave off?" — and no such block is visible                                                                                               | `memory_handoff_accept` (rare; the SessionStart hook usually got there first; pass `workspace` + `project` together only for a named sibling workspace/project)                                                                                           |
| "save context for the next session" / wrapping up / ending this session                                                                                | `memory_handoff_begin` (session-end only; do **not** use for status/briefing; single-use handoff; terse summary; put detail in `open_questions` + `next_steps` bullets; pass `workspace` + `project` together only for a named sibling workspace/project) |
| "discard that handoff" / "I created a handoff by mistake"                                                                                              | `memory_handoff_cancel` (requires exact `handoff_id` from `memory_handoff_begin`; marks it expired before the next session sees it)                                                                                                                       |
| "consolidate this session" / "compile what we learned" (also runs on PreCompact; at session end only if `AI_MEMORY_CONSOLIDATE_ON_SESSION_END` is set) | `memory_consolidate`                                                                                                                                                                                                                                      |
| "what did we learn from this session?" / "what memory should we add?" / explicit wrap-up learning review                                               | `memory_auto_improve` (manual learning review for a completed session; omit `session_id` for latest completed session; the server also schedules background review for newly completed sessions in every project when configured)                         |
| "remember this permanently" / "save a note" / "add an annotation" / durable project knowledge                                                          | `memory_write_page` (write a wiki page; do **not** use handoff for permanent notes; put the title as a `# H1` on the first line of `body` and omit the `title` arg — ai-memory derives it from the H1)                                                    |
| "read the page about X" / "show me the full content of Y" / "open the page on Z"                                                                       | `memory_read_page` (full body; pass a query to search or `path` for a direct lookup; pass `workspace` + `project` together only for a named sibling workspace/project)                                                                                    |
| "delete the page X" / "remove that note"                                                                                                               | `memory_delete_page` (by exact `path`; idempotent; pass `workspace` + `project` together only for a named sibling workspace/project)                                                                                                                      |
| "audit the wiki" / "find contradictions" / "what rules should we add?"                                                                                 | `memory_lint`                                                                                                                                                                                                                                             |
| "prune old pages" / "memory cleanup"                                                                                                                   | `memory_forget_sweep`                                                                                                                                                                                                                                     |

`memory_explore` is the right default for the "I want to know what's
going on" use case — it returns a prose digest whose verbosity
scales automatically to how long it's been since the last activity
(< 1 h → one line; > 30 days → full catchup).

### When the current project comes up empty — broaden the search

`memory_query` searches only the **current** project by default. If a
search comes back empty or thin, the knowledge may live in a **sibling
project** — shared `infra`, `ops`, or a related app. Don't conclude
"we never recorded it" after a single project misses; broaden instead:

- **Know which projects to check?** Re-run with explicit `scopes`, e.g.
  `scopes: [{ "workspace": "default", "project": "infra" }]`.
- **Don't know where it lives?** Pass `global=true` to search every
  project in every workspace at once. Each hit is annotated with its
  workspace + project so you can tell where it came from. `global=true`
  cannot be combined with `scopes`/`project`/`workspace`.

`memory_query` returns **snippets, not full page bodies** — an empty or
short snippet does **not** mean the page is empty (a large page can
match outside the snippet window). To read the whole page, use
`memory_read_page` (by `path`, or pass a `query` to fetch the top hit's
full body; add `workspace` + `project` together only when the user names
a sibling workspace/project).

### Use Retrieved Memory As Operating Guidance

When `memory_query` or `memory_recent` returns `_rules/`, `gotchas/`,
`procedures/`, or `decisions/` pages that match the current task, treat
them as actionable context, not trivia:

- Read full pages with `memory_read_page` when the snippet looks relevant.
- Apply `_rules/` as constraints.
- Check `gotchas/` as preflight warnings before editing the same subsystem.
- Follow `procedures/` as checklists for releases, PR reviews, deploys,
  migrations, and other repeatable workflows.
- Use `decisions/` as prior architecture unless the user explicitly asks
  to revisit them.

Before non-trivial coding, debugging, deployment, release, auth, scope,
migration, PR-review, or data-preservation work, search memory for the
subsystem and task type first. If the first query is thin, broaden or
query specific error/subsystem terms before designing a fix.

### Learning Review

The server schedules background auto-improvement for newly completed sessions in
every project when an LLM provider is configured. `memory_auto_improve` is the manual version:
use it when the user asks what durable lessons this session suggests, or at
explicit wrap-up when reviewing proposed memory would be useful. Scheduled and
manual runs apply or stage validated edits through the auto-improvement approval
path. Admins can turn off scheduling with `[auto_improve.scheduler] enabled =
false`, or opt into manual proposal approval with `[auto_improve]
require_approval = true`, in which case scheduled and manual proposals stay in
pending-writes until approved.

### When you write a project rule, write it here

If you're about to write a durable project rule ("always X", "never
Y", "all PRs must …"), write it in the project's canonical agent
instruction file. Many projects use CLAUDE.md for Claude Code and
AGENTS.md for Codex / OpenCode / Cursor / Gemini CLI, but if the
project says one file is canonical, use that file. ai-memory's lint
pass surfaces the same hint automatically when a `kind: rule` page
lands in `_rules/`.

### Refreshing this snippet

This block is maintained by ai-memory. Two ways to refresh it with
the latest binary's recommended copy:

- **From the agent** (no terminal needed): ask "refresh the ai-memory
  routing in this project" — the agent calls
  `memory_install_self_routing`, picks the right filename for itself
  (Claude Code → `CLAUDE.md`; Codex / OpenCode / Cursor / Gemini →
  `AGENTS.md`), and uses its Write / Edit tool to land the block.
- **From the CLI**: `ai-memory install-instructions` (defaults to
  `CLAUDE.md`; pass `--target AGENTS.md` for non-Claude agents or
  projects that use `AGENTS.md` as the canonical instruction file).

Both are idempotent: re-runs replace the block bracketed by
`<!-- ai-memory:start -->` / `<!-- ai-memory:end -->` markers
without disturbing the rest of the file.
<!-- ai-memory:end -->

## OpenSpec

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

Fluxo padrao:

1. Use `/opsx:explore` quando o pedido estiver vago.
2. Use `/opsx:propose <descricao>` para gerar os 4 artefatos do schema `spec-driven`: `proposal`, `specs`, `design` e `tasks`.
3. Revise antes de codar: confira proposta, specs, design e tasks; rode `openspec status --change <change-id>` e espere 4/4 artefatos completos; ajuste specs/tasks aqui. Checkpoints: a proposta responde problema, solucao, escopo e riscos? As specs tem cenarios e deltas corretos? O design cabe na arquitetura do projeto? As tasks sao numeradas e verificaveis?
4. Use `/opsx:apply` somente apos a revisao.
5. Use `/opsx:sync` se a implementacao alterar ou consolidar specs.
6. Rode `openspec validate --all --strict` antes de finalizar. Para uma change especifica, use `openspec validate <change-id> --strict`.
7. Use `/opsx:archive` quando a mudanca estiver concluida.

Aprovacao antes de arquivar:

Validacao OpenSpec nao substitui aprovacao do operador. Antes de arquivar uma
change ou trata-la como aprovada, o agente deve:

1. criar ou revisar a change;
2. fazer leitura guiada em PT-BR dos artefatos principais (`proposal`, `specs`,
   `design` e `tasks`);
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
`/opsx-explore`, `/opsx-propose`, `/opsx-apply`, `/opsx-sync` e `/opsx-archive`.

Nota de instalacao: se faltarem `openspec/AGENTS.md` ou `openspec/project.md`,
eles podem ser gerados por `openspec update` quando for decidido formalizar essas
instrucoes; sem acao automatica.
