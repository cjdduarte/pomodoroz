import isElectron from "is-electron";
import type { InvokeConnector } from "../InvokeConnector";
import { ElectronInvokeConnector } from "./ElectronInvokeConnector";
import { TauriInvokeConnector } from "./TauriInvokeConnector";

export type RuntimeKind = "electron" | "tauri" | "browser";

export const isTauriRuntime = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const globalWindow = window as unknown as {
    isTauri?: boolean;
    __TAURI_INTERNALS__?: unknown;
  };
  return Boolean(
    globalWindow.isTauri || globalWindow.__TAURI_INTERNALS__
  );
};

export const getRuntimeKind = (): RuntimeKind => {
  if (isElectron()) {
    return "electron";
  }

  if (isTauriRuntime()) {
    return "tauri";
  }

  return "browser";
};

export const getRuntimeInvokeConnector = ():
  | InvokeConnector
  | undefined => {
  switch (getRuntimeKind()) {
    case "electron":
      return ElectronInvokeConnector;
    case "tauri":
      return TauriInvokeConnector;
    default:
      return undefined;
  }
};
