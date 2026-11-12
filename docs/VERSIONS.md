# VERSIONS - Pomodoroz

Registro de versoes, toolchains e fontes do Pomodoroz.

Regra: nunca assumir versao por memoria. Antes de fixar, atualizar ou sugerir
versao de runtime, crate, pacote npm, imagem, SDK ou API, consultar fonte
oficial, confirmar que a versao existe e registrar fonte + data.

As linhas abaixo foram lidas dos manifests locais durante a padronizacao
documental. Elas nao substituem auditoria oficial em registry/changelog.

## Runtime e app

| Item           | Versao declarada | Fonte local                                                                            | Data consulta oficial                                                  | Status                                                                                                      |
| -------------- | ---------------: | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Pomodoroz      |        `26.11.1` | `package.json`, `src-tauri/Cargo.toml`                                                 | local                                                                  | versao interna sincronizada                                                                                 |
| pnpm           |        `12.18.0` | `packageManager` em `package.json`                                                     | 2026-11-12 ([npm](https://www.npmjs.com/package/pnpm))                 | pin, workflows e boot document do lockfile alinhados                                                        |
| Node           |             `24` | `node-version` nos workflows                                                           | 2026-11-12 ([nodejs.org](https://nodejs.org/dist/index.json))          | mantido: 24 segue LTS; Node e so build-time e nada no typecheck consome tipos do Node                       |
| Rust edition   |           `2024` | `src-tauri/Cargo.toml`                                                                 | local                                                                  | edicao do projeto                                                                                           |
| Rust toolchain |         `1.99.1` | [manifesto stable oficial](https://static.rust-lang.org/dist/channel-rust-stable.toml) | 2026-11-12                                                             | fixada em `rust-toolchain.toml`                                                                             |
| Rust minimo    |           `1.99` | `src-tauri/Cargo.toml`                                                                 | 2026-11-12                                                             | serie minima suportada                                                                                      |
| OpenSpec       |         `1.14.1` | CLI instalada (`openspec --version`)                                                   | 2026-11-12 ([npm](https://www.npmjs.com/package/@fission-ai/openspec)) | segurado: 2.0.0 (2026-11-11) remove os comandos `/opsx:*`; atualizar e tarefa propria pela politica central |

## Atualizacoes futuras da toolchain Rust

Este arquivo e o registro canonico da versao efetiva, fonte e data. Cada novo
bump consulta o manifesto stable e as notas de release oficiais, atualiza
conjuntamente `rust-toolchain.toml`, o MSRV em `src-tauri/Cargo.toml` e os
pins de `dtolnay/rust-toolchain` em `.github/workflows/ci.yml` e
`.github/workflows/release-autoupdate.yml`, e executa o gate Rust/Tauri
aplicavel. Dependencias, edition e lockfiles nao mudam como efeito colateral.

## Dependencias principais declaradas

| Pacote/crate      | Versao declarada | Fonte local            | Data consulta oficial                                             | Status                                                                             |
| ----------------- | ---------------: | ---------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `@tauri-apps/api` |         `2.12.4` | `package.json`         | 2026-10-29 ([npm](https://www.npmjs.com/package/@tauri-apps/api)) | patch de seguranca aplicado                                                        |
| `@tauri-apps/cli` |         `2.12.4` | `package.json`         | 2026-10-29 ([npm](https://www.npmjs.com/package/@tauri-apps/cli)) | patch de seguranca aplicado                                                        |
| `tauri`           |         `2.12.5` | `src-tauri/Cargo.toml` | 2026-10-29 ([crates.io](https://crates.io/crates/tauri))          | patch de seguranca aplicado                                                        |
| `react`           |         `19.3.1` | `package.json`         | 2026-11-03 ([npm](https://www.npmjs.com/package/react))           | atualizado (minor)                                                                 |
| `react-dom`       |         `19.3.1` | `package.json`         | 2026-11-03 ([npm](https://www.npmjs.com/package/react-dom))       | atualizado (minor)                                                                 |
| `react-router`    |          `8.5.1` | `package.json`         | 2026-11-12 ([npm](https://www.npmjs.com/package/react-router))    | atualizado (major)                                                                 |
| `typescript`      |          `6.0.3` | `package.json`         | 2026-11-12 ([npm](https://www.npmjs.com/package/typescript))      | segurado: `@typescript-eslint` 8.72.2 exige `typescript <6.1.0` e quebra com 7.0.2 |
| `vite`            |         `^8.3.8` | `package.json`         | 2026-11-12 ([npm](https://www.npmjs.com/package/vite))            | atualizado (patch)                                                                 |
| `rodio`           |         `0.23.0` | `src-tauri/Cargo.toml` | 2026-11-12 ([crates.io](https://crates.io/crates/rodio))          | atualizado (0.x minor)                                                             |

## Politica de updates

- Evoluir dependencias em blocos pequenos, testaveis e reversiveis.
- Antes de adicionar biblioteca nova, apresentar opcoes e impacto.
- Atualizar changelogs antes de tag/release.

## Historico

- 2026-06-12: arquivo criado durante padronizacao documental do Lote 5 com base
  nos manifests locais.
- 2026-07-02: versoes locais re-sincronizadas durante o hardening da auditoria
  `docs/AUDITORIA_2026-07-02.md`.
- 2026-07-10: baseline local confirmado como `26.7.2` durante a auditoria
  geral e a redefinicao do roadmap de correcoes.
- 2026-07-17: OpenSpec 1.6.0 confirmado na [release oficial](https://github.com/Fission-AI/OpenSpec/releases/tag/v1.6.0); aliases e revisao do fluxo atualizados para `/opsx:update` e `/opsx-update`.
- 2026-08-27: OpenSpec 1.11.0 confirmado na [release oficial](https://github.com/Fission-AI/OpenSpec/releases/tag/v1.11.0); instrucoes OpenCode regeneradas e validacao strict passou.
- 2026-09-06: toolchain fixada em Rust 1.98.1 e MSRV elevado para 1.98.
- 2026-10-29: patch de seguranca Tauri aplicado com versoes confirmadas no
  npm e no crates.io (`tauri` 2.12.5, `tauri-build` 2.7.4, plugins nativos e
  `@tauri-apps/*` correspondentes); lock Rust atualizado para `zip`,
  `rustls-webpki`, `webpki-root-certs`, `tokio`, `plist` e `serde_json`.
- 2026-10-29: pnpm 12.16.1 confirmado no npm (latest); `packageManager`, pins
  Corepack dos workflows e boot document do `pnpm-lock.yaml` atualizados;
  `pnpm install --frozen-lockfile` passou com o pnpm 12.16.1.
- 2026-10-29: lote JS de baixo risco aplicado (tooling de build/lint e patches
  de `react-redux`/`uuid`). Adiados: React 19.3 (transicoes e eventos de
  resize mudam de comportamento), styled-components 6.6 (`attrs` e
  interpolacoes), RTK 2.13 (novo build), i18next/react-i18next, os majors
  `@types/node` 26, `react-router` 8, `typescript` 7, `vitest` 5 e `rodio` 0.23.
- 2026-11-03: o operador aplicou via `check-updates` React/react-dom 19.3.1,
  `@types/react*` 19.3.0, styled-components 6.6.0, RTK 2.13.0, i18next
  26.7.1, react-i18next 17.1.11, `@vitejs/plugin-react` 6.2.1, eslint
  10.14.0, globals 17.14.0 e `log` 0.4.35; `async-executor` 1.14.0 (yanked)
  foi trocado por 1.14.1. Gates e `cargo audit` passaram; continuam adiados os
  majors `@types/node` 26, `react-router` 8, `typescript` 7, `vitest` 5 e
  `rodio` 0.23.
- 2026-11-12: migracao das versoes seguradas na branch `chore/deps-upgrade`,
  um commit por bloco, com o gate do CI passando localmente em cada um:
  patches/minors JS e Rust (RTK 2.14.0, vite 8.3.8, `@vitejs/plugin-react`
  6.3.0, `@eslint-react/eslint-plugin` 5.30.1, `@typescript-eslint/*` 8.72.2,
  `rimraf` 6.1.4, plugins Tauri log 2.10.2, notification 2.8.1 e opener 2.7.3
  em JS e Rust), pnpm 12.18.0, `@types/node` 26.6.6, `vitest` 5.1.0, `i18next`
  27.1.1 com `react-i18next` 18.0.1, `react-router` 8.5.1, `rodio` 0.23.0
  (`cpal` 0.18.2), toolchain Rust 1.99.1 com MSRV 1.99, edition 2024,
  `actions/checkout` e `actions/setup-node` v7 e lockfiles JS e Rust renovados
  (`pnpm update --lockfile-only`, `cargo update`). `rustix` 1.1.6 resolve o
  RUSTSEC-2026-0486. Continuam segurados `typescript` 7 (lint sem suporte),
  Node 26 e OpenSpec 2.0.0.
