import { BrowserWindow } from "electron";

const getFromStorage = async <T = unknown>(
  win: BrowserWindow,
  key: string
): Promise<T | undefined> => {
  try {
    const data = (await win.webContents.executeJavaScript(
      `localStorage.getItem("${key}")`
    )) as string | null;
    if (data === null) {
      return undefined;
    }
    return JSON.parse(data) as T;
  } catch {
    return undefined;
  }
};

export { getFromStorage };
