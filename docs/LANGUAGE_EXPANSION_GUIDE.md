# Language Expansion Guide (Renderer + Tray)

This document describes exactly what must be changed to add new languages in Pomodoroz.

Current architecture has two localization paths:

- Renderer UI (`react-i18next`) for screens/components.
- Native tray menu copy (Tauri/Rust + renderer bridge) for system tray labels.

Both are required for a complete language rollout.

Auto-language source (A9 decision):

- Renderer auto mode:
  - Primary source: `@tauri-apps/plugin-os` `locale()`.
  - Safe fallback: browser locale (`navigator.languages` / `navigator.language`) when native locale is unavailable.
- Native tray startup:
  - Source: `tauri_plugin_os::locale()`.
- Final language normalization/fallback:
  - `normalizeLanguageCode(...)` with fallback to `en`.

Why this was changed:

- Before A9, renderer and tray startup could use different locale origins, which allowed startup mismatch in `auto` mode.
- A single OS-locale contract across boundaries makes behavior deterministic and easier to maintain.

---

## 1) Required files to update

### 1.1 Renderer language contract

- `src/store/settings/types.ts`
  - Extend `LanguageCode` with the new codes.
- `src/store/settings/index.ts`
  - Update `isLanguageOption` validation whitelist.

### 1.2 Supported language list + auto-detection

- `src/i18n/languages.ts`
  - Add new entries in `supportedLanguages`.
  - Keep `normalizeLanguageCode` fallback behavior.
  - Keep plugin-first detection contract for `auto` mode.

### 1.3 i18n resources registry

- `src/i18n/index.ts`
  - Import new translation files.
  - Register them in `resources`.

### 1.4 Translation files

- `src/i18n/translations/<code>.ts`
  - Add one file per language.
  - Keep key parity with existing translations (`en.ts` as reference).

### 1.5 Settings UI language selector

- `src/routes/Settings/LanguageSection.tsx`
  - No direct code change usually needed.
  - It already consumes `supportedLanguages`; new entries appear automatically.

### 1.6 Tray copy sync from renderer

- `src/contexts/connectors/TauriConnector.tsx`
  - Extend `TRAY_COPY_BY_LANGUAGE: Record<LanguageCode, TrayCopy>`.
  - Add `restoreLabel`, `quitLabel`, and `tooltip` for each new language.

### 1.7 Native startup tray fallback (before renderer sync)

- `src-tauri/src/lib.rs`
  - Update `resolve_tray_copy()` locale mapping.
  - Keep locale origin from `tauri_plugin_os::locale()`.
  - Include all supported languages and keep a final fallback.

### 1.8 Optional metadata alignment

- `src/hooks/useLanguageSync.ts`
  - Keep `<html lang>` synced with active app language.
- `app/renderer/index.html` and `app/renderer/public/index.html`
  - Static `lang="en"` is only an initial HTML fallback and should not be treated as runtime i18n source.

---

## 2) Why tray copy is not inside `src/i18n/translations/*.ts`

It is a different runtime boundary:

- `src/i18n/translations/*.ts` is renderer-only (React/WebView).
- Tray labels exist in native process space (Tauri), including app boot phase before renderer is ready.
- Because of this, tray labels need:
  - A native startup fallback in Rust (`resolve_tray_copy`).
  - A renderer-to-native sync path (`SET_TRAY_COPY`) once app state is available.

So yes: they are distinct and both are necessary.

---

## 3) Implementation checklist

- [ ] Add new language codes to `LanguageCode`.
- [ ] Update settings language validation (`isLanguageOption`).
- [ ] Add language entries to `supportedLanguages`.
- [ ] Create translation files with full key parity.
- [ ] Register translation resources in `i18n/index.ts`.
- [ ] Add tray copy entries in `TauriConnector.tsx`.
- [ ] Extend Rust startup tray locale mapping.
- [ ] Sync `<html lang>` with selected language.

---

## 4) Post-implementation verification

- [ ] Manual: select each new language in Settings and verify full UI text replacement.
- [ ] Manual: set `language = auto`; change system language; verify runtime change.
- [ ] Manual: launch app directly in OS locale matching new language and confirm tray labels on startup.
- [ ] Manual: after renderer boot, confirm tray labels still match selected language.
- [ ] Manual: verify placeholders/interpolations (`{{duration}}`, `{{minuteLabel}}`, etc.) in new locales.
- [ ] Manual: verify no missing-key fallback noise in console.
- [ ] Build checks:
  - [ ] `pnpm typecheck:renderer`
  - [ ] `pnpm build:renderer`
  - [ ] `cargo check --manifest-path src-tauri/Cargo.toml`

---

## 5) Fallback policy

Fallback is intentional and required for safety:

- If locale is missing/invalid/unsupported, app must still render valid labels.
- For renderer, fallback language prevents broken/missing UI strings.
- For native tray, fallback is mandatory at startup because renderer sync may not have happened yet.

Recommended policy:

- Keep fallback to English as default.
- Expand locale mapping whenever a new language is officially supported.
