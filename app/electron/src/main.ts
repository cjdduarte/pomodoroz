import {
  BrowserWindow,
  Notification,
  app,
  ipcMain,
  type IpcMainEvent,
  type OpenDialogOptions,
  type SaveDialogOptions,
  globalShortcut,
  Menu,
  Tray,
  shell,
  nativeImage,
  dialog,
  screen,
} from "electron";
import debounce from "lodash.debounce";
import path from "path";
import { promises as fs } from "fs";
import {
  SET_ALWAYS_ON_TOP,
  SET_FULLSCREEN_BREAK,
  SET_TRAY_BEHAVIOR,
  COMPACT_COLLAPSE,
  COMPACT_EXPAND,
  MINIMIZE_WINDOW,
  CLOSE_WINDOW,
  SET_UI_THEME,
  SET_NATIVE_TITLEBAR,
  SHOW_WINDOW,
  RELEASE_NOTES_LINK,
  TRAY_ICON_UPDATE,
  SET_COMPACT_MODE,
  SET_OPEN_AT_LOGIN,
  UPDATE_AVAILABLE,
  INSTALL_UPDATE,
  FULLSCREEN_BREAK_ENTERED,
  FULLSCREEN_BREAK_EXITED,
  EXPORT_TASKS_DIALOG,
  IMPORT_TASKS_DIALOG,
  TASKS_EXPORT_RESULT,
  TASKS_IMPORT_RESULT,
  CONFIRM_RESET_FOCUS_TO_IDLE,
  type ToMainPayloadMap,
  type FromMainPayloadMap,
  type UpdateAvailablePayload,
  type ResetFocusToIdleDialogResult,
} from "@pomodoroz/shareables";
import type { AppUpdater, UpdateInfo } from "electron-updater";
import {
  activateGlobalShortcuts,
  activateAutoUpdate,
  blockShortcutKeys,
  getIcon,
  isWindow,
  isMacOS,
  getFromStorage,
  createContextMenu,
  isUserHaveSession,
} from "./helpers";
import isDev from "electron-is-dev";
import store from "./store";

import {
  FullscreenState,
  setFullscreenBreakHandler,
} from "./lifecycleEventHandlers/fullScreenBreak";

const onProduction = app.isPackaged;
const isLinux = process.platform === "linux";

const notificationIcon = path.join(
  __dirname,
  "assets/notification-dark.png"
);

const trayIcon = path.join(__dirname, "assets/tray-dark.png");

const onlySingleInstance = app.requestSingleInstanceLock();

const applicationMenu = isMacOS()
  ? Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }])
  : null;
Menu.setApplicationMenu(applicationMenu);

const getFrameHeight = () => {
  if (isWindow()) {
    return 470;
  } else {
    if (store.safeGet("useNativeTitlebar")) {
      return 456;
    }
    // Frameless on Linux: the custom titlebar (40px) + body border (2px)
    // consume viewport space that the native titlebar would not, so the
    // window needs to be taller to keep the same usable content area.
    return 490;
  }
};

const getCompactHeight = () => {
  const baseCompactHeight = 100;
  const framelessTitlebarCompensation = 40;

  return store.safeGet("useNativeTitlebar")
    ? baseCompactHeight
    : baseCompactHeight + framelessTitlebarCompensation;
};

const COMPACT_GRID_HEIGHT = 320;

let tray: Tray | null = null;

let win: BrowserWindow | null;
let appUpdater: AppUpdater | null = null;

let pendingUpdate: UpdateAvailablePayload | null = null;

type WindowStateProps = {
  isOnCompactMode: boolean;
  isPseudoFullscreen: boolean;
} & FullscreenState;

type TrayBehaviorSettings = {
  minimizeToTray: boolean;
  closeToTray: boolean;
};

type SettingsRecord = Record<string, unknown>;
type SupportedLanguageOption =
  | "auto"
  | "en"
  | "es"
  | "zh"
  | "ja"
  | "pt";

const DEFAULT_TRAY_BEHAVIOR: TrayBehaviorSettings = {
  minimizeToTray: false,
  closeToTray: true,
};

const getSettingsFromStateData = (data: unknown): SettingsRecord => {
  if (
    typeof data === "object" &&
    data !== null &&
    "settings" in data &&
    typeof (data as Record<string, unknown>).settings === "object" &&
    (data as Record<string, unknown>).settings !== null
  ) {
    return (data as Record<string, unknown>).settings as SettingsRecord;
  }

  return {};
};

function getTrayBehaviorSettings(data: unknown): TrayBehaviorSettings {
  const settings = getSettingsFromStateData(data);

  return {
    minimizeToTray:
      typeof settings.minimizeToTray === "boolean"
        ? settings.minimizeToTray
        : DEFAULT_TRAY_BEHAVIOR.minimizeToTray,
    closeToTray:
      typeof settings.closeToTray === "boolean"
        ? settings.closeToTray
        : DEFAULT_TRAY_BEHAVIOR.closeToTray,
  };
}

