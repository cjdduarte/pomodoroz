# Decisoes Tecnicas 2026 - Pomodoroz

> Documento unico de decisoes: o que sera migrado, o que nao sera, e porque.
> Consolida pendencias tecnicas/de produto e discussoes de stack.
>
> Data de referencia: 2026-04-07

---

## 0. Painel de Execucao

| Fase                                | Prioridade | Status       | Estimativa | Risco | Objetivo                        |
| ----------------------------------- | ---------- | ------------ | ---------- | ----- | ------------------------------- |
| Fase 0 - Pre-flight                 | Agora      | Em andamento | 0.5d       | Baixo | Baseline verde + higiene minima |
| Fase 1 - Yarn Classic -> Yarn Berry | Agora      | Nao iniciado | 1d         | Medio | Sair do Yarn 1 com baixo atrito |
| Fase 2 - Remover Lerna              | Depois     | Nao iniciado | 1d         | Medio | Simplificar monorepo            |
| Fase 3 - Scripts -> `yarn exec`     | Depois     | Nao iniciado | 0.5d       | Baixo | Portabilidade de scripts        |
| Fase 4 - CI matrix minima           | Depois     | Nao iniciado | 1d         | Medio | Reprodutibilidade e gates       |
| Fase 5 - Hooks tooling              | Opcional   | Nao iniciado | 0.5d       | Baixo | Reduzir overhead de hooks       |
| Fase 6 - `electron-vite`            | Opcional   | Nao iniciado | 1d         | Medio | Melhorar DX de dev              |
| Fase 7 - Vitest no renderer         | Opcional   | Nao iniciado | 1d         | Medio | Ganho de velocidade em testes   |

Legenda de status:

- `Nao iniciado`: sem PR aberto para a fase.
- `Em andamento`: PR/branch ativo para a fase.
- `Concluido`: mergeado e validado.
- `Bloqueado`: depende de decisao externa ou prerequisito.

---

## 1. Estado Atual (Baseline)

| Camada          | Tecnologia                       | Versao   |
| --------------- | -------------------------------- | -------- |
| Runtime         | Electron                         | 41.x     |
| Frontend        | React                            | 19.x     |
| Bundler         | Vite                             | 8.x      |
| Linguagem       | TypeScript                       | 6.0.x    |
| Router          | React Router (HashRouter)        | 7.x      |
| Estado          | Redux Toolkit                    | 2.x      |
| Styling         | Styled Components                | 6.x      |
| DnD             | @dnd-kit                         | core 6.x |
| i18n            | i18next                          | 26.x     |
| Package manager | Yarn Classic                     | 1.22.x   |
| Monorepo runner | Lerna (+ runner Nx embutido)     | 9.x      |
| Packaging       | electron-builder                 | 26.x     |
| Persistencia    | electron-store + localStorage    | atual    |
| Git hooks       | Husky + lint-staged + Commitizen | atual    |
| Dev server main | nodemon + wait-on                | atual    |
| Testes          | Jest + ts-jest                   | atual    |
| Lint            | ESLint 9 flat config + Prettier  | atual    |
| Node.js         | v24                              | atual    |

---

## 2. Plano de Migracao (Execucao)

### Fase 0 - Pre-flight

- Objetivo: preparar o projeto para migracao sem risco desnecessario.
- Escopo:
  - baseline verde
  - higiene de `.env`
  - registrar versoes de referencia
- Comandos de validacao:

```sh
yarn lint
yarn build
yarn workspace pomodoroz run test --watchAll=false --runInBand
yarn build:dir
```

- Criterio de saida:
  - comandos verdes localmente
  - checklist de smoke basico executado
  - `.env` fora do versionamento e `.env.example` presente
- Rollback:
  1. Reverter alteracoes de docs/config da fase.
  2. Restaurar lockfile anterior e validar baseline.

### Fase 1 - Yarn Classic -> Yarn Berry (node-modules)

- Objetivo: sair do Yarn 1 com menor atrito possivel.
- Escopo:
  - adotar Yarn Berry
  - manter `nodeLinker: node-modules` (sem PnP nesta fase)
  - declarar `packageManager` e `engines.node`
  - ajustar CI para `--immutable`
- Comandos de validacao:

```sh
yarn -v
yarn lint
yarn build
yarn workspace pomodoroz run test --watchAll=false --runInBand
yarn build:dir
```

- Criterio de saida:
  - paridade funcional sem regressao
  - Linux e Windows verdes para lint/build/test/build:dir
- Rollback:
  1. Restaurar lock/config anteriores do Yarn 1 na branch.
  2. Reinstalar dependencias e revalidar baseline.

### Fase 2 - Remover Lerna e usar workspaces nativos

