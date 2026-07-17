# RETOMADA.md

Status: **handoff operacional**.

Este arquivo existe para retomar a sessao atual em um novo chat sem reconstruir contexto.

Ele **nao** substitui `AGENTS.md` como fonte de verdade de governanca/fluxo e **nao** substitui `docs/IMPROVEMENTS.md` como planejamento.

Nao registrar segredos, tokens, credenciais, endpoints privados, dados pessoais ou informacoes que nao deveriam entrar no repositorio.

---

## Sessao atual

- Foco: adicionar uma limpeza segura dos artefatos de build locais.
- Implementado: `scripts/dev-full.sh` agora oferece `[x] Limpar artefatos de build` no menu, com tamanho dos diretórios e confirmação, e a flag não interativa `--clean`.
- A limpeza delega para `pnpm clean`, removendo `app/renderer/build` e `src-tauri/target`; o próximo build do renderer e Rust será completo.

---

## Estado atual

- Branch atual: `main`.
- Baseline publicado: `26.7.2`; próximos changelogs abertos: `TBD` / `A definir`.
- `secure-native-file-authorization` foi sincronizada em `openspec/specs/task-transfer-native-authorization/` e arquivada com aprovacao do operador.
- Validações desta alteração: `bash -n scripts/dev-full.sh`, `--help`, verificação de flags incompatíveis e `git diff --check` aprovados; a limpeza real não foi executada para preservar os artefatos locais.
- A change anterior `address-audit-hardening-findings` tambem esta completa, mas ainda requer revisao guiada e aprovacao explicita antes de arquivamento.

---

## Proximos passos

1. Executar `./scripts/dev-full.sh --clean` ou a opção `[x]` quando quiser liberar os artefatos locais; o próximo build será mais lento.
2. Validar manualmente os links externos dos Ajustes e a importacao/exportacao de tarefas pelo dialogo nativo.
3. Priorizar C2-C4 do roadmap: supply chain e admission gate de release.
4. Revisar o diff e criar o commit quando o operador solicitar.
