# RETOMADA.md

Status: **handoff operacional**.

Este arquivo existe para retomar a sessao atual em um novo chat sem reconstruir contexto.

Ele **nao** substitui `AGENTS.md` como fonte de verdade de governanca/fluxo e **nao** substitui `docs/IMPROVEMENTS.md` como planejamento.

Nao registrar segredos, tokens, credenciais, endpoints privados, dados pessoais ou informacoes que nao deveriam entrar no repositorio.

---

## Sessao atual

- Foco: aplicar o lote de hardening derivado de `docs/AUDITORIA_2026-07-02.md`.
- Caminho usado: OpenSpec, change `address-audit-hardening-findings` em `openspec/changes/address-audit-hardening-findings/`.
- Implementado ate aqui: resiliencia de storage corrompido, hardening de comandos nativos de arquivo/payload, ajustes de release/CI, janela de pausa especial, reset automatico de cores fora do undo, e atualizacao documental inicial.
- Revisao posterior corrigida: validacao de import/export JSON agora rejeita symlink no arquivo final, mas permite diretorios-pai symlink legitimos selecionados pelo dialogo nativo.
- A politica atual documentada e que estado ativo do timer (`round`, `timerType`, `playing`) reinicia dos defaults apos restart; persistir isso fica fora deste lote.

---

## Estado atual

- Branch atual: `main`.
- Baseline publicado: `26.6.3`; proximo changelog aberto: `26.7.1` (`TBD` / `A definir`).
- Ja havia mudancas nao relacionadas/anteriores no worktree antes deste lote: atualizacoes de dependencias/manifests/workflows e `AGENTS.md`/`.opencode/`.
- Validacoes executadas neste lote: OpenSpec strict, lint/typecheck/test/build renderer, Rust fmt/clippy/check/test. A validacao Rust final apos N1 passou com 12 testes.

---

## Proximos passos

1. Revisar o diff final para separar mudancas deste lote de alteracoes preexistentes.
2. Se tudo ficar verde, sugerir commit Conventional Commit em ingles.
