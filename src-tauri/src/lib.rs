mod commands;
mod constants;

use commands::window_bridge::{
    close_window, compact_collapse, compact_expand, minimize_window, play_notification_sound,
    read_text_file, set_always_on_top, set_compact_mode, set_fullscreen_break, set_native_titlebar,
    set_tray_behavior, set_tray_copy, set_tray_icon, set_ui_theme, show_window, write_text_file,
    TrayBehaviorState,
};
#[cfg(target_os = "linux")]
use constants::WINDOW_RESTORED_EVENT;
use constants::{MAIN_TRAY_ID, MAIN_WINDOW_LABEL, TRAY_MENU_QUIT_ID, TRAY_MENU_RESTORE_ID};
#[cfg(target_os = "linux")]
use std::path::{Path, PathBuf};
#[cfg(target_os = "linux")]
use tauri::Emitter;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime, WindowEvent,
};

struct TrayCopy {
    restore_label: &'static str,
    quit_label: &'static str,
    tooltip: &'static str,
}

#[cfg(target_os = "linux")]
fn resolve_linux_tray_base_dir() -> PathBuf {
    std::env::var_os("XDG_RUNTIME_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join("pomodoroz-tray")
}

#[cfg(target_os = "linux")]
fn parse_linux_session_pid(dir_name: &str) -> Option<u32> {
    let suffix = dir_name.strip_prefix("session-")?;
    let pid_segment = suffix.split('-').next()?;
    pid_segment.parse::<u32>().ok()
}

#[cfg(target_os = "linux")]
fn is_linux_pid_alive(pid: u32) -> bool {
    Path::new(&format!("/proc/{pid}")).exists()
}

#[cfg(target_os = "linux")]
fn cleanup_orphan_linux_tray_sessions(base_dir: &Path) {
    let Ok(entries) = std::fs::read_dir(base_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }

        let file_name = entry.file_name();
        let Some(name) = file_name.to_str() else {
            continue;
        };
        let Some(pid) = parse_linux_session_pid(name) else {
            continue;
        };

        if !is_linux_pid_alive(pid) {
            let _ = std::fs::remove_dir_all(path);
        }
    }
}

#[cfg(target_os = "linux")]
fn resolve_linux_tray_temp_dir() -> PathBuf {
    let base_dir = resolve_linux_tray_base_dir();
    cleanup_orphan_linux_tray_sessions(&base_dir);
    let session_nonce = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default();

    // Diretório por processo/sessão evita colisão de path com runs
    // anteriores do `yarn tauri dev` no cache do status notifier.
    base_dir.join(format!("session-{}-{}", std::process::id(), session_nonce))
}

fn resolve_tray_copy() -> TrayCopy {
    let locale = ["LC_ALL", "LC_MESSAGES", "LANG"]
        .iter()
        .find_map(|key| std::env::var(key).ok())
        .unwrap_or_default()
        .to_lowercase();

    if locale.starts_with("pt") {
        TrayCopy {
            restore_label: "Restaurar Pomodoroz",
            quit_label: "Sair",
            tooltip: "Pomodoroz",
        }
    } else {
        TrayCopy {
            restore_label: "Restore Pomodoroz",
            quit_label: "Quit",
            tooltip: "Pomodoroz",
        }
    }
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();

        // Workaround Linux/webkit2gtk:
        // após `hide()` -> `show()`, o webview pode perder input grab.
        // O toggle de `resizable` foi o único método estável para forçar
        // renegociação da superfície e recuperar cliques no frame custom.
        //
        // Efeito colateral: pode surgir `:hover` "preso" no renderer.
        // Para compensar, emitimos um evento interno e o frontend
        // suprime hover temporariamente até o próximo mousemove real.
        #[cfg(target_os = "linux")]
        {
            let was_resizable = window.is_resizable().unwrap_or(true);
            let _ = window.set_resizable(!was_resizable);
            let _ = window.set_resizable(was_resizable);
            let _ = window.set_focus();
            let _ = window.emit(WINDOW_RESTORED_EVENT, ());
        }
    }
}

fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let tray_copy = resolve_tray_copy();
    let restore_item =
        MenuItemBuilder::with_id(TRAY_MENU_RESTORE_ID, tray_copy.restore_label).build(app)?;
    let quit_item = MenuItemBuilder::with_id(TRAY_MENU_QUIT_ID, tray_copy.quit_label).build(app)?;
    let tray_menu = MenuBuilder::new(app)
        .items(&[&restore_item, &quit_item])
        .build()?;

    let mut tray_builder = TrayIconBuilder::with_id(MAIN_TRAY_ID)
        .menu(&tray_menu)
        .tooltip(tray_copy.tooltip)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            if event.id() == TRAY_MENU_RESTORE_ID {
                show_main_window(app);
                return;
            }
            if event.id() == TRAY_MENU_QUIT_ID {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        });

    #[cfg(target_os = "linux")]
    {
        tray_builder = tray_builder.temp_dir_path(resolve_linux_tray_temp_dir());
    }

    if let Some(icon) = app.default_window_icon().cloned() {
        tray_builder = tray_builder.icon(icon);
    }

    let _tray = tray_builder.build(app)?;
    Ok(())
}

fn setup_global_shortcuts<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutState};

    let builder = match tauri_plugin_global_shortcut::Builder::new()
        .with_shortcuts(["alt+shift+h", "alt+shift+s"])
    {
        Ok(builder) => builder,
        Err(error) => {
            log::warn!("[TAURI] Failed to prepare global shortcuts: {error}");
            return Ok(());
        }
    };

    app.plugin(
        builder
            .with_handler(|app, shortcut, event| {
                if event.state != ShortcutState::Pressed {
                    return;
                }

                let shortcut_modifiers = Modifiers::ALT | Modifiers::SHIFT;

                if shortcut.matches(shortcut_modifiers, Code::KeyH) {
                    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
                        if app.tray_by_id(MAIN_TRAY_ID).is_some() {
                            let _ = window.hide();
                        } else {
                            let _ = window.minimize();
                        }
                    }
                    return;
                }

                if shortcut.matches(shortcut_modifiers, Code::KeyS) {
                    show_main_window(app);
                }
            })
            .build(),
    )?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TrayBehaviorState::default())
        .invoke_handler(tauri::generate_handler![
            set_always_on_top,
            set_fullscreen_break,
            set_compact_mode,
            compact_expand,
            compact_collapse,
            set_ui_theme,
            set_native_titlebar,
            show_window,
            minimize_window,
            close_window,
            write_text_file,
            read_text_file,
            play_notification_sound,
            set_tray_behavior,
            set_tray_copy,
            set_tray_icon
        ])
        .on_window_event(|window, event| {
            if window.label() != MAIN_WINDOW_LABEL {
                return;
            }

            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.app_handle().tray_by_id(MAIN_TRAY_ID).is_none() {
                    return;
                }

                let tray_behavior = window.state::<TrayBehaviorState>();
                if tray_behavior.close_to_tray() {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .setup(|app| {
            let app_handle = app.handle();
            if let Err(error) = setup_tray(app_handle) {
                log::warn!("[TAURI] Failed to initialize tray icon: {error}");
            }
            if let Err(error) = setup_global_shortcuts(app_handle) {
                log::warn!("[TAURI] Failed to initialize global shortcuts: {error}");
            }

            app_handle.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
                show_main_window(app);
            }))?;

            app_handle.plugin(tauri_plugin_autostart::Builder::new().build())?;

            if cfg!(debug_assertions) {
                app_handle.plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            app_handle.plugin(tauri_plugin_notification::init())?;
            app_handle.plugin(tauri_plugin_opener::init())?;
            app_handle.plugin(tauri_plugin_dialog::init())?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
