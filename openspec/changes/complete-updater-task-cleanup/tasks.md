## 1. Updater And Task Behavior

- [x] 1.1 Restrict native updater eligibility to published NSIS and AppImage channels.
- [x] 1.2 Add Rust coverage for every supported and unsupported updater bundle type.
- [x] 1.3 Remap an active task selection when its card moves across lists.
- [x] 1.4 Add reducer coverage for active, unrelated, and same-list task moves.

## 2. Verified Cleanup

- [x] 2.1 Remove verified unused renderer components, hooks, styles, asset, translations, and stale Vite/CRA residue while preserving live shared symbols.
- [x] 2.2 Remove verified unused direct JavaScript dependency declarations and regenerate the pnpm lockfile without unrelated updates.
- [x] 2.3 Remove pnpm-incompatible Yarn residue and obsolete Rust comparison scripts, preserving current canonical scripts.

## 3. Documentation And Validation

- [x] 3.1 Update release operations with signed x86_64 updater artifacts, feed entry checks, single-platform behavior, and local preflight limitations.
- [x] 3.2 Update the corrections roadmap and both unreleased changelogs.
- [ ] 3.3 Run strict OpenSpec validation, frozen pnpm install, renderer lint/typecheck/tests/build, Rust fmt/clippy/check/test, and script syntax/help checks.
