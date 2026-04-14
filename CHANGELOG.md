# Changelog

> [English version](CHANGELOG.en.md)

> **Pomodoroz** é um fork do [Pomatez](https://github.com/zidoro/pomatez) por [Roldan Montilla Jr](https://github.com/roldanjr).
> Fork iniciado em 2026-03-25 a partir do Pomatez v1.10.0.
> Agradecimento ao autor original pela base sólida.

## [26.4.16] - A definir

### Adicionado

- **Scaffold inicial do runtime Tauri (v2)** — novo diretório `src-tauri/` com `Cargo.toml`, `build.rs`, `src/main.rs`, `src/lib.rs`, capabilities e ícones padrão para iniciar o fluxo dual runtime.
- **Ferramentas Tauri no monorepo atual** — adicionadas dependências `@tauri-apps/cli` e `@tauri-apps/api` no projeto raiz e novo script `yarn tauri`.

### Alterado

- **Configuração Tauri alinhada ao renderer atual** — `src-tauri/tauri.conf.json` aponta para `../app/renderer/build`, usa `devUrl` `http://localhost:3000`, e executa `beforeDevCommand`/`beforeBuildCommand` via workspace do renderer.
- **Metadados iniciais do app Tauri ajustados** — identificador `com.cjdduarte.pomodoroz`, versão `26.4.15` no scaffold e janela inicial `340x470`, mais próxima do app Electron atual.
- **Chamadas nativas do renderer centralizadas no connector** — usos diretos de `window.electron` foram removidos de `CounterContext`, `Control` e `TaskTransferSection`; agora esses fluxos usam o contrato tipado de `InvokeConnector`.
- **Contrato do connector expandido para Fase 1** — `InvokeConnector` agora cobre `send`, `receive` e `invoke`, preservando o comportamento no Electron e preparando a troca para Tauri.
- **`TauriConnector` ativado por runtime** — `ConnectorContext` agora seleciona provider por runtime (`electron`/`tauri`), com `TauriInvokeConnector` dedicado para janela, fullscreen, compact mode e fluxo de import/export de tarefas no Tauri.
- **Compatibilidade de permissões Tauri ajustada** — `src-tauri/capabilities/default.json` passou a incluir permissões explícitas de janela usadas pelo connector (`show`, `hide`, `close`, `minimize`, `set_focus`, `set_always_on_top`, `set_fullscreen`, `set_size`, `set_theme`, `set_decorations`).
- **Compact mode sem acoplamento direto ao Electron** — `CompactTaskDisplay` agora usa `getInvokeConnector()` para `COMPACT_EXPAND`/`COMPACT_COLLAPSE`.
- **Bridge de comandos Rust iniciado no `src-tauri`** — adicionados comandos nativos em `src-tauri/src/commands/window_bridge.rs` (always-on-top, fullscreen break, compact mode, theme, titlebar, show/minimize/close) e `TauriInvokeConnector` passou a usar `invoke()` nesses canais.
- **Renderer desacoplado de `@pomodoroz/shareables`** — o contrato IPC do frontend foi movido para `app/renderer/src/ipc/index.ts`, todos os imports do renderer passaram a usar `ipc`, e a dependência do pacote foi removida de `@pomodoroz/renderer`.
- **Fluxo de confirmação de reset no Tauri ajustado para PT/UX legível** — `TauriInvokeConnector` trocou o `window.prompt` por duas confirmações (`window.confirm`), preservando decisões `cancelar/não/sim` sem campo de texto.
- **Saída de fullscreen break via `Esc` restaurada no Tauri** — `CounterContext` agora encerra fullscreen por teclado durante pausa, com o mesmo comportamento esperado da experiência anterior.
- **Tray inicial habilitado no runtime Tauri (Fase 2a)** — `src-tauri/src/lib.rs` agora cria ícone de bandeja com menu (`Restore`/`Quit`) e clique no ícone para restaurar a janela.
- **Fechar/minimizar para bandeja reativado com fallback seguro** — `window_bridge` só oculta janela quando o tray está disponível; sem tray, mantém minimizar/fechar padrão para evitar “sumir” app.
- **Botão `X` da barra nativa agora respeita `Fechar para a bandeja` no Tauri** — o backend Rust passou a interceptar `CloseRequested` da janela principal com estado `set_tray_behavior`, evitando inconsistência após restaurar da bandeja.
- **Decisão de fechar/ocultar centralizada no fluxo nativo de fechamento** — `close_window` passou a delegar para `window.close()` e o handler `CloseRequested` (com `TrayBehaviorState`) virou a única fonte de decisão de hide/exit.
- **Fechar por `X` customizado voltou a respeitar `Fechar para a bandeja`** — o botão da barra customizada agora entra no mesmo fluxo nativo (`CloseRequested`), mantendo comportamento consistente com o fechamento da janela.
- **Ícone dinâmico de tray voltou a funcionar no Tauri** — `TRAY_ICON_UPDATE` agora converte `dataUrl` no renderer e atualiza o ícone nativo via comando Rust `set_tray_icon`, removendo no-op e desperdício de ciclo.
- **Menu de bandeja sincronizado com idioma do app no Tauri** — labels do tray (`Restaurar`/`Sair` etc.) agora são atualizados pelo renderer via `SET_TRAY_COPY`, evitando menu fixo em inglês quando a interface está em português.
- **`SET_TRAY_BEHAVIOR` reativado no path Tauri** — o renderer voltou a sincronizar `closeToTray` para o backend nativo, mantendo uma única fonte de verdade para decisão de fechar x ocultar.
- **Toggles ainda não suportados no backend Tauri ficaram bloqueados em Ajustes** — `Open at login` e `In-app auto update` agora ficam `disabled` no runtime Tauri até as fases nativas correspondentes.
- **Conjunto Tauri pinado para reduzir drift de ecossistema** — `@tauri-apps/api`, `@tauri-apps/cli`, `tauri`, `tauri-build` e `tauri-plugin-log` agora usam versões fixas no projeto.
- **Ícone de tray no Linux isolado por sessão para evitar “ícone aleatório” entre execuções dev** — `setup_tray` agora usa `temp_dir_path` próprio (`$XDG_RUNTIME_DIR`/`pomodoroz-tray` por processo+timestamp) e faz limpeza defensiva de sessões órfãs, reduzindo reutilização de caminhos antigos no status notifier.
- **Notificações desktop no renderer migradas para wrapper cross-runtime** — `useNotification` e `Updater` agora usam `showDesktopNotification`, que integra `tauri-plugin-notification` no runtime Tauri e preserva fallback de notificação web fora do Tauri.
- **Permissão de notificação no Tauri habilitada via capability** — `src-tauri/capabilities/default.json` agora inclui `notification:default`, liberando `isPermissionGranted`/`requestPermission`/`notify` no runtime nativo.
- **Abertura de links externos no Tauri corrigida para caminho nativo** — links de suporte/ajuda e abertura de release notes deixaram de depender de `window.open`/`target="_blank"` e passaram a usar `plugin-opener` (`@tauri-apps/plugin-opener` + `tauri-plugin-opener`).
- **Solicitação de permissão de notificação ajustada para gesto do usuário** — o pedido de permissão saiu do fluxo assíncrono do timer e passou para a interação em Ajustes (tipo de notificação), evitando bloqueio do WebKit/Tauri (`Notification prompting can only be done from a user gesture`).
- **Atalhos globais iniciais migrados para Tauri (Fase 2c kickoff)** — backend Rust agora registra `Alt+Shift+H` (ocultar app; fallback para minimizar sem tray) e `Alt+Shift+S` (restaurar/focar janela), alinhando paridade com o comportamento do Electron.

### Documentação

- **Plano de migração para Tauri (Fase 0) refinado** — escopo atualizado para dual runtime com Yarn, script `tauri` no `package.json` raiz e integração via `src-tauri/tauri.conf.json` com o renderer atual, sem reestruturação prematura.
- **Política de idioma para commits/PRs formalizada** — `AGENTS.md`, `CLAUDE.md` e `CONTRIBUTING.md` agora explicitam que mensagens de commit e títulos de PR devem ser em inglês (Conventional Commits).
- **Rastreio de execução por marcos adicionado ao plano** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora tem tracker explícito por fase (status, gate de avanço e checklists de execução para fases 0 e 1).
- **Tracker da migração avançado para 2c após fechamento manual da 2b** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora registra a validação de notificações (permissão por gesto do usuário + entrega de aviso) como concluída.
- **Tracker avançado para 2d após validação manual da 2c no Linux** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora marca os atalhos globais `Alt+Shift+H/S` como validados no runtime dev Linux e abre o snapshot operacional da 2d.

## [26.4.15] - 2026-04-09

### Corrigido

- **Reset de cores no grid com ação no primeiro clique** — botão agora abre confirmação imediata e aplica o reset sem exigir segundo clique.
- **Texto da confirmação de reset no grid ajustado** — mensagem de confirmação agora usa formato de pergunta no diálogo (`window.confirm`) em pt/en/es/ja/zh.

## [26.4.14] - 2026-04-09

### Corrigido

- **Texto de apoio padronizado no PT-BR.**
- **Drag visual entre listas estabilizado** — ao arrastar uma tarefa para outra lista, o card não “salta” de volta visualmente para a lista de origem antes do drop.
- **Preview de arraste alinhado ao card real** — overlay de drag agora reaproveita o mesmo estilo do cartão da lista (largura, layout e ícones), melhorando a consistência visual durante o movimento.
- **Ícones de lista diferenciados no topo** — botão de arrastar lista agora usa ícone de grip, reduzindo ambiguidade visual com o botão de ações (`...`).
- **Tipagem SVG ajustada para TypeScript 6** — módulo `*.svg` agora declara `ReactComponent` nomeado em `src/typings.d.ts`, eliminando o `TS2614` no índice de ícones.
- **Hook `useTargetOutside` compatível com refs React 19/TS6** — `ref` agora aceita `RefObject<T | null>`, removendo `TS2322` em `TaskHeader` e outros usos com `useRef(..., null)`.
- **Typecheck do renderer integrado no validar-tudo** — `scripts/validar-tudo.sh` e `scripts/validar-tudo.ps1` agora executam `yarn workspace @pomodoroz/renderer exec tsc --noEmit -p tsconfig.json` no fluxo completo e no `quick-dev`.
- **Lote TS6 aplicado no renderer** — corrigidos tipos de eventos (`implicit any`), refs de botões no ripple effect, tipagem de `wakeLock`, tipagem de `children` em `Dimmer`, compatibilidade de refs em `Popper` e widening de `trackedTaskActionTypes` no reducer de tasks.

## [26.4.13] - 2026-04-08

### Corrigido

- **Release notes HTML legíveis no Updater** — quando `releaseNotes` chega em HTML, a tela converte para texto estruturado antes de renderizar, evitando exibição de tags cruas.
- **Compatibilidade com release notes HTML escapado** — quando o corpo chega com entidades (`&lt;p&gt;...`), o Updater agora decodifica antes de normalizar/renderizar.
- **Mensagem de apoio atualizada em Ajustes** — banner one-time agora menciona as duas formas de apoio (⭐ GitHub e ☕ café), alinhando texto com os botões do rodapé.
- **Persistência do prompt inicial de update corrigida** — se o app for fechado antes de escolher `Sim/Não`, o prompt volta a aparecer na próxima abertura até haver decisão explícita.
- **Check inicial de update adiado até escolha explícita** — em perfil novo, o main não faz `checkForUpdates()` no boot; a primeira checagem ocorre só após o usuário escolher `Sim/Não` no prompt de política.
- **Tela de release notes ocultada no modo automático** — quando `Auto update no app` está ativo, Ajustes não força a tela `Updater`; o fluxo fica nas notificações nativas de download/instalação.
- **Seleção do AppImage local corrigida no install script** — `scripts/install.sh` e `scripts/install.ps1` agora escolhem o artefato mais novo por versão (`sort -V`/`[version]`), evitando instalar build antigo como `26.4.8` quando já existe `26.4.12`.

### Alterado

- **Escolha inicial de política de update** — em perfil novo (instalação/dados limpos), o app mostra um prompt na primeira abertura para selecionar `auto update` ou `apenas avisar`; a decisão fica persistida e pode ser alterada depois em Ajustes.

### Observação

- Esta versão inclui ajustes em renderer/main (fluxo de update) e scripts de instalação local Linux (AppImage).

## [26.4.12] - 2026-04-08

### Corrigido

- **Hardening de atalhos no instalador Windows (NSIS)** — configuração `nsis` agora define explicitamente `shortcutName`, `createStartMenuShortcut` e `createDesktopShortcut`.
- **Fallback para atalho ausente no Start Menu** — novo include NSIS (`electron-builder/installer.nsh`) recria o atalho quando ele não existir após instalação/update.
- **Nome em "Aplicativos instalados" sem redundância de versão** — `uninstallDisplayName` no NSIS foi definido como `Pomodoroz`, mantendo a versão apenas no campo de detalhes do Windows.
- **i18n do Updater no renderer** — textos da tela de atualização e da notificação de abertura de release agora usam chaves `updater.*` em pt/en/es/ja/zh.

### Alterado

- **Atualizações seguras de dependências** — `electron` (`41.1.1 -> 41.2.0`), `i18next` (`26.0.3 -> 26.0.4`), `@typescript-eslint/eslint-plugin` (`8.58.0 -> 8.58.1`) e `@typescript-eslint/parser` (`8.58.0 -> 8.58.1`).

### Observação

- Ajuste restrito ao alvo Windows NSIS; fluxo Linux/AppImage permanece inalterado.

## [26.4.11] - 2026-04-08

### Alterado

- **Política de update configurável em Ajustes** — novo toggle `Auto update no app`; por padrão o app fica em modo aviso+redirecionamento para release, e quando ativado volta para download/instalação in-app.
- **Contrato IPC do updater refinado** — adicionados `SET_IN_APP_AUTO_UPDATE` e `OPEN_RELEASE_PAGE`; `INSTALL_UPDATE` permanece como alias de compatibilidade por um ciclo.
- **Versão visível em Ajustes** — cabeçalho de Configurações agora exibe `vX.Y.Z` de forma discreta.
- **Guard de download com log explícito** — quando um update termina de baixar com o modo in-app desativado, o main registra log e ignora o prompt de instalação de forma transparente.
- **Sugestão automática de versão por tags** — `release/version` (bash + PowerShell) agora sugerem `YY.M.(ultimo+1)` com base em tags locais `vYY.M.*`; ao virar o mês sem tags, sugerem `YY.M.1`.
- **Sincronização de tags no release** — `release.sh`/`release.ps1` agora tentam `fetch --tags` automaticamente; em falha de rede/permissão, seguem com aviso e usam tags locais.
- **Menu de execução no release** — sem parâmetros, `release.sh`/`release.ps1` agora mostram menu interativo com opções de publicar release real ou simular.

### Traduções

- **Novo rótulo de configuração** — chave `settings.inAppAutoUpdate` adicionada em pt/en/es/ja/zh.

### Teste manual (release)

- **Modo padrão (toggle desligado)** — ao detectar update, o app apenas avisa e o botão abre a página de release no navegador.
- **Modo in-app (toggle ligado)** — após detectar/baixar update, o app exibe prompt `Quit and Install`.
- **Configurações** — cabeçalho mostra a versão atual em formato `vX.Y.Z`.

## [26.4.10] - 2026-04-08

### Corrigido

- **Instalação de update mais segura** — `quitAndInstall()` agora executa apenas quando a ação `"Quit and Install"` é confirmada na notificação.
- **Registro de listeners do updater** — eventos (`update-available`, `download-progress`, `update-downloaded`) passam a ser registrados antes de `checkForUpdates()`, reduzindo risco de race em respostas rápidas.
- **Estado de update tipado de forma consistente** — `updateBody` no renderer foi padronizado como `string`, com fallback seguro para estado legado.

### Alterado

- **Workflow de release notes endurecido** — pipeline falha com erro explícito se a seção da versão estiver ausente ou vazia em `CHANGELOG.md`.
- **Fluxo de release por script** — adicionados scripts dedicados para release (`scripts/release.sh` e `scripts/release.ps1`) e atalhos no `package.json` (`release:tag*`).

### Documentação

- **Política CHANGELOG <-> Release formalizada** — ligação entre changelog, tag e notas de release documentada em `AGENTS.md`, `CLAUDE.md` e `docs/TECHNICAL_DECISIONS_2026.md`.
- **Política de canal de auto-update explicitada** — ciclo atual formaliza suporte in-app para Windows NSIS e Linux AppImage; portable/deb/rpm/AUR fora do canal in-app.
- **Planejamento de observabilidade de dependências** — registrada pendência para evoluir `check-updates.sh` com modo `report --full` (dependências + audit + GitHub Actions).

## [26.4.9] - 2026-04-07

### Alterado

- **Auto update do fork ativado em release** — pipeline de publicação agora gera e publica metadados de update no GitHub Releases para Windows (`latest.yml`) e Linux AppImage (`latest-linux.yml`).
- **Fluxo de release automatizado (CI)** — novo workflow dedicado para publicação de artefatos de update por plataforma.

### Validado

- **Windows (NSIS)** — detecção de atualização de `26.4.8` para `26.4.9` confirmada.
- **Linux (AppImage)** — artefatos e metadados de atualização publicados com sucesso.

## [26.4.8] - 2026-04-07

### Alterado

- **Dependência de build do renderer** — `vite` atualizado de `8.0.6` para `8.0.7`.

### Observação

- Esta versão não introduz funcionalidades novas no app; é um ajuste de manutenção de dependência.

## [26.4.7] - 2026-04-07 (Release inicial do Pomodoroz)

### Escopo

- Consolida todo o trabalho pós-fork até **2026-04-07** antes da primeira publicação.
- A classificação abaixo é relativa ao baseline original **Pomatez v1.10.0**.

### Adicionado

- **Módulo de Estatísticas** — tela completa com rastreamento de foco/pausa/ocioso, ciclos completos, gráfico diário e detalhamento por tarefa. Dados 100% locais.
- **Grade de Rotação de Estudos** — alternância lista/grade em Tarefas com status diário por cartão (`branco/verde/vermelho`) e estado persistente.
- **Ações de cartão na grade** — clique direito seleciona a tarefa e mantém sincronização com o Timer (modo normal navega ao Timer; modo compacto colapsa após seleção).
- **Grade no modo compacto** — grade disponível no modo compacto com integração IPC de redimensionamento/colapso.
- **Botão Sortear** — opcional via Configurações; sorteio por fase (`branco → verde`, depois `verde → vermelho`) sem navegar ao Timer.
- **Loop de cores na grade** — loop manual opcional no clique do cartão (`vermelho → branco`), controlável nas Configurações.
- **Controle de colunas da grade** — seletor (`Auto / 1 / 2 / 3`) na barra de ferramentas com preferência persistente em modo normal e compacto.
- **Importação/Exportação de tarefas (JSON)** — Configurações permite exportar/importar listas/cartões com validação de esquema, `version`, regeneração de UUID e opção merge/substituição.
- **Resetar tempo para Ocioso (só foco)** — novo toggle nas Configurações (`Voltar pode contar como Ocioso`) com confirmação `Sim/Não/Cancelar` ao resetar.
- **Som de notificação customizável** — escolha entre sino padrão ou arquivo de áudio personalizado nas Configurações.
- **Breaks de 0 minutos** — sliders de pausa curta/longa permitem 0 minutos (pula a pausa automaticamente).
- **Display compacto de tarefa** — `CompactTaskDisplay` expandido com menu de ações (concluir/pular/excluir) em todos os modos, substituindo o antigo `PriorityCard`.
- **Confirmação nativa de saída** — diálogo localizado no Electron main (pt/en).
- **Fluxo IPC de atualização** — `UPDATE_AVAILABLE` / `INSTALL_UPDATE` ponta a ponta para política do fork.
- **i18n** — traduções de Estatísticas em pt, en, es, ja, zh.
- **Aviso do modo rigoroso i18n** — texto localizado do aviso no Timer usando `timer.strictModeNotice` em todos os idiomas.

### Alterado

- **Electron-only** — runtime Tauri/Rust totalmente removido do código e scripts.
- **React 19** — migrado de React 16 com `createRoot`.
- **Vite 8** — substituiu CRA como fluxo padrão de dev/build.
- **TypeScript 6** — atualizado de 4.x com alinhamento de tsconfig.
- **React Router 7** — migrado de v5 (`Switch`/`withRouter` removidos).
- **Normalização de imports do Router** — renderer agora usa pacote `react-router` diretamente.
- **Redux Toolkit 2** — atualizado de 1.x.
- **@dnd-kit** — substituiu `react-beautiful-dnd` para arrastar e soltar.
- **Lerna 9** — runner de monorepo atualizado de v7.
- **Electron 41** — atualizado de versão anterior.
- **Sandbox do Electron** — habilitado `sandbox: true` com preload adaptado.
- **Updater reforçado** — pula verificação com segurança quando arquivos de config estão ausentes (dev/`--dir`).
- **UI de Estatísticas** — seção "Time Distribution" removida; "By Task List" promovida; período padrão alterado para "hoje".
- **Altura do modo compacto** — corrigida no Electron main (`getCompactHeight()`).
- **Modelo de cores da grade simplificado** — estágio laranja removido; estados salvos legados migram no carregamento.
- **Tipografia da grade refinada** — peso do título do cartão alinhado com a visualização em lista.
- **Modernização do ESLint** — lint do renderer migrado para flat config ESLint v9.
- **Atualização do stack i18n** — `react-i18next` 17 e `i18next` 26.
- **Atualização de dependências Electron** — `electron-builder` 26, `electron-updater` 6 e `electron-store` 11.
- **Migração de config Vite (Rolldown)** — `rollupOptions` para `rolldownOptions` para compatibilidade com Vite 8.
- **Hardening de prop forwarding styled-components** — `StyleSheetManager.shouldForwardProp` combinando `@emotion/is-prop-valid` com props bloqueadas do projeto.
- **Migração de notarização** — `electron-notarize` substituído por `@electron/notarize` no fluxo `afterSign`.
- **Migração de textarea autosize** — agora usa `react-textarea-autosize` no lugar de chamadas imperativas DOM.
- **Migração de notificações (Electron main)** — `node-notifier` substituído por API nativa `Notification`.
- **Migração de undo/redo em tarefas** — `redux-undo` substituído por reducer de histórico interno (`past/present/future`).
- **Limpeza de dependência do Router** — `react-router-dom` residual removido após migração completa para `react-router`.
- **Tipagem de action Redux** — `AnyAction` atualizado para `UnknownAction` (recomendação RTK 2).
- **Modernização de evento de teclado** — `onkeypress`/`keyCode` substituídos por `onkeydown` + `e.key === "Enter"`.
- **Alinhamento de ref React 19** — `React.forwardRef` substituído por ref-as-prop em `TaskDetails`, `Checkbox` e `Radio`.
- **Ações do footer do Timer (P2.5 G1)** — trigger de ações agora usa ícone `option-x`; sem tarefa ativa, abre dropdown diretamente.
- **Fluxo switch pós-pausa (P2.5 G2)** — "Switch" no prompt pós-pausa agora abre a grade de rotação.
- **Paridade de clique direito em lista (P2.5 G3)** — modo lista agora espelha o comportamento da grade.
- **Modo grade agrupado (P2.5 G4)** — toggle `Agrupar/Desagrupar` com separadores por lista e preferência persistente.
- **Controles de ícone na barra da grade (P2.5 G4)** — `Reset`, `Sortear` e `Agrupar/Desagrupar` usam botões só-ícone com tooltip localizado.
- **Densidade de cartões agrupados** — modo agrupado renderiza cartões mais compactos.
- **Ação de lista prioritária refinada** — clicar em `Priority List` também seleciona o primeiro cartão pendente.
- **Rebranding** — renomeado de Pomatez para Pomodoroz (`com.cjdduarte.pomodoroz`).

### Corrigido

- **Hotfix de rastreamento reset-to-idle** — ordem de inicialização do `CounterProvider` corrigida (`ReferenceError`).
- **Consistência de comportamento da bandeja** — estado de comportamento da bandeja agora sincronizado via `SET_TRAY_BEHAVIOR`.
- **Restauração de estado no break fullscreen** — ciclo fullscreen agora restaura estado anterior da janela.
- **Sincronização fullscreen + robustez Wayland** — UI fullscreen aplicada apenas após confirmação nativa, com fallback para Linux/Wayland.
- **Display do Timer** — limitado a zero (sem mais `0-1 : 0-1` negativo).
- **Anel de progresso SVG** — proteção contra divisão por zero.
- **Intervalo do countdown** — fallback de 1000ms quando `count % 1 === 0`.
- **Visibilidade de controles do Timer (modo rigoroso)** — botões do modo compacto restaurados; aviso renderizado em overlay.
- **Progressão de tarefa do menu de ações (P2.5 G1)** — `Done` e `Skip` agora avançam automaticamente para a próxima tarefa pendente.
- **Progressão ao deletar (pós-P2.5)** — deletar a tarefa ativa segue a mesma regra de auto-avanço.
- **Correção de alvo do Skip (P2.5 G1)** — `skipTaskCard` agora pula o cartão selecionado em vez do primeiro pendente.
- **Guard de menu contextual em lista (P2.5 G3)** — clique direito em cartões concluídos é ignorado.
- **Aviso de cancelamento de formulário (pós-P2.5)** — corrigido `"Form submission canceled"` com `type="button"`.
- **Resiliência de dependência do renderer** — dependência direta `uuid` adicionada no renderer.
- **Paridade de scrollbar no grid compacto** — scrollbar vertical preservada quando cartões excedem altura do painel.

### Removido

- **Scaffolding legado** — `.travis.yml`, `snap/` e `.devcontainer/` removidos.
- **Tauri/Rust** — diretório `app/tauri`, arquivos Cargo e scripts relacionados.
- **CRA** — `react-scripts` e `react-app-env.d.ts` removidos.
- **react-beautiful-dnd** — substituído por `@dnd-kit`.
- **use-stay-awake** — substituído por hook interno (Wake Lock API com fallback).
- **`v8-compile-cache`** — removido (não utilizado no Node 24 / Electron 41).
- **`regenerator-runtime`** — removido (polyfill legado Babel não utilizado no stack atual).
- **`say`** — removido (assets de áudio `.wav` permanecem versionados).
- **`autosize` / `@types/autosize`** — removidos após migração para `react-textarea-autosize`.
- **`node-notifier` / `@types/node-notifier`** — removidos após migração para notificações nativas Electron.
- **`redux-undo`** — removido após migração para histórico interno.
- **`react-router-dom`** — removido após migração para imports `react-router`.
- **PriorityCard** — substituído por `CompactTaskDisplay`.
- **Google Analytics** — removido.
- **Link da comunidade Discord** — removido das Configurações.

---

_Para o changelog original do Pomatez anterior ao fork, veja o [repositório Pomatez](https://github.com/zidoro/pomatez/blob/master/CHANGELOG.md)._
