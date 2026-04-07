import {
  activateFullScreenShortcuts,
  deactivateFullScreenShortcuts,
} from "../helpers";
import { app, BrowserWindow, Menu, Tray, type Input } from "electron";

type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FullscreenWindowSnapshot = {
  bounds: WindowBounds;
  wasVisible: boolean;
  wasMinimized: boolean;
  wasCompactMode: boolean;
};

export type FullscreenState = {
  isFullscreen: boolean;
  isFullscreenRequested: boolean;
  fullscreenSnapshot: FullscreenWindowSnapshot | null;
  isOnCompactMode?: boolean;
};

type FullscreenArgs = {
  shouldFullscreen: boolean;
  alwaysOnTop: boolean;
};

type AppArgs = {
  tray: Tray | null;
  trayTooltip: string;
  fullScreenTrayBreakLabel: string;
  win: BrowserWindow | null;
  contextMenu: Menu;
  fullscreenState: FullscreenState;
};

let removeWindowExitShortcuts: (() => void) | null = null;
let fullscreenRetryTimers: ReturnType<typeof setTimeout>[] = [];

const clearFullscreenRetryTimers = () => {
  for (const timer of fullscreenRetryTimers) {
    clearTimeout(timer);
  }
  fullscreenRetryTimers = [];
};

const activateWindowExitShortcuts = (
  win: BrowserWindow | null,
  exitFullScreenCallback: () => void
) => {
  removeWindowExitShortcuts?.();
  removeWindowExitShortcuts = null;

  if (!win) return;

  const onBeforeInput = (event: Electron.Event, input: Input) => {
    if (input.type !== "keyDown") return;

    const key = input.key?.toLowerCase();
    const isEscape = key === "escape";
    const isQuitCombo = (input.control || input.meta) && key === "w";

    if (!isEscape && !isQuitCombo) return;

    event.preventDefault();
    exitFullScreenCallback();
  };

  win.webContents.on("before-input-event", onBeforeInput);

  removeWindowExitShortcuts = () => {
    win.webContents.removeListener("before-input-event", onBeforeInput);
  };
};

const deactivateWindowExitShortcuts = () => {
  removeWindowExitShortcuts?.();
  removeWindowExitShortcuts = null;
};

const createFullscreenWindowSnapshot = (
  win: BrowserWindow | null,
  isOnCompactMode: boolean
): FullscreenWindowSnapshot | null => {
  if (!win) return null;

  return {
    bounds: win.getBounds(),
    wasVisible: win.isVisible(),
    wasMinimized: win.isMinimized(),
    wasCompactMode: isOnCompactMode,
  };
};

const setFullScreen = (
  flag: boolean,
  alwaysOnTop: boolean,
  win: BrowserWindow | null,
  fullscreenState: FullscreenState
) => {
  const ensureWindowForeground = () => {
    if (!win) return;

    if (
      process.platform === "linux" &&
      win.isVisible() &&
      !win.isFocused()
    ) {
      win.hide();
    }

    if (win.isMinimized() || !win.isVisible()) {
      win.restore();
    }

    app.focus();
    win.show();
    win.moveTop();
    win.focus();
  };

  const requestNativeFullscreen = () => {
    if (!win || !fullscreenState.isFullscreenRequested) return;

    ensureWindowForeground();
    win.setFullScreen(true);
  };

  if (flag && win) {
    // Compact mode locks max size; clear it before entering fullscreen.
    win.setMaximumSize(0, 0);
    win.setResizable(true);

    win.setFullScreenable(true);
    // During fullscreen breaks force top-most, then restore user setting on exit.
    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true);

    requestNativeFullscreen();

    clearFullscreenRetryTimers();
    if (!win.isFullScreen()) {
      for (const delay of [120, 280, 600]) {
        const timer = setTimeout(() => {
          if (!win || win.isDestroyed()) return;
          if (!fullscreenState.isFullscreenRequested) return;
          if (win.isFullScreen()) return;

          requestNativeFullscreen();
        }, delay);
        fullscreenRetryTimers.push(timer);
      }
    }
  } else {
    clearFullscreenRetryTimers();
    const restoreAlwaysOnTopLevel = alwaysOnTop ? "floating" : "normal";
    win?.setFullScreenable(true);
    win?.setAlwaysOnTop(alwaysOnTop, restoreAlwaysOnTopLevel);
    win?.setVisibleOnAllWorkspaces(false);
    win?.setFullScreen(false);
  }

  fullscreenState.isFullscreen = flag;
};

/**
 * Handles the event of the main app SET_FULLSCREEN_BREAK
 *
 * @param fullscreenArgs
 * @param appArgs
 */
export const setFullscreenBreakHandler = (
  fullscreenArgs: FullscreenArgs,
  appArgs: AppArgs
) => {
  const { shouldFullscreen, alwaysOnTop } = fullscreenArgs;
  const {
    tray,
    trayTooltip,
    fullScreenTrayBreakLabel,
    win,
    contextMenu,
    fullscreenState,
  } = appArgs;

  if (shouldFullscreen) {
    if (!fullscreenState.isFullscreenRequested) {
      fullscreenState.fullscreenSnapshot =
        createFullscreenWindowSnapshot(
          win,
          Boolean(fullscreenState.isOnCompactMode)
        );
    }
    fullscreenState.isFullscreenRequested = true;
    setFullScreen(true, alwaysOnTop, win, fullscreenState);

    const exitBreak = () => {
      if (!fullscreenState.isFullscreen) return;

      setFullscreenBreakHandler(
        { shouldFullscreen: false, alwaysOnTop },
        appArgs
      );
    };

    activateFullScreenShortcuts(exitBreak);
    activateWindowExitShortcuts(win, exitBreak);

    tray?.setToolTip("");
    tray?.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: fullScreenTrayBreakLabel,
        },
      ])
    );
  } else {
    fullscreenState.isFullscreenRequested = false;
    setFullScreen(false, alwaysOnTop, win, fullscreenState);

    deactivateFullScreenShortcuts();
    deactivateWindowExitShortcuts();

    tray?.setToolTip(trayTooltip);
    tray?.setContextMenu(contextMenu);
  }
};
