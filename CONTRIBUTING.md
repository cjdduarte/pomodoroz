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
- For AI-assisted changes: after each finalized implementation, include a suggested ready-to-use commit message in English.

## Development Setup

### Requirements

- Node.js v24
- pnpm v10

### Commands

```sh
pnpm install              # Install dependencies
pnpm dev:app              # Electron + Vite renderer
pnpm dev:renderer         # Renderer only (Vite on localhost:3000)
pnpm dev:main             # Electron main only
pnpm lint                 # Lint + typecheck
pnpm build:dir            # Unpacked build for smoke testing
```

Any IDE should work — it will pick up `package.json` in the root folder.

### Validation Scripts

```sh
./scripts/validar-tudo.sh              # Interactive menu
./scripts/validar-tudo.sh --dev        # Quick dev validation
```

## Building for Production

```sh
pnpm build:win            # Windows (portable + setup)
pnpm build:mac            # macOS
pnpm build:linux          # Linux (AppImage, deb, rpm)
pnpm build:mwl            # All platforms
```

## Pre-Commit

This project uses Husky + lint-staged for pre-commit checks.
Hooks are installed automatically when you run `pnpm install`.
To run the same checks manually: `pnpm exec lint-staged`.

### Generated Files (Tauri)

- Never commit Rust build outputs from `src-tauri/target/`.
- Never commit generated ACL schemas from `src-tauri/gen/schemas/`.
- Before committing, run `git status --short` and confirm only source/docs files are staged.

## CI / Release

- There is no CI pipeline on regular pushes/PRs yet (planned in migration Phase 4).
- Release workflow (`release-autoupdate.yml`) runs on `v*` tags or manual dispatch, with Windows + Linux jobs.
- See `docs/RELEASE_OPERATIONS.md` for the full release flow.

## Guidelines

- Make platform-specific features or integrations optional so core functionality remains consistent across platforms.
- If opening a PR, be prepared to implement requested changes yourself.
- Code in English. Comments/logs in Portuguese (PT-BR) where appropriate.

If you have issues with the setup, open an issue with error logs and steps to reproduce.
