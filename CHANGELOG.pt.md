# Changelog

> [English version](CHANGELOG.md)

> **Pomodoroz** é um fork do [Pomatez](https://github.com/zidoro/pomatez) por [Roldan Montilla Jr](https://github.com/roldanjr).
> Fork iniciado em 2026-03-25 a partir do Pomatez v1.10.0.
> Agradecimento ao autor original pela base sólida.

## [26.5.10] - 2026-05-18

### Alterado

- **Colunas Auto do grid de tarefas usam a mesma largura minima de cartao** — os grids normal e compacto agora usam o mesmo limite Auto de `11rem` e o mesmo padding horizontal de conteudo, reduzindo diferencas de layout entre as duas visualizacoes.

## [26.5.9] - 2026-05-15

### Corrigido

- **Controle de colunas do grid de tarefas permanece alinhado à direita em layouts estreitos** — a barra do grid agora mantém o seletor de colunas alinhado à borda direita em vez de posicioná-lo ao lado das ações à esquerda.
- **Ação de reset do grid de tarefas fica depois do sorteio e do agrupamento** — o botão de resetar cores agora aparece como terceiro ícone da barra em vez de ser o primeiro.
- **Estatísticas abertas pelo modo compacto retornam ao Timer compacto** — ao voltar do relatório para o Timer, o app agora restaura o modo compacto em vez de permanecer no layout normal.
- **Reducers de conclusão de tarefas agora tratam IDs ausentes de forma consistente** — os reducers de marcar como concluída e não concluída passam a ter o mesmo comportamento sem efeito quando o ID do cartão está ausente.

## [26.5.8] - 2026-05-14

### Adicionado

- **Prioridades no grid de tarefas** — cartões agora podem ser marcados como prioridade diretamente no grid, prioridades pendentes aparecem em uma seção superior dedicada tanto no grid normal quanto no compacto, a barra do grid pode alternar para o modo somente priorizadas, e a importação/exportação de tarefas preserva o novo marcador de prioridade mantendo compatibilidade com arquivos antigos.
- **Cartões de prioridade mantêm tamanho estável ao alternar agrupamento** — alternar o modo Agrupar/Desagrupar do grid não muda mais o tamanho dos cartões dentro da seção `Prioridades`, enquanto os demais grupos de tarefas continuam seguindo o layout selecionado.
- **Cartões de prioridade ficam separados visualmente do restante do grid** — quando prioridades pendentes aparecem no grid desagrupado, uma linha divisória agora separa a seção de prioridades dos demais cartões.
- **Sorteio pode ser limitado a tarefas priorizadas** — Ajustes agora inclui a opção `Sortear apenas priorizadas` abaixo do toggle do botão Sortear no grid; quando ligada no modo todas as tarefas, o Sorteio usa somente cartões priorizados elegíveis e volta automaticamente ao conjunto normal quando não houver priorizados disponíveis. O filtro visual somente priorizadas mantém o Sorteio limitado ao pool visível do grid.
- **Prioridades podem ser alternadas pela tela Lista** — cartões na tela Lista agora exibem a mesma estrela de prioridade perto do handle de arraste, longe das ações de editar/excluir, e arrastar uma tarefa priorizada entre listas preserva o marcador de prioridade.

### Alterado

- **Dependências foram atualizadas** — pins selecionados de tooling JS e pins transitivos de dependências Rust foram atualizados, incluindo updates Rust que resolvem os erros atuais de vulnerabilidade do `cargo audit`, sem mudanças intencionais de comportamento.

### Corrigido

- **Dry-runs de versão e release não pedem mais versão** — `scripts/version.sh --dry-run` e `scripts/release.sh --dry-run` agora usam a versão sugerida automaticamente quando nenhuma versão é informada.
- **Checks de update Cargo encontram ferramentas instaladas pelo usuario de forma consistente** — `scripts/check-updates.sh` agora adiciona `$CARGO_HOME/bin` ou `~/.cargo/bin` ao `PATH` local antes de verificar `cargo-audit` e `cargo-outdated`.
- **Prompt compacto de extensão de foco mantém a altura ao clicar nos controles de tarefa** — quando `Continuar focando?` está visível no modo compacto, os controles de painel do rodapé ficam bloqueados para que grid/ações/dropdown não colapsem a janela do prompt.
- **Validação em desenvolvimento aborta quando a instalação local já está em execução** — `scripts/validar-tudo.sh` agora para antes de abrir o runtime dev ou o binário release local se o binário local instalado do Pomodoroz estiver aberto, evitando confundir a janela instalada com o runtime em teste.

## [26.5.7] - 2026-05-12

### Corrigido

- **Grid de tarefas compacto agora cresce ao aumentar a altura da janela compacta** — ao arrastar a borda inferior da janela com o grid compacto aberto, a altura extra passa para o grid de tarefas em vez de esticar a área do timer, e ao reabrir o grid a altura ajustada manualmente é mantida durante a sessão atual.

### Alterado

- **Dependências foram atualizadas** — os pins de dependências do projeto foram atualizados sem mudanças intencionais de comportamento.

## [26.5.6] - 2026-05-11

### Adicionado

- **Relatório agora separa métricas do período de progresso de longo prazo** — a tela de Estatísticas mantém o filtro de período ligado a tempo de foco, tempo de pausa, tempo ocioso, ciclos completos, principais focos e fluxo diário enquanto exibe sequência, nível, progresso de XP, meta de hoje, marcos explícitos, heatmap de 30 dias e barras dos últimos 7 dias a partir do histórico local existente, sem adicionar novos campos de armazenamento.

### Alterado

- **Seletor de período ficou escopado à seção do relatório** — o combo de período agora fica no cabeçalho do Relatório do período, e os cartões objetivos de métricas continuam visíveis antes da seção de progresso para evitar misturar dados filtrados do relatório com dados fixos de hábito.
- **Janelas do relatório diário agora seguem dias de calendário** — os dados de semana e mês usam o mesmo intervalo de dias locais do gráfico de fluxo diário, e as barras do fluxo diário agora aparecem da data mais antiga para a mais recente em janelas de período fixas.
- **Atualizações Rust preparam os pins selecionados antes do lockfile** — o verificador de updates agora ajusta todos os root crates selecionados no `Cargo.toml` antes de rodar `cargo update`, evitando conflitos transitórios em pares com pin exato como `tauri` e `tauri-build`.
- **Tela de Estatísticas agora começa pelo filtro e pelas métricas** — o título visual redundante do relatório, o cabeçalho do resumo e o rótulo do filtro foram removidos, mantendo rótulos acessíveis para tecnologias assistivas.
- **Traduções de Estatísticas foram limpas** — uma mensagem obsoleta de confirmação de limpeza foi removida de todos os arquivos de idioma.

## [26.5.5] - 2026-05-06

### Corrigido

- **Pausa em tela cheia agora traz janelas Tauri em segundo plano para frente antes de ocupar a tela** — ao entrar na pausa em tela cheia, a janela agora sai do minimizado, aparece, recebe foco e fica temporariamente acima quando estava minimizada fora da bandeja ou visível atrás de outros apps; ao sair, o ajuste Sempre no topo do usuário é restaurado.

## [26.5.4] - 2026-05-06

### Corrigido

- **Controles de tarefa do Timer abrem na direção correta em cada modo de janela** — no modo normal, os overlays de tarefa abrem acima do rodapé sem recorte; no modo compacto, ações de tarefa usam um painel expandido mais curto abaixo do rodapé, e listas de prioridade continuam usando o painel mais alto do grid quando mais espaço é útil.
- **Destaque da tarefa ativa no grid ficou mais sutil** — o marcador da tarefa em execução agora muda apenas a cor da borda existente do cartão, sem adicionar halo extra ou sombra, tanto no grid padrão quanto no grid compacto.
- **Preflight Rust do release está formatado corretamente** — os imports dos comandos Tauri agora seguem o `cargo fmt`, evitando que o `release.sh` pare no gate local de qualidade Rust.

### Alterado

- **Dependências foram atualizadas em um refresh de pacotes** — nenhuma mudança funcional é intencional.

## [26.5.3] - 2026-05-05

### Corrigido

- **Timer compacto volta a manter o relogio visivel** — o modo compacto agora reserva uma coluna estavel para o relogio e centraliza o texto do contador sem recorte, preservando o rodape de tarefas encostado na borda introduzido na 26.5.1.

## [26.5.2] - 2026-05-05

### Alterado

- **Ferramenta de testes do renderer agora usa Vitest apenas para testes de funcionalidade** — os pacotes especificos de Jest e as dependencias Babel diretas dos testes foram removidos, scripts Vitest foram adicionados, o CI agora executa apenas a suite de testes de funcionalidade do renderer, e os fluxos locais de validacao/instalacao barram builds pelos mesmos testes funcionais.

## [26.5.1] - 2026-05-04

### Corrigido

- **Script de release agora explica cabecalhos de changelog ausentes antes de sincronizar manifests** — o `release.sh` valida os dois changelogs antes do `version:sync`, mostra os cabecalhos de versao mais proximos quando a versao pedida esta ausente e nao emite mais ruido de perfil de login nos comandos internos.
- **Áreas roláveis do app agora usam o mesmo padrão fino e visível de scrollbar** — Grid de Tarefas, telas principais com rolagem, detalhes de tarefa, campos de texto e menus de tarefas do Timer não misturam mais barras escondidas, dependentes de hover ou nativas mais grossas.
- **Checagem de updates não sugere mais updates Rust manuais quando os root crates estão atuais** — a seção Cargo agora oculta comandos manuais genéricos quando o `cargo outdated` passa e não encontra updates de root crates.
- **Checagem de updates agora oferece e aplica corretamente updates Rust patch/minor root** — o `check-updates` passa a tratar resultados `latest` patch/minor do `cargo outdated` como candidatos seguros quando `compat` não está disponível, atualiza pins exatos no manifesto Cargo antes de refrescar o lockfile e condiciona a recomendação JS/Tauri ao alinhamento Rust quando necessário.
- **Rodapé do Timer compacto agora encosta na borda da janela** — o modo compacto faz o Timer preencher a altura disponível e ancora o rodapé de tarefa no fim, removendo o pequeno espaço de fundo abaixo do rodapé.
- **Publicação Windows não aborta mais quando a GitHub Release ainda não foi criada** — o workflow de release agora trata a release ausente como caminho esperado de criação no PowerShell e tolera a corrida entre os jobs Linux/Windows para criar a mesma release.

### Alterado

- **Dependências Tauri foram mantidas alinhadas entre JS e Rust** — os updates JS de `@tauri-apps/*` agora acompanham os crates Rust correspondentes para o `tauri dev` não relatar divergência de versão do Tauri.
- **Pin de versão do pnpm agora fica declarado e mantido de forma consistente** — `package.json` declara `packageManager`, e o `check-updates` compara/atualiza o pin do manifesto junto dos pins Corepack dos workflows.

## [26.4.39] - 2026-04-29

### Corrigido

- **Prompt de continuar tarefa não desloca mais o tamanho da janela compacta** — o rodapé Continuar/Trocar agora usa a mesma altura fixa do rodapé compacto normal e trunca textos longos da tarefa dentro desse espaço.
- **Layout normal do Timer não pode mais ser reduzido abaixo do tamanho suportado** — a janela Tauri agora aplica um tamanho mínimo no modo normal enquanto o modo compacto mantém seu limite menor, evitando que o círculo do timer sobreponha navegação, texto de sessões e controles de reprodução.

### Alterado

- **Documentação de idiomas no README ficou mais clara** — a tabela Pomatez vs Pomodoroz agora resume a cobertura de idiomas suportados por quantidade, e a lista de idiomas reflete todos os 7 locales suportados.

## [26.4.38] - 2026-04-27

### Adicionado

- **Sessões de foco agora podem ser estendidas perto do fim** — o novo ajuste opcional de Extensão de foco mostra um prompt não-modal `+curto` / `+longo` nos últimos 30 segundos do foco, expande temporariamente o modo compacto quando necessário, usa durações configuráveis em Configurações/Regras, permite uma extensão por bloco de foco e envia um lembrete nativo quando o app está em segundo plano e notificações estão ligadas.
- **Customização do atalho de tema agora persiste** — o atalho local `Alternar tema`, controlado pelo app, agora pode ser alterado em Ajustes, armazenado nas configurações locais, restaurado na inicialização e protegido contra atalhos inválidos ou reservados.

### Corrigido

- **Polimento da extensão de foco após revisão** — o controle de uso da extensão agora tem uma única fonte de verdade, e a cópia alemã da extensão de foco agora usa a grafia nativa para `Verlängerung` / `verlängern`.

### Alterado

- **Ajudas de estudo do grid agora vêm ligadas por padrão** — perfis novos/restaurados agora mostram o botão Sortear no grid e rotacionam as cores do grid por padrão.
- **Dependências foram atualizadas em um refresh patch** — nenhuma mudança funcional é intencional.
- **Estado do prompt manual de update foi simplificado** — o armazenamento do body das notas de release foi removido do estado de update do renderer e do payload IPC porque o prompt manual agora permanece focado na versão disponível e na escolha de instalação.
- **Scripts de desinstalação local agora podem remover artefatos de instaladores gerados** — `scripts/uninstall.sh` e `scripts/uninstall.ps1` ganharam um modo de limpeza de instaladores para `src-tauri/target/release/bundle`, alinhado à saída local produzida por `validar-tudo --installers`.

## [26.4.37] - 2026-04-25

### Corrigido

- **Avisos de integração nativa não aparecem mais para falhas opcionais de sincronização em segundo plano** — erros de bandeja, autostart, ícone da bandeja e sync da política de update continuam registrados para diagnóstico, mas não exibem mais o banner genérico do Tauri na inicialização.

### Alterado

- **CSP do renderer agora é explícita na configuração do Tauri** — `app.security.csp` agora define uma política conservadora para o pacote final, `devCsp` preserva as necessidades locais do Vite/Tauri em desenvolvimento, e a meta CSP ampla dos templates do renderer foi removida.
- **Pequenos resíduos mortos do renderer foram removidos** — classes marcadoras sem uso em espaçadores do timer e a prop de conector sem consumo `openExternalCallback` foram removidas sem alterar comportamento visível.

## [26.4.36] - 2026-04-25

### Corrigido

- **Falhas de comandos nativos do Tauri agora aparecem na UI** — falhas assíncronas de `TauriInvokeConnector.send()` agora notificam o provider do conector, permitindo que o aviso existente de integração nativa apareça em vez de deixar a falha apenas nos logs do console.

### Alterado

- **Exibição de versão no renderer não importa mais o manifesto raiz do pacote** — o Vite agora injeta a versão do app no build, e os labels de versão na barra de título/Ajustes consomem a constante compartilhada `APP_VERSION` em vez de empacotar o `package.json`.
- **Guia do Claude Code foi alinhado com a arquitetura Tauri-only atual** — `CLAUDE.md` agora reflete o stack de lint ESLint 10 / `@eslint-react`, a cobertura completa de idiomas `de`/`fr` e a ponte de conector atual após a remoção do roteador legado de runtime.

## [26.4.35] - 2026-04-24

### Corrigido

- **Prompts manuais de update não dependem mais do texto das notas de release** — a disponibilidade de update agora usa `updateVersion`, mantendo o prompt de instalação e o indicador na navegação disponíveis mesmo quando o feed do updater tem body vazio.

### Alterado

- **Modo manual de update agora pergunta antes de instalar** — quando a instalação automática de updates está desligada, o app mostra um prompt localizado com `Atualizar agora` / `Agora não` em vez de substituir a tela de Ajustes pelo updater.
- **Texto de atualização automática foi clarificado e encurtado em todos os idiomas** — a configuração mantém o sentido de atualização automática e passa a caber melhor em linhas estreitas de Ajustes e prompts compactos.
- **Checagens de suporte do canal de updater agora são memoizadas por sessão de runtime** — ações repetidas do updater reutilizam o resultado resolvido de `is_updater_channel_supported`, preservando fallback seguro para `false` em erros nativos.
- **Roadmap de melhorias sincronizado após o bloco de updater** — `docs/IMPROVEMENTS.md` agora marca `A13` como entregue, enfileira visibilidade de erro IPC, `A7`, CSP/limpezas e `A3` como a próxima sequência técnica, e retorna itens de produto ainda não concluídos para `Open`.
- **Gestão de pins do pnpm alinhada entre CI e release** — o CI agora usa o mesmo pin `pnpm@10.33.2` do workflow de release, e `check-updates.sh` agora reporta e pode atualizar todos os pins de pnpm dos workflows em conjunto, além de orientar melhor Manjaro/Arch quando o binário `pnpm` ativo difere do pacote do sistema.

## [26.4.34] - 2026-04-24

### Alterado

- **Dependências do projeto foram atualizadas em um lote de manutenção** — sem mudanças funcionais planejadas.
- **CI agora inclui paridade de qualidade no Windows** — `.github/workflows/ci.yml` agora roda os gates de qualidade do renderer e `cargo check` do Tauri em `windows-latest`, além dos jobs existentes em Linux, com execução bem-sucedida nos dois lanes.
- **Bridge de escrita do export no Tauri agora usa validação defensiva de entrada** — `write_text_file` agora exige extensão `.json`, rejeita destinos existentes que não sejam arquivo regular e limita payload a 5 MB para alinhar com o hardening já aplicado no import/read.

## [26.4.33] - 2026-04-23

### Alterado

- **Detecção automática de idioma passou a usar o plugin oficial de OS do Tauri no renderer** — `detectSystemLanguage` agora resolve locale por `@tauri-apps/plugin-os` (`locale()`), com fallback seguro para locale do browser apenas quando o locale nativo não estiver disponível.
- **Fluxo de bootstrap/sincronização do i18n foi adaptado para resolução assíncrona de locale** — a inicialização do idioma no renderer agora começa com fallback síncrono e reconcilia para o locale nativo em modo auto, sem alterar o comportamento de seleção manual de idioma.
- **Fonte de locale no startup da bandeja foi unificada com a arquitetura do renderer** — a resolução de copy inicial nativa agora usa `tauri_plugin_os::locale()` no lugar de leitura direta de `LC_ALL`/`LC_MESSAGES`/`LANG`.
- **Capabilities do Tauri agora incluem permissão explícita do plugin de OS** — `src-tauri/capabilities/default.json` passou a conceder `os:default` para acesso ao locale.
- **Roadmap de melhorias foi sincronizado com a entrega do A9** — `docs/IMPROVEMENTS.md` agora marca a unificação da fonte de locale como concluída e atualiza a ordem de execução após `26.4.32`.
- **Racional da arquitetura de locale ficou explícito na documentação** — `docs/IMPROVEMENTS.md` e `docs/LANGUAGE_EXPANSION_GUIDE.md` agora explicam por que o A9 foi executado (consistência de startup em modo auto, menor risco de drift e alinhamento ao plugin oficial do Tauri), e não apenas o que foi alterado.

## [26.4.32] - 2026-04-21

### Corrigido

- **Updater in-app agora bloqueia o fluxo de instalador em canais de runtime não suportados** — instalações locais Linux geradas com `--no-bundle` não tentam mais `downloadAndInstall`; ações de update passam a cair para abertura da página de release quando o tipo de bundle em execução não suporta substituição por instalador.

### Alterado

- **Suporte de canal do updater passou a ser verificado explicitamente na ponte nativa** — novo comando `is_updater_channel_supported` foi adicionado e registrado no invoke handler do Tauri para alinhar o comportamento de update ao tipo de pacote em execução.
- **Scripts de instalação local passaram a explicitar limitação do canal de updater** — `scripts/install.sh` e `scripts/install.ps1` agora informam que instalações locais `--no-bundle` não executam instalação automática de update in-app.

## [26.4.31] - 2026-04-21

### Corrigido

- **Transições automáticas de fim de ciclo no timer ficaram resilientes a corrida de estado** — o `CounterContext` agora controla/limpa timeout de transição de break com referência única e cleanup no ciclo de vida, evitando execução tardia após reset/reconfiguração/desmontagem.
- **Listener global de `Escape` no setter de pausa especial deixou de ficar ativo permanentemente** — o handler de teclado em `SpecialField` agora só é registrado enquanto o popup está aberto.
- **Posicionamento do ripple em botões foi corrigido para cenários com scroll** — `useRippleEffect` passou a usar `clientX/clientY` com `getBoundingClientRect()`.
- **Persistência local ganhou flush defensivo em eventos de ciclo de vida da WebView** — o debounce do `store.subscribe` agora é descarregado em `beforeunload`, `pagehide` e `visibilitychange`, reduzindo risco de perder o último estado em fechamento rápido.

### Alterado

- **Setter de pausa especial migrado para i18n completo (pt/en/es/ja/zh)** — textos hardcoded foram substituídos por chaves de tradução para todos os idiomas suportados.
- **Contrato de configuração do break curto normalizado** — action typo `setShorBreak` foi renomeada para `setShortBreak` (slice e consumidores), sem mudança funcional esperada.
- **Action órfã `restartTimer` removida do slice `timer`** — caminho sem consumidores no renderer foi eliminado para reduzir superfície de uso indevido.
- **Comando Tauri `read_text_file` endurecido para import de tarefas** — leitura agora valida extensão `.json`, recusa caminhos não-arquivo e limita tamanho do payload (5 MB).
- **Roadmap técnico atualizado com pendência explícita para versionamento no renderer** — `docs/IMPROVEMENTS.md` recebeu o item `A7` para migrar exibição de versão e remover dependência de `package.json` no bundle da UI em ciclo futuro.
- **README EN/PT ganhou comparação objetiva entre Pomatez original e Pomodoroz** — adicionada seção "Pomatez vs Pomodoroz" com diferenças de arquitetura, stack e funcionalidades em formato de tabela compacta.
- **Cobertura de idiomas ampliada para Alemão e Francês (`de`/`fr`)** — `LanguageCode`, validação de settings, `supportedLanguages`, recursos do i18n e novas traduções completas foram atualizados para suportar os dois idiomas no renderer.
- **Localização da bandeja no Tauri alinhada aos novos idiomas já no bootstrap nativo** — `TRAY_COPY_BY_LANGUAGE` foi expandido no renderer e o fallback inicial em Rust (`resolve_tray_copy`) passou a reconhecer `es/zh/ja/pt/de/fr` (com fallback seguro para `en`).
- **Guia operacional para adicionar novos idiomas foi documentado** — novo `docs/LANGUAGE_EXPANSION_GUIDE.md` lista arquivos obrigatórios, checklist de implementação e validação pós-implantação.
- **Nomenclatura dos changelogs foi padronizada para deixar o inglês como fonte primária de release** — `CHANGELOG.en.md` foi promovido para `CHANGELOG.md`, o português foi movido para `CHANGELOG.pt.md`, e scripts/docs de release foram atualizados para validar ambos com os novos nomes.

## [26.4.30] - 2026-04-20

### Alterado

- **Contrato IPC simplificado após consolidação Tauri-only** — remoção dos tipos/canais `INVOKE_MAIN` e do método `invoke` do `InvokeConnector`, eliminando caminho morto sem consumidores no renderer.
- **Auto-expand de janela compacta para diálogos consolidado em hook compartilhado** — a lógica duplicada de expansão/recolhimento temporário (`Control` e `TaskListGrid`) foi centralizada em `useCompactAutoExpand`, reduzindo drift entre fluxos e evitando recolhimento indevido quando o modo compacto é desligado durante o prompt.
- **`ConfirmDialog` com acessibilidade de foco reforçada** — adicionado trap de `Tab`/`Shift+Tab`, auto-focus inicial no botão de cancelar ao abrir, `aria-describedby` para mensagem e restauração de foco ao elemento acionador no fechamento.
- **Seletor de colunas do grid no modo escuro corrigido** — o dropdown `Colunas` no `TaskListGrid` passou a usar reset de aparência nativa (`appearance: none`) e seta customizada em CSS para evitar fundo branco e manter consistência visual no dark theme.

## [26.4.29] - 2026-04-20

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
- **Scripts PowerShell de versionamento/release ficaram resilientes a Windows sem `pnpm` global** — `scripts/version.ps1` e `scripts/release.ps1` agora executam `pnpm` via `node scripts/pnpmw.mjs`, removendo dependência do binário `pnpm` no `PATH` e alinhando o comportamento aos wrappers já usados em `validar-tudo.ps1` e `check-updates.ps1`.
- **`uninstall.ps1` ganhou suporte Windows user-scope com paridade funcional de modo** — o script agora roda em Linux e Windows, mantendo modo padrão + `-Purge`/`-Yes`; no Windows remove diretórios de instalação por usuário (`%LOCALAPPDATA%`), atalhos comuns (Start Menu/Desktop) e, em `-Purge`, limpa dados locais em `%APPDATA%`/`%LOCALAPPDATA%` para `pomodoroz` e `com.cjdduarte.pomodoroz`.
- **Build de release/instaladores no Windows ficou resiliente a lock do executável local** — `scripts/validar-tudo.ps1` agora encerra automaticamente instâncias em execução de `src-tauri/target/release/pomodoroz_tauri.exe` antes de `tauri build`, evitando falha `Acesso negado (os error 5)` ao sobrescrever o binário.
- **Geração local de instaladores não exige mais chave privada de assinatura do updater** — `scripts/validar-tudo.sh` e `scripts/validar-tudo.ps1` agora forçam `bundle.createUpdaterArtifacts=false` para todos os bundles locais de instalador, evitando falha por ausência de `TAURI_SIGNING_PRIVATE_KEY` fora do pipeline oficial de release.
- **Override local de config do Tauri em PowerShell ficou compatível com parsing JSON no Windows** — `scripts/validar-tudo.ps1` passou a usar arquivo temporário (`src-tauri/.tauri-local-no-updater.json`) no `--config` durante geração de instaladores, evitando erro de parse (`key must be a string`) causado por quoting inline no `tauri build`.

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
