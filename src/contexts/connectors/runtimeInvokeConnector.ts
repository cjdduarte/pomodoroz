import type { InvokeConnector } from "../InvokeConnector";
import { TauriInvokeConnector } from "./TauriInvokeConnector";

export type RuntimeKind = "tauri" | "browser";

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
  if (isTauriRuntime()) {
    return "tauri";
  }

  return "browser";
};

export const getRuntimeInvokeConnector = ():
  | InvokeConnector
  | undefined => {
  switch (getRuntimeKind()) {
    case "tauri":
      return TauriInvokeConnector;
    default:
      return undefined;
  }
};
