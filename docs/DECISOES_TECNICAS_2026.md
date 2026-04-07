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
| Fase U - Auto Update do fork        | Agora      | Nao iniciado | 1d         | Medio | Publicar feed e validar upgrade |
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
  - esta fase cobre CI de codigo-fonte; validacao empacotada Win/macOS/Linux fica na secao de produto/release
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
- Regra de corte: primeiro PR contem somente Fase 0. Fase 1 entra em PR seguinte.

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
- Observacao: manter `electron-store` neste ciclo, sem remocao/substituicao isolada.

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

Nota de escopo: esta secao trata de validacoes de produto/release (incluindo app empacotado), separadas da Fase 4 de CI.

| Pendencia                                                 | Origem                   | Status                         |
| --------------------------------------------------------- | ------------------------ | ------------------------------ |
| Always On Top em Linux/Wayland                            | Consolidado (2026-04-07) | Aberto                         |
| Validacao de matriz completa empacotada (Win/macOS/Linux) | Consolidado (2026-04-07) | Aberto                         |
| Gamificacao (streaks, XP, achievements)                   | Consolidado (2026-04-07) | Ideacao                        |
| Updater: feed proprio do fork                             | Consolidado (2026-04-07) | Em planejamento (execucao 6.5) |

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

### 6.5 Auto Update do fork (guia completo de implementacao)

Objetivo: habilitar atualizacao automatica de forma controlada, com foco em Windows e Linux AppImage.

Estado atual (2026-04-07):

- Fluxo tecnico base ja existe no codigo:
  - main/electron: `activateAutoUpdate`, eventos `UPDATE_AVAILABLE` e `INSTALL_UPDATE`.
  - renderer: UI de update na tela de Settings.
- Bloqueio atual: feed proprio do fork ainda nao operacional em release oficial.
- Linux sem `APPIMAGE` continua com skip explicito de checagem (comportamento intencional no codigo atual).

Escopo desta implementacao:

- Inclui:
  - publicacao de release com metadados de update.
  - validacao end-to-end do fluxo em app empacotado.
  - documentacao de operacao e rollback.
- Nao inclui:
  - alterar regra Linux sem `APPIMAGE`.
  - mudar stack (Yarn/Lerna) para destravar updater.
  - introduzir servidor proprio fora de GitHub Releases neste ciclo.

#### 6.5.1 Requisitos minimos

1. Repositorio do fork com Releases ativas no GitHub.
2. Token de publicacao (`GH_TOKEN`) disponivel no ambiente de release (local ou CI).
3. Build empacotado gerando metadados de update:
   - Linux AppImage: `latest-linux.yml` + `.AppImage`.
   - Windows NSIS: `latest.yml` + instalador NSIS.
4. Versao nova maior que a instalada no cliente.

Observacoes:

- Scripts `build:*` usam `--publish=never` (nao publicam feed).
- Publicacao usa scripts `release`/`release:mw` com `--publish always`.

#### 6.5.2 Passo a passo (operacao recomendada)

Passo 1 - Preparar versao:

1. Definir nova versao (ex.: `26.4.9`).
2. Atualizar changelog da versao.
3. Validar definicao dos scripts de release (sem publicar ainda):
   - raiz: `release` e `release:mw` em `package.json`
   - electron: `release` e `release:mw` em `app/electron/package.json`
4. Validar baseline:
   - `yarn lint`
   - `yarn build`
   - `yarn build:dir`

Passo 2 - Publicar artefatos com feed:

1. Exportar token no ambiente:
   - `GH_TOKEN=<token>`
2. Publicar release:
   - todos os alvos: `yarn release`
   - mac + windows: `yarn release:mw`
   - linux dedicado: executar release linux em job/plataforma linux quando necessario.
3. Confirmar no Release publicado a presenca de:
   - Windows: instalador NSIS + `latest.yml`.
   - Linux: `.AppImage` + `latest-linux.yml`.

Passo 3 - Validar cliente (E2E):

1. Instalar versao anterior no ambiente de teste.
2. Abrir app empacotado conectado a internet.
3. Verificar recebimento de `UPDATE_AVAILABLE` na UI.
4. Acionar `Install Now` e confirmar reinicio com nova versao.

#### 6.5.3 Matriz de comportamento por plataforma

