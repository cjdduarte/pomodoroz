<h1 align="center">Pomodoroz</h1>

<h3 align="center">Foco. Pausa. Progresso.</h3>

<p align="center">
  <a href="README.en.md">English version</a>
</p>

<p align="center">
  <a href="https://github.com/cjdduarte/pomodoroz/releases/latest"><img alt="release" src="https://img.shields.io/github/v/release/cjdduarte/pomodoroz?label=release&color=blue"></a>
  <a href="https://github.com/cjdduarte/pomodoroz/releases"><img alt="downloads" src="https://img.shields.io/github/downloads/cjdduarte/pomodoroz/total?label=downloads&color=green"></a>
  <a href="LICENSE"><img alt="license" src="https://img.shields.io/github/license/cjdduarte/pomodoroz?label=license&color=yellow"></a>
</p>

<p align="center">
  <img src="assets/timerA.png" alt="Pomodoroz - Tema Claro" width="340">
  &nbsp;&nbsp;
  <img src="assets/timerB.png" alt="Pomodoroz - Tema Escuro" width="340">
</p>

<p align="center">
  <br>
  <a href="#-sobre">Sobre</a>
  .
  <a href="#-funcionalidades">Funcionalidades</a>
  .
  <a href="#-instalação">Instalação</a>
  .
  <a href="#-desenvolvimento">Desenvolvimento</a>
  .
  <a href="#-contribuindo">Contribuindo</a>
  .
  <a href="#-privacidade">Privacidade</a>
  .
  <a href="#-licença">Licença</a>
  <br>
  <br>
</p>

## 🔗 Sobre

