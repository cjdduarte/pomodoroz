## Context

Release CI publishes signed updater metadata only for Windows x86_64 NSIS and Linux x86_64 AppImage, but the native eligibility check also permits deb, rpm, MSI, and macOS app bundles. The task-selection slice stores a list ID with the active card but does not react when that card is moved across lists, causing the timer context to clear.

The audit also identified unused renderer artifacts and direct dependency declarations. Consumer investigation confirmed a bounded removal set; native dialog and notification plugins remain in Rust and must not be removed with their unused JavaScript packages.

## Goals / Non-Goals

**Goals:**

- Make native updater eligibility exactly match the two published updater channels.
- Preserve an active selection across a cross-list card move using the existing Redux action.
- Document the signed updater assets and admission conditions actually produced by CI.
- Remove only consumer-verified residue and regenerate dependency locks through pnpm.

**Non-Goals:**

- No updater feed, signing, release-admission, or CI architecture redesign.
- No changes to task drag ordering, undo/redo semantics, task import format, or timer duration rules.
- No removal of native Tauri dialog/notification plugins, their capabilities, or live shared Popper styles.
- No dependency additions or migration to another toolchain.

## Decisions

1. **Use one pure native predicate for published updater channels.**
   - The predicate accepts only `BundleType::Nsis` and `BundleType::AppImage`; all other bundle types and development builds return false.
   - `is_updater_channel_supported` delegates to this helper, enabling a complete Rust unit matrix.
   - The existing TypeScript fallback remains unchanged because it already uses the native result for manual and automatic updater paths.

2. **Remap task selection in the selection reducer.**
   - `taskSelection` handles the existing `dragList` action through `extraReducers`.
   - Only a cross-list card move whose source is the selected list and whose draggable ID is the selected card changes the selection list ID.
   - This avoids route-specific dispatches and preserves the existing action as the single source of the move.

3. **Remove verified residue in one dependency-safe batch.**
   - Delete unused components/hooks/assets, unused declarations, stale translations, CRA public entry, and obsolete scripts only after preserving live shared symbols.
   - Use `pnpm remove` to remove direct JavaScript dependencies and refresh `pnpm-lock.yaml`; retain `serde_json` because `tauri::generate_context!` requires it as a direct compile-time dependency.
   - Preserve transitive packages and native plugin crates/capabilities even when the matching JavaScript package is removed.

4. **Document the release artifacts CI actually validates.**
   - Release operations distinguish raw installer/AppImage artifacts from v1-compatible signed updater archives, identify x86_64 scope, require both feed platforms, and state that local preflight does not validate signed updater artifacts.

## Risks / Trade-offs

- [Existing MSI users expect in-app updates] -> MSI is not a published/documented updater channel; unsupported channels retain the existing release-page fallback.
- [Task selection changes on unrelated drag] -> Reducer guards require card drag, matching selected card, matching source list, and a different destination list.
- [Cleanup removes an indirect consumer] -> Keep live Popper style exports and native plugins; run renderer/Rust gates and targeted task-drag smoke validation.
- [Lockfile churn obscures removal] -> Use pnpm package operations only, inspect the resulting lock diff, and keep no unrelated version updates.

## Migration Plan

1. Add and test updater eligibility helper and task-selection drag remapping.
2. Apply the verified cleanup set and package removals.
3. Update release operations, roadmap, and unreleased changelogs.
4. Run strict OpenSpec, pnpm frozen install, renderer, Rust, and script validation gates.
5. Roll back per concern by restoring the affected source/configuration files and lockfile entries; no data migration is involved.

## Open Questions

- None. Release admission and supply-chain hardening remain separate C2-C4 work.
