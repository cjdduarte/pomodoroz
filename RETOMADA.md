# RETOMADA.md

Status: **handoff operacional**.

Este arquivo existe para retomar a sessao atual em um novo chat sem reconstruir contexto.

Ele **nao** substitui `AGENTS.md` como fonte de verdade de governanca/fluxo e **nao** substitui `docs/IMPROVEMENTS.md` como planejamento.

Nao registrar segredos, tokens, credenciais, endpoints privados, dados pessoais ou informacoes que nao deveriam entrar no repositorio.

---

## Sessao atual

- Foco: corrigir a autorizacao de URLs externas no Tauri.
- Correcao direta: `opener:allow-open-url` habilitava o comando, mas sem o escopo `http`/`https` todas as URLs eram recusadas pelo plugin.
- Implementado: `opener:allow-default-urls` restaura apenas URLs `http` e `https`, mantendo bloqueada a permissao de revelar arquivos.
- Planejamento redefinido: `docs/IMPROVEMENTS.md` agora contem apenas correcoes priorizadas; funcionalidades B2-B11 seguem como backlog adiado conforme `docs/decisions/ADR-0001-correction-first-roadmap.md`.

---

## Estado atual

- Branch atual: `main`.
- Baseline publicado: `26.7.1`; proximos changelogs abertos: `TBD` / `A definir`.
- `secure-native-file-authorization` foi sincronizada em `openspec/specs/task-transfer-native-authorization/` e arquivada com aprovacao do operador.
- Validacoes locais aprovadas: lint, typecheck, 36 Vitest, build do renderer, Rust fmt, clippy e 15 testes Rust.
- A change anterior `address-audit-hardening-findings` tambem esta completa, mas ainda requer revisao guiada e aprovacao explicita antes de arquivamento.

---

## Proximos passos

1. Validar manualmente os links externos dos Ajustes e a importacao/exportacao de tarefas pelo dialogo nativo.
2. Priorizar C2-C4 do roadmap: supply chain e admission gate de release.
3. Revisar o diff e criar o commit quando o operador solicitar.
