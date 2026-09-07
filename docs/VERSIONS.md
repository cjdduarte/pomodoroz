# VERSIONS - Pomodoroz

Registro de versoes, toolchains e fontes do Pomodoroz.

Regra: nunca assumir versao por memoria. Antes de fixar, atualizar ou sugerir
versao de runtime, crate, pacote npm, imagem, SDK ou API, consultar fonte
oficial, confirmar que a versao existe e registrar fonte + data.

As linhas abaixo foram lidas dos manifests locais durante a padronizacao
documental. Elas nao substituem auditoria oficial em registry/changelog.

## Runtime e app

| Item           | Versao declarada | Fonte local                                                                            | Data consulta oficial | Status                                                                                                       |
| -------------- | ---------------: | -------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Pomodoroz      |         `26.7.2` | `package.json`, `src-tauri/Cargo.toml`                                                 | local                 | versao interna sincronizada                                                                                  |
| pnpm           |         `11.9.0` | `packageManager` em `package.json`                                                     | pendente              | auditar antes de mudar                                                                                       |
| Rust edition   |           `2021` | `src-tauri/Cargo.toml`                                                                 | local                 | edicao do projeto                                                                                            |
| Rust toolchain |         `1.98.1` | [manifesto stable oficial](https://static.rust-lang.org/dist/channel-rust-stable.toml) | 2026-09-06            | fixada em `rust-toolchain.toml`                                                                              |
| Rust minimo    |           `1.98` | `src-tauri/Cargo.toml`                                                                 | 2026-09-06            | serie minima suportada                                                                                       |
| OpenSpec       |         `1.11.0` | [release oficial v1.11.0](https://github.com/Fission-AI/OpenSpec/releases/tag/v1.11.0) | 2026-08-28            | comandos/skills OpenCode regenerados; `.agents/` detectado, mas nao adicionado sem `openspec init` explicito |

## Dependencias principais declaradas

| Pacote/crate      | Versao declarada | Fonte local            | Data consulta oficial | Status                 |
| ----------------- | ---------------: | ---------------------- | --------------------- | ---------------------- |
| `@tauri-apps/api` |         `2.11.1` | `package.json`         | pendente              | auditar antes de mudar |
| `@tauri-apps/cli` |         `2.11.4` | `package.json`         | pendente              | auditar antes de mudar |
| `tauri`           |         `2.11.5` | `src-tauri/Cargo.toml` | pendente              | auditar antes de mudar |
| `react`           |        `^19.2.7` | `package.json`         | pendente              | auditar antes de mudar |
| `react-dom`       |        `^19.2.7` | `package.json`         | pendente              | auditar antes de mudar |
| `react-router`    |         `7.17.0` | `package.json`         | pendente              | auditar antes de mudar |
| `typescript`      |          `6.0.3` | `package.json`         | pendente              | auditar antes de mudar |
| `vite`            |         `^8.1.2` | `package.json`         | pendente              | auditar antes de mudar |
| `rodio`           |         `0.22.2` | `src-tauri/Cargo.toml` | pendente              | auditar antes de mudar |

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