**Pomodoroz** é um fork do [Pomatez](https://github.com/zidoro/pomatez) por [Roldan Montilla Jr](https://github.com/roldanjr), iniciado em 2026-03-25.

Este fork consolida o projeto como **Electron-only** (Tauri/Rust removido), adiciona módulo de **Estatísticas**, **Grade de Rotação de Estudos** e moderniza toda a stack.

Agradecimento ao autor original pela base sólida.

### O que mudou em relação ao Pomatez original

- Módulo de **Estatísticas** com gráfico diário, tempo por tarefa e filtros de período.
- **Grade de Rotação** com status diário por cartão (branco/verde/vermelho), sorteio por fase e modo agrupado.
- **Importação/Exportação de tarefas** em JSON com validação e merge/substituição.
- **Modo compacto aprimorado** com grade expansível e menu de ações.
- **Voltar pode contar como Ocioso** — opção para reclassificar tempo de foco ao resetar.
- **Som de notificação customizável** e **breaks de 0 minutos** (pula automaticamente).
- Ações do Timer refinadas, seleção por clique direito e progressão automática de tarefas.
- Stack modernizada: React 19, Vite 8, TypeScript 6, React Router 7, Redux Toolkit 2, @dnd-kit, ESLint 9.

Para o histórico completo, veja o [CHANGELOG.md](CHANGELOG.md).

## ✨ Funcionalidades

### Timer
- Modos: **Foco**, **Pausa curta**, **Pausa longa** e **Pausas especiais** (horários configuráveis).
- Controles: iniciar, pausar, pular, resetar.
- Rodadas de sessão configuráveis.
- **Modo rigoroso** — impede pausar/pular/resetar uma vez iniciado.
- **Início automático** do foco após a pausa.
- **Breaks de 0 minutos** — pula a pausa automaticamente.
- **Animação de progresso** (desativável).

### Tarefas
- Criar listas e tarefas com descrição.
- Arrastar e soltar para reordenar (listas e cartões).
- Marcar como concluído, pular ou excluir.
- **Desfazer/Refazer** (Ctrl+Z / Ctrl+Shift+Z).
- **Importação/Exportação** em JSON com validação, regeneração de IDs e opção merge ou substituição.

### Grade de Rotação de Estudos
- Alternância entre visualização em **lista** e **grade**.
- Status diário por cartão: branco → verde → vermelho.
- **Botão Sortear** — seleção aleatória por fase (branco→verde, depois verde→vermelho).
- **Colunas**: Auto / 1 / 2 / 3 (preferência persistente).
- **Modo agrupado** — separadores por lista com toggle Agrupar/Desagrupar.
- **Reset de cores** com confirmação e reset automático diário.
- Clique direito seleciona a tarefa ativa e navega ao Timer.

### Estatísticas
- **Períodos**: Hoje, Semana (7d), Mês (30d), Tudo.
- Cartões resumo: tempo de foco, pausa, ocioso e ciclos completos.
- **Gráfico diário** (foco/pausa/ocioso empilhados).
- **Detalhamento por lista de tarefas** com tempo e ciclos.
- Limpeza de dados com confirmação (semana, mês ou tudo).

### Modo Compacto
- Interface mínima para telas pequenas.
- **Grade expansível** dentro do modo compacto.
- Menu de ações (concluir/pular/excluir) no display de tarefa.
- Prompt pós-pausa para continuar ou abrir a grade.

### Notificações
- **Nenhuma** — sem notificação.
- **Normal** — notifica a cada pausa.
- **Extra** — notifica 60s antes da pausa, 30s antes do fim e no início.
- **Som customizável** — sino padrão ou arquivo de áudio personalizado.
- **Assistente de voz** — aviso sonoro sobre status da sessão.

### Aparência e Sistema
- **Tema escuro** com opção de seguir o tema do sistema.
- **Barra de título nativa** — alterna entre custom e nativa do SO.
- **Sempre no topo** — mantém a janela acima das demais.
- **Minimizar/Fechar para bandeja** com indicador de progresso no ícone.
- **Abrir no login** (macOS/Windows).

### Atalhos de Teclado
- `Alt+Shift+H` — Ocultar app.
- `Alt+Shift+S` — Mostrar app.
- `Alt+Shift+T` — Alternar tema.
- `Ctrl+Z` / `Ctrl+Shift+Z` — Desfazer/Refazer em Tarefas.

### Idiomas
- Português (BR), Inglês, Espanhol, Japonês, Chinês.
- Detecção automática do idioma do sistema.

### Tela cheia durante pausas
- Ocupa a tela inteira durante a pausa para forçar o descanso.
- Estabilidade em estados compacto/minimizado/oculto.

## 💻 Instalação

Disponível para Windows, macOS e Linux.

Baixe a versão mais recente na [página de Releases](https://github.com/cjdduarte/pomodoroz/releases/latest).

### Compilar do Código-Fonte

```sh
yarn install
yarn build:dir    # Build desempacotado
yarn build:linux  # Linux (AppImage, deb, rpm)
yarn build:win    # Windows (portable + setup)
yarn build:mac    # macOS
```

## 🛠️ Desenvolvimento

### Requisitos
- Node.js v24
- Yarn Classic (1.x)

### Comandos

```sh
yarn dev:app          # Electron + Vite renderer
yarn dev:renderer     # Renderer only (Vite em localhost:3000)
yarn lint             # Lint/typecheck do monorepo
yarn build:dir        # Build desempacotado
```

### Stack

- Electron 41
- React 19 + Vite 8 + TypeScript 6
- React Router 7 + Redux Toolkit 2
- @dnd-kit (arrastar e soltar)
- Styled Components
- i18next
- Lerna 9 + Yarn Classic

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes.

## 🔒 Privacidade

Pomodoroz **não coleta nenhum dado**. Todas as informações (tarefas, configurações, estatísticas) ficam armazenadas localmente na sua máquina.

## 📄 Licença

MIT © [Carlos Duarte](https://github.com/cjdduarte)

Trabalho original: MIT © [Roldan Montilla Jr](https://github.com/roldanjr) — [Pomatez](https://github.com/zidoro/pomatez)
