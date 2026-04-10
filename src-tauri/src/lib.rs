mod commands;
mod constants;

use commands::window_bridge::{
  close_window, compact_collapse, compact_expand, minimize_window,
  set_always_on_top, set_compact_mode, set_fullscreen_break,
  set_native_titlebar, set_tray_behavior, set_tray_copy,
  set_tray_icon, set_ui_theme, show_window, TrayBehaviorState,
};
use constants::{
  MAIN_TRAY_ID, MAIN_WINDOW_LABEL, TRAY_MENU_QUIT_ID,
  TRAY_MENU_RESTORE_ID, WINDOW_RESTORED_EVENT,
};
use tauri::{
  menu::{MenuBuilder, MenuItemBuilder},
  tray::{
    MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent,
  },
  AppHandle, Emitter, Manager, Runtime, WindowEvent,
};

struct TrayCopy {
  restore_label: &'static str,
  quit_label: &'static str,
  tooltip: &'static str,
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
  let restore_item = MenuItemBuilder::with_id(
    TRAY_MENU_RESTORE_ID,
    tray_copy.restore_label,
  )
  .build(app)?;
  let quit_item = MenuItemBuilder::with_id(
    TRAY_MENU_QUIT_ID,
    tray_copy.quit_label,
  )
  .build(app)?;
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

  if let Some(icon) = app.default_window_icon().cloned() {
    tray_builder = tray_builder.icon(icon);
  }

  let _tray = tray_builder.build(app)?;
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
      if let Err(error) = setup_tray(&app_handle) {
        log::warn!("[TAURI] Failed to initialize tray icon: {error}");
      }

      if cfg!(debug_assertions) {
        app_handle.plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