type ExitDialogCopy = {
  title: string;
  message: string;
  confirmButton: string;
  cancelButton: string;
};

type ResetFocusToIdleDialogCopy = {
  title: string;
  message: string;
  yesButton: string;
  noButton: string;
  cancelButton: string;
};

type TrayCopy = {
  tooltip: string;
  restoreLabel: string;
  quitLabel: string;
  fullscreenBreakLabel: string;
};

type MainLanguage = "en" | "es" | "zh" | "ja" | "pt";

const EXIT_DIALOG_COPY: Record<MainLanguage, ExitDialogCopy> = {
  en: {
    title: "Confirm Exit",
    message: "Are you sure you want to end the session?",
    confirmButton: "Yes, end session",
    cancelButton: "Cancel",
  },
  es: {
    title: "Confirmar salida",
    message: "¿Seguro que quieres finalizar la sesión?",
    confirmButton: "Sí, finalizar sesión",
    cancelButton: "Cancelar",
  },
  zh: {
    title: "确认退出",
    message: "确定要结束本次会话吗？",
    confirmButton: "是，结束会话",
    cancelButton: "取消",
  },
  ja: {
    title: "終了の確認",
    message: "セッションを終了しますか？",
    confirmButton: "はい、終了する",
    cancelButton: "キャンセル",
  },
  pt: {
    title: "Confirmar saída",
    message: "Tem certeza de que deseja encerrar a sessão?",
    confirmButton: "Sim, encerrar sessão",
    cancelButton: "Cancelar",
  },
};

const RESET_FOCUS_TO_IDLE_DIALOG_COPY: Record<
  MainLanguage,
  ResetFocusToIdleDialogCopy
> = {
  en: {
    title: "Allocate elapsed focus time to Idle?",
    message: "Move the elapsed time of the current task to Idle?",
    yesButton: "Yes",
    noButton: "No",
    cancelButton: "Cancel",
  },
  es: {
    title: "¿Asignar el tiempo transcurrido a Ocioso?",
    message:
      "¿Mover a Ocioso el tiempo transcurrido de la tarea actual?",
    yesButton: "Sí",
    noButton: "No",
    cancelButton: "Cancelar",
  },
  zh: {
    title: "将已过专注时间分配为空闲？",
    message: "是否将当前任务的已过时间转为空闲时间？",
    yesButton: "是",
    noButton: "否",
    cancelButton: "取消",
  },
  ja: {
    title: "経過した集中時間をアイドルに振り替えますか？",
    message: "現在のタスクの経過時間をアイドル時間へ移動しますか？",
    yesButton: "はい",
    noButton: "いいえ",
    cancelButton: "キャンセル",
  },
  pt: {
    title: "Alocar tempo decorrido em Ocioso?",
    message: "Mover o tempo decorrido desta tarefa atual para Ocioso?",
    yesButton: "Sim",
    noButton: "Não",
    cancelButton: "Cancelar",
  },
};

const TRAY_COPY: Record<MainLanguage, TrayCopy> = {
  en: {
    tooltip: "Just click to restore.",
    restoreLabel: "Restore the app",
    quitLabel: "Quit",
    fullscreenBreakLabel: "Please wait for your break to end.",
  },
  es: {
    tooltip: "Haz clic para restaurar.",
    restoreLabel: "Restaurar la app",
    quitLabel: "Salir",
    fullscreenBreakLabel: "Espera a que termine tu pausa.",
  },
  zh: {
    tooltip: "点击即可恢复。",
    restoreLabel: "恢复应用",
    quitLabel: "退出",
    fullscreenBreakLabel: "请等待休息结束。",
  },
  ja: {
    tooltip: "クリックして復元",
    restoreLabel: "アプリを復元",
    quitLabel: "終了",
    fullscreenBreakLabel: "休憩が終わるまでお待ちください。",
  },
  pt: {
    tooltip: "Clique para restaurar.",
    restoreLabel: "Restaurar o app",
    quitLabel: "Sair",
    fullscreenBreakLabel: "Aguarde o fim da pausa para continuar.",
  },
};

const resolveMainLanguage = (data: unknown): MainLanguage => {
  const settings = getSettingsFromStateData(data);
  const configuredLanguage = settings.language;

  const localeLanguage: SupportedLanguageOption =
    typeof configuredLanguage === "string"
      ? (configuredLanguage as SupportedLanguageOption)
      : "auto";

  const languageBase =
    localeLanguage === "auto"
      ? app.getLocale().toLowerCase().split("-")[0]
      : localeLanguage;

  switch (languageBase) {
    case "pt":
      return "pt";
    case "es":
      return "es";
    case "zh":
      return "zh";
    case "ja":
      return "ja";
    default:
      return "en";
  }
};

