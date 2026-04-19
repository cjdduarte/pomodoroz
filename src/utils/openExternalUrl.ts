import { openUrl as openTauriUrl } from "@tauri-apps/plugin-opener";

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

  return Promise.resolve(openTauriUrl(url))
    .then(() => true)
    .catch((error: unknown) => {
      console.warn(
        "[External URL] Falha ao abrir URL no runtime Tauri:",
        error
      );
      return false;
    });
};
