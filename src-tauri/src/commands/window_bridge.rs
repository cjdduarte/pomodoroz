#[cfg(target_os = "linux")]
use crate::constants::WINDOW_RESTORED_EVENT;
use crate::constants::{MAIN_TRAY_ID, TRAY_MENU_QUIT_ID, TRAY_MENU_RESTORE_ID};
use rodio::{play, DeviceSinkBuilder};
use std::{
    fs,
    io::Cursor,
    path::{Path, PathBuf},
    sync::Mutex,
    time::Duration,
};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    utils::{config::BundleType, platform::bundle_type},
    AppHandle, Emitter, LogicalSize, Manager, Runtime, State, Theme, Window,
};

const WINDOW_WIDTH: f64 = 340.0;
const WINDOW_FRAME_HEIGHT_WINDOWS: f64 = 470.0;
const WINDOW_FRAME_HEIGHT_NATIVE_TITLEBAR: f64 = 456.0;
const WINDOW_FRAME_HEIGHT_FRAMELESS: f64 = 490.0;
const WINDOW_COMPACT_BASE_HEIGHT: f64 = 100.0;
const WINDOW_COMPACT_TITLEBAR_COMPENSATION: f64 = 40.0;
const WINDOW_COMPACT_GRID_HEIGHT: f64 = 320.0;
const WINDOW_COMPACT_ACTIONS_HEIGHT: f64 = 160.0;
const WINDOW_COMPACT_FOCUS_EXTENSION_HEIGHT: f64 = 76.0;
const MAX_IMPORT_FILE_BYTES: u64 = 5 * 1024 * 1024;

const EVENT_FULLSCREEN_BREAK_ENTERED: &str = "FULLSCREEN_BREAK_ENTERED";
const EVENT_FULLSCREEN_BREAK_EXITED: &str = "FULLSCREEN_BREAK_EXITED";

#[derive(Clone, Copy)]
pub struct TrayBehaviorSettings {
    pub close_to_tray: bool,
}

pub struct TrayBehaviorState {
    settings: Mutex<TrayBehaviorSettings>,
}

impl Default for TrayBehaviorState {
    fn default() -> Self {
        Self {
            settings: Mutex::new(TrayBehaviorSettings {
                close_to_tray: true,
            }),
        }
    }
}

impl TrayBehaviorState {
    pub fn set(&self, next_settings: TrayBehaviorSettings) -> Result<(), String> {
        let mut settings = self.settings.lock().map_err(map_error)?;
        *settings = next_settings;
        Ok(())
    }

    pub fn close_to_tray(&self) -> bool {
        self.settings
            .lock()
            .map(|settings| settings.close_to_tray)
            .unwrap_or(false)
    }
}

fn map_error(error: impl std::fmt::Display) -> String {
    error.to_string()
}

fn validate_json_extension(path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());
    if extension.as_deref() != Some("json") {
        return Err("Only .json files are allowed.".to_string());
    }

    Ok(())
}

fn is_native_titlebar(window: &Window) -> Result<bool, String> {
    window.is_decorated().map_err(map_error)
}

fn get_frame_height(window: &Window) -> Result<f64, String> {
    if cfg!(target_os = "windows") {
        return Ok(WINDOW_FRAME_HEIGHT_WINDOWS);
    }

    if is_native_titlebar(window)? {
        Ok(WINDOW_FRAME_HEIGHT_NATIVE_TITLEBAR)
    } else {
        Ok(WINDOW_FRAME_HEIGHT_FRAMELESS)
    }
}

fn get_compact_height(window: &Window) -> Result<f64, String> {
    if is_native_titlebar(window)? {
        Ok(WINDOW_COMPACT_BASE_HEIGHT)
    } else {
        Ok(WINDOW_COMPACT_BASE_HEIGHT + WINDOW_COMPACT_TITLEBAR_COMPENSATION)
    }
}

fn set_window_min_size(window: &Window, compact_mode: bool) -> Result<(), String> {
    let height = if compact_mode {
        get_compact_height(window)?
    } else {
        get_frame_height(window)?
    };

    window
        .set_min_size(Some(LogicalSize::new(WINDOW_WIDTH, height)))
        .map_err(map_error)
}

fn has_tray(window: &Window) -> bool {
    window.app_handle().tray_by_id(MAIN_TRAY_ID).is_some()
}

