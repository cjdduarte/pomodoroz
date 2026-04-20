# Changelog

> [English version](CHANGELOG.en.md)

> **Pomodoroz** é um fork do [Pomatez](https://github.com/zidoro/pomatez) por [Roldan Montilla Jr](https://github.com/roldanjr).
> Fork iniciado em 2026-03-25 a partir do Pomatez v1.10.0.
> Agradecimento ao autor original pela base sólida.

## [26.4.29] - A definir

### Alterado

- **Atualização de dependências do projeto** — lote de manutenção aplicado em bibliotecas do ecossistema JS/TS, sem mudança funcional planejada.
- **Dependências de lint TypeScript atualizadas (`@typescript-eslint/*` 8.59.0)** — `@typescript-eslint/eslint-plugin` e `@typescript-eslint/parser` foram atualizados para `8.59.0`, com lockfile regenerado.
- **Higiene de ambiente do renderer simplificada** — removido `app/renderer/.env.example` e retirada a exceção `!.env.example` no `.gitignore`; o renderer não consome `SKIP_PREFLIGHT_CHECK`, `BROWSER` ou `CI` no runtime/build padrão, mantendo `.env` apenas como arquivo local opcional.
- **A5 batch 2 concluído (`eslint`/`@eslint/js` 10.x + `eslint-react`)** — lint migrou para `@eslint-react/eslint-plugin` (`recommended-typescript` com ajustes de compatibilidade), `eslint` foi atualizado para `10.2.1` e `@eslint/js` para `10.0.1`; `eslint-plugin-react` e `eslint-plugin-react-hooks` foram removidos do projeto, com atualização da diretiva de lint em `Portal.tsx` para as regras do novo plugin.
- **A5 batch 3 concluído (`vite-plugin-svgr` 5.x)** — `vite-plugin-svgr` foi atualizado de `4.5.0` para `5.2.0`, preservando o contrato atual de ícones SVG (`ReactComponent` nomeado) e passando na validação completa (`pnpm lint`, `pnpm typecheck:renderer`, `pnpm build:renderer`, `cargo check --manifest-path src-tauri/Cargo.toml`).
- **Scripts de validação/release endurecidos para reduzir bypass acidental** — `scripts/release.sh` e `scripts/release.ps1` agora exigem confirmação explícita ao usar `--skip-validate`/`-SkipValidate` (ou `POMODOROZ_RELEASE_SKIP_VALIDATE_ACK=1` em modo não interativo), e `scripts/validar-tudo.sh` e `scripts/validar-tudo.ps1` passaram a incluir `cargo check --all-targets --all-features` no gate Rust (com log dedicado no modo `--log-full-cargo`/`-LogMode full-cargo`).
- **Correções de consistência após auditoria técnica do runtime Tauri** — `onSelectAutoUpdatePolicy` em `Layout` deixou de usar a condição invertida para sync de auto-update, checks redundantes de conector não-nulo foram removidos (`Layout`, `Updater`, `Control`, `CompactTaskDisplay`, `CounterContext`, `TaskTransferSection`), utilitários órfãos (`isBrowser`, `isObjectEmpty`) saíram do barrel `utils`, o comando Rust `restart_app` passou a ter assinatura sem retorno enganoso, os fluxos de confirmação de reset (timer e grid) migraram para modal interno React (sem `@tauri-apps/plugin-dialog`), e a camada legada `runtimeInvokeConnector` foi removida.
- **Confirmações de reset padronizadas com modal do app para evitar duplicação no Linux/GTK** — os prompts de reset agora renderizam no `Portal` do app com título/mensagem controlados pelo i18n (pt/en/es/ja/zh), eliminando repetição visual de texto do diálogo nativo; em modo compacto, o app expande a janela temporariamente quando necessário para evitar corte do modal e recolhe ao fechar.
- **Guia operacional de release atualizado com bypass explícito de preflight** — `docs/RELEASE_OPERATIONS.md` agora documenta `--skip-validate`/`-SkipValidate` com aviso de uso emergencial e requisito de `POMODOROZ_RELEASE_SKIP_VALIDATE_ACK=1` em modo não interativo.
- **Compatibilidade do `validar-tudo.ps1` no Windows corrigida para interpolação com `:`** — o ajuste do `PKG_CONFIG_PATH` passou de interpolação direta de string para formatação segura (`"{0}:{1}" -f ...`), evitando `ParserError` em PowerShell (`InvalidVariableReferenceWithDrive`).
- **Quick run no Windows não depende mais de `pnpm` global no PATH** — `scripts/validar-tudo.ps1` removeu o gate `Get-Command pnpm` e passou a validar/executar comandos de pacote apenas via `scripts/pnpmw.mjs` (`node + corepack`), corrigindo falha precoce no menu interativo.
- **Diagnóstico de `pnpmw/corepack` melhorado no PowerShell** — `scripts/validar-tudo.ps1` agora exibe detalhes reais quando `node scripts/pnpmw.mjs --version` falha e não encerra com falso negativo quando o comando retorna sucesso sem versão no stdout.
- **`pnpmw.mjs` não mascara mais falhas de comando como “pnpm não encontrado”** — o wrapper agora propaga o código de saída do primeiro candidato executável (ex.: erro real de `pnpm exec eslint`) e só tenta fallback quando o binário está realmente indisponível (`ENOENT`).
- **Fluxo Quick run sem install ficou explícito e com validação antecipada de dependências** — `scripts/validar-tudo.ps1` e `scripts/validar-tudo.sh` agora informam no menu que a opção 1 não instala dependências e encerram cedo com mensagem direta quando `node_modules` está ausente em `--skip-install`.

## [26.4.28] - 2026-04-20

### Alterado

- **Pipeline Linux de release fixada em ambiente determinístico (sem fallback de dependência)** — o job `release-linux` foi fixado em `ubuntu-24.04` com instalação explícita de `libfuse2t64` para o empacotamento AppImage (`linuxdeploy`), removendo seleção condicional de pacotes.
- **Pipeline Linux de AppImage reforçada com dependências explícitas do `linuxdeploy` (gtk/gstreamer)** — o job de release passou a instalar pacotes de runtime/ferramentas de GStreamer e `binutils`, com log por tentativa e tail filtrado para diagnóstico de falhas de empacotamento sem flood de saída.
- **Empacotamento AppImage compatibilizado com validação freedesktop do `.desktop`** — categoria Linux foi fixada para `Utility` (`tauri.conf.json`, template de bundle e scripts de instalação), removendo `Productivity` como categoria não registrada no `appimagetool`.
- **`sync-latest-json` alinhado ao modo `createUpdaterArtifacts: "v1Compatible"`** — o merge de plataformas agora reconhece artefatos compactados do updater (`.exe.zip` e `.AppImage.tar.gz`, com fallback para `.exe`/`.AppImage`) e os uploads de release incluem esses formatos.

## [26.4.27] - 2026-04-20

### Alterado

- **Runtime consolidado em Tauri-only** — removidos os ramos de runtime dual/browser em `runtimeInvokeConnector`, `ConnectorContext` e no fluxo de ações do `Updater`.
- **Utilitários nativos alinhados ao runtime único** — `openExternalUrl` e `desktopNotification` agora seguem caminho Tauri-only; `notificationAudio` mantém fallback de áudio do renderer apenas em falha do áudio nativo.
- **Bootstrap de desenvolvimento simplificado** — script `dev:renderer` removido do `package.json`; `beforeDevCommand` do Tauri passou a chamar o Vite diretamente.
- **Titlebar Tauri consolidada em uma única estratégia de arraste** — removidas as regras legadas `-webkit-app-region` em `titlebar.ts`, mantendo arraste por `data-tauri-drag-region` e `start_window_drag`.
- **Ícone/tarefa no Linux alinhado entre launcher e janela ativa** — `favicon.ico` do renderer foi atualizado para o ícone oficial do app e os arquivos `.desktop` (instalação local + bundles `deb/rpm`) passaram a declarar `StartupWMClass/X-GNOME-WMClass` para reduzir duplicação/alternância de ícones no painel.
- **`check-updates` alinhado ao escopo root-only** — ajustes de nomenclatura em Shell/PowerShell (`Workspace` -> `Escopo`, `Monorepo/Tooling` -> `Tooling`) sem alterar a lógica de atualização.
- **Descrição da GitHub Release voltou a usar o changelog automaticamente** — o workflow `release-autoupdate.yml` agora extrai a seção da versão em `CHANGELOG.md` e aplica em `gh release create/edit`, evitando releases com corpo vazio ao publicar por tag/dispatch.
- **Documentação consolidada em roadmap único de melhorias** — `docs/IMPROVEMENTS.md` passou a ser a referência de pendências (técnicas + produto), com `docs/MIGRATION_TO_TAURI.md` e `docs/PRODUCT_BACKLOG.md` mantidos como ponteiros de compatibilidade.

## [26.4.26] - 2026-04-19

### Alterado

- **Pipeline de release Tauri endurecida contra falhas transitórias de rede no AppImage** — o job Linux em `.github/workflows/release-autoupdate.yml` agora tenta `pnpm tauri build --bundles appimage` até 3 vezes antes de falhar.
- **Tempo de CI/release otimizado com cache de build Rust** — `Swatinem/rust-cache@v2` foi adicionado em `ci.yml` (job `tauri-rust-check`) e nos jobs Windows/Linux do `release-autoupdate.yml`.
- **Limpeza de resíduos legados do runtime Electron e título custom** — remoção do artefato local `dist/linux-unpacked` (não versionado), remoção das regras CSS `-webkit-app-region` no titlebar e exclusão da extensão global `window.isUserHaveSession` sem consumidores no código atual.
- **Documentação de instalação alinhada ao escopo real de publicação** — `README.md` e `README.pt-BR.md` agora deixam explícito que os artefatos publicados em Release cobrem Windows/Linux, mantendo macOS via build por código-fonte.
- **Legado `styled-components/macro` removido do renderer** — imports foram migrados para `styled-components` em `src/`, o alias de compatibilidade foi removido de `app/renderer/vite.config.ts` e o shim `src/types/styled-components-macro.d.ts` foi excluído.
- **Toggle de “Barra de título nativa” endurecido para evitar perda de clique no botão `X` após alternâncias** — `titlebar.ts` voltou a marcar área de arraste (`drag`) e controles de janela (`no-drag`) de forma explícita, e `set_native_titlebar` no Rust agora aplica renegociação defensiva de superfície no Linux após `set_decorations`.

## [26.4.25] - 2026-04-18

### Corrigido

- **Arraste da janela restaurado ao desativar “Barra de título nativa” no runtime Tauri** — a `Titlebar` custom agora dispara arraste nativo (`start_window_drag`) no `mousedown` da área de título, além da região `data-tauri-drag-region`, mantendo os botões de janela clicáveis fora dessa área.
- **Aplicação imediata do estilo de borda/sombra ao alternar título nativo** — `ThemeContext` deixou de usar referência estática para `useNativeTitlebar`, evitando estado visual preso após o toggle.

## [26.4.24] - 2026-04-17

### Alterado

- **Manifesto legado de empacotamento Electron removido do repositório sem quebrar build/release** — `app/electron/package.json` foi removido da árvore versionada, e o novo wrapper `scripts/electron-builder-wrapper.mjs` passou a gerar/remover um manifesto temporário durante execuções do `electron-builder` (scripts locais e workflow de release), mantendo compatibilidade com a estrutura de duas camadas exigida pela ferramenta.
- **Fluxo de empacotamento Electron centralizado no wrapper raiz** — `package.json` (`eb`) e `.github/workflows/release-autoupdate.yml` agora executam o wrapper dedicado (em vez de chamar `electron-builder` direto), preservando o collector `traversal` e eliminando acoplamento operacional com um `package.json` permanente dentro de `app/electron`.
- **Fase 3b marcada como concluída no plano de migração** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` foi atualizado para refletir o fechamento da etapa de flatten com remoção dos manifests de workspace remanescentes e gate liberado para iniciar a Fase 4 (CI Tauri).
- **Hardening final da Fase 2f (updater Tauri) concluído** — `TauriInvokeConnector` agora executa `downloadAndInstall` no canal `INSTALL_UPDATE` e reinicia o app via comando Rust `restart_app`; o toggle `In-app auto update` foi reabilitado em Ajustes para runtime Tauri, e a tela de update ganhou ação nativa de “Instalar e reiniciar” com fallback para abrir a página de release.
- **Kickoff da Fase 4 com gate de CI em PR/push** — novo workflow `.github/workflows/ci.yml` adiciona validações automáticas de `pnpm lint`, `pnpm typecheck:renderer`, `pnpm build:renderer` e `cargo check` (Linux), formalizando a porta de qualidade enquanto a migração de release para pipeline Tauri ainda está em andamento.
- **Workflow de updater Tauri preparado para rodar por tag (`v*`) além do modo manual** — `.github/workflows/release-tauri-updater.yml` agora resolve `RELEASE_TAG` automaticamente em push de tag, permitindo publicar assets assinados (`.exe`/`.AppImage` + `.sig` + `latest.json`) sem depender apenas de `workflow_dispatch`.

## [26.4.23] - 2026-04-17

### Alterado

- **Regra operacional de release para agentes reforçada na documentação** — `AGENTS.md`, `CLAUDE.md` e `docs/RELEASE_OPERATIONS.md` agora exigem que o agente preencha a data (`YYYY-MM-DD`) no cabeçalho da versão alvo em `CHANGELOG.md` e `CHANGELOG.en.md` antes de sugerir `./scripts/release.sh`/`./scripts/release.ps1`.

## [26.4.22] - 2026-04-17

### Alterado

- **Metadata do `electron-builder` migrado para layout root-managed** — novo `electron-builder.config.json` no root virou fonte unica da configuracao de empacotamento Electron; o script `eb` do root passou a usar esse arquivo explicitamente e `app/electron/package.json` deixou de carregar bloco `build` embutido, preparando a remocao segura do manifesto de empacotamento na etapa final da Fase 3b.

## [26.4.21] - 2026-04-17

### Corrigido

- **Publicacao de instaladores Electron no GitHub Actions voltou a usar contexto valido de package manager** — o script `eb` raiz (`package.json`) deixou de forcar `npm_execpath=traversal`/`npm_config_user_agent=traversal`; com isso, os jobs do `release-autoupdate` voltam a executar `pnpm eb ... --publish always` sem erro `spawn traversal ENOENT` em Windows e Linux.

## [26.4.20] - 2026-04-17

### Corrigido

- **Build de instaladores no workflow de release voltou a funcionar no CI (Windows/Linux)** — `app/electron/package.json` deixou de injetar `npm_config_user_agent=traversal npm_execpath=traversal` no script `eb`; em versões recentes do `electron-builder`, essas envs faziam o empacotador tentar executar literalmente um binário chamado `traversal` para instalar dependências do subprojeto, quebrando com `spawn traversal ENOENT` em `pnpm eb --win nsis` e `pnpm eb --linux AppImage`.
- **Release passou a versionar também `src-tauri/Cargo.lock`** — `scripts/release.sh` e `scripts/release.ps1` agora incluem `src-tauri/Cargo.lock` no commit de release, já que o Cargo regenera o lockfile com a nova versão durante o preflight (fmt/clippy) e sem isso o arquivo ficava permanentemente marcado como modificado após o release.

## [26.4.19] - 2026-04-17

### Alterado

- **Geração de AppImage no `validar-tudo` (runtime Tauri) ficou obrigatória e resiliente no Linux** — `scripts/validar-tudo.sh` e `scripts/validar-tudo.ps1` agora executam AppImage com `NO_STRIP=1` + `APPIMAGE_EXTRACT_AND_RUN=1`, aplicam workaround automático de `pkg-config` para ambientes onde `gdk-pixbuf` aponta para diretório inexistente e não tratam mais falha de AppImage como aviso silencioso no passo de instaladores.
- **Build local de AppImage no fluxo de instaladores passou a desabilitar artefatos de updater assinados** — no `validar-tudo*`, o passo local de AppImage usa `bundle.createUpdaterArtifacts=false` para evitar falha por ausência de `TAURI_SIGNING_PRIVATE_KEY` fora do pipeline oficial de release.
- **Fluxo operacional consolidado no `package.json` raiz (sem `pnpm-workspace.yaml`)** — scripts de `dev/build/lint` passaram a executar diretamente no root (`build:renderer`, `build:electron`, `typecheck:renderer`, `dev:app` via `scripts/dev-app.mjs`), `app/renderer/package.json` foi removido e os wrappers (`validar-tudo*`, `install*`, `check-updates*`, `release-autoupdate.yml`) deixaram de depender de `pnpm --filter` de workspace.
- **`version-sync`/`release` ficaram resilientes ao flatten de manifests opcionais** — `scripts/version-sync.mjs` agora trata `app/electron/package.json` e `app/renderer/package.json` como opcionais (mantendo `package.json` raiz + arquivos Tauri como obrigatórios), e `scripts/release.sh`/`scripts/release.ps1` passaram a montar o `git add` dinamicamente para não quebrar quando esses manifests não existirem mais.
- **Scripts raiz deixaram de depender de `lerna run` no fluxo operacional** — `package.json` passou a usar `scripts/pnpmw.mjs` com `pnpm -r --filter` para `dev:*`, `build*`, `release*` e `clean`, iniciando o kickoff da Fase 3b (remoção progressiva do acoplamento Lerna/Nx sem alterar ainda a estrutura `app/*`).
- **Sobras de orquestração Lerna/Nx removidas do repositório** — `lerna.json` foi removido, o script/dependência `lerna` saiu do `package.json` raiz e o toggle `nx` foi retirado de `pnpm-workspace.yaml`, mantendo o build diário apenas com `pnpm`; o inventário do `check-updates` também deixou de listar `lerna` no bloco de tooling.
- **Kickoff de flatten do renderer concluído com `src` no root** — código do frontend foi movido de `app/renderer/src` para `src`, com ajustes em `app/renderer/index.html`, `app/renderer/tsconfig.json`, `app/renderer/vite.config.ts` e scripts de `app/renderer/package.json` (lint/prebuild) para manter `pnpm lint` e `pnpm build` verdes durante a transição.
- **Consolidação de dependências do renderer no manifesto raiz** — duplicações entre `package.json` (root) e `app/renderer/package.json` foram removidas do workspace do renderer (mantendo apenas dependências locais específicas), e `check-updates.sh/.ps1` passou a ler o inventário do bloco `[Renderer]` diretamente do manifesto raiz (`root/src`) durante a transição para estrutura flat.
- **Fluxo operacional desacoplado de `@pomodoroz/shareables`** — `app/electron` passou a usar contrato IPC local (`app/electron/src/ipc.ts`), a dependência `workspace:*` foi removida de `app/electron/package.json`, e os scripts/workflow (`validar-tudo*`, `install*`, `check-updates*`, `release-autoupdate.yml`) deixaram de executar build/lint varrendo o workspace `app/shareables`.
- **Workspace legado `app/shareables` removido do monorepo** — arquivos do pacote foram excluídos, `package.json`/`pnpm-workspace.yaml` passaram a listar apenas `app/electron` e `app/renderer`, e o lockfile foi regenerado sem link local para `@pomodoroz/shareables`.
- **Orquestração `pnpm` passou a usar filtros por caminho (não por nome de workspace)** — scripts raiz (`package.json`), validação (`validar-tudo.sh/.ps1`), bootstrap Tauri (`src-tauri/tauri.conf.json`) e release workflow (`release-autoupdate.yml`) agora apontam para `./app/renderer` e `./app/electron`, reduzindo acoplamento aos nomes `@pomodoroz/renderer`/`pomodoroz` durante a etapa final de flatten.

## [26.4.18] - 2026-04-16

### Alterado

- **Bootstrap de `pnpm` no workflow de release corrigido para evitar falha em Actions (`pnpm` não encontrado)** — `.github/workflows/release-autoupdate.yml` removeu o cache `pnpm` do `actions/setup-node`, mantendo ativação de `pnpm` via Corepack antes dos comandos de build/publicação.
- **Fluxo Tauri e guias de contribuição/documentação alinhados ao `pnpm`** — `src-tauri/tauri.conf.json` trocou `beforeDevCommand`/`beforeBuildCommand` para `scripts/pnpmw.mjs` (sem dependência de Yarn no runtime Tauri), e os guias `README*`, `CONTRIBUTING.md`, `CLAUDE.md` e `docs/MIGRATION_ELECTRON_TO_TAURI.md` foram atualizados para comandos/requisitos em `pnpm`.
- **Kickoff da Fase 2f no Tauri com updater nativo em modo seguro (notify-only)** — integração inicial de `tauri-plugin-updater` no `src-tauri` + `@tauri-apps/plugin-updater` no renderer, com bridge de política (`SET_IN_APP_AUTO_UPDATE`) no `TauriConnector` e emissão de `UPDATE_AVAILABLE` para a UI existente. O fluxo de instalação/restart (`downloadAndInstall` + relaunch) permanece pendente para o hardening final do feed assinado de release Tauri.
- **Updater Tauri passou a usar chave pública real + artefatos compatíveis (`latest.json`)** — `src-tauri/tauri.conf.json` agora possui `plugins.updater.pubkey` configurada e `bundle.createUpdaterArtifacts: "v1Compatible"`, preparando geração de assinatura/feed para o endpoint de update.
- **Workflow manual para publicar assets assinados do updater Tauri adicionado** — `.github/workflows/release-tauri-updater.yml` cria/upload de assets de updater (Windows NSIS e Linux AppImage + `.sig` + `latest*.json`) em uma tag específica usando `TAURI_SIGNING_PRIVATE_KEY` e `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- **`version-sync` e `release` passaram a incluir versão do runtime Tauri** — `scripts/version-sync.mjs` agora sincroniza também `src-tauri/tauri.conf.json` e `src-tauri/Cargo.toml`; `scripts/release.sh`/`scripts/release.ps1` passaram a stagear esses arquivos no commit de release para evitar divergência de versão entre Electron e Tauri.
- **Release passou a exigir data final nos dois changelogs** — `scripts/release.sh` e `scripts/release.ps1` agora validam que `CHANGELOG.md` e `CHANGELOG.en.md` usam `## [x.y.z] - YYYY-MM-DD` para a versão alvo (bloqueando `A definir`/`TBD` e também datas divergentes entre PT/EN).

## [26.4.17] - 2026-04-16

### Alterado

- **Workflow de release no GitHub Actions padronizado entre Linux/Windows com pin de `pnpm` via Corepack** — `.github/workflows/release-autoupdate.yml` agora ativa `pnpm` com `corepack prepare pnpm@10.33.0 --activate` nos jobs de release, removendo dependência de `pnpm/action-setup@v4` e os warnings de depreciação de Node 20.
- **`check-updates` reforçado para orientar pin do workflow e reduzir ruído no Cargo em shell/PowerShell** — `scripts/check-updates.sh` e `scripts/check-updates.ps1` agora mostram status/sugestão do pin de `pnpm` no workflow (compatível com `pnpm/action-setup` e `corepack`), exibem aviso claro de que `report` não aplica updates JS/TS e resumem Cargo (`root-deps-only` + advisories) no terminal; no modo interativo, os detalhes completos de `cargo outdated`/`cargo audit` passam a ser gravados em `logs/`. Também foi adicionado fallback de atualização do `pnpm` via `npm install -g` quando `corepack` não está disponível no PATH, além de menu inicial de tipo de log (`none`, `cargo`, `full`) ao rodar sem argumentos.
- **`check-updates` ganhou seleção Rust no estilo JS para root crates (`SAFE`/`MAJOR`)** — no modo interativo, quando `cargo outdated --root-deps-only` encontra updates, `scripts/check-updates.sh` e `scripts/check-updates.ps1` agora permitem selecionar e aplicar updates Rust por categoria, com confirmação explícita antes de executar `cargo update -p <crate> --precise <versao>`.
- **`validar-tudo` ganhou menu de tipo de log e trilhas separadas para o gate Rust** — quando executado em modo interativo sem argumentos, `scripts/validar-tudo.sh` e `scripts/validar-tudo.ps1` agora perguntam o tipo de log (`none`, `full`, `full-cargo`); no modo `full-cargo`, `cargo fmt` e `cargo clippy` também são gravados em arquivos dedicados em `logs/`.

## [26.4.16] - 2026-04-16

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
- **`Open at login` reativado no runtime Tauri (Fase 2g kickoff)** — integração inicial com `tauri-plugin-autostart` conecta o toggle de Ajustes ao backend nativo via `SET_OPEN_AT_LOGIN` no `TauriConnector`.
- **Instância única restaurada no runtime Tauri (paridade com Electron)** — `tauri-plugin-single-instance` foi integrado para focar/restaurar a janela existente ao abrir o app novamente, evitando múltiplas instâncias em duplo clique no atalho/menu.
- **Atalho do Menu Iniciar explicitado no NSIS** — `src-tauri/tauri.conf.json` agora define `bundle.windows.nsis.startMenuFolder = \"Pomodoroz\"` para melhorar previsibilidade da entrada no Windows Start Menu.
- **Importação/Exportação de tarefas no Tauri migrada para diálogo nativo (Fase 2h kickoff)** — `TauriInvokeConnector` agora usa `tauri-plugin-dialog` (`save/open`) e bridge Rust (`write_text_file`/`read_text_file`), removendo o fallback web de `<a download>` e `<input type=\"file\">`.
- **Som de notificação no Tauri migrado para playback nativo em Rust (Fase 2i kickoff)** — renderer agora envia bytes WAV para o comando Rust `play_notification_sound` (via `rodio`), mantendo fallback local no renderer fora do Tauri ou em falha de áudio nativo.
- **Prompt inicial de política de atualização com layout refinado** — título e descrição agora ficam centralizados no modal, e os botões usam rótulos compactos para evitar overflow visual em janelas estreitas.
- **Guardrail de update mantido no Tauri após defer da 2f** — somente `In-app auto update` permanece `disabled` em Ajustes até a etapa final de hardening de release.
- **Conjunto Tauri pinado para reduzir drift de ecossistema** — `@tauri-apps/api`, `@tauri-apps/cli`, `tauri`, `tauri-build` e `tauri-plugin-log` agora usam versões fixas no projeto.
- **Ícone de tray no Linux isolado por sessão para evitar “ícone aleatório” entre execuções dev** — `setup_tray` agora usa `temp_dir_path` próprio (`$XDG_RUNTIME_DIR`/`pomodoroz-tray` por processo+timestamp) e faz limpeza defensiva de sessões órfãs, reduzindo reutilização de caminhos antigos no status notifier.
- **Notificações desktop no renderer migradas para wrapper cross-runtime** — `useNotification` e `Updater` agora usam `showDesktopNotification`, que integra `tauri-plugin-notification` no runtime Tauri e preserva fallback de notificação web fora do Tauri.
- **Permissão de notificação no Tauri habilitada via capability** — `src-tauri/capabilities/default.json` agora inclui `notification:default`, liberando `isPermissionGranted`/`requestPermission`/`notify` no runtime nativo.
- **Abertura de links externos no Tauri corrigida para caminho nativo** — links de suporte/ajuda e abertura de release notes deixaram de depender de `window.open`/`target="_blank"` e passaram a usar `plugin-opener` (`@tauri-apps/plugin-opener` + `tauri-plugin-opener`).
- **Solicitação de permissão de notificação ajustada para gesto do usuário** — o pedido de permissão saiu do fluxo assíncrono do timer e passou para a interação em Ajustes (tipo de notificação), evitando bloqueio do WebKit/Tauri (`Notification prompting can only be done from a user gesture`).
- **Atalhos globais iniciais migrados para Tauri (Fase 2c kickoff)** — backend Rust agora registra `Alt+Shift+H` (ocultar app; fallback para minimizar sem tray) e `Alt+Shift+S` (restaurar/focar janela), alinhando paridade com o comportamento do Electron.
- **Scripts `version/release/check-updates` migrados para `pnpm` sem fallback** — pares `.sh`/`.ps1` agora exigem `pnpm`, usam `pnpm version:sync` no fluxo de versionamento/release e `pnpm outdated --format json` + `pnpm add` no verificador de updates.
- **`validar-tudo` passou a validar qualidade Rust do `src-tauri`** — preflight padrão agora inclui `cargo fmt --all -- --check` e `cargo clippy --all-targets --all-features -- -D warnings` (mantendo `quick-dev` sem gate Rust para preservar velocidade).
- **`check-updates` passou a incluir relatório Rust (Cargo)** — scripts `.sh`/`.ps1` agora executam bloco `[5/5]` com `cargo outdated` e `cargo audit` (quando instalados) e exibem comandos recomendados para atualização manual de crates.
- **Scripts de instalação local migrados para `pnpm` sem fallback** — `scripts/install.sh` e `scripts/install.ps1` agora exigem `pnpm` e executam pre-check/build/AppImage com `pnpm` (`pnpm --filter ... run ...`, `pnpm build:dir`, `pnpm exec electron-builder`).
- **`validar-tudo` migrado para `pnpm` sem fallback** — wrappers `.sh`/`.ps1` agora validam ambiente com `pnpm`, rodam lint/typecheck/build por `pnpm` e executam empacotamento/instaladores via `pnpm exec electron-builder`.
- **Compatibilidade dos scripts PowerShell corrigida para Windows PowerShell 5.1** — `validar-tudo.ps1` e `check-updates.ps1` tiveram interpolação e exemplos de comando ajustados (sem `&&` em contexto inválido e sem variável seguida de `:`), eliminando erros de parser na execução `-File`.
- **Scripts PowerShell passaram a executar `pnpm` via `pnpmw`/Corepack** — `validar-tudo.ps1` e `check-updates.ps1` agora roteiam chamadas para `node scripts/pnpmw.mjs`, evitando falha `pnpm nao encontrado` quando o binário não está no `PATH` no Windows.
- **Tabela de updates JS/TS corrigida no `check-updates.sh`** — parser do JSON do `pnpm outdated` agora preserva alinhamento das colunas quando `workspace` vem vazio, voltando a exibir nomes de pacote corretamente.
- **Scripts `package.json` (root/workspaces) migrados para `pnpm`** — comandos de build/lint/start/release em `package.json`, `app/electron/package.json`, `app/renderer/package.json` e `app/shareables/package.json` deixaram de chamar `yarn`, removendo fallback implícito no prebuild/build.
- **Execução de scripts `pnpm` ficou resiliente a ambiente sem binário no PATH** — novo wrapper `scripts/pnpmw.mjs` foi aplicado nos `package.json` (root/workspaces) para usar `pnpm` quando disponível ou `corepack pnpm` quando necessário, corrigindo erros no Windows como `'pnpm' nao e reconhecido` em fluxos `corepack pnpm run ...`.
- **`pnpmw` no Windows passou a invocar `corepack.js` diretamente pelo diretório do `node.exe`** — o wrapper agora resolve `node_modules/corepack/dist/corepack.js` ao lado do Node e executa `pnpm` sem depender da resolução de `corepack.cmd` via PATH/processo filho.
- **`pnpmw` ficou resiliente a `npm_execpath` inválido em shells sem profile** — o wrapper agora só aceita candidatos cujo probe retorna `status=0` e deixa de abortar cedo quando `npm_execpath` falha, evitando erro no `validar-tudo.ps1` em `powershell -NoProfile`.
- **`pnpmw` no Windows agora tenta múltiplos caminhos sem abortar na primeira falha** — quando um candidato disponível falha ao executar (ex.: `corepack.cmd` em contexto específico), o wrapper continua para os próximos candidatos e também tenta invocação via `cmd.exe`, reduzindo falso-negativo de resolução do `pnpm`.
- **Execução do `lerna run` estabilizada em ambiente Corepack-only (Windows)** — `lerna.json` passou a usar `npmClient: \"npm\"` para evitar erro `'pnpm' nao e reconhecido` em subprocessos, mantendo `pnpm` no gerenciamento de dependências e scripts via `pnpmw`.
- **`validar-tudo.ps1` corrigido para gate strict do Clippy no Windows** — a validação Rust passou a aplicar `-D warnings` via `RUSTFLAGS`, evitando falha de parsing/encaminhamento de argumentos em ambientes onde `cargo clippy` não aceita `-- -D warnings` no mesmo formato.
- **Empacotamento no `validar-tudo.ps1` ficou robusto em Windows sem `pnpm` no PATH** — o script passou a acionar `electron-builder` via script `eb` do workspace Electron (com `npm_config_user_agent=npm_execpath=traversal`), evitando falha do node-module-collector com `pnpm nao reconhecido`.
- **`check-updates.ps1` corrigido para capturar saída real do `pnpmw`** — a função `pnpm` deixou de descartar stdout/stderr, restaurando detecção de versão do `pnpm` e parse do JSON de `pnpm outdated`.
- **`check-updates.ps1` ajustado para PowerShell 5.1 na montagem da tabela de updates** — a conversão de `List[object]` para array passou a usar `ToArray()`, eliminando erro `Os tipos de argumento nao correspondem` no relatório por workspace.
- **Parser do `pnpm outdated` no `check-updates.ps1` reforçado para saída em objeto chaveado** — o script agora lê corretamente payloads JSON em formato `PSCustomObject` (pacote como chave), restaurando listagem de updates em ambientes Windows/PowerShell 5.1.
- **Logs operacionais locais fora do versionamento Git** — `.gitignore` passou a incluir `/logs/`, evitando ruído de execução (`validar-tudo`, `check-updates`, `cargo audit/outdated`) no `git status`.
- **Hook de pre-commit alinhado ao fluxo `pnpm`** — `.husky/pre-commit` deixou de chamar `yarn lint-staged` e passou a usar `node ./scripts/pnpmw.mjs exec lint-staged`, evitando falha de commit em ambientes sem Yarn.
- **Lote SAFE de dependências aplicado com validação completa** — `@types/node` (`25.5.2 -> 25.6.0`) no root e renderer, `react-router` (`7.14.0 -> 7.14.1`) no renderer, `electron` (`41.2.0 -> 41.2.1`) no workspace Electron e `tauri-plugin-global-shortcut` (`2.2.1 -> 2.3.1`) no `src-tauri`.
- **`validar-tudo` ganhou auto-reparo do runtime Electron para fluxo `dev:app`** — `scripts/validar-tudo.sh` e `scripts/validar-tudo.ps1` agora verificam `require('electron')` antes de iniciar o modo dev e, se o binário estiver ausente/incompleto, executam automaticamente o `install.js` do pacote Electron no workspace `app/electron`.
- **Rótulo do botão principal do prompt de auto update encurtado em PT-BR/EN/ES** — `settings.autoUpdatePromptEnable` agora usa `Atualizar auto.` (pt), `Auto update` (en) e `Actualizar auto.` (es), evitando overflow visual em janelas estreitas.
- **`uninstall` em modo purge passou a cobrir dados do runtime Tauri no Linux** — `scripts/uninstall.sh` e `scripts/uninstall.ps1` agora removem também paths por identificador (`~/.config/com.cjdduarte.pomodoroz`, `~/.cache/com.cjdduarte.pomodoroz` e `~/.local/share/com.cjdduarte.pomodoroz`), além dos paths legados de `~/.config/pomodoroz` e `~/.cache/pomodoroz`.

### Documentação

- **Plano de migração para Tauri (Fase 0) refinado** — escopo atualizado para dual runtime com Yarn, script `tauri` no `package.json` raiz e integração via `src-tauri/tauri.conf.json` com o renderer atual, sem reestruturação prematura.
- **Política de idioma para commits/PRs formalizada** — `AGENTS.md`, `CLAUDE.md` e `CONTRIBUTING.md` agora explicitam que mensagens de commit e títulos de PR devem ser em inglês (Conventional Commits).
- **Rastreio de execução por marcos adicionado ao plano** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora tem tracker explícito por fase (status, gate de avanço e checklists de execução para fases 0 e 1).
- **Tracker da migração avançado para 2c após fechamento manual da 2b** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora registra a validação de notificações (permissão por gesto do usuário + entrega de aviso) como concluída.
- **Tracker avançado para 2d após validação manual da 2c no Linux** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora marca os atalhos globais `Alt+Shift+H/S` como validados no runtime dev Linux e abre o snapshot operacional da 2d.
- **Snapshot operacional Linux da Fase 2 atualizado no plano de migração** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora registra a revalidação dos fluxos `validar-tudo` (opções 5 e 6) e `uninstall` em modo `purge`, com observação de logs não bloqueantes no `linux-unpacked`.
- **Checklist da Fase 3a atualizado para lockfile e workflow de release** — `docs/MIGRATION_ELECTRON_TO_TAURI.md` agora marca como concluídos a remoção do `yarn.lock` e a migração de `.github/workflows/release-autoupdate.yml` para `pnpm`, mantendo pendente apenas a validação do workflow no GitHub Actions.
- **Guia de release alinhado ao fluxo atual (`pnpm` + `release.sh`)** — `docs/RELEASE_OPERATIONS.md` foi atualizado para comandos reais de publicação/tag, incluindo regra explícita de manter `A definir`/`TBD` até o dia do release e datar a versão apenas na publicação.

### Observação

- Esta release `26.4.16` ainda publica artefatos Electron (`.exe` NSIS + `.AppImage` + `latest*.yml`). Os itens Tauri acima representam avanço de migração interna (dual runtime), sem troca do pipeline oficial de release nesta versão.

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