const getExitDialogCopy = (data: unknown): ExitDialogCopy =>
  EXIT_DIALOG_COPY[resolveMainLanguage(data)];

const getResetFocusToIdleDialogCopy = (
  data: unknown
): ResetFocusToIdleDialogCopy =>
  RESET_FOCUS_TO_IDLE_DIALOG_COPY[resolveMainLanguage(data)];

const getTrayCopy = (data: unknown): TrayCopy =>
  TRAY_COPY[resolveMainLanguage(data)];

const windowState: WindowStateProps = {
  isFullscreen: false,
  isFullscreenRequested: false,
  fullscreenSnapshot: null,
  isOnCompactMode: false,
  isPseudoFullscreen: false,
};

let trayBehaviorState: TrayBehaviorSettings = {
  ...DEFAULT_TRAY_BEHAVIOR,
};

let fullscreenFallbackTimer: ReturnType<typeof setTimeout> | null =
  null;

const clearFullscreenFallbackTimer = () => {
  if (fullscreenFallbackTimer) {
    clearTimeout(fullscreenFallbackTimer);
    fullscreenFallbackTimer = null;
  }
};

const ensureWindowShown = (targetWindow: BrowserWindow) => {
  if (targetWindow.isMinimized() || !targetWindow.isVisible()) {
    targetWindow.restore();
  }

  if (!targetWindow.isVisible()) {
    targetWindow.show();
  }
};

const focusWindowOnTop = (targetWindow: BrowserWindow) => {
  app.focus();
  targetWindow.moveTop();
  targetWindow.focus();
};

/**
 * This only exists to counteract an issue with linux where leave-full-screen triggers every time this is called on linux (when exiting fullscreen)
 *
 * It may be fixed in a future version of linux.
 *
 * If you try to set the size smaller than the minimum allowed it will also cause issues here.
 *
 * @param width
 * @param height
 */
const setWindowSizeIfDiff = (
  targetWindow: BrowserWindow | null,
  width: number,
  height: number
) => {
  const minSize = targetWindow?.getMinimumSize();
  width = Math.max(width, minSize?.[0] || 0);
  height = Math.max(height, minSize?.[1] || 0);
  const size = targetWindow?.getSize();
  if (!size || size[0] !== width || size[1] !== height) {
    targetWindow?.setSize(width, height);
  }
};

const restoreWindowAfterFullscreen = () => {
  if (!win) return;

  const snapshot = windowState.fullscreenSnapshot;
  if (snapshot) {
    win.setBounds(snapshot.bounds);
    windowState.isOnCompactMode = snapshot.wasCompactMode;
    windowState.fullscreenSnapshot = null;
  }

  if (windowState.isOnCompactMode) {
    const compactHeight = getCompactHeight();

    // Fullscreen can leave stale min/max constraints (for example from
    // compact-grid expand). Re-apply compact constraints on exit.
    win.setMinimumSize(340, compactHeight);
    win.setMaximumSize(340, compactHeight);
    setWindowSizeIfDiff(win, 340, compactHeight);

    // Linux/Wayland intentionally stays resizable in compact mode.
    if (isLinux) {
      win.setResizable(true);
    } else {
      // Windows does better when resize lock is deferred.
      setTimeout(() => {
        win?.setResizable(false);
      });
    }
  } else {
    setWindowSizeIfDiff(win, 340, getFrameHeight());
  }

  windowState.isFullscreen = false;
  windowState.isFullscreenRequested = false;
  windowState.isPseudoFullscreen = false;
  win.webContents.send(FULLSCREEN_BREAK_EXITED);
};

const scheduleFullscreenFallback = () => {
  clearFullscreenFallbackTimer();

  const fallbackDelayMs = isLinux ? 220 : 900;

  fullscreenFallbackTimer = setTimeout(() => {
    if (!win || win.isDestroyed()) return;
    if (!windowState.isFullscreenRequested) return;
    if (win.isFullScreen()) return;

    const display = screen.getDisplayMatching(win.getBounds());
    const { bounds } = display;

    ensureWindowShown(win);
    win.setBounds(bounds);
    focusWindowOnTop(win);
    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true);

    windowState.isPseudoFullscreen = true;
    windowState.isFullscreen = true;
    win.webContents.send(FULLSCREEN_BREAK_ENTERED);
  }, fallbackDelayMs);
};

type SetAlwaysOnTopPayload =
  ToMainPayloadMap[typeof SET_ALWAYS_ON_TOP][0];
type SetFullscreenBreakPayload =
  ToMainPayloadMap[typeof SET_FULLSCREEN_BREAK][0];
type SetTrayBehaviorPayload =
  ToMainPayloadMap[typeof SET_TRAY_BEHAVIOR][0];
type SetCompactModePayload =
  ToMainPayloadMap[typeof SET_COMPACT_MODE][0];
