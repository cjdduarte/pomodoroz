# Pomodoroz Desktop (Electron-only) - Agente Arquiteto

## Fontes Oficiais (sem duplicacao)

- [CHANGELOG.md](CHANGELOG.md): historico do que JA foi implementado.
- [docs/DECISOES_TECNICAS_2026.md](docs/DECISOES_TECNICAS_2026.md): decisoes tecnicas, stack alvo, roadmap e pendencias abertas.
- [README.md](README.md) / [README.en.md](README.en.md): visao de produto, instalacao e uso.
- [CLAUDE.md](CLAUDE.md): guia operacional para Claude Code.

Regra: este arquivo NAO replica cronologia de mudancas, tabelas de decisoes, roadmap detalhado, nem backlog funcional. Essas informacoes ficam centralizadas nos documentos acima.

---

## Escopo do Projeto

- Plataforma principal: Electron (Node.js + Chromium + React/TypeScript).
- Arquitetura: app desktop standalone, sem servidor e sem cloud.
- Modelo de dados: local-first (dados locais).
- Diretriz: evolucao incremental com foco em estabilidade, seguranca e previsibilidade.

---

## Missao do Agente

1. Preservar estabilidade funcional (timer, tasks, settings, tray e compact mode).
2. Manter hardening de seguranca no Electron (preload/IPC/sandbox/CSP).
3. Evoluir dependencias em lotes pequenos, testaveis e reversiveis.
4. Manter build e smoke cross-platform (Windows, macOS e Linux).
5. Registrar implementacoes no CHANGELOG e pendencias/decisoes no documento tecnico unico.

---

## Regras Gerais

1. Trabalhar em blocos pequenos, testaveis e reversiveis.
2. Preservar UX e comportamento do timer/tasks/settings.
3. Antes de adicionar biblioteca nova, apresentar opcoes, impacto e aguardar confirmacao.
4. Nao trocar tecnologia silenciosamente.
5. Codigo em ingles; comentarios/logs em pt-BR quando fizer sentido.

---

## Politica de Documentacao

- Implementado apos o fork: registrar em `CHANGELOG.md`.
- Pendencias futuras, decisoes e plano tecnico: registrar em `docs/DECISOES_TECNICAS_2026.md`.
- Nao criar specs/checklists soltos na raiz para temas que ja existem no documento tecnico unico.

### Regra de ligacao CHANGELOG <-> Release (obrigatoria)

1. Fonte oficial das notas da GitHub Release: secao da versao em `CHANGELOG.md` (`## [x.y.z]`).
2. Antes de criar tag/release, a IA deve inserir/atualizar:
   - `CHANGELOG.md` (pt)
   - `CHANGELOG.en.md` (en)
3. Scripts de release (`release.sh`/`release.ps1`) devem falhar se a versao nao existir nos 2 changelogs.
4. Workflow de release sincroniza titulo/notas a partir do `CHANGELOG.md`; sem conteudo, cai em texto generico de fallback.
5. Regra operacional: nao criar tag `v*` sem entrada valida no changelog da versao.

Template minimo recomendado por versao:

```md
## [x.y.z] - YYYY-MM-DD

### Changed

- Item 1
```

---

## Fluxo de Scripts (baseline)

- Fluxo principal: `yarn dev:app`, `yarn build:*`, `yarn lint`.
- Wrappers recomendados:
  - Unix: `./scripts/validar-tudo.sh` (menu), `./scripts/validar-tudo.sh --dev`, `./scripts/validar-tudo.sh --run-packed`
  - PowerShell: `./scripts/validar-tudo.ps1` (menu), `./scripts/validar-tudo.ps1 -Dev`, `./scripts/validar-tudo.ps1 -RunPacked`
- Scripts de instalacao local:

```sh
./scripts/install.sh
./scripts/install.ps1
./scripts/uninstall.sh
./scripts/uninstall.ps1
```

---

## MCP (uso recomendado)

| MCP                 | Quando usar                           |
| ------------------- | ------------------------------------- |
| context7            | Duvidas de API e documentacao oficial |
| sequential-thinking | Planejamento de migracoes maiores     |
| playwright          | Investigacao de comportamento de UI   |

Regra: usar MCP como suporte de decisao, sem duplicar historico/roadmap neste arquivo.
