# RETOMADA.md

Status: **handoff operacional**.

Este arquivo existe para retomar a sessao atual em um novo chat sem reconstruir contexto.

Ele **nao** substitui `AGENTS.md` como fonte de verdade de governanca/fluxo e **nao** substitui `docs/IMPROVEMENTS.md` como planejamento.

Nao registrar segredos, tokens, credenciais, endpoints privados, dados pessoais ou informacoes que nao deveriam entrar no repositorio.

---

## Sessao atual

- Foco: remover a autorizacao de arquivo baseada em caminho fornecido pelo renderer.
- Caminho usado: OpenSpec, change `secure-native-file-authorization` em `openspec/changes/secure-native-file-authorization/`.
- Implementado: importacao e exportacao de tarefas agora selecionam e acessam o arquivo dentro do backend Tauri; os comandos genericos `read_text_file` e `write_text_file` foram removidos do invoke surface.
- Planejamento redefinido: `docs/IMPROVEMENTS.md` agora contem apenas correcoes priorizadas; funcionalidades B2-B11 seguem como backlog adiado conforme `docs/decisions/ADR-0001-correction-first-roadmap.md`.

---

## Estado atual

- Branch atual: `main`.
- Baseline publicado: `26.7.1`; proximos changelogs abertos: `TBD` / `A definir`.
- A change nova esta em 8/8 tarefas e passou `openspec validate --all --strict`.
- Validacoes locais aprovadas: lint, typecheck, 36 Vitest, build do renderer, Rust fmt, clippy e 15 testes Rust.
- A change anterior `address-audit-hardening-findings` tambem esta completa, mas ainda requer revisao guiada e aprovacao explicita antes de arquivamento.

---

## Proximos passos

1. Validar manualmente importacao e exportacao de tarefas pelo dialogo nativo em plataformas disponiveis.
2. Fazer leitura guiada e obter aprovacao explicita antes de arquivar `secure-native-file-authorization`.
3. Priorizar C2-C4 do roadmap: supply chain e admission gate de release.