type SetUiThemePayload = ToMainPayloadMap[typeof SET_UI_THEME][0];
type SetNativeTitlebarPayload =
  ToMainPayloadMap[typeof SET_NATIVE_TITLEBAR][0];
type MinimizeWindowPayload =
  ToMainPayloadMap[typeof MINIMIZE_WINDOW][0];
type CloseWindowPayload = ToMainPayloadMap[typeof CLOSE_WINDOW][0];
type SetOpenAtLoginPayload =
  ToMainPayloadMap[typeof SET_OPEN_AT_LOGIN][0];
type TrayIconUpdatePayload =
  ToMainPayloadMap[typeof TRAY_ICON_UPDATE][0];
type ExportTasksDialogPayload =
  ToMainPayloadMap[typeof EXPORT_TASKS_DIALOG][0];
type TasksExportResultPayload =
  FromMainPayloadMap[typeof TASKS_EXPORT_RESULT][0];
type TasksImportResultPayload =
  FromMainPayloadMap[typeof TASKS_IMPORT_RESULT][0];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasBooleanProperty = <K extends string>(
  value: unknown,
  key: K
): value is Record<K, boolean> =>
  isRecord(value) && typeof value[key] === "boolean";

const hasStringProperty = <K extends string>(
  value: unknown,
  key: K
): value is Record<K, string> =>
  isRecord(value) && typeof value[key] === "string";

const isSetAlwaysOnTopPayload = (
  value: unknown
): value is SetAlwaysOnTopPayload =>
  hasBooleanProperty(value, "alwaysOnTop");

const isSetFullscreenBreakPayload = (
  value: unknown
): value is SetFullscreenBreakPayload =>
  hasBooleanProperty(value, "shouldFullscreen") &&
  hasBooleanProperty(value, "alwaysOnTop");

const isSetTrayBehaviorPayload = (
  value: unknown
): value is SetTrayBehaviorPayload =>
  hasBooleanProperty(value, "minimizeToTray") &&
  hasBooleanProperty(value, "closeToTray");

const isSetCompactModePayload = (
  value: unknown
): value is SetCompactModePayload =>
  hasBooleanProperty(value, "compactMode");

const isSetUiThemePayload = (
  value: unknown
): value is SetUiThemePayload =>
  hasBooleanProperty(value, "isDarkMode");

const isSetNativeTitlebarPayload = (
  value: unknown
): value is SetNativeTitlebarPayload =>
  hasBooleanProperty(value, "useNativeTitlebar");

const isMinimizeWindowPayload = (
  value: unknown
): value is MinimizeWindowPayload =>
  hasBooleanProperty(value, "minimizeToTray");

const isCloseWindowPayload = (
  value: unknown
): value is CloseWindowPayload =>
  hasBooleanProperty(value, "closeToTray");

const isSetOpenAtLoginPayload = (
  value: unknown
): value is SetOpenAtLoginPayload =>
  hasBooleanProperty(value, "openAtLogin");

const isTrayIconUpdatePayload = (
  value: unknown
): value is TrayIconUpdatePayload =>
  typeof value === "string" && value.startsWith("data:image/");

const isExportTasksDialogPayload = (
  value: unknown
): value is ExportTasksDialogPayload =>
  hasStringProperty(value, "suggestedFileName") &&
  hasStringProperty(value, "content");

const sendTasksExportResult = (
  event: IpcMainEvent,
  payload: TasksExportResultPayload
) => {
  event.sender.send(TASKS_EXPORT_RESULT, payload);
};

const sendTasksImportResult = (
  event: IpcMainEvent,
  payload: TasksImportResultPayload
) => {
  event.sender.send(TASKS_IMPORT_RESULT, payload);
};

const applyOpenAtLoginSetting = (openAtLogin: boolean): void => {
  try {
    app.setLoginItemSettings({
      openAtLogin,
      openAsHidden: openAtLogin,
    });
  } catch (error) {
    console.log(
      "[OpenAtLogin] Failed to apply login item settings:",
      error
    );
  }
};

const syncOpenAtLoginFromStore = (): void => {
  const storedOpenAtLogin = store.safeGet("openAtLogin");
  const desiredOpenAtLogin =
    typeof storedOpenAtLogin === "boolean" ? storedOpenAtLogin : false;

  applyOpenAtLoginSetting(desiredOpenAtLogin);
};

const isSafeExternalUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
    );
  } catch {
    return false;
  }
};

const getUpdateBody = (info: UpdateInfo): string => {
  if (typeof info.releaseNotes === "string") {
    return info.releaseNotes;
  }

  if (Array.isArray(info.releaseNotes)) {
    return info.releaseNotes
      .map((releaseNote) => releaseNote.note)
      .filter((note): note is string =>
        typeof note === "string" ? note.trim().length > 0 : false
      )
      .join("\n\n");
  }

  return "";
};

