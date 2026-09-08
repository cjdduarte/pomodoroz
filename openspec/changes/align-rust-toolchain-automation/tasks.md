## 1. Toolchain Alignment

- [x] 1.1 Replace every CI and release `dtolnay/rust-toolchain@stable` reference with the Rust version declared in `rust-toolchain.toml`, and verify no moving `stable` Rust setup reference remains in `.github/workflows/`.

## 2. Contributor Documentation

- [x] 2.1 Add the pinned Rust 1.98.1 requirement to `README.md` and `README.pt-BR.md`, and verify both requirement lists match `rust-toolchain.toml`.
- [x] 2.2 Update `docs/VERSIONS.md` so each future Rust bump explicitly updates `rust-toolchain.toml`, `Cargo.toml` MSRV, and workflow setup references, and verify the procedure names all three locations.
- [x] 2.3 Add equivalent English and Portuguese changelog entries and refresh `RETOMADA.md` with the pinning state, then verify the operational records describe the completed change.

## 3. Validation

- [x] 3.1 Run `rustc --version`, `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `cargo check --all-targets --all-features`, and `cargo test --all-targets --all-features` from `src-tauri` to verify the pinned local toolchain completes the Rust gate.
- [x] 3.2 Run `openspec validate align-rust-toolchain-automation --strict` and verify the change artifacts remain valid.
