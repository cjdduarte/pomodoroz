import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import {
  disable as disableAutostart,
  enable as enableAutostart,
} from "@tauri-apps/plugin-autostart";
import {
  detectSystemLanguage,
  normalizeLanguageCode,
} from "i18n/languages";
import type { LanguageCode } from "store/settings/types";
import { getFromStorage, openExternalUrl } from "utils";
import type {
  ExportTasksDialogPayload,
  FromMainChannel,
  FromMainPayloadMap,
  InvokeMainChannel,
  InvokeMainPayloadMap,
  InvokeMainResponseMap,
  ResetFocusToIdleDialogResult,
  ToMainChannel,
  ToMainPayloadMap,
  TasksExportResultPayload,
  TasksImportResultPayload,
} from "ipc";
import {
  CLOSE_WINDOW,
  COMPACT_COLLAPSE,
  COMPACT_EXPAND,
  CONFIRM_RESET_FOCUS_TO_IDLE,
  EXPORT_TASKS_DIALOG,
  IMPORT_TASKS_DIALOG,
  MINIMIZE_WINDOW,
  OPEN_RELEASE_PAGE,
  RELEASE_NOTES_LINK,
  SET_ALWAYS_ON_TOP,
  SET_COMPACT_MODE,
  SET_FULLSCREEN_BREAK,
  SET_NATIVE_TITLEBAR,
  SET_OPEN_AT_LOGIN,
  SET_TRAY_BEHAVIOR,
  SET_TRAY_COPY,
  SET_UI_THEME,
  SHOW_WINDOW,
  TASKS_EXPORT_RESULT,
  TASKS_IMPORT_RESULT,
  TRAY_ICON_UPDATE,
} from "ipc";
import type { InvokeConnector } from "../InvokeConnector";

const normalizeFromMainPayload = <C extends FromMainChannel>(
  payload: unknown
): FromMainPayloadMap[C] => {
  if (Array.isArray(payload)) {
    return payload as FromMainPayloadMap[C];
  }
  if (typeof payload === "undefined") {
    return [] as FromMainPayloadMap[C];
  }
  return [payload] as FromMainPayloadMap[C];
};

const emitFromMain = async <C extends FromMainChannel>(
  channel: C,
  ...payload: FromMainPayloadMap[C]
) => {
  if (payload.length === 0) {
    await emit(channel);
    return;
  }
  await emit(channel, payload[0]);
};

const buildErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const toInvokeArgs = (payload: unknown): Record<string, unknown> =>
  (payload ?? {}) as Record<string, unknown>;