const emitUpdateAvailable = (info: UpdateInfo) => {
  const payload = {
    version: info.version,
    updateBody: getUpdateBody(info),
  };

  pendingUpdate = payload;
  win?.webContents.send(UPDATE_AVAILABLE, payload);
};

let trayTooltip = getTrayCopy(undefined).tooltip;
let fullScreenTrayBreakLabel =
  getTrayCopy(undefined).fullscreenBreakLabel;

const createTrayContextMenu = (trayCopy: TrayCopy) =>
  Menu.buildFromTemplate([
    {
      label: trayCopy.restoreLabel,
      click: () => {
        if (!win) return;

        ensureWindowShown(win);
        focusWindowOnTop(win);
      },
    },
    {
      label: trayCopy.quitLabel,
      click: async () => {
        if (!win || !(await isUserHaveSession(win))) {
          app.exit();
          return;
        }

        const stateData = await getFromStorage(win, "state");
        const dialogCopy = getExitDialogCopy(stateData);
        const quitConfirmButtons = [
          dialogCopy.confirmButton,
          dialogCopy.cancelButton,
        ];
        const enum QuitConfirm {
          YES,
          NO,
        }

        // https://www.electronjs.org/docs/latest/api/dialog#dialogshowmessageboxsyncwindow-options
        // First argument is optional; null will not throw
        const response = dialog.showMessageBoxSync(win!, {
          type: "question",
          title: dialogCopy.title,
          message: dialogCopy.message,
          buttons: quitConfirmButtons,
          defaultId: QuitConfirm.NO, // Cancel as default (better UX)
          cancelId: QuitConfirm.NO, // Esc/Cancel = Cancel,
          icon: getIcon(),
        });

        if (response === QuitConfirm.YES) {
          app.exit();
        }
      },
    },
  ]);

let contextMenu = createTrayContextMenu(getTrayCopy(undefined));

const refreshTrayLocalization = (stateData: unknown) => {
  const trayCopy = getTrayCopy(stateData);
  trayTooltip = trayCopy.tooltip;
  fullScreenTrayBreakLabel = trayCopy.fullscreenBreakLabel;
  contextMenu = createTrayContextMenu(trayCopy);
  tray?.setToolTip(trayTooltip);
  tray?.setContextMenu(contextMenu);
};

