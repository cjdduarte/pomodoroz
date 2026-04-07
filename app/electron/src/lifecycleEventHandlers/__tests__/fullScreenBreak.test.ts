import { setFullscreenBreakHandler } from "../fullScreenBreak";
import { BrowserWindow, Menu, Tray } from "electron";
import path from "path";

const activateFullScreenShortcutsMock = jest.fn();
const deactivateFullScreenShortcutsMock = jest.fn();

jest.mock("../../helpers", () => ({
  activateFullScreenShortcuts: (exitFullScreenCallback: () => void) =>
    activateFullScreenShortcutsMock(exitFullScreenCallback),
  deactivateFullScreenShortcuts: () =>
    deactivateFullScreenShortcutsMock(),
}));

jest.mock("electron", () => {
  class MockBrowserWindow {
    getBounds = jest.fn(() => ({
      x: 120,
      y: 80,
      width: 340,
      height: 490,
    }));
    show = jest.fn();
    focus = jest.fn();
    setAlwaysOnTop = jest.fn();
    setFullScreen = jest.fn();
    setResizable = jest.fn();
    setMaximumSize = jest.fn();
    setVisibleOnAllWorkspaces = jest.fn();
    setFullScreenable = jest.fn();
    restore = jest.fn();
    moveTop = jest.fn();
    isMinimized = jest.fn(() => false);
    isFocused = jest.fn(() => true);
    isFullScreen = jest.fn(() => true);
    isVisible = jest.fn(() => true);
    webContents = {
      on: jest.fn(),
      removeListener: jest.fn(),
      send: jest.fn(),
    };
  }

  class MockTray {
    setToolTip = jest.fn();
    setContextMenu = jest.fn();
    constructor(_icon: string) {}
  }

  return {
    app: {
      focus: jest.fn(),
    },
    BrowserWindow: MockBrowserWindow,
    Tray: MockTray,
    Menu: {
      buildFromTemplate: jest.fn((template: unknown[]) => template),
    },
  };
});

