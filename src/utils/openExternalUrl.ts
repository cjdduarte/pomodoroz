import { openUrl as openTauriUrl } from "@tauri-apps/plugin-opener";
import { getRuntimeKind } from "contexts/connectors/runtimeInvokeConnector";

const isAllowedExternalUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

export const openExternalUrl = async (
  url: string
): Promise<boolean> => {
  if (!isAllowedExternalUrl(url)) {
    console.warn("[External URL] URL inválida bloqueada:", url);
    return false;
  }

  if (getRuntimeKind() === "tauri") {
    return Promise.resolve(openTauriUrl(url))
      .then(() => true)
      .catch((error: unknown) => {
        console.warn(
          "[External URL] Falha ao abrir URL no runtime Tauri:",
          error
        );
        return false;
      });
  }

  if (typeof window === "undefined") {
    return false;
  }

  const openedWindow = window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

  if (openedWindow) {
    return true;
  }

  try {
    window.location.assign(url);
    return true;
  } catch (error) {
    console.warn(
      "[External URL] Falha ao abrir URL no navegador:",
      error
    );
    return false;
  }
};