function createMainWindow() {
  win = new BrowserWindow({
    width: 340,
    height: getFrameHeight(),
    resizable: true,
    maximizable: false,
    show: false,
    frame: store.safeGet("useNativeTitlebar"),
    icon: getIcon(),
    backgroundColor: store.safeGet("isDarkMode") ? "#141e25" : "#fff",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Open the DevTools.
  if (isDev) win.webContents.openDevTools({ mode: "detach" });

  win.webContents.setWindowOpenHandler((details) => {
    if (isSafeExternalUrl(details.url)) {
      shell.openExternal(details.url);
    }
    return { action: "deny" };
  });

  const rendererDevUrl =
    process.env.ELECTRON_RENDERER_URL || "http://localhost:3000";
  win.loadURL(
    !onProduction
      ? rendererDevUrl
      : `file://${path.join(__dirname, "index.html")}`
  );

  win.once("ready-to-show", () => {
    win?.show();
  });

  win.webContents.on("did-finish-load", () => {
    if (pendingUpdate) {
      win?.webContents.send(UPDATE_AVAILABLE, pendingUpdate);
    }

    if (win) {
      getFromStorage(win, "state").then((stateData) => {
        trayBehaviorState = getTrayBehaviorSettings(stateData);
        refreshTrayLocalization(stateData);
      });
    }
  });

  win.on(
    "minimize",
    debounce(
      () => {
        if (!win) return;

        const { minimizeToTray } = trayBehaviorState;
        if (!minimizeToTray || windowState.isFullscreen) return;

        win.hide();
        if (tray === null) {
          createSystemTray();
        }
      },
      1000,
      { leading: true }
    )
  );

  win.on("enter-full-screen", () => {
    clearFullscreenFallbackTimer();
    windowState.isPseudoFullscreen = false;
    windowState.isFullscreen = true;
    win?.webContents.send(FULLSCREEN_BREAK_ENTERED);
  });

  win.on("leave-full-screen", () => {
    clearFullscreenFallbackTimer();

    // On some Linux/Wayland setups we can receive leave-full-screen while
    // fullscreen is still being requested. Ignore this transient leave and
    // keep the request/fallback active.
    if (
      windowState.isFullscreenRequested &&
      !windowState.isPseudoFullscreen
    ) {
      scheduleFullscreenFallback();
      return;
    }

    restoreWindowAfterFullscreen();
  });

  win.on(
    "close",
    debounce(
      (e) => {
        e.preventDefault();

        const { closeToTray } = trayBehaviorState;
        if (!closeToTray) {
          app.exit();
          return;
        }

        if (!windowState.isFullscreen) {
          win?.hide();
          if (tray === null) {
            createSystemTray();
          }
        }
      },
      1000,
      { leading: true }
    )
  );

  createContextMenu(win);
}

function createSystemTray() {
  if (tray !== null) return;

  tray = new Tray(trayIcon);

  tray.setToolTip(trayTooltip);
  tray.setContextMenu(contextMenu);

  if (win) {
    getFromStorage(win, "state").then((stateData) => {
      refreshTrayLocalization(stateData);
    });
  }

  tray.on("click", () => {
    if (!win || win.isDestroyed()) return;

    if (!win.isVisible()) {
      win.show();
      return;
    }

    if (!win.isFullScreen()) {
      win.hide();
    }
  });
}

type NotificationProps = {
  title: string;
  message: string;
  actions?: string[];
  callback?: (err: Error | null, response: string) => void;
};

function notify(props: NotificationProps) {
  if (!Notification.isSupported()) {
    const error = new Error("Notification API not supported.");
    console.log("[Notifications] Failed to show notification:", error);
    if (props.callback) {
      props.callback(error, "");
    }
    return;
  }

  const notificationOptions: Electron.NotificationConstructorOptions = {
    icon: notificationIcon,
    title: props.title,
    body: props.message,
    silent: false,
  };

  if (props.actions && props.actions.length > 0) {
    notificationOptions.actions = props.actions.map((action) => ({
      type: "button",
      text: action,
    }));
  }

  const notification = new Notification(notificationOptions);
  let settled = false;

  const settle = (err: Error | null, response: string) => {
    if (settled) return;
    settled = true;

    if (err) {
      console.log("[Notifications] Failed to show notification:", err);
    }

    if (props.callback) {
      props.callback(err, response);
    }
  };

  notification.on("action", (_event, index) => {
    const response = props.actions?.[index];
    settle(
      null,
      typeof response === "string"
        ? response.toLowerCase()
        : String(index)
    );
  });

  notification.on("click", () => {
    if (props.actions && props.actions.length === 1) {
      settle(null, props.actions[0].toLowerCase());
      return;
    }

    settle(null, "click");
  });

  notification.on("failed", (_event, error) => {
    settle(new Error(String(error)), "");
  });

  try {
    notification.show();
  } catch (error) {
    settle(
      error instanceof Error ? error : new Error(String(error)),
      ""
    );
  }
}

if (!onlySingleInstance) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      } else if (!win.isVisible()) {
        win.show();
      } else {
        win.focus();
      }
    }
  });

  app.whenReady().then(async () => {
    if (isDev && process.env.POMODOROZ_INSTALL_DEVTOOLS === "1") {
      console.log("Installing devtools");
      const installer = await import("electron-devtools-installer");
      const extensions = [
        {
          name: "REACT_DEVELOPER_TOOLS",
          extension: installer.REACT_DEVELOPER_TOOLS,
        },
        {
          name: "REDUX_DEVTOOLS",
          extension: installer.REDUX_DEVTOOLS,
        },
      ];

      for (const { name, extension } of extensions) {
        try {
          await installer.default(extension, {
            forceDownload: true,
          });
        } catch (error) {
          console.log(`[DevTools] Failed to install ${name}:`, error);
        }
      }
    }

    createMainWindow();
    syncOpenAtLoginFromStore();

    if (onProduction) {
      if (win) {
        const blockKeys = [
          "CommandOrControl+R",
          "CommandOrControl+Shift+R",
          "CommandOrControl+Alt+Q",
          "F11",
        ];
        blockShortcutKeys(win, blockKeys);
      }
    }

    activateGlobalShortcuts([
      {
        key: "Alt+Shift+H",
        callback: () => {
          win?.hide();
        },
      },
      {
        key: "Alt+Shift+S",
        callback: () => {
          win?.show();
        },
      },
    ]);

    appUpdater = activateAutoUpdate({
      onErrorUpdating: (error) => {
        console.log("[Updater] Error while checking updates:", error);
      },
      onUpdateAvailable: (info) => {
        emitUpdateAvailable(info);

        notify({
          title: "NEW UPDATE IS AVAILABLE",
          message: `App version ${info.version} ready to be downloaded.`,
          actions: ["View Release Notes"],
          callback: (err, response) => {
            if (!err) {
              if (response === "view release notes") {
                shell.openExternal(RELEASE_NOTES_LINK);
              }
            }
          },
        });
      },
      onUpdateDownloaded: (info) => {
        notify({
          title: "READY TO BE INSTALLED",
          message: "Update has been successfully downloaded.",
          // Keep a single explicit action to preserve current update UX.
          actions: ["Quit and Install" /*, "Install it Later"*/],
          callback: (err, response) => {
            if (!err && response === "quit and install") {
              appUpdater?.quitAndInstall();
            }
          },
        });
      },
    });
  });
}

