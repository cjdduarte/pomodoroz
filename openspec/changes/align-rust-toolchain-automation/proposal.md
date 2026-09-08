## Why

The repository pins Rust 1.98.1 locally, but CI and release jobs select the
moving `stable` channel. This can cause automation to validate or publish with
a different toolchain from local development, while the contributor-facing
documentation does not state the Rust requirement.

## What Changes

- Make all CI and release Rust setup steps use the repository's pinned Rust
  1.98.1 toolchain.
- State the Rust 1.98.1 requirement in both README variants.
- Extend the toolchain update procedure in `docs/VERSIONS.md` to require
  updating workflow pins together with the local toolchain and MSRV.
- Record the implemented operational/documentation change in both changelogs
  and refresh the session handoff.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a tooling and documentation alignment with no product behavior
change.

## Impact

- GitHub Actions CI and release workflow setup steps.
- English and Portuguese contributor requirements.
- Rust toolchain maintenance instructions and operational records.
