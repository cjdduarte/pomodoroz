import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import {
  disable as disableAutostart,
  enable as enableAutostart,
} from "@tauri-apps/plugin-autostart";
import {
  open as openDialog,
  save as saveDialog,
} from "@tauri-apps/plugin-dialog";
import { check as checkForUpdates } from "@tauri-apps/plugin-updater";
import { openExternalUrl } from "utils";
import type {
  ExportTasksDialogPayload,
  FromMainChannel,
  FromMainPayloadMap,
  SetInAppAutoUpdatePayload,
  ToMainChannel,
  ToMainPayloadMap,
  TasksExportResultPayload,
  TasksImportResultPayload,
  UpdateAvailablePayload,
} from "ipc";
import {
  CLOSE_WINDOW,
  COMPACT_COLLAPSE,
  COMPACT_EXPAND,
  EXPORT_TASKS_DIALOG,
  INSTALL_UPDATE,
  IMPORT_TASKS_DIALOG,
  MINIMIZE_WINDOW,
  OPEN_RELEASE_PAGE,
  RELEASE_NOTES_LINK,
  SET_ALWAYS_ON_TOP,
  SET_COMPACT_MODE,
  SET_FULLSCREEN_BREAK,
  SET_IN_APP_AUTO_UPDATE,
  SET_NATIVE_TITLEBAR,
  SET_OPEN_AT_LOGIN,
  START_WINDOW_DRAG,
  SET_TRAY_BEHAVIOR,
  SET_TRAY_COPY,
  SET_UI_THEME,
  SHOW_WINDOW,
  TASKS_EXPORT_RESULT,
  TASKS_IMPORT_RESULT,
  TRAY_ICON_UPDATE,
  UPDATE_AVAILABLE,
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

let updaterPolicySyncPromise: Promise<void> | null = null;
let updaterInstallPromise: Promise<void> | null = null;
let updaterChannelSupportPromise: Promise<boolean> | null = null;

type TauriUpdateHandle = NonNullable<
  Awaited<ReturnType<typeof checkForUpdates>>
>;

const isUpdaterChannelSupported = async (): Promise<boolean> => {
  if (updaterChannelSupportPromise) {
    return updaterChannelSupportPromise;
  }

  updaterChannelSupportPromise = invoke<boolean>(
    "is_updater_channel_supported"
  )
    .catch((error: unknown) => {
      console.warn(
        "[TAURI Updater] Failed to determine updater channel support.",
        error
      );
      return false;
    })
    .finally(() => {
      updaterChannelSupportPromise = null;
    });

  return updaterChannelSupportPromise;
};

const closeUpdateHandle = async (updateHandle: TauriUpdateHandle) => {
  await updateHandle.close().catch((closeError: unknown) => {
    console.warn(
      "[TAURI Updater] Failed to close updater handle.",
      closeError
    );
  });
};

const downloadInstallAndRestart = async (
  updateHandle: TauriUpdateHandle,
  source: "policy-sync" | "manual-action"
) => {
  try {
    console.info(
      `[TAURI Updater] Downloading and installing update (${source}).`
    );
    await updateHandle.downloadAndInstall();
  } finally {
    await closeUpdateHandle(updateHandle);
  }

  console.info("[TAURI Updater] Update installed. Restarting app.");
  await invoke("restart_app");
};

const installTauriUpdateAndRestart = async () => {
  if (updaterInstallPromise) {
    return updaterInstallPromise;
  }

  updaterInstallPromise = (async () => {
    const channelSupported = await isUpdaterChannelSupported();
    if (!channelSupported) {
      console.info(
        "[TAURI Updater] Current runtime channel does not support in-app installer flow."
      );
      await openExternalUrl(RELEASE_NOTES_LINK);
      return;
    }

    const updateHandle = await checkForUpdates();
    if (!updateHandle) {
      console.info(
        "[TAURI Updater] Install requested, but no update was found."
      );
      return;
    }

    await downloadInstallAndRestart(updateHandle, "manual-action");
  })().finally(() => {
    updaterInstallPromise = null;
  });

  return updaterInstallPromise;
};

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

const TASK_TRANSFER_FILTERS = [
  {
    name: "JSON",
    extensions: ["json"],
  },
];

const exportTasksWithNativeDialog = async (
  payload: ExportTasksDialogPayload
) => {
  try {
    const filePath = await saveDialog({
      defaultPath:
        payload.suggestedFileName || "pomodoroz-tasks-export.json",
      filters: TASK_TRANSFER_FILTERS,
    });

    if (!filePath) {
      await emitTasksExportResult({
        ok: false,
        canceled: true,
      });
      return;
    }

    await invoke("write_text_file", {
      filePath,
      content: payload.content,
    });

    await emitTasksExportResult({
      ok: true,
      canceled: false,
      filePath,
    });
  } catch (error) {
    await emitTasksExportResult({
      ok: false,
      canceled: false,
      error: buildErrorMessage(error),
    });
  }
};

const importTasksWithNativeDialog = async () => {
  try {
    const selectedPath = await openDialog({
      multiple: false,
      directory: false,
      filters: TASK_TRANSFER_FILTERS,
    });

    if (!selectedPath) {
      await emitTasksImportResult({
        ok: false,
        canceled: true,
      });
      return;
    }

    const filePath = Array.isArray(selectedPath)
      ? selectedPath[0]
      : selectedPath;

    if (!filePath) {
      await emitTasksImportResult({
        ok: false,
        canceled: true,
      });
      return;
    }

    const content = await invoke<string>("read_text_file", {
      filePath,
    });

    await emitTasksImportResult({
      ok: true,
      canceled: false,
      filePath,
      content,
    });
  } catch (error) {
    await emitTasksImportResult({
      ok: false,
      canceled: false,
      error: buildErrorMessage(error),
    });
  }
};

const toUpdateAvailablePayload = (
  version: string,
  updateBody?: string
): UpdateAvailablePayload => ({
  version,
  updateBody: updateBody?.trim() ?? "",
});

const syncTauriUpdatePolicy = async (
  enableInAppAutoUpdate: boolean
) => {
  if (updaterPolicySyncPromise) {
    return updaterPolicySyncPromise;
  }

  updaterPolicySyncPromise = (async () => {
    const channelSupported = await isUpdaterChannelSupported();
    if (!channelSupported) {
      console.info(
        "[TAURI Updater] Skipping policy sync: updater installer flow is not supported for the current runtime channel."
      );
      return;
    }

    let updateHandle: Awaited<ReturnType<typeof checkForUpdates>> =
      null;

    try {
      updateHandle = await checkForUpdates();

      if (!updateHandle) {
        return;
      }

      await emitFromMain(
        UPDATE_AVAILABLE,
        toUpdateAvailablePayload(
          updateHandle.version,
          updateHandle.body
        )
      );

      if (enableInAppAutoUpdate) {
        const installHandle = updateHandle;
        updateHandle = null;
        await downloadInstallAndRestart(installHandle, "policy-sync");
      }
    } catch (error) {
      console.warn(
        "[TAURI Updater] Failed to check updates. Ensure updater plugin endpoints/signature are configured for Tauri releases.",
        error
      );
    } finally {
      if (updateHandle) {
        await closeUpdateHandle(updateHandle);
      }
      updaterPolicySyncPromise = null;
    }
  })();

  return updaterPolicySyncPromise;
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

    case SET_IN_APP_AUTO_UPDATE: {
      const data = payload[0] as SetInAppAutoUpdatePayload;
      await syncTauriUpdatePolicy(data.enableInAppAutoUpdate);
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

    case START_WINDOW_DRAG: {
      await invoke("start_window_drag");
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

    case INSTALL_UPDATE: {
      await installTauriUpdateAndRestart();
      return;
    }

    case EXPORT_TASKS_DIALOG: {
      const data = payload[0] as ExportTasksDialogPayload;
      await exportTasksWithNativeDialog(data);
      return;
    }

    case IMPORT_TASKS_DIALOG: {
      await importTasksWithNativeDialog();
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
};