ipcMain.on(SET_ALWAYS_ON_TOP, (_event, payload: unknown) => {
  if (!isSetAlwaysOnTopPayload(payload)) return;

  const { alwaysOnTop } = payload;
  win?.setAlwaysOnTop(alwaysOnTop, alwaysOnTop ? "floating" : "normal");
});

ipcMain.on(SET_FULLSCREEN_BREAK, (_event, payload: unknown) => {
  if (!isSetFullscreenBreakPayload(payload)) return;

  setFullscreenBreakHandler(payload, {
    win,
    tray,
    trayTooltip,
    fullScreenTrayBreakLabel,
    contextMenu,
    fullscreenState: windowState,
  });

  if (payload.shouldFullscreen) {
    scheduleFullscreenFallback();
    return;
  }

  clearFullscreenFallbackTimer();
  if (windowState.isPseudoFullscreen && !win?.isFullScreen()) {
    restoreWindowAfterFullscreen();
  }
});

ipcMain.on(SET_TRAY_BEHAVIOR, (_event, payload: unknown) => {
  if (!isSetTrayBehaviorPayload(payload)) return;

  trayBehaviorState = {
    minimizeToTray: payload.minimizeToTray,
    closeToTray: payload.closeToTray,
  };
});

ipcMain.on(SET_COMPACT_MODE, (_event, payload: unknown) => {
  if (!isSetCompactModePayload(payload)) return;

  if (payload.compactMode) {
    const compactHeight = getCompactHeight();
    win?.setMinimumSize(340, compactHeight);
    win?.setMaximumSize(340, compactHeight);
    win?.setSize(340, compactHeight);
    // On Linux/Wayland, forcing non-resizable can cause temporary
    // titlebar controls misalignment in compact mode.
    if (!isLinux) {
      win?.setResizable(false);
    }
    windowState.isOnCompactMode = true;
  } else {
    win?.setResizable(true);
    windowState.isOnCompactMode = false;
    win?.setMaximumSize(0, 0);
    win?.setMinimumSize(340, getFrameHeight());
    win?.setSize(340, getFrameHeight());
  }
});

ipcMain.on(COMPACT_EXPAND, () => {
  if (!windowState.isOnCompactMode) return;

  const compactHeight = getCompactHeight();
  const expandedHeight = compactHeight + COMPACT_GRID_HEIGHT;

  win?.setMinimumSize(340, expandedHeight);
  win?.setMaximumSize(340, expandedHeight);
  win?.setSize(340, expandedHeight);
});

ipcMain.on(COMPACT_COLLAPSE, () => {
  if (!windowState.isOnCompactMode) return;

  const compactHeight = getCompactHeight();

  win?.setMinimumSize(340, compactHeight);
  win?.setMaximumSize(340, compactHeight);
  win?.setSize(340, compactHeight);
});

ipcMain.on(SET_UI_THEME, (_event, payload: unknown) => {
  if (!isSetUiThemePayload(payload)) return;

  const { isDarkMode } = payload;
  store.safeSet("isDarkMode", isDarkMode);
});

ipcMain.on(SHOW_WINDOW, () => {
  if (!win) return;

  if (isLinux && win.isVisible() && !win.isFocused()) {
    win.hide();
  }

  ensureWindowShown(win);
  focusWindowOnTop(win);
});

ipcMain.on(MINIMIZE_WINDOW, (_event, payload: unknown) => {
  if (!isMinimizeWindowPayload(payload)) return;

  const { minimizeToTray } = payload;
  trayBehaviorState.minimizeToTray = minimizeToTray;
  if (!minimizeToTray) {
    win?.minimize();
  } else {
    if (tray === null) {
      createSystemTray();
    }
    win?.hide();
  }
});

ipcMain.on(CLOSE_WINDOW, (_event, payload: unknown) => {
  if (!isCloseWindowPayload(payload)) return;

  const { closeToTray } = payload;
  trayBehaviorState.closeToTray = closeToTray;
  if (!closeToTray) {
    app.exit();
  } else {
    if (tray === null) {
      createSystemTray();
    }
    win?.hide();
  }
});

ipcMain.on(SET_NATIVE_TITLEBAR, (_event, payload: unknown) => {
  if (!isSetNativeTitlebarPayload(payload)) return;

  const { useNativeTitlebar } = payload;
  if (store.safeGet("useNativeTitlebar") !== useNativeTitlebar) {
    store.safeSet("useNativeTitlebar", useNativeTitlebar);
    setTimeout(() => {
      const appImagePath = process.env.APPIMAGE;

      if (onProduction && isLinux && appImagePath) {
        // In AppImage builds, process.execPath can point to a transient mount
        // path. Relaunching with APPIMAGE keeps restart stable.
        app.relaunch({ execPath: appImagePath });
      } else {
        app.relaunch();
      }
      app.exit();
    }, 1000);
  }
});

