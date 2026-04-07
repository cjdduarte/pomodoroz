# Pomodoroz Desktop (Electron-only) - Agente Arquiteto

> **Documentacao Complementar:**
>
> - [CLAUDE.md](CLAUDE.md) - Guia de desenvolvimento para Claude Code
> - [README.md](README.md) - Roadmap aberto (pendencias futuras) e visao de produto

---

## Resumo da Estrategia Atual

- **Plataforma principal**: Electron (Node.js + Chromium + React/TypeScript frontend)
- **Objetivo atual**: manter e evoluir o app já consolidado em **Electron-only**.
- **Origem do codigo**: Fork do [Pomatez](https://github.com/zidoro/pomatez) original por [Roldan Montilla Jr](https://github.com/roldanjr).
- **Arquitetura**: App desktop standalone, sem servidor, sem cloud. Dados locais.
- **Diretriz atual**: manutenção incremental, segurança e estabilidade por blocos pequenos.

## Politica de Documentacao (consolidada)

- **Implementado apos o fork**: registrar em `CHANGELOG.md`.
- **Pendencias futuras**: manter em `README.md` (secao `Open Roadmap (Post-Fork)`).
- **Specs/checklists na raiz**: removidos por consolidacao para reduzir fragmentacao de contexto.

## Status do Projeto (2026-03-25)

- Projeto finalizado no fluxo Electron-only.
- Migração concluída: Tauri/Rust removido e frontend consolidado em React 19 + Vite 8 + Router 7 + dnd-kit.
- Build e smoke empacotado validados com `yarn build:dir` e execução local do binário.
- Harden de runtime aplicado (`sandbox: true`, IPC/preload tipado, fallback seguro do updater sem feed).
- Historico de implementacoes consolidado em `CHANGELOG.md`.
- Melhoria futura já registrada: validação/estabilização dedicada de `Always On Top` em Linux/Wayland.

### Mudanças recentes (2026-03-25)

- Bug fix: timer display negativo (`0-1 : 0-1`) corrigido com clamp a zero em `useTime` e `Counter.tsx`.
- Bug fix: divisão por zero no progresso SVG quando `duration === 0` (guard em `Counter.tsx`).
- Bug fix: `setInterval(fn, 0)` quando `count % 1 === 0` — adicionado fallback de 1000ms.
- Feature: breaks de 0 minutos permitidos (slider `minValue: 0` para short/long break) — funciona como skip automático.
- Feature: som de notificação customizável (`NotificationSoundSection` em Settings, com `notification-custom.wav`).
- Feature: `CompactTaskDisplay` expandido com menu de ações (done/skip/delete/priority list), substituindo `PriorityCard` em todos os modos.
- Refactor: `PriorityCard` removido — `CompactTaskDisplay` serve modo compacto e normal.
- Refactor: secção "Time Distribution" removida de Statistics; "By Task List" promovida.
- Refactor: Collapse de "Notification Types" agora usa i18n (`settings.notificationTypes`).
- Fix: altura do compact mode no Electron corrigida para compensar titlebar (`getCompactHeight()`).

### Mudanças recentes (2026-03-26)

- Ajuste: checklist de validação da `GRID_ROTATION_SPEC.md` promovido de `[V]` para `[F]` nos itens concluídos.
- Ajuste: texto de confirmação do reset no grid simplificado em i18n (sem "novamente") em `en/es/ja/pt/zh`.
- Ajuste: seletor de colunas movido para toolbar do grid para economizar espaço útil.
- Ajuste: migração do lint do renderer para stack moderna (`ESLint 9` + `@typescript-eslint 8`) com flat config.

### Mudanças recentes (2026-03-28)

- Fase 5.3/5.4 da migração de dependências promovidas para `[F]` no ciclo Linux.
- Validação adicional de instalação local via `validar-tudo.sh` opção `6` (AppImage + launcher local).

### Mudanças recentes (2026-04-03)

- P2.5 concluído (G1/G2/G3/G4 + refinamentos): ações do Timer, seleção por contexto em Tasks, grid agrupado e ajustes de UX.
- Consolidação documental: pendências futuras unificadas no `README` e histórico de implementações no `CHANGELOG`.

---

## Stack Alvo (2026)

### Frontend

- **React 19.2**
- **Vite 8**
- **TypeScript 6.0**
- **React Router 7**
- **Redux Toolkit 2.x**
- **@dnd-kit** (`core`, `sortable`, `utilities`)
- **Styled Components** (manter inicialmente)
- **i18next**

### Runtime Nativo

- **Electron** (processo main + preload + renderer)
- **electron-builder** (ou migracao futura para Electron Forge, se aprovado)
- **electron-updater** (manter enquanto fizer sentido)

### Build & Tooling

- **Yarn (JS/TS)** para frontend, scripts e monorepo
- **Node.js v24**
- **ESLint + Prettier**

---

## Fontes de Documentacao (preencher a cada sessao)

- **Context7 consultado**: (registrar aqui)
- **MCP `sequential-thinking`** (quando usado): (registrar aqui)
- **Fontes adicionais**: logs locais de `yarn dev:app`, `yarn build:dir`, execucao do binario `linux-unpacked` e rastreio com `NODE_OPTIONS=--trace-deprecation`.

---

## Boas Praticas para Servidores MCP

- `context7`: consultar docs oficiais de Electron, React, Vite e TypeScript.
- `sequential-thinking`: planejar mudancas arquiteturais e upgrades maiores.
- `playwright`: apoio para investigacao de comportamento de UI.

Regras:

- Sempre apresentar alternativas e impacto antes de adotar nova dependencia.
- Nunca trocar tecnologia silenciosamente.

---

## Missao do Agente

Voce e uma IA arquiteta de software para manutencao evolutiva do Pomodoroz em **Electron-only**.

Responsabilidades:

1. Preservar estabilidade funcional do app (timer, tasks, settings, tray e compact mode).
2. Manter hardening de seguranca no Electron (preload/IPC/sandbox/CSP).
3. Evoluir dependencias em lotes pequenos e testaveis.
4. Manter build e smoke cross-platform (Windows, macOS, Linux).
5. Registrar decisoes e limitacoes conhecidas (ex.: `Always On Top` em Linux/Wayland).

---

## Regras Gerais

1. Trabalhar em blocos pequenos, testaveis e reversiveis.
2. Preservar UX e comportamento do timer/tasks/settings.
3. Antes de adicionar biblioteca nova, explicar opcoes e aguardar confirmacao.
4. Registrar decisoes na tabela de decisoes arquiteturais.
5. Codigo em ingles; logs/comentarios em portugues PT-BR quando fizer sentido.

---

## Plano de Migracao Electron-only

### Status final

- [x] Fase 0 - Baseline e estabilizacao
- [x] Fase 1 - Descontinuacao Tauri/Rust
- [x] Fase 2 - Build frontend em Vite
- [x] Fase 3 - Upgrade de frameworks frontend
- [x] Fase 4 - Harden principal do Electron
- [x] Fase 5 - Remocao total do Tauri/Rust

### Melhorias futuras (nao bloqueantes)

- [ ] Always On Top em Linux/Wayland (comportamento depende de window manager/compositor)
- [ ] Validacao de matriz completa empacotada (Windows/macOS/Linux) em ciclo de release dedicado
- [ ] Gamificação: sistema de conquistas, streaks, XP e níveis baseados em ciclos de foco completados (ver secção dedicada abaixo)

---

## Compatibilidade de Scripts

- Fluxo principal: `yarn dev:app` / `yarn build:*`.
- Wrappers recomendados:
  - Unix: `./scripts/validar-tudo.sh` (menu), `./scripts/validar-tudo.sh --dev` e `./scripts/validar-tudo.sh --run-packed`
  - PowerShell: `./scripts/validar-tudo.ps1` (menu), `./scripts/validar-tudo.ps1 -Dev` e `./scripts/validar-tudo.ps1 -RunPacked`
- `cargo` e comandos Tauri deixam de ser parte do ciclo normal.
- Pasta `scripts/` deve refletir apenas o fluxo Electron + frontend.

### Instalação local (com ícone e atalho no menu)

Scripts na raiz do repositório (não vão para o GitHub):

```sh
./scripts/install.sh        # Instala AppImage + launcher + ícone
./scripts/install.ps1       # Equivalente PowerShell
./scripts/uninstall.sh      # Remove instalação local
./scripts/uninstall.ps1     # Equivalente PowerShell
```

---

## Riscos e Mitigacoes

| Risco              | Impacto                      | Mitigacao                                           |
| ------------------ | ---------------------------- | --------------------------------------------------- |
| React 16 -> 19     | Breaking changes             | Upgrade incremental + testes de smoke por rota      |
| Router 5 -> 7      | Regressao de navegacao       | Migrar por modulo e validar rotas-chave             |
| DnD migration      | Regressao em Task List       | Troca controlada para `@dnd-kit` com testes manuais |
| Remocao do Tauri   | Perda de fallback temporario | Remover apenas apos checklist de paridade Electron  |
| Segurança Electron | Exposicao de superfície      | Revisao de preload/IPC/CSP antes de release         |

---

## Decisoes Arquiteturais

| Data       | Decisao                                                                                                                                           | Alternativas                                                                          | Razao                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2026-03-23 | Consolidar em Electron-only e remover Tauri/Rust                                                                                                  | Manter dual runtime (Electron + Tauri)                                                | Menor manutencao e menos risco operacional                                                                                |
| 2026-03-23 | Stack alvo frontend: React 19.2 + Vite 8 + TS 5.9 + Router 7 + RTK 2.x + dnd-kit                                                                  | Manter stack legado (React 16 + CRA)                                                  | Melhor suporte e longevidade                                                                                              |
| 2026-03-23 | Remover `app/tauri` do repositorio nesta etapa                                                                                                    | Manter como legado read-only por mais tempo                                           | Reduzir superficie de manutencao e eliminar ambiguidade do fluxo principal                                                |
| 2026-03-23 | Proteger updater Electron contra `ENOENT` em ambiente dev/`--dir`                                                                                 | Deixar excecao e tratar apenas em runtime                                             | Evitar erro ruidoso e tornar smoke/build local previsivel                                                                 |
| 2026-03-18 | Manter Styled Components inicialmente                                                                                                             | Migrar para Tailwind agora                                                            | Evitar migracao de CSS junto com migracao de runtime                                                                      |
| 2026-03-24 | Tornar Vite o fluxo padrao de dev/build do renderer e remover fallback CRA no script principal                                                    | Manter CRA como default e Vite opcional                                               | Consolidar migracao da Fase 2 e reduzir ambiguidade operacional                                                           |
| 2026-03-24 | Adotar ESLint 8 temporariamente e postergar ESLint 10                                                                                             | Migrar para ESLint 10 agora                                                           | `eslint-config-react-app@7` depende de `eslint@^8`; migracao para 10 sera feita junto da revisao de lint config na Fase 3 |
| 2026-03-24 | Atualizar Travis para pipeline Electron-only com `lint` + `build` em pushes e `lint` antes de release em tags                                     | Manter CI sem etapa de lint                                                           | Reduzir regressao silenciosa e alinhar release com fluxo atual (Vite/Electron)                                            |
| 2026-03-24 | Iniciar upgrade de React no renderer para 19.x com `createRoot` mantendo compatibilidade incremental                                              | Migrar React + Router + DnD em um unico passo                                         | Reduzir risco de regressao e permitir validacao por blocos pequenos                                                       |
| 2026-03-24 | Migrar DnD do modulo de Tasks para `@dnd-kit` e remover `react-beautiful-dnd`                                                                     | Adiar migracao de DnD para depois do Router 7                                         | Eliminar incompatibilidades com React 19 e reduzir dependencia legada sem alterar fluxo funcional                         |
| 2026-03-24 | Migrar `react-router-dom` 5 para 7 no renderer mantendo `HashRouter`                                                                              | Adiar para depois do hardening Electron                                               | Remover API legada (`Switch`, `withRouter`) e alinhar stack alvo da Fase 3                                                |
| 2026-03-24 | Substituir `use-stay-awake` por hook interno (`Wake Lock API` com fallback) e remover peers legados de renderer                                   | Manter dependencia legada e ignorar warning                                           | Reduzir ruído de instalação e alinhar stack com React 19/Vite                                                             |
| 2026-03-24 | Corrigir peers Babel/styled no workspace (adicionar `@babel/core`, plugins Babel de lint e `react-is`)                                            | Ignorar warnings de instalação                                                        | Reduzir ruído de manutenção e facilitar leitura dos warnings realmente críticos                                           |
| 2026-03-24 | Atualizar testes Electron para Jest 29 / ts-jest 29 (com `babel-jest` 29)                                                                         | Manter Jest 26 legado com warnings de peer                                            | Eliminar warnings finais de instalação sem impactar runtime do app                                                        |
| 2026-03-24 | Registrar `DEP0060` como warning conhecido de dependencia transitiva (`strong-log-transformer@2.1.0` via `lerna`/`nx`) e tratar em bloco dedicado | Suprimir deprecations globalmente no Node ou fazer upgrade amplo imediato de Lerna/Nx | Evitar mudanca estrutural no runner agora; warning nao bloqueia dev/build                                                 |
| 2026-03-24 | Atualizar monorepo runner de `lerna@7` para `lerna@9.0.7`                                                                                         | Manter runner legado e conviver com `DEP0060`                                         | Remove warning de deprecacao no fluxo principal e mantém scripts existentes funcionando (`lint`, `build`, `dev:app`)      |
| 2026-03-24 | Manter updater desativado no fork ate publicacao oficial do repositorio e configuracao de feed proprio                                            | Reaproveitar feed/release do projeto original desde ja                                | Evitar update cruzado entre app original e fork durante fase de migracao                                                  |
| 2026-03-26 | Migrar lint do renderer para flat config (`ESLint 9` + `@typescript-eslint 8`) e remover `eslint-config-react-app@7`                              | Manter stack legada com warning de compatibilidade TS 5.9, ou reduzir TS para <5.2    | Eliminar warning estrutural no lint com TS 5.9 e manter validação moderna sem impactar runtime                            |

---

## Proximo Passo Recomendado

1. Manter o baseline atual com smoke recorrente (`dev:app` + `build:dir`).
2. Tratar `Always On Top` em Linux/Wayland como melhoria futura isolada.
3. Evoluir upgrades de dependencias em lotes pequenos com validação completa após cada lote.

## Itens para Validacao Final (Settings)

- [x] Validar no app empacotado: toggle `Dark Theme` aparece e alterna pela tela de Settings (incluindo transicao de `Follow System Theme` -> manual).
- [ ] `Always On Top` em Linux/Wayland: manter como melhoria futura (não bloqueante para baseline atual).

---

## Funcionalidades de Referencia do Produto

### Timer

- Focus / short break / long break / special break
- Play / pause / skip / reset
- Session rounds
- Compact mode

### Tasks

- Listas e tarefas
- Edicao e conclusao
- Drag-and-drop

### Settings

- Tema e idioma
- Tray behavior (minimize/close to tray)
- Always on top
- Native titlebar
- Open at login

### Integracoes Nativas

- System tray com icone de progresso
- Notifications
- Global shortcuts
- Updater
- Fullscreen break

---

## Gamificação (planejamento futuro)

Objetivo: aumentar engajamento e motivação do utilizador através de mecânicas de jogo integradas ao fluxo de Pomodoro.

### Ideias em avaliação

| Mecânica                  | Descrição                                                                   | Dados necessários                                             |
| ------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Streaks                   | Dias consecutivos com pelo menos 1 ciclo completo                           | Histórico diário de ciclos (já existe em `statistics`)        |
| XP / Níveis               | Pontos por ciclo de foco completado, com níveis progressivos                | Contador persistente (novo slice ou extensão de `statistics`) |
| Conquistas (Achievements) | Badges desbloqueáveis por marcos (ex.: 10 ciclos, 7 dias streak, 100h foco) | Lógica de avaliação sobre dados existentes                    |
| Resumo diário             | Popup ou card ao final do dia com métricas e progresso                      | Dados de `statistics` filtrados por dia                       |

### Princípios

- Dados 100% locais (sem servidor/cloud) — alinhado com arquitetura atual.
- Persistência via `localStorage` ou `electron-store` (mesmo padrão do app).
- Sem dependências externas novas — usar Redux Toolkit para estado.
- Implementar de forma incremental: streaks primeiro, depois XP, depois achievements.
- UI discreta — não deve interferir no fluxo principal do timer.

### Dependências técnicas

- O tracking de estatísticas (`store/statistics`) já regista ciclos completos, duração e timestamps — base suficiente para streaks e XP.
- Será necessário um novo slice (`store/gamification` ou extensão de `statistics`) para estado persistente de XP/nível/achievements.
- Componentes UI novos: badge/card na rota Timer ou Statistics.

### Status

- Em fase de ideação. Nenhum código implementado.
- Aguardando definição de escopo mínimo e aprovação para iniciar.

---

## MCP

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Uso por MCP

| MCP                 | Quando usar                         |
| ------------------- | ----------------------------------- |
| context7            | Inicio de sessao e duvidas de API   |
| sequential-thinking | Planejamento de migracoes maiores   |
| playwright          | Investigacao de comportamento de UI |