#[cfg(target_os = "linux")]
fn prepare_window_for_focus_restore(window: &Window) {
    let is_visible = window.is_visible().unwrap_or(false);
    let is_focused = window.is_focused().unwrap_or(false);

    if is_visible && !is_focused {
        let _ = window.hide();
    }
}

#[cfg(not(target_os = "linux"))]
fn prepare_window_for_focus_restore(_window: &Window) {}

#[cfg(target_os = "linux")]
fn refresh_linux_window_surface(window: &Window) {
    let was_resizable = window.is_resizable().unwrap_or(true);
    let _ = window.set_resizable(!was_resizable);
    let _ = window.set_resizable(was_resizable);
    let _ = window.set_focus();
    let _ = window.emit(WINDOW_RESTORED_EVENT, ());
}

#[cfg(not(target_os = "linux"))]
fn refresh_linux_window_surface(_window: &Window) {}

fn restore_window_to_foreground(window: &Window) -> Result<(), String> {
    prepare_window_for_focus_restore(window);
    window.unminimize().map_err(map_error)?;
    window.show().map_err(map_error)?;
    window.set_focus().map_err(map_error)?;

    // Workaround Linux/webkit2gtk:
    // restaurar de minimizado/oculto pode deixar a superficie sem foco real.
    // O mesmo refresh usado no tray força renegociação antes do fullscreen.
    refresh_linux_window_surface(window);

    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window.set_always_on_top(always_on_top).map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_fullscreen_break(
    window: Window,
    should_fullscreen: bool,
    always_on_top: bool,
) -> Result<(), String> {
    let effective_always_on_top = should_fullscreen || always_on_top;
    window
        .set_always_on_top(effective_always_on_top)
        .map_err(map_error)?;

    if should_fullscreen {
        restore_window_to_foreground(&window)?;
    }

    window
        .set_fullscreen(should_fullscreen)
        .map_err(map_error)?;

    if should_fullscreen {
        let _ = window.set_focus();
    }

    window
        .emit(
            if should_fullscreen {
                EVENT_FULLSCREEN_BREAK_ENTERED
            } else {
                EVENT_FULLSCREEN_BREAK_EXITED
            },
            (),
        )
        .map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_compact_mode(window: Window, compact_mode: bool) -> Result<(), String> {
    let height = if compact_mode {
        get_compact_height(&window)?
    } else {
        get_frame_height(&window)?
    };

    set_window_min_size(&window, compact_mode)?;

    window
        .set_size(LogicalSize::new(WINDOW_WIDTH, height))
        .map_err(map_error)
}

#[tauri::command]
pub fn compact_expand(window: Window) -> Result<(), String> {
    let compact_height = get_compact_height(&window)?;
    window
        .set_size(LogicalSize::new(
            WINDOW_WIDTH,
            compact_height + WINDOW_COMPACT_GRID_HEIGHT,
        ))
        .map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn compact_expand_to_height(window: Window, height: f64) -> Result<(), String> {
    let compact_height = get_compact_height(&window)?;
    let min_height = compact_height + WINDOW_COMPACT_GRID_HEIGHT;
    let height = if height.is_finite() {
        height.max(min_height)
    } else {
        min_height
    };

    window
        .set_size(LogicalSize::new(WINDOW_WIDTH, height))
        .map_err(map_error)
}

#[tauri::command]
pub fn compact_expand_actions(window: Window) -> Result<(), String> {
    let compact_height = get_compact_height(&window)?;
    window
        .set_size(LogicalSize::new(
            WINDOW_WIDTH,
            compact_height + WINDOW_COMPACT_ACTIONS_HEIGHT,
        ))
        .map_err(map_error)
}

#[tauri::command]
pub fn compact_expand_focus_extension(window: Window) -> Result<(), String> {
    let compact_height = get_compact_height(&window)?;
    window
        .set_size(LogicalSize::new(
            WINDOW_WIDTH,
            compact_height + WINDOW_COMPACT_FOCUS_EXTENSION_HEIGHT,
        ))
        .map_err(map_error)
}

#[tauri::command]
pub fn compact_collapse(window: Window) -> Result<(), String> {
    let compact_height = get_compact_height(&window)?;
    window
        .set_size(LogicalSize::new(WINDOW_WIDTH, compact_height))
        .map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_ui_theme(window: Window, is_dark_mode: bool) -> Result<(), String> {
    let theme = if is_dark_mode {
        Some(Theme::Dark)
    } else {
        Some(Theme::Light)
    };

    window.set_theme(theme).map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_native_titlebar(
    window: Window,
    use_native_titlebar: bool,
    compact_mode: bool,
) -> Result<(), String> {
    window
        .set_decorations(use_native_titlebar)
        .map_err(map_error)?;

    // Workaround Linux/webkit2gtk:
    // alternar `set_decorations` pode deixar a superfície sem input grab
    // em alguns ciclos on/off/on do título nativo. O toggle de resizable
    // força renegociação da superfície e recupera clique nos controles.
    #[cfg(target_os = "linux")]
    {
        let was_resizable = window.is_resizable().map_err(map_error)?;
        window.set_resizable(!was_resizable).map_err(map_error)?;
        window.set_resizable(was_resizable).map_err(map_error)?;
        window.set_focus().map_err(map_error)?;
    }

    set_window_min_size(&window, compact_mode)?;

    Ok(())
}

#[tauri::command]
pub fn show_window(window: Window) -> Result<(), String> {
    restore_window_to_foreground(&window)
}

#[tauri::command]
pub fn start_window_drag(window: Window) -> Result<(), String> {
    window.start_dragging().map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn minimize_window(window: Window, minimize_to_tray: bool) -> Result<(), String> {
    if minimize_to_tray && has_tray(&window) {
        window.hide().map_err(map_error)
    } else {
        window.minimize().map_err(map_error)
    }
}

#[tauri::command]
pub fn close_window(window: Window) -> Result<(), String> {
    // Sempre delega para o fluxo nativo de close. O handler
    // `on_window_event` (lib.rs) intercepta `CloseRequested` e decide
    // entre `hide()` (bandeja) ou fechamento real com base no
    // `TrayBehaviorState`.
    // Um único caminho evita corridas de double-hide e reduz bugs de
    // input grab do webkit2gtk no Linux após restore.
    window.close().map_err(map_error)
}

#[tauri::command]
pub fn restart_app<R: Runtime>(app: AppHandle<R>) {
    app.restart();
}

#[tauri::command]
pub fn is_updater_channel_supported() -> bool {
    matches!(
        bundle_type(),
        Some(
            BundleType::AppImage
                | BundleType::Deb
                | BundleType::Rpm
                | BundleType::Msi
                | BundleType::Nsis
                | BundleType::App
        )
    )
}

#[tauri::command(rename_all = "camelCase")]
pub fn write_text_file(file_path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(file_path);

    validate_json_extension(&path)?;

    if content.len() as u64 > MAX_IMPORT_FILE_BYTES {
        return Err("Provided content is too large.".to_string());
    }

    if let Ok(metadata) = fs::metadata(&path) {
        if !metadata.is_file() {
            return Err("Selected path is not a file.".to_string());
        }
    }

    fs::write(path, content).map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn read_text_file(file_path: String) -> Result<String, String> {
    let path = PathBuf::from(file_path);

    validate_json_extension(&path)?;

    let metadata = fs::metadata(&path).map_err(map_error)?;
    if !metadata.is_file() {
        return Err("Selected path is not a file.".to_string());
    }

    if metadata.len() > MAX_IMPORT_FILE_BYTES {
        return Err("Selected file is too large.".to_string());
    }

    fs::read_to_string(path).map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn play_notification_sound(wav_bytes: Vec<u8>, delay_ms: Option<u64>) -> Result<(), String> {
    if wav_bytes.is_empty() {
        return Err("Notification sound payload is empty.".to_string());
    }

    std::thread::spawn(move || {
        let playback_result = (|| -> Result<(), String> {
            if let Some(delay_ms) = delay_ms.filter(|delay| *delay > 0) {
                std::thread::sleep(Duration::from_millis(delay_ms));
            }

            let mut sink = DeviceSinkBuilder::open_default_sink().map_err(map_error)?;
            sink.log_on_drop(false);

            let player = play(sink.mixer(), Cursor::new(wav_bytes)).map_err(map_error)?;
            player.sleep_until_end();
            Ok(())
        })();

        if let Err(error) = playback_result {
            log::warn!("[TAURI Audio] Falha ao reproduzir som: {error}");
        }
    });

    Ok(())
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_tray_icon(window: Window, png_bytes: Vec<u8>) -> Result<(), String> {
    let tray = window
        .app_handle()
        .tray_by_id(MAIN_TRAY_ID)
        .ok_or_else(|| "Tray icon is not available.".to_string())?;
    let tray_icon = Image::from_bytes(&png_bytes).map_err(map_error)?;

    tray.set_icon(Some(tray_icon)).map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_tray_behavior(
    state: State<'_, TrayBehaviorState>,
    // Mantido por compatibilidade com o payload compartilhado entre
    // runtimes; no Tauri o `minimizeToTray` continua decisão por chamada
    // em `minimize_window`.
    _minimize_to_tray: bool,
    close_to_tray: bool,
) -> Result<(), String> {
    state.set(TrayBehaviorSettings { close_to_tray })
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_tray_copy(
    window: Window,
    restore_label: String,
    quit_label: String,
    tooltip: String,
) -> Result<(), String> {
    let app_handle = window.app_handle();
    let tray = app_handle
        .tray_by_id(MAIN_TRAY_ID)
        .ok_or_else(|| "Tray icon is not available.".to_string())?;

    let restore_item = MenuItemBuilder::with_id(TRAY_MENU_RESTORE_ID, restore_label)
        .build(app_handle)
        .map_err(map_error)?;
    let quit_item = MenuItemBuilder::with_id(TRAY_MENU_QUIT_ID, quit_label)
        .build(app_handle)
        .map_err(map_error)?;
    let tray_menu = MenuBuilder::new(app_handle)
        .items(&[&restore_item, &quit_item])
        .build()
        .map_err(map_error)?;

    tray.set_menu(Some(tray_menu)).map_err(map_error)?;
    tray.set_tooltip(Some(tooltip)).map_err(map_error)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Barreira de seguranca do import/export: write_text_file/read_text_file
    // so podem tocar arquivos .json. Estes testes travam esse contrato.
    #[test]
    fn validate_json_extension_accepts_json() {
        assert!(validate_json_extension(Path::new("backup.json")).is_ok());
    }

    #[test]
    fn validate_json_extension_is_case_insensitive() {
        assert!(validate_json_extension(Path::new("BACKUP.JSON")).is_ok());
        assert!(validate_json_extension(Path::new("backup.Json")).is_ok());
    }

    #[test]
    fn validate_json_extension_rejects_other_extensions() {
        assert!(validate_json_extension(Path::new("backup.txt")).is_err());
        assert!(validate_json_extension(Path::new("backup.json.exe")).is_err());
        assert!(validate_json_extension(Path::new("backup")).is_err());
        assert!(validate_json_extension(Path::new(".json")).is_err());
    }

    // Limite de tamanho de import: mantem o guard explicito em 5 MiB.
    // Se alguem mexer na constante sem querer, este teste acende.
    #[test]
    fn import_size_limit_is_5_mib() {
        assert_eq!(MAX_IMPORT_FILE_BYTES, 5 * 1024 * 1024);
    }

    // Modo compacto: sem titlebar nativo a altura-base soma a compensacao.
    // A logica vive em get_compact_height (que exige Window), entao
    // validamos a relacao numerica que ela usa. Os valores entram via array
    // (avaliados em runtime) para nao virar uma asbercao sobre constante.
    #[test]
    fn compact_height_compensates_without_native_titlebar() {
        let [base, compensation] = [
            WINDOW_COMPACT_BASE_HEIGHT,
            WINDOW_COMPACT_TITLEBAR_COMPENSATION,
        ];
        assert!(compensation > 0.0, "compensation must be positive");
        assert_eq!(base + compensation, 140.0);
    }

    #[test]
    fn window_dimension_constants_are_positive() {
        // Passar pelo array forca avaliacao em runtime; sem isso o clippy
        // trata cada assert como asbercao sobre constante (-D warnings).
        let dimensions = [
            WINDOW_WIDTH,
            WINDOW_FRAME_HEIGHT_WINDOWS,
            WINDOW_FRAME_HEIGHT_NATIVE_TITLEBAR,
            WINDOW_FRAME_HEIGHT_FRAMELESS,
            WINDOW_COMPACT_BASE_HEIGHT,
            WINDOW_COMPACT_GRID_HEIGHT,
            WINDOW_COMPACT_ACTIONS_HEIGHT,
            WINDOW_COMPACT_FOCUS_EXTENSION_HEIGHT,
        ];
        for value in dimensions {
            assert!(value > 0.0, "window dimension constant must be positive");
        }
    }
}
