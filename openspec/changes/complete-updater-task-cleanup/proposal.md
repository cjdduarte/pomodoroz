## Why

The native updater currently advertises channels that the release pipeline does not publish, moving the selected task between lists invalidates its persisted selection and pauses focus, and verified unused code/dependencies obscure the active architecture. Release documentation also omits the signed updater archives that users actually receive.

## What Changes

- Restrict native in-app updater eligibility to the published Windows NSIS and Linux AppImage channels.
- Preserve the active task selection when its card moves to a different list.
- Document the signed x86_64 updater assets, feed requirements, and local preflight boundary used by the release pipeline.
- Remove only verified dead renderer code, stale renderer configuration, unused direct dependencies, Yarn residue, and obsolete Rust comparison scripts.
- Update the active roadmap and unreleased changelogs with this correction batch.

## Capabilities

### New Capabilities

- `published-updater-channel-policy`: In-app updater eligibility matches the channels and artifacts published by release CI.
- `active-task-selection-continuity`: Moving an active task card between lists preserves its resolvable selection and timer context.
- `verified-maintenance-cleanup`: Unused application artifacts and direct dependency declarations are removed only after consumer verification.

### Modified Capabilities

- None.

## Impact

- Native updater predicate and Rust tests in `src-tauri/src/commands/window_bridge.rs`.
- Redux task-selection reducer and tests in `src/store/taskSelection/` and `src/store/tasks/`.
- Renderer components, styles, translations, Vite configuration, dependency manifests, lockfiles, ignore rules, and obsolete scripts.
- `docs/RELEASE_OPERATIONS.md`, `docs/IMPROVEMENTS.md`, and both unreleased changelogs.
- No new runtime library or release publication is required.