- Objetivo: simplificar o monorepo.
- Escopo:
  - trocar `lerna run` por `yarn workspaces foreach`
  - remover dependencia `lerna` apos paridade
- Comandos de validacao:

```sh
yarn dev:app
yarn lint
yarn build
yarn build:dir
```

- Criterio de saida:
  - scripts equivalentes funcionando
  - sem perda de comportamento de paralelismo esperado
- Rollback:
  1. Restaurar scripts baseados em `lerna`.
  2. Reinstalar deps e revalidar baseline.

### Fase 3 - Scripts com caminho fixo -> `yarn exec`

- Objetivo: tornar scripts portaveis entre ambientes.
- Escopo:
  - substituir chamadas do tipo `../../node_modules/...` por `yarn exec`
- Comandos de validacao:

```sh
yarn lint
yarn build
yarn workspace pomodoroz run test --watchAll=false --runInBand
```

- Criterio de saida:
  - nenhum script restante com caminho fixo para binarios de tooling
- Rollback:
  1. Reverter alteracoes de scripts na fase.
  2. Revalidar baseline.

### Fase 4 - CI matrix minima e reprodutibilidade

- Objetivo: impedir regressao silenciosa.
- Escopo:
  - matrix minima: Linux + Windows
  - gates: lint -> build -> test -> build:dir
  - Node fixo v24 e lockfile imutavel
- Criterio de saida:
  - pipeline executando para PR e push
  - falha de gate bloqueando merge
- Rollback:
  1. Reverter workflow novo se houver falso positivo critico.
  2. Abrir task de ajuste e reaplicar em PR dedicado.

### Fase 5 (opcional) - Husky + Commitizen -> lefthook

- Objetivo: reduzir overhead de hooks.
- Executar somente apos fases 1-4 estabilizadas.

### Fase 6 (opcional) - `nodemon + wait-on` -> `electron-vite`

- Objetivo: melhorar DX no fluxo de dev.
- Executar somente se houver dor real no ciclo de desenvolvimento.

### Fase 7 (opcional) - Jest -> Vitest (renderer)

- Objetivo: acelerar testes no renderer.
- Pode manter Jest no main/electron.

---

## 3. Primeiro PR Recomendado

Escopo recomendado para iniciar sem alto risco:

1. Finalizar Fase 0:
   - higiene de `.env`
   - baseline verde documentado
2. Entregar sem mexer ainda em package manager.

Entrega esperada:

- PR pequeno, reversivel, sem mudanca estrutural do build.

---

## 4. O que NAO migrar neste ciclo

### Styled Components

- Decisao: manter.
- Motivo: migracao custosa para ganho funcional baixo agora.
- Reavaliar: se surgir dor real de performance/manutencao.

### React Router (HashRouter)

- Decisao: manter.
- Motivo: navegacao previsivel com baixo custo.
- Reavaliar: nao neste ciclo.

### electron-store -> SQLite

- Decisao: manter.
- Motivo: SQLite adiciona complexidade nativa sem necessidade imediata.
- Reavaliar: quando houver demanda clara por consultas complexas.

### Redux Toolkit -> Zustand

- Decisao: manter.
- Motivo: reescrita grande sem ganho funcional direto.
- Reavaliar: nao neste ciclo.

### Bun (runtime/package manager)

- Decisao: manter Node + Yarn neste ciclo.
- Motivo: risco de compatibilidade no ecossistema Electron/release.
- Reavaliar: se maturidade/adoacao em Electron subir e houver dor real no fluxo atual.

### @dnd-kit, i18next, electron-builder

- Decisao: manter.
- Motivo: escolhas atuais estaveis e adequadas ao produto.

---

## 5. Pendencias Tecnicas Ativas (Hoje)

1. Higiene de `.env` ainda nao finalizada (`app/renderer/.env` versionado).
2. CI matrix ainda nao implementada.
3. TODO de atalhos customizados sem persistencia (`Shortcut.tsx`).
4. Updates major pendentes no renderer:
   - `eslint` e `@eslint/js` 10.x
   - `vite-plugin-svgr` 5.x

---

## 6. Pendencias de Produto (Nao-tooling)

| Pendencia                                                 | Origem                   | Status                           |
| --------------------------------------------------------- | ------------------------ | -------------------------------- |
| Always On Top em Linux/Wayland                            | Consolidado (2026-04-07) | Aberto                           |
| Validacao de matriz completa empacotada (Win/macOS/Linux) | Consolidado (2026-04-07) | Aberto                           |
| Gamificacao (streaks, XP, achievements)                   | Consolidado (2026-04-07) | Ideacao                          |
| Updater: feed proprio do fork                             | Consolidado (2026-04-07) | Bloqueado ate publicacao oficial |

