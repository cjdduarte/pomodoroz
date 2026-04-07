import { contextBridge, ipcRenderer, shell } from "electron";
import {
  type ToMainChannel,
  type FromMainChannel,
  type InvokeMainChannel,
  type ToMainPayloadMap,
  type FromMainPayloadMap,
  type InvokeMainPayloadMap,
  type InvokeMainResponseMap,
} from "@pomodoroz/shareables";

type IpcResponseHandler<C extends FromMainChannel> = (
  ...args: FromMainPayloadMap[C]
) => void;

// Keep runtime channel lists local to preload.
// Importing workspace packages at runtime in sandboxed preload can fail.
const TO_MAIN_CHANNELS: readonly ToMainChannel[] = [
  "SET_ALWAYS_ON_TOP",
  "SET_FULLSCREEN_BREAK",
  "SET_TRAY_BEHAVIOR",
  "SET_COMPACT_MODE",
  "COMPACT_EXPAND",
  "COMPACT_COLLAPSE",
  "SET_NATIVE_TITLEBAR",
  "SET_OPEN_AT_LOGIN",
  "TRAY_ICON_UPDATE",
  "SET_UI_THEME",
  "MINIMIZE_WINDOW",
  "CLOSE_WINDOW",
  "SHOW_WINDOW",
  "INSTALL_UPDATE",
  "EXPORT_TASKS_DIALOG",
  "IMPORT_TASKS_DIALOG",
];

const FROM_MAIN_CHANNELS: readonly FromMainChannel[] = [
  "UPDATE_AVAILABLE",
  "FULLSCREEN_BREAK_ENTERED",
  "FULLSCREEN_BREAK_EXITED",
  "TASKS_EXPORT_RESULT",
  "TASKS_IMPORT_RESULT",
];

const INVOKE_MAIN_CHANNELS: readonly InvokeMainChannel[] = [
  "CONFIRM_RESET_FOCUS_TO_IDLE",
];

// https://github.com/electron/electron/issues/9920#issuecomment-575839738

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

const isToMainChannel = (channel: string): channel is ToMainChannel =>
  (TO_MAIN_CHANNELS as readonly string[]).includes(channel);

const isFromMainChannel = (
  channel: string
): channel is FromMainChannel =>
  (FROM_MAIN_CHANNELS as readonly string[]).includes(channel);

const isInvokeMainChannel = (
  channel: string
): channel is InvokeMainChannel =>
  (INVOKE_MAIN_CHANNELS as readonly string[]).includes(channel);

contextBridge.exposeInMainWorld("electron", {
  send: <C extends ToMainChannel>(
    channel: C,
    ...args: ToMainPayloadMap[C]
  ) => {
    if (isToMainChannel(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  receive: <C extends FromMainChannel>(
    channel: C,
    response: IpcResponseHandler<C>
  ) => {
    if (!isFromMainChannel(channel)) {
      return () => undefined;
    }

    const listener = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ) => response(...(args as FromMainPayloadMap[C]));

    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  invoke: <C extends InvokeMainChannel>(
    channel: C,
    ...args: InvokeMainPayloadMap[C]
  ): Promise<InvokeMainResponseMap[C]> => {
    if (!isInvokeMainChannel(channel)) {
      return Promise.reject(
        new Error(`Invalid IPC channel: ${channel}`)
      );
    }

    return ipcRenderer.invoke(channel, ...args) as Promise<
      InvokeMainResponseMap[C]
    >;
  },
  openExternal: (
    url: string,
    options?: Electron.OpenExternalOptions
  ) => {
    if (!isSafeExternalUrl(url)) return Promise.resolve();
    return shell.openExternal(url, options);
  },
});
