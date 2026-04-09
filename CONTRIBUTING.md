# Contributing to Pomodoroz

## Conventional Commits

Please use conventional commit messages in your PRs (or PR titles for squash merge):

- `feat:` — New features
- `fix:` — Bug fixes
- `perf:` — Performance improvements
- `chore:` — Non-code changes (build, deps, CI)
- `docs:` — Documentation changes
- `lang:` — Language/i18n changes
- Commit messages and PR titles must be in English.

## Development Setup

### Requirements

- Node.js v24
- Yarn Classic (1.x)

### Commands

```sh
yarn install              # Install dependencies
yarn dev:app              # Electron + Vite renderer
yarn dev:renderer         # Renderer only (Vite on localhost:3000)
yarn dev:main             # Electron main only
yarn lint                 # Lint + typecheck
yarn build:dir            # Unpacked build for smoke testing
```

Any IDE should work — it will pick up `package.json` in the root folder.

### Validation Scripts

```sh
./scripts/validar-tudo.sh              # Interactive menu
./scripts/validar-tudo.sh --dev        # Quick dev validation
```

## Building for Production

```sh
yarn build:win            # Windows (portable + setup)
yarn build:mac            # macOS
yarn build:linux          # Linux (AppImage, deb, rpm)
yarn build:mwl            # All platforms
```

## Pre-Commit

This project uses Husky + lint-staged for pre-commit checks.
Hooks are installed automatically when you run `yarn install`.
To run the same checks manually: `yarn lint-staged`.

## CI / Release

- There is no CI pipeline on regular pushes/PRs yet (planned in migration Phase 4).
- Release workflow (`release-autoupdate.yml`) runs on `v*` tags or manual dispatch, with Windows + Linux jobs.
- See `docs/RELEASE_OPERATIONS.md` for the full release flow.

## Guidelines

- Make platform-specific features or integrations optional so core functionality remains consistent across platforms.
- If opening a PR, be prepared to implement requested changes yourself.
- Code in English. Comments/logs in Portuguese (PT-BR) where appropriate.

If you have issues with the setup, open an issue with error logs and steps to reproduce.