ipcMain.on(TRAY_ICON_UPDATE, (_event, dataUrl: unknown) => {
  if (!isTrayIconUpdatePayload(dataUrl)) return;

  const image = nativeImage.createFromDataURL(dataUrl);
  if (!image.isEmpty()) {
    tray?.setImage(image);
  }
});

ipcMain.on(INSTALL_UPDATE, () => {
  appUpdater?.quitAndInstall();
});

ipcMain.on(SET_OPEN_AT_LOGIN, (_event, payload: unknown) => {
  if (!isSetOpenAtLoginPayload(payload)) return;

  const { openAtLogin } = payload;
  const storeOpenAtLogin = store.safeGet("openAtLogin");

  if (storeOpenAtLogin !== openAtLogin) {
    store.safeSet("openAtLogin", openAtLogin);
  }

  applyOpenAtLoginSetting(openAtLogin);
});

ipcMain.handle(
  CONFIRM_RESET_FOCUS_TO_IDLE,
  async (): Promise<ResetFocusToIdleDialogResult> => {
    let stateData: unknown = undefined;

    if (win) {
      try {
        stateData = await getFromStorage(win, "state");
      } catch (error) {
        console.log(
          "[ResetFocusToIdle] Failed to read state for dialog localization:",
          error
        );
      }
    }

    const dialogCopy = getResetFocusToIdleDialogCopy(stateData);
    const yesIndex = 0;
    const noIndex = 1;
    const cancelIndex = 2;

    try {
      const result = win
        ? await dialog.showMessageBox(win, {
            type: "question",
            title: dialogCopy.title,
            message: dialogCopy.message,
            buttons: [
              dialogCopy.yesButton,
              dialogCopy.noButton,
              dialogCopy.cancelButton,
            ],
            defaultId: noIndex,
            cancelId: cancelIndex,
            noLink: true,
            icon: getIcon(),
          })
        : await dialog.showMessageBox({
            type: "question",
            title: dialogCopy.title,
            message: dialogCopy.message,
            buttons: [
              dialogCopy.yesButton,
              dialogCopy.noButton,
              dialogCopy.cancelButton,
            ],
            defaultId: noIndex,
            cancelId: cancelIndex,
            noLink: true,
            icon: getIcon(),
          });

      if (result.response === yesIndex) {
        return "yes";
      }

      if (result.response === noIndex) {
        return "no";
      }
    } catch (error) {
      console.log(
        "[ResetFocusToIdle] Failed to show native confirmation dialog:",
        error
      );
    }

    return "cancel";
  }
);

ipcMain.on(
  EXPORT_TASKS_DIALOG,
  async (event: IpcMainEvent, payload: unknown) => {
    if (!isExportTasksDialogPayload(payload)) {
      sendTasksExportResult(event, {
        ok: false,
        canceled: false,
        error: "Invalid export payload.",
      });
      return;
    }

    try {
      const saveOptions: SaveDialogOptions = {
        title: "Export tasks",
        defaultPath: payload.suggestedFileName,
        filters: [{ name: "JSON", extensions: ["json"] }],
      };
      const result = win
        ? await dialog.showSaveDialog(win, saveOptions)
        : await dialog.showSaveDialog(saveOptions);

      if (result.canceled || !result.filePath) {
        sendTasksExportResult(event, {
          ok: false,
          canceled: true,
        });
        return;
      }

      await fs.writeFile(result.filePath, payload.content, "utf8");
      sendTasksExportResult(event, {
        ok: true,
        canceled: false,
        filePath: result.filePath,
      });
    } catch (error) {
      console.log("[TasksIO] Failed to export tasks:", error);
      sendTasksExportResult(event, {
        ok: false,
        canceled: false,
        error: "Failed to export tasks.",
      });
    }
  }
);

ipcMain.on(IMPORT_TASKS_DIALOG, async (event: IpcMainEvent) => {
  try {
    const openOptions: OpenDialogOptions = {
      title: "Import tasks",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    };
    const result = win
      ? await dialog.showOpenDialog(win, openOptions)
      : await dialog.showOpenDialog(openOptions);

    if (result.canceled || result.filePaths.length === 0) {
      sendTasksImportResult(event, {
        ok: false,
        canceled: true,
      });
      return;
    }

    const [filePath] = result.filePaths;
    const content = await fs.readFile(filePath, "utf8");

    sendTasksImportResult(event, {
      ok: true,
      canceled: false,
      filePath,
      content,
    });
  } catch (error) {
    console.log("[TasksIO] Failed to import tasks:", error);
    sendTasksImportResult(event, {
      ok: false,
      canceled: false,
      error: "Failed to import tasks.",
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.setAppUserModelId("com.cjdduarte.pomodoroz");