### 6.1 Melhorias futuras nao bloqueantes (referencia consolidada)

- [ ] Always On Top em Linux/Wayland (comportamento depende de window manager/compositor)
- [ ] Validacao de matriz completa empacotada (Windows/macOS/Linux) em ciclo de release dedicado
- [ ] Gamificacao: sistema de conquistas, streaks, XP e niveis baseados em ciclos de foco completados

### 6.2 Itens para validacao final (Settings)

- [x] Validar no app empacotado: toggle `Dark Theme` aparece e alterna na tela de Settings (incluindo transicao `Follow System Theme` -> manual)
- [ ] `Always On Top` em Linux/Wayland: manter como melhoria futura nao bloqueante para baseline atual

### 6.3 Funcionalidades de referencia do produto

#### Timer

- Focus / short break / long break / special break
- Play / pause / skip / reset
- Session rounds
- Compact mode

#### Tasks

- Listas e tarefas
- Edicao e conclusao
- Drag-and-drop

#### Settings

- Tema e idioma
- Tray behavior (minimize/close to tray)
- Always on top
- Native titlebar
- Open at login

#### Integracoes nativas

- System tray com icone de progresso
- Notifications
- Global shortcuts
- Updater
- Fullscreen break

### 6.4 Gamificacao (planejamento futuro - detalhado)

Objetivo: aumentar engajamento e motivacao do usuario com mecanicas de jogo no fluxo Pomodoro.

#### Ideias em avaliacao

| Mecanica                  | Descricao                                                                   | Dados necessarios                                             |
| ------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Streaks                   | Dias consecutivos com pelo menos 1 ciclo completo                           | Historico diario de ciclos (ja existe em `statistics`)        |
| XP / Niveis               | Pontos por ciclo de foco completado, com niveis progressivos                | Contador persistente (novo slice ou extensao de `statistics`) |
| Conquistas (Achievements) | Badges desbloqueaveis por marcos (ex.: 10 ciclos, 7 dias streak, 100h foco) | Logica de avaliacao sobre dados existentes                    |
| Resumo diario             | Popup ou card ao final do dia com metricas e progresso                      | Dados de `statistics` filtrados por dia                       |

#### Principios

- Dados 100% locais (sem servidor/cloud), alinhado com a arquitetura atual.
- Persistencia via `localStorage` ou `electron-store` (mesmo padrao do app).
- Sem dependencias externas novas; usar Redux Toolkit para estado.
- Implementar incrementalmente: streaks -> XP -> achievements.
- UI discreta, sem interferir no fluxo principal do timer.

#### Dependencias tecnicas

- O tracking de `store/statistics` ja registra ciclos completos, duracao e timestamps; base suficiente para streaks e XP.
- Necessario novo slice (`store/gamification`) ou extensao de `statistics` para XP/nivel/achievements persistentes.
- Componentes novos previstos: badge/card na rota Timer ou Statistics.

#### Status

- Em ideacao. Nenhum codigo implementado.
- Aguardando definicao de escopo minimo e aprovacao para iniciar.

---

## 7. Impacto nos Compilados

Trocar package manager (Yarn -> Berry/pnpm) nao muda os formatos finais.
Quem define formato e naming e o `electron-builder`.

Fluxo:

```text
install deps -> build app -> electron-builder -> exe / nsis / AppImage / deb / rpm
```

O que pode variar:

- hash/tamanho por diferenca de resolucao de dependencia

O que deve permanecer:

- formatos de artefato
- naming policy (se configuracao do builder nao mudar)
- comportamento funcional do app

---

## 8. Se fosse projeto do zero (Referencia)

Stack de referencia (nao para reescrever o atual):

```text
pnpm + electron-vite + React 19 + CSS Modules + Zustand + Vitest
+ @dnd-kit + i18next + lefthook + ESLint 9 + Prettier
```

---

## 9. Decisoes Aprovadas em 2026-04-07

1. Migrar primeiro tooling (Yarn/Lerna/scripts/CI), nao UI/state.
2. Manter Electron + React + Vite + TypeScript como base.
3. Nao migrar para Bun neste ciclo.
4. Nao migrar styled-components/router/store/state neste ciclo.
5. Executar em blocos pequenos e reversiveis.

---

## 10. Checklist Padrao de Aprovacao

Aplicar em toda fase/PR de migracao:

- [ ] `lint` verde
- [ ] `build` verde
- [ ] `test` verde
- [ ] `build:dir` verde
- [ ] smoke manual no binario empacotado (timer, tasks, settings, compact mode, tray)
- [ ] CHANGELOG atualizado quando aplicavel

---

## 11. Fontes

- CHANGELOG.md
- README.md / README.en.md
- CLAUDE.md
- Conversas tecnicas de 2026-04-07
