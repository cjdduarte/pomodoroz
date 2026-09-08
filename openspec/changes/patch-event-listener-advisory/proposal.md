## Why

CI rejects the newly published `RUSTSEC-2026-0221` unsoundness advisory in the
transitive `event-listener` 5.4.1 crate. RustSec identifies 5.4.2 as the
compatible patched release, so the lockfile must be refreshed before the
security gate can pass.

## What Changes

- Update only the transitive `event-listener` crate from 5.4.1 to 5.4.2 in
  `src-tauri/Cargo.lock`.
- Confirm `cargo audit --deny warnings` passes without adding an advisory
  ignore.
- Run Rust quality, test, and build gates.
- Record the security maintenance update in the changelogs and handoff.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This dependency patch does not modify product requirements.

## Impact

- `src-tauri/Cargo.lock` only for dependency resolution.
- CI Rust advisory gate and operational maintenance records.
