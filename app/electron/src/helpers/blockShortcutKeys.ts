import { BrowserWindow, globalShortcut } from "electron";

const registerBlockedShortcut = (key: string): void => {
  if (globalShortcut.isRegistered(key)) return;

  const didRegister = globalShortcut.register(key, () => {});
  if (!didRegister) {
    console.log(`[Shortcuts] Failed to block shortcut: ${key}`);
  }
};

const unregisterBlockedShortcut = (key: string): void => {
  if (globalShortcut.isRegistered(key)) {
    globalShortcut.unregister(key);
  }
};

export function blockShortcutKeys(
  window: BrowserWindow,
  shortcutKeys: string[]
) {
  window.on("focus", () =>
    shortcutKeys.forEach((key) => {
      registerBlockedShortcut(key);
    })
  );

  window.on("blur", () =>
    shortcutKeys.forEach((key) => {
      unregisterBlockedShortcut(key);
    })
  );

  window.on("show", () =>
    shortcutKeys.forEach((key) => {
      registerBlockedShortcut(key);
    })
  );

  window.on("hide", () =>
    shortcutKeys.forEach((key) => {
      unregisterBlockedShortcut(key);
    })
  );
}
