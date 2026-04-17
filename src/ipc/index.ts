export const SET_ALWAYS_ON_TOP = "SET_ALWAYS_ON_TOP";
export const SET_FULLSCREEN_BREAK = "SET_FULLSCREEN_BREAK";
export const SET_TRAY_BEHAVIOR = "SET_TRAY_BEHAVIOR";
export const SET_TRAY_COPY = "SET_TRAY_COPY";
export const SET_COMPACT_MODE = "SET_COMPACT_MODE";
export const COMPACT_EXPAND = "COMPACT_EXPAND";
export const COMPACT_COLLAPSE = "COMPACT_COLLAPSE";
export const SET_NATIVE_TITLEBAR = "SET_NATIVE_TITLEBAR";
export const SET_OPEN_AT_LOGIN = "SET_OPEN_AT_LOGIN";
export const TRAY_ICON_UPDATE = "TRAY_ICON_UPDATE";
export const SET_UI_THEME = "SET_UI_THEME";
export const MINIMIZE_WINDOW = "MINIMIZE_WINDOW";
export const CLOSE_WINDOW = "CLOSE_WINDOW";
export const SHOW_WINDOW = "SHOW_WINDOW";
export const UPDATE_AVAILABLE = "UPDATE_AVAILABLE";
export const SET_IN_APP_AUTO_UPDATE = "SET_IN_APP_AUTO_UPDATE";
export const OPEN_RELEASE_PAGE = "OPEN_RELEASE_PAGE";
export const INSTALL_UPDATE = "INSTALL_UPDATE";
export const FULLSCREEN_BREAK_ENTERED = "FULLSCREEN_BREAK_ENTERED";
export const FULLSCREEN_BREAK_EXITED = "FULLSCREEN_BREAK_EXITED";
export const EXPORT_TASKS_DIALOG = "EXPORT_TASKS_DIALOG";
export const IMPORT_TASKS_DIALOG = "IMPORT_TASKS_DIALOG";
export const TASKS_EXPORT_RESULT = "TASKS_EXPORT_RESULT";
export const TASKS_IMPORT_RESULT = "TASKS_IMPORT_RESULT";
export const CONFIRM_RESET_FOCUS_TO_IDLE =
  "CONFIRM_RESET_FOCUS_TO_IDLE";
export const WINDOW_RESTORED_EVENT = "pomodoroz://window-restored";

export const TO_MAIN = [
  SET_ALWAYS_ON_TOP,
  SET_FULLSCREEN_BREAK,
  SET_TRAY_BEHAVIOR,
  SET_TRAY_COPY,
  SET_COMPACT_MODE,
  COMPACT_EXPAND,
  COMPACT_COLLAPSE,
  SET_NATIVE_TITLEBAR,
  SET_OPEN_AT_LOGIN,
  TRAY_ICON_UPDATE,
  SET_UI_THEME,
  MINIMIZE_WINDOW,
  CLOSE_WINDOW,
  SHOW_WINDOW,
  SET_IN_APP_AUTO_UPDATE,
  OPEN_RELEASE_PAGE,
  INSTALL_UPDATE,
  EXPORT_TASKS_DIALOG,
  IMPORT_TASKS_DIALOG,
] as const;

export const FROM_MAIN = [
  UPDATE_AVAILABLE,
  FULLSCREEN_BREAK_ENTERED,
  FULLSCREEN_BREAK_EXITED,
  TASKS_EXPORT_RESULT,
  TASKS_IMPORT_RESULT,
] as const;

export const INVOKE_MAIN = [CONFIRM_RESET_FOCUS_TO_IDLE] as const;

export type ToMainChannel = (typeof TO_MAIN)[number];
export type FromMainChannel = (typeof FROM_MAIN)[number];
export type InvokeMainChannel = (typeof INVOKE_MAIN)[number];

export type SetAlwaysOnTopPayload = {
  alwaysOnTop: boolean;
};

export type SetFullscreenBreakPayload = {
  shouldFullscreen: boolean;
  alwaysOnTop: boolean;
};

export type SetTrayBehaviorPayload = {
  minimizeToTray: boolean;
  closeToTray: boolean;
};

