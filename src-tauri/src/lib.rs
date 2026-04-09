mod commands;

use commands::window_bridge::{
  close_window, compact_collapse, compact_expand, minimize_window,
  set_always_on_top, set_compact_mode, set_fullscreen_break,
  set_native_titlebar, set_ui_theme, show_window,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
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
      close_window
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
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
