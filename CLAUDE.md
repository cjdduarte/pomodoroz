# Pomodoroz - Claude Quick Ref

Fonte normativa: `AGENTS.md`.

## Ler primeiro

1. `AGENTS.md`
2. `RETOMADA.md`
3. `docs/IMPROVEMENTS.md`
4. `docs/MIGRATION_TO_TAURI.md`
5. `docs/RELEASE_OPERATIONS.md`
6. `docs/VERSIONS.md` quando tocar dependencias ou runtime

## O que e

Aplicacao desktop Tauri standalone, sem servidor ou nuvem, com dados locais.
O renderer e React/Vite/TypeScript e o backend nativo fica em Rust em
`src-tauri/`.

## Comandos principais

```bash
pnpm install
pnpm dev:app
pnpm lint
pnpm typecheck:renderer
pnpm build:renderer
pnpm tauri build --no-bundle
./scripts/dev.sh check
./scripts/validar-tudo.sh
```

Use `scripts/dev-full.sh` para o fluxo rico de desenvolvimento e
`scripts/release.*` somente no processo de release autorizado.

## Regras criticas

- Preservar timer, tarefas, settings, tray, modo compacto e hardening Tauri.
- Nao trocar tecnologia nem adicionar dependencia sem explicar impacto e obter
  confirmacao.
- Manter capabilities, CSP e comandos nativos restritos ao necessario.
- Dados sao locais; nao introduzir servidor ou nuvem silenciosamente.
- Mudancas implementadas devem entrar em `CHANGELOG.md` e `CHANGELOG.pt.md`.
- Nunca commitar, publicar, criar tag ou fazer release sem pedido explicito.
- Nunca assumir versoes; consultar fonte oficial antes de alterar dependencias.

## Arquivos-chave

- `src/`: renderer React.
- `src-tauri/`: comandos Rust, tray, updater e capabilities.
- `package.json`: scripts e dependencias.
- `scripts/dev.sh` e `scripts/dev-full.sh`: desenvolvimento e validacao.
- `docs/RELEASE_OPERATIONS.md`: release e updater.

## OpenSpec

Politica comum: [OpenSpec nos projetos](../../OPENSPEC_PROJETOS.md).
Use OpenSpec somente para entrega operacional verificavel; ajustes documentais
pequenos podem ser feitos diretamente.
