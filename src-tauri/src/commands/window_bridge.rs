use tauri::{Emitter, LogicalSize, Theme, Window};

const WINDOW_WIDTH: f64 = 340.0;
const WINDOW_DEFAULT_HEIGHT: f64 = 470.0;
const WINDOW_COMPACT_HEIGHT: f64 = 140.0;
const WINDOW_COMPACT_GRID_HEIGHT: f64 = 460.0;

const EVENT_FULLSCREEN_BREAK_ENTERED: &str =
  "FULLSCREEN_BREAK_ENTERED";
const EVENT_FULLSCREEN_BREAK_EXITED: &str = "FULLSCREEN_BREAK_EXITED";

fn map_error(error: impl std::fmt::Display) -> String {
  error.to_string()
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_always_on_top(
  window: Window,
  always_on_top: bool,
) -> Result<(), String> {
  window
    .set_always_on_top(always_on_top)
    .map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_fullscreen_break(
  window: Window,
  should_fullscreen: bool,
  always_on_top: bool,
) -> Result<(), String> {
  window
    .set_always_on_top(always_on_top)
    .map_err(map_error)?;
  window
    .set_fullscreen(should_fullscreen)
    .map_err(map_error)?;
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
pub fn set_compact_mode(
  window: Window,
  compact_mode: bool,
) -> Result<(), String> {
  let height = if compact_mode {
    WINDOW_COMPACT_HEIGHT
  } else {
    WINDOW_DEFAULT_HEIGHT
  };

  window
    .set_size(LogicalSize::new(WINDOW_WIDTH, height))
    .map_err(map_error)
}

#[tauri::command]
pub fn compact_expand(window: Window) -> Result<(), String> {
  window
    .set_size(LogicalSize::new(
      WINDOW_WIDTH,
      WINDOW_COMPACT_GRID_HEIGHT,
    ))
    .map_err(map_error)
}

#[tauri::command]
pub fn compact_collapse(window: Window) -> Result<(), String> {
  window
    .set_size(LogicalSize::new(
      WINDOW_WIDTH,
      WINDOW_COMPACT_HEIGHT,
    ))
    .map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn set_ui_theme(
  window: Window,
  is_dark_mode: bool,
) -> Result<(), String> {
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
) -> Result<(), String> {
  window
    .set_decorations(use_native_titlebar)
    .map_err(map_error)
}

#[tauri::command]
pub fn show_window(window: Window) -> Result<(), String> {
  window.show().map_err(map_error)?;
  window.set_focus().map_err(map_error)
}

#[tauri::command(rename_all = "camelCase")]
pub fn minimize_window(
  window: Window,
  minimize_to_tray: bool,
) -> Result<(), String> {
  if minimize_to_tray {
    window.hide().map_err(map_error)
  } else {
    window.minimize().map_err(map_error)
  }
}

#[tauri::command(rename_all = "camelCase")]
pub fn close_window(
  window: Window,
  close_to_tray: bool,
) -> Result<(), String> {
  if close_to_tray {
    window.hide().map_err(map_error)
  } else {
    window.close().map_err(map_error)
  }
}
