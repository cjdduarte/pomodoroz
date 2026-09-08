## 1. Security Patch

- [x] 1.1 Update only `event-listener` from 5.4.1 to 5.4.2 in `src-tauri/Cargo.lock`, and verify `cargo tree -i event-listener@5.4.2` resolves the patched version through the existing Tauri dependency graph.

## 2. Validation and Records

- [x] 2.1 Run `cargo audit --deny warnings`, `cargo fmt --all -- --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `cargo check --all-targets --all-features`, and `cargo test --all-targets --all-features` from `src-tauri`, and verify no new advisory ignore is added.
- [x] 2.2 Record the dependency security patch in both changelogs and `RETOMADA.md`, and verify their entries do not claim a product behavior change.
- [x] 2.3 Run `openspec validate patch-event-listener-advisory --strict` and verify the change artifacts are valid.
