# Contributing to This Project

While we don't have a strict coding style guide we do use conventional commits.

We do ask that you try to make any platform specific features or program
specific integrations optional, so that core functionality remains consistent
across all platforms and use cases.

Please do not open features saying "I asked AI to do it" trying to contribute.
If you make a pr we expect that if we ask for changes you should be able to
implement them rather than
us being your AI proof readers.

## Conventional Commits

Please make your commit messages in the following style, or your pr names in
this style so they can be squash merged.

- `feat:`
  - New features
- `fix:`
  - Fixing bugs
- `perf:`
  - Performance improvements
- `chore:`
  - Non code changes which done fall into the other categories e.g. Updating build pipelines.
- `docs:`
  - Documentation changes
- `lang:`
  - Language specific changes

These are the main ones used in this project.

## How to set up the development environment

If there are any issues with these stages e.g. we have forgot to update any
versions, feel free to open a small pr to correct it.

### Requirements

- Node.js v24
- Yarn Classic (1.x)

Any IDE should be fine as they should pick up the package.json in the root
folder. Once you have run `yarn` to install modules, the main commands are:

- `yarn dev:app`
- `yarn dev:renderer`
- `yarn dev:main`
- `yarn lint`
- `yarn build:dir`

Current default frontend flow:

- `dev:app` runs the renderer with Vite.
- `dev:renderer` runs Vite directly for the renderer workspace.
- Electron-only flow is finalized; Tauri/Rust is out of scope.

If you have any issues, feel free to open an issue with any error logs and steps
to reproduce.

We will happily add any configurations or list any plugins suggested that may
help with local development.

## CI / Release

- CI validates `yarn lint` and `yarn build` on regular pushes.
- Tagged builds run release jobs (`yarn release:mw` on macOS and `yarn release` on Linux).

## Building for Production

1. Build Windows installer.
   ```sh
   yarn build:win
   ```
2. Build macOS installer.
   ```sh
   yarn build:mac
   ```
3. Build Linux installer.
   ```sh
   yarn build:linux
   ```
4. Build macOS, Windows and Linux installer at once.
   ```sh
   yarn build:mwl
   ```

## Pre-Commit

This project uses Husky + lint-staged for pre-commit checks.

- Hooks are installed automatically when you run `yarn install` in `pomodoroz/`.
- To run the same checks manually, use `yarn lint-staged`.