describe("Fullscreen break", () => {
  const getWindowSpies = (window: BrowserWindow) => {
    return {
      show: jest.spyOn(window, "show"),
      focus: jest.spyOn(window, "focus"),
      setAlwaysOnTop: jest.spyOn(window, "setAlwaysOnTop"),
      setFullScreen: jest.spyOn(window, "setFullScreen"),
      setResizable: jest.spyOn(window, "setResizable"),
      setMaximumSize: jest.spyOn(window, "setMaximumSize"),
      restore: jest.spyOn(window, "restore"),
      isMinimized: jest.spyOn(window, "isMinimized"),
      isVisible: jest.spyOn(window, "isVisible"),
      setVisibleOnAllWorkspaces: jest.spyOn(
        window,
        "setVisibleOnAllWorkspaces"
      ),
      getBounds: jest.spyOn(window, "getBounds"),
      send: jest.spyOn(window.webContents, "send"),
    };
  };

  it("should enter full screen on break", () => {
    const window = new BrowserWindow();
    const tray = new Tray(
      path.join(__dirname, "../../assets/tray-dark.png")
    );
    const trayTooltip = "Mock tray tool tip";
    const fullScreenTrayBreakLabel = "Mock break tray label";
    const fullscreenState = {
      isFullscreen: false,
      isFullscreenRequested: false,
      fullscreenSnapshot: null,
      isOnCompactMode: false,
    };

    // Set spies
    const windowSpies = getWindowSpies(window);
    const traySpies = {
      setToolTip: jest.spyOn(tray, "setToolTip"),
      setContextMenu: jest.spyOn(tray, "setContextMenu"),
    };
    setFullscreenBreakHandler(
      { shouldFullscreen: true, alwaysOnTop: true },
      {
        win: window,
        contextMenu: Menu.buildFromTemplate([{ label: "Mock Label" }]),
        fullscreenState,
        trayTooltip,
        fullScreenTrayBreakLabel,
        tray,
      }
    );

    // Verify that window has been setup to fullscreen
    expect(windowSpies.show).toHaveBeenCalled();
    expect(windowSpies.focus).toHaveBeenCalled();
    expect(windowSpies.setAlwaysOnTop).toHaveBeenCalledWith(
      true,
      "screen-saver"
    );
    expect(windowSpies.setFullScreen).toHaveBeenCalledWith(true);
    expect(windowSpies.setResizable).toHaveBeenCalledWith(true);
    expect(windowSpies.setMaximumSize).toHaveBeenCalledWith(0, 0);
    expect(windowSpies.restore).not.toHaveBeenCalled();
    expect(windowSpies.setVisibleOnAllWorkspaces).toHaveBeenCalledWith(
      true
    );
    expect(windowSpies.getBounds).toHaveBeenCalledTimes(1);
    expect(fullscreenState.isFullscreenRequested).toEqual(true);
    expect(fullscreenState.fullscreenSnapshot).toEqual(
      expect.objectContaining({
        bounds: { x: 120, y: 80, width: 340, height: 490 },
        wasVisible: true,
        wasMinimized: false,
        wasCompactMode: false,
      })
    );
    expect(fullscreenState.isFullscreen).toEqual(true);
    expect(activateFullScreenShortcutsMock).toHaveBeenCalledTimes(1);

    // Verify that tray has been updated
    expect(traySpies.setToolTip).toHaveBeenCalledTimes(1);
    expect(traySpies.setContextMenu).toHaveBeenCalledTimes(1);
  });

  it("should restore minimized/hidden window before entering fullscreen", () => {
    const window = new BrowserWindow();
    const tray = new Tray(
      path.join(__dirname, "../../assets/tray-dark.png")
    );
    const trayTooltip = "Mock tray tool tip";
    const fullScreenTrayBreakLabel = "Mock break tray label";
    const fullscreenState = {
      isFullscreen: false,
      isFullscreenRequested: false,
      fullscreenSnapshot: null,
      isOnCompactMode: true,
    };

    jest.spyOn(window, "isMinimized").mockReturnValue(true);
    jest.spyOn(window, "isVisible").mockReturnValue(false);

    const windowSpies = getWindowSpies(window);

    setFullscreenBreakHandler(
      { shouldFullscreen: true, alwaysOnTop: true },
      {
        win: window,
        contextMenu: Menu.buildFromTemplate([{ label: "Mock Label" }]),
        fullscreenState,
        trayTooltip,
        fullScreenTrayBreakLabel,
        tray,
      }
    );

    expect(windowSpies.restore).toHaveBeenCalledTimes(1);
    expect(windowSpies.show).toHaveBeenCalled();
    expect(windowSpies.setFullScreen).toHaveBeenCalledWith(true);
    expect(fullscreenState.fullscreenSnapshot).toEqual(
      expect.objectContaining({
        wasCompactMode: true,
      })
    );
  });

  it("should restore minimized window even when still marked visible", () => {
    const window = new BrowserWindow();
    const tray = new Tray(
      path.join(__dirname, "../../assets/tray-dark.png")
    );
    const trayTooltip = "Mock tray tool tip";
    const fullScreenTrayBreakLabel = "Mock break tray label";
    const fullscreenState = {
      isFullscreen: false,
      isFullscreenRequested: false,
      fullscreenSnapshot: null,
      isOnCompactMode: false,
    };

    jest.spyOn(window, "isMinimized").mockReturnValue(true);
    jest.spyOn(window, "isVisible").mockReturnValue(true);

    const windowSpies = getWindowSpies(window);

    setFullscreenBreakHandler(
      { shouldFullscreen: true, alwaysOnTop: true },
      {
        win: window,
        contextMenu: Menu.buildFromTemplate([{ label: "Mock Label" }]),
        fullscreenState,
        trayTooltip,
        fullScreenTrayBreakLabel,
        tray,
      }
    );

    expect(windowSpies.restore).toHaveBeenCalledTimes(1);
    expect(windowSpies.show).toHaveBeenCalled();
    expect(windowSpies.setFullScreen).toHaveBeenCalledWith(true);
  });

  it("should exit full screen on break", () => {
    const window = new BrowserWindow();
    const tray = new Tray(
      path.join(__dirname, "../../assets/tray-dark.png")
    );
    const trayTooltip = "Mock tray tool tip";
    const fullScreenTrayBreakLabel = "Mock break tray label";
    const fullscreenState = {
      isFullscreen: true,
      isFullscreenRequested: true,
      fullscreenSnapshot: null,
      isOnCompactMode: false,
    };

    // Set spies
    const windowSpies = getWindowSpies(window);
    const traySpies = {
      setToolTip: jest.spyOn(tray, "setToolTip"),
      setContextMenu: jest.spyOn(tray, "setContextMenu"),
    };
    setFullscreenBreakHandler(
      { shouldFullscreen: false, alwaysOnTop: true },
      {
        win: window,
        contextMenu: Menu.buildFromTemplate([{ label: "Mock Label" }]),
        fullscreenState,
        trayTooltip,
        fullScreenTrayBreakLabel,
        tray,
      }
    );

    // Verify that window has been setup to fullscreen
    expect(windowSpies.show).not.toHaveBeenCalled();
    expect(windowSpies.focus).not.toHaveBeenCalled();
    expect(windowSpies.setAlwaysOnTop).toHaveBeenCalledWith(
      true,
      "floating"
    );
    expect(windowSpies.setFullScreen).toHaveBeenCalledWith(false);
    expect(windowSpies.setResizable).not.toHaveBeenCalled();
    expect(windowSpies.setVisibleOnAllWorkspaces).toHaveBeenCalledWith(
      false
    );
    expect(windowSpies.send).not.toHaveBeenCalled();
    expect(fullscreenState.isFullscreenRequested).toEqual(false);
    expect(fullscreenState.isFullscreen).toEqual(false);
    expect(deactivateFullScreenShortcutsMock).toHaveBeenCalledTimes(1);

    // Verify that tray has been updated
    expect(traySpies.setToolTip).toHaveBeenCalledTimes(1);
    expect(traySpies.setContextMenu).toHaveBeenCalledTimes(1);
  });

  it("should keep previous snapshot while request is already active", () => {
    const window = new BrowserWindow();
    const tray = new Tray(
      path.join(__dirname, "../../assets/tray-dark.png")
    );
    const trayTooltip = "Mock tray tool tip";
    const fullScreenTrayBreakLabel = "Mock break tray label";
    const fullscreenState = {
      isFullscreen: true,
      isFullscreenRequested: true,
      fullscreenSnapshot: {
        bounds: { x: 10, y: 10, width: 340, height: 490 },
        wasVisible: false,
        wasMinimized: true,
        wasCompactMode: true,
      },
      isOnCompactMode: false,
    };

    const windowSpies = getWindowSpies(window);

    setFullscreenBreakHandler(
      { shouldFullscreen: true, alwaysOnTop: true },
      {
        win: window,
        contextMenu: Menu.buildFromTemplate([{ label: "Mock Label" }]),
        fullscreenState,
        trayTooltip,
        fullScreenTrayBreakLabel,
        tray,
      }
    );

    expect(windowSpies.getBounds).not.toHaveBeenCalled();
    expect(fullscreenState.fullscreenSnapshot).toEqual({
      bounds: { x: 10, y: 10, width: 340, height: 490 },
      wasVisible: false,
      wasMinimized: true,
      wasCompactMode: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