| Plataforma/Canal                  | Resultado esperado                                                 |
| --------------------------------- | ------------------------------------------------------------------ |
| Windows (NSIS)                    | Checa update, baixa, notifica, instala com `quitAndInstall()`      |
| macOS                             | Fora do escopo deste ciclo de ativacao (validar em ciclo dedicado) |
| Linux AppImage                    | Checa update quando `APPIMAGE` presente                            |
| Linux empacotado sem `APPIMAGE`   | Nao checa update (skip intencional)                                |
| Linux via pacote de distro (AUR)  | Atualizacao deve seguir gerenciador de pacotes, nao fluxo in-app   |
| Ambiente dev sem `dev-app-update` | Nao checa update (skip intencional)                                |

#### 6.5.4 Como funciona no Manjaro (resumo pratico)

- Se o usuario roda binario AppImage: auto update pode funcionar.
- Se o usuario instala por pacote de distro/AUR: fluxo in-app deve ser tratado como nao suportado neste ciclo.
- Acao recomendada para pacote de distro: orientar atualizacao via gerenciador do sistema.

#### 6.5.5 Criterios de aceite

- [ ] Release com metadados de update publicados e acessiveis.
- [ ] Windows: upgrade automatico validado de versao N -> N+1.
- [ ] Linux AppImage: upgrade automatico validado de versao N -> N+1.
- [ ] Linux sem `APPIMAGE`: skip esperado registrado (sem erro fatal).
- [ ] CHANGELOG atualizado com status da ativacao.
- [ ] Pendencia "Updater: feed proprio do fork" atualizada para Concluido.

#### 6.5.6 Rollback

1. Interromper publicacoes de release com feed automatico.
2. Publicar hotfix sem promover update automatico, se necessario.
3. Manter cliente na versao estavel anterior enquanto corrige pipeline/feed.
4. Reabrir pendencia no documento tecnico com causa raiz e proximo passo.

#### 6.5.7 Relacao com fases de tooling (importante)

- Migracao Yarn/Lerna/CI melhora previsibilidade de release, mas nao e prerequisito tecnico direto do updater.
- O destravamento real do auto update depende de:
  - feed/metadados corretos no release publicado.
  - validacao por plataforma no binario empacotado.

#### 6.5.8 Code signing e notarizacao (risco conhecido)

- Windows: sem assinatura de codigo, o SmartScreen pode exibir alerta adicional na instalacao/update.
- macOS: auto update exige assinatura/notarizacao corretas; este ciclo nao inclui ativacao oficial do auto update no macOS.
- O projeto ja possui `afterSign` para notarizacao no macOS, condicionado a variaveis de ambiente de chave Apple.

### 6.6 Checklist de Execucao por PR/Release (Auto Update)

PR-AU-01 - Preparacao e validacao local:

- [ ] Definir versao alvo e atualizar changelog.
- [ ] Confirmar scripts `release` e `release:mw` presentes e executaveis.
- [ ] Executar baseline (`lint`, `build`, `build:dir`).
- [ ] Revisar secao 6.5 para garantir escopo/nao escopo.

PR-AU-02 - Publicacao de feed (pipeline/release):

- [ ] Configurar `GH_TOKEN` no ambiente de publicacao.
- [ ] Publicar release com `--publish always`.
- [ ] Confirmar metadados de update no release (Windows `latest.yml`, Linux `latest-linux.yml`).
- [ ] Confirmar upload dos binarios-alvo (NSIS e AppImage).

PR-AU-03 - Validacao E2E Windows:

- [ ] Instalar versao N.
- [ ] Publicar N+1.
- [ ] Verificar recebimento de `UPDATE_AVAILABLE`.
- [ ] Executar `Install Now` e validar reinicio em N+1.

PR-AU-04 - Validacao E2E Linux AppImage:

- [ ] Instalar versao N via AppImage.
- [ ] Publicar N+1 com `latest-linux.yml`.
- [ ] Validar check/download/install em AppImage.
- [ ] Registrar comportamento esperado de skip fora de AppImage.

PR-AU-05 - Encerramento e governanca:

- [ ] Atualizar status da pendencia de updater na secao 6 (Concluido quando pronto).
- [ ] Registrar resultado no CHANGELOG (ativacao e limites por plataforma).
- [ ] Se houver regressao, aplicar rollback da secao 6.5.6 e reabrir pendencia.

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
