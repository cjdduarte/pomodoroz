import { globalShortcut } from "electron";

const EXIT_SHORTCUTS = {
  ESCAPE: "Escape",
  ESCAPE_LEGACY: "Esc",
  QUIT: "CommandOrControl+W",
};

type ShortCut = {
  key: string;
  callback: () => void;
};

function registerShortcut(key: string, callback: () => void) {
  if (globalShortcut.isRegistered(key)) return;

  const didRegister = globalShortcut.register(key, callback);
  if (!didRegister) {
    console.log(`[Shortcuts] Failed to register shortcut: ${key}`);
  }
}

export function activateGlobalShortcuts(shortcuts: ShortCut[]) {
  shortcuts.forEach(({ key, callback }) => {
    registerShortcut(key, callback);
  });
}

export function activateFullScreenShortcuts(
  exitFullScreenCallback: () => void
) {
  registerShortcut(EXIT_SHORTCUTS.ESCAPE, exitFullScreenCallback);
  registerShortcut(
    EXIT_SHORTCUTS.ESCAPE_LEGACY,
    exitFullScreenCallback
  );
  registerShortcut(EXIT_SHORTCUTS.QUIT, exitFullScreenCallback);
}

export function deactivateFullScreenShortcuts() {
  globalShortcut.unregister(EXIT_SHORTCUTS.ESCAPE);
  globalShortcut.unregister(EXIT_SHORTCUTS.ESCAPE_LEGACY);
  globalShortcut.unregister(EXIT_SHORTCUTS.QUIT);
}