export type SetTrayCopyPayload = {
  restoreLabel: string;
  quitLabel: string;
  tooltip: string;
};

export type SetCompactModePayload = {
  compactMode: boolean;
};

export type SetNativeTitlebarPayload = {
  useNativeTitlebar: boolean;
};

export type SetOpenAtLoginPayload = {
  openAtLogin: boolean;
};

export type SetUiThemePayload = {
  isDarkMode: boolean;
};

export type SetInAppAutoUpdatePayload = {
  enableInAppAutoUpdate: boolean;
};

export type MinimizeWindowPayload = {
  minimizeToTray: boolean;
};

export type CloseWindowPayload = {
  closeToTray: boolean;
};

export type ExportTasksDialogPayload = {
  suggestedFileName: string;
  content: string;
};

export type UpdateAvailablePayload = {
  version: string;
  updateBody: string;
};

export type TasksExportResultPayload = {
  ok: boolean;
  canceled: boolean;
  filePath?: string;
  error?: string;
};

export type TasksImportResultPayload = {
  ok: boolean;
  canceled: boolean;
  filePath?: string;
  content?: string;
  error?: string;
};

export type ResetFocusToIdleDialogResult = "yes" | "no" | "cancel";

export type ToMainPayloadMap = {
  [K in ToMainChannel]: K extends typeof SET_ALWAYS_ON_TOP
    ? [SetAlwaysOnTopPayload]
    : K extends typeof SET_FULLSCREEN_BREAK
      ? [SetFullscreenBreakPayload]
      : K extends typeof SET_TRAY_BEHAVIOR
        ? [SetTrayBehaviorPayload]
        : K extends typeof SET_TRAY_COPY
          ? [SetTrayCopyPayload]
          : K extends typeof SET_COMPACT_MODE
            ? [SetCompactModePayload]
            : K extends typeof COMPACT_EXPAND
              ? []
              : K extends typeof COMPACT_COLLAPSE
                ? []
                : K extends typeof SET_NATIVE_TITLEBAR
                  ? [SetNativeTitlebarPayload]
                  : K extends typeof SET_OPEN_AT_LOGIN
                    ? [SetOpenAtLoginPayload]
                    : K extends typeof TRAY_ICON_UPDATE
                      ? [string]
                      : K extends typeof SET_UI_THEME
                        ? [SetUiThemePayload]
                        : K extends typeof SET_IN_APP_AUTO_UPDATE
                          ? [SetInAppAutoUpdatePayload]
                          : K extends typeof MINIMIZE_WINDOW
                            ? [MinimizeWindowPayload]
                            : K extends typeof CLOSE_WINDOW
                              ? [CloseWindowPayload]
                              : K extends typeof SHOW_WINDOW
                                ? []
                                : K extends typeof OPEN_RELEASE_PAGE
                                  ? []
                                  : K extends typeof INSTALL_UPDATE
                                    ? []
                                    : K extends typeof EXPORT_TASKS_DIALOG
                                      ? [ExportTasksDialogPayload]
                                      : K extends typeof IMPORT_TASKS_DIALOG
                                        ? []
                                        : never;
};

export type FromMainPayloadMap = {
  [K in FromMainChannel]: K extends typeof UPDATE_AVAILABLE
    ? [UpdateAvailablePayload]
    : K extends typeof FULLSCREEN_BREAK_ENTERED
      ? []
      : K extends typeof FULLSCREEN_BREAK_EXITED
        ? []
        : K extends typeof TASKS_EXPORT_RESULT
          ? [TasksExportResultPayload]
          : K extends typeof TASKS_IMPORT_RESULT
            ? [TasksImportResultPayload]
            : never;
};

export type InvokeMainPayloadMap = {
  [K in InvokeMainChannel]: K extends typeof CONFIRM_RESET_FOCUS_TO_IDLE
    ? []
    : never;
};

export type InvokeMainResponseMap = {
  [K in InvokeMainChannel]: K extends typeof CONFIRM_RESET_FOCUS_TO_IDLE
    ? ResetFocusToIdleDialogResult
    : never;
};

export const RELEASE_NOTES_LINK =
  "https://github.com/cjdduarte/pomodoroz/releases/latest";
