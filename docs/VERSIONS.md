# VERSIONS - Pomodoroz

Registro de versoes, toolchains e fontes do Pomodoroz.

Regra: nunca assumir versao por memoria. Antes de fixar, atualizar ou sugerir
versao de runtime, crate, pacote npm, imagem, SDK ou API, consultar fonte
oficial, confirmar que a versao existe e registrar fonte + data.

As linhas abaixo foram lidas dos manifests locais durante a padronizacao
documental. Elas nao substituem auditoria oficial em registry/changelog.

## Runtime e app

| Item         | Versao declarada | Fonte local                            | Data consulta oficial | Status                      |
| ------------ | ---------------: | -------------------------------------- | --------------------- | --------------------------- |
| Pomodoroz    |         `26.6.1` | `package.json`, `src-tauri/Cargo.toml` | local                 | versao interna sincronizada |
| pnpm         |         `11.5.0` | `packageManager` em `package.json`     | pendente              | auditar antes de mudar      |
| Rust edition |           `2021` | `src-tauri/Cargo.toml`                 | local                 | edicao do projeto           |
| Rust minimo  |         `1.77.2` | `src-tauri/Cargo.toml`                 | pendente              | auditar antes de mudar      |

## Dependencias principais declaradas

| Pacote/crate      | Versao declarada | Fonte local            | Data consulta oficial | Status                 |
| ----------------- | ---------------: | ---------------------- | --------------------- | ---------------------- |
| `@tauri-apps/api` |         `2.11.0` | `package.json`         | pendente              | auditar antes de mudar |
| `@tauri-apps/cli` |         `2.11.2` | `package.json`         | pendente              | auditar antes de mudar |
| `tauri`           |         `2.11.2` | `src-tauri/Cargo.toml` | pendente              | auditar antes de mudar |
| `react`           |        `^19.2.6` | `package.json`         | pendente              | auditar antes de mudar |
| `react-dom`       |        `^19.2.6` | `package.json`         | pendente              | auditar antes de mudar |
| `react-router`    |         `7.16.0` | `package.json`         | pendente              | auditar antes de mudar |
| `typescript`      |          `6.0.3` | `package.json`         | pendente              | auditar antes de mudar |
| `vite`            |        `^8.0.14` | `package.json`         | pendente              | auditar antes de mudar |
| `rodio`           |         `0.22.2` | `src-tauri/Cargo.toml` | pendente              | auditar antes de mudar |

## Politica de updates

- Evoluir dependencias em blocos pequenos, testaveis e reversiveis.
- Antes de adicionar biblioteca nova, apresentar opcoes e impacto.
- Atualizar changelogs antes de tag/release.

## Historico

- 2026-06-12: arquivo criado durante padronizacao documental do Lote 5 com base
  nos manifests locais.