const dataUrlToPngBytes = (dataUrl: string): number[] => {
  const separatorIndex = dataUrl.indexOf(",");
  if (separatorIndex < 0) {
    throw new Error("Invalid tray icon payload.");
  }

  const base64 = dataUrl.slice(separatorIndex + 1).replace(/\s/g, "");
  const binary = window.atob(base64);
  const bytes: number[] = new Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

type ResetDialogCopy = {
  resetTitle: string;
  resetMessage: string;
  reclassifyTitle: string;
  reclassifyMessage: string;
};

const RESET_DIALOG_COPY: Record<LanguageCode, ResetDialogCopy> = {
  en: {
    resetTitle: "Reset current timer?",
    resetMessage: "Do you want to reset now?",
    reclassifyTitle: "Allocate elapsed focus time to Idle?",
    reclassifyMessage:
      "Move the elapsed time of the current task to Idle?",
  },
  es: {
    resetTitle: "¿Restablecer el temporizador actual?",
    resetMessage: "¿Quieres restablecerlo ahora?",
    reclassifyTitle: "¿Asignar el tiempo transcurrido a Ocioso?",
    reclassifyMessage:
      "¿Mover a Ocioso el tiempo transcurrido de la tarea actual?",
  },
  zh: {
    resetTitle: "重置当前计时器？",
    resetMessage: "是否立即重置？",
    reclassifyTitle: "将已过专注时间分配为空闲？",
    reclassifyMessage: "是否将当前任务的已过时间转为空闲时间？",
  },
  ja: {
    resetTitle: "現在のタイマーをリセットしますか？",
    resetMessage: "今すぐリセットしますか？",
    reclassifyTitle: "経過した集中時間をアイドルに振り替えますか？",
    reclassifyMessage:
      "現在のタスクの経過時間をアイドル時間へ移動しますか？",
  },
  pt: {
    resetTitle: "Resetar o timer atual?",
    resetMessage: "Deseja resetar agora?",
    reclassifyTitle: "Alocar tempo decorrido em Ocioso?",
    reclassifyMessage:
      "Mover o tempo decorrido desta tarefa atual para Ocioso?",
  },
};

const resolvePreferredLanguage = (): LanguageCode => {
  const storedLanguage = getFromStorage<{
    settings?: { language?: string };
  }>("state")?.settings?.language;

  if (storedLanguage && storedLanguage !== "auto") {
    return normalizeLanguageCode(storedLanguage);
  }

  return detectSystemLanguage();
};

const askResetFocusToIdle = (): ResetFocusToIdleDialogResult => {
  const language = resolvePreferredLanguage();
  const copy = RESET_DIALOG_COPY[language];
  const shouldResetNow = window.confirm(
    `${copy.resetTitle}\n\n${copy.resetMessage}`
  );

  if (!shouldResetNow) {
    return "cancel";
  }

  const shouldReclassify = window.confirm(
    `${copy.reclassifyTitle}\n\n${copy.reclassifyMessage}`
  );
  if (shouldReclassify) {
    return "yes";
  }
  return "no";
};

const emitTasksExportResult = async (
  payload: TasksExportResultPayload
) => {
  await emitFromMain(TASKS_EXPORT_RESULT, payload);
};

const emitTasksImportResult = async (
  payload: TasksImportResultPayload
) => {
  await emitFromMain(TASKS_IMPORT_RESULT, payload);
};

const exportTasksFallback = async (
  payload: ExportTasksDialogPayload
) => {
  try {
    const blob = new Blob([payload.content], {
      type: "application/json;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download =
      payload.suggestedFileName || "pomodoroz-tasks-export.json";
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    await emitTasksExportResult({
      ok: true,
      canceled: false,
    });
  } catch (error) {
    await emitTasksExportResult({
      ok: false,
      canceled: false,
      error: buildErrorMessage(error),
    });
  }
};

const importTasksFallback = async () => {
  try {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";
    document.body.append(input);

    let handled = false;
    const cleanup = () => {
      input.remove();
    };

    const markCanceled = () => {
      if (handled) return;
      handled = true;
      cleanup();
      void emitTasksImportResult({
        ok: false,
        canceled: true,
      });
    };

    const onFocus = () => {
      window.setTimeout(markCanceled, 280);
    };

    input.addEventListener("change", () => {
      if (handled) return;
      handled = true;
      window.removeEventListener("focus", onFocus);

      const file = input.files?.[0];
      cleanup();

      if (!file) {
        void emitTasksImportResult({
          ok: false,
          canceled: true,
        });
        return;
      }

      file
        .text()
        .then((content) =>
          emitTasksImportResult({
            ok: true,
            canceled: false,
            filePath: file.name,
            content,
          })
        )
        .catch((error: unknown) =>
          emitTasksImportResult({
            ok: false,
            canceled: false,
            error: buildErrorMessage(error),
          })
        );
    });

    window.addEventListener("focus", onFocus, { once: true });
    input.click();
  } catch (error) {
    await emitTasksImportResult({
      ok: false,
      canceled: false,
      error: buildErrorMessage(error),
    });
  }
};

const sendToTauri = async <C extends ToMainChannel>(
  event: C,
  payload: ToMainPayloadMap[C]
) => {
  switch (event) {
    case SET_ALWAYS_ON_TOP: {
      await invoke("set_always_on_top", toInvokeArgs(payload[0]));
      return;
    }

    case SET_FULLSCREEN_BREAK: {
      await invoke("set_fullscreen_break", toInvokeArgs(payload[0]));
      return;
    }

    case SET_COMPACT_MODE: {
      await invoke("set_compact_mode", toInvokeArgs(payload[0]));
      return;
    }

    case COMPACT_EXPAND: {
      await invoke("compact_expand");
      return;
    }

    case COMPACT_COLLAPSE: {
      await invoke("compact_collapse");
      return;
    }

    case SET_UI_THEME: {
      await invoke("set_ui_theme", toInvokeArgs(payload[0]));
      return;
    }

    case SET_NATIVE_TITLEBAR: {
      await invoke("set_native_titlebar", toInvokeArgs(payload[0]));
      return;
    }

    case SET_OPEN_AT_LOGIN: {
      const data = payload[0] as { openAtLogin: boolean };
      if (data.openAtLogin) {
        await enableAutostart();
      } else {
        await disableAutostart();
      }
      return;
    }

    case SET_TRAY_BEHAVIOR: {
      await invoke("set_tray_behavior", toInvokeArgs(payload[0]));
      return;
    }

    case SET_TRAY_COPY: {
      await invoke("set_tray_copy", toInvokeArgs(payload[0]));
      return;
    }

    case SHOW_WINDOW: {
      await invoke("show_window");
      return;
    }

    case MINIMIZE_WINDOW: {
      await invoke("minimize_window", toInvokeArgs(payload[0]));
      return;
    }

    case CLOSE_WINDOW: {
      // `closeToTray` is handled entirely on the Rust side via
      // `TrayBehaviorState` + `CloseRequested` event. The renderer
      // just asks for a close — the event handler decides the outcome.
      await invoke("close_window");
      return;
    }

    case OPEN_RELEASE_PAGE: {
      await openExternalUrl(RELEASE_NOTES_LINK);
      return;
    }

    case EXPORT_TASKS_DIALOG: {
      const data = payload[0] as ExportTasksDialogPayload;
      await exportTasksFallback(data);
      return;
    }

    case IMPORT_TASKS_DIALOG: {
      await importTasksFallback();
      return;
    }

    case TRAY_ICON_UPDATE: {
      const dataUrl = payload[0] as string;
      await invoke("set_tray_icon", {
        pngBytes: dataUrlToPngBytes(dataUrl),
      });
      return;
    }

    default:
      console.warn(`[TAURI IPC] Unhandled channel: ${event}`);
      return;
  }
};

export const TauriInvokeConnector: InvokeConnector = {
  send: <C extends ToMainChannel>(
    event: C,
    ...payload: ToMainPayloadMap[C]
  ) => {
    void sendToTauri(event, payload).catch((error: unknown) => {
      console.error("[TAURI IPC] Failed to send command.", error);
    });
  },

  receive: <C extends FromMainChannel>(
    event: C,
    response: (...payload: FromMainPayloadMap[C]) => void
  ) => {
    let disposed = false;
    let unlisten: (() => void) | null = null;

    void listen(event, (tauriEvent) => {
      const normalizedPayload = normalizeFromMainPayload<C>(
        tauriEvent.payload
      );
      response(...normalizedPayload);
    })
      .then((cleanup) => {
        if (disposed) {
          cleanup();
          return;
        }
        unlisten = cleanup;
      })
      .catch((error: unknown) => {
        console.error(
          "[TAURI IPC] Failed to subscribe to event.",
          error
        );
      });

    return () => {
      disposed = true;
      if (unlisten) {
        unlisten();
      }
    };
  },

  invoke: async <C extends InvokeMainChannel>(
    event: C,
    ..._payload: InvokeMainPayloadMap[C]
  ): Promise<InvokeMainResponseMap[C]> => {
    if (event === CONFIRM_RESET_FOCUS_TO_IDLE) {
      return askResetFocusToIdle() as InvokeMainResponseMap[C];
    }

    throw new Error(`[TAURI IPC] Unsupported invoke channel: ${event}`);
  },
};
