import { invoke } from "@tauri-apps/api/core";
import { getRuntimeKind } from "contexts/connectors/runtimeInvokeConnector";

let tauriPermissionGrantedCache: boolean | null = null;
let hasLoggedPendingPermission = false;

const isNotificationApiAvailable = (): boolean =>
  typeof window !== "undefined" && "Notification" in window;

const normalizePermissionState = (
  state: unknown
): NotificationPermission => {
  if (state === true || state === "granted") {
    return "granted";
  }
  if (state === false || state === "denied") {
    return "denied";
  }
  return "default";
};

const normalizeTauriPermissionState = (
  state: unknown
): NotificationPermission => {
  if (state === true) {
    return "granted";
  }
  if (state === false) {
    return "denied";
  }
  if (state === null) {
    return "default";
  }
  return normalizePermissionState(state);
};

const readNotificationPermission =
  (): NotificationPermission | null => {
    if (!isNotificationApiAvailable()) {
      return null;
    }

    return normalizePermissionState(window.Notification.permission);
  };

const updatePermissionCache = (permission: NotificationPermission) => {
  if (permission === "granted") {
    tauriPermissionGrantedCache = true;
    return;
  }

  if (permission === "denied") {
    tauriPermissionGrantedCache = false;
    return;
  }

  tauriPermissionGrantedCache = null;
};

const readTauriNotificationPermission =
  async (): Promise<NotificationPermission> => {
    const permissionState = await invoke<null | boolean>(
      "plugin:notification|is_permission_granted"
    ).catch((error: unknown) => {
      console.warn(
        "[TAURI Notification] Falha ao consultar permissão:",
        error
      );
      return null;
    });

    return normalizeTauriPermissionState(permissionState);
  };

const requestTauriNotificationPermission =
  async (): Promise<NotificationPermission> => {
    const permissionState = await invoke<string>(
      "plugin:notification|request_permission"
    ).catch((error: unknown) => {
      console.warn(
        "[TAURI Notification] Falha ao solicitar permissão:",
        error
      );
      return "denied";
    });

    return normalizeTauriPermissionState(permissionState);
  };

const sendTauriNativeNotification = async (
  title: string,
  options: NotificationOptions
) => {
  await invoke("plugin:notification|notify", {
    options: {
      title,
      body: options.body,
      icon: options.icon,
    },
  }).catch((error: unknown) => {
    console.warn(
      "[TAURI Notification] Falha ao enviar notificação:",
      error
    );
  });
};

export const requestDesktopNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (getRuntimeKind() === "tauri") {
      const currentPermission = await readTauriNotificationPermission();
      if (currentPermission !== "default") {
        updatePermissionCache(currentPermission);
        return currentPermission;
      }

      const requestedPermission =
        await requestTauriNotificationPermission();
      updatePermissionCache(requestedPermission);
      return requestedPermission;
    }

    const currentPermission = readNotificationPermission();
    if (!currentPermission) {
      console.warn(
        "[Notification] API de notificação não disponível neste runtime."
      );
      return "denied";
    }

    if (currentPermission !== "default") {
      updatePermissionCache(currentPermission);
      return currentPermission;
    }

    const requestedPermission =
      await window.Notification.requestPermission().catch(
        () => "denied" as NotificationPermission
      );

    const normalizedPermission = normalizePermissionState(
      requestedPermission
    );
    updatePermissionCache(normalizedPermission);
    return normalizedPermission;
  };

const hasDesktopNotificationPermission = async (): Promise<boolean> => {
  if (tauriPermissionGrantedCache === true) {
    return true;
  }

  if (getRuntimeKind() === "tauri") {
    const tauriPermission = await readTauriNotificationPermission();
    updatePermissionCache(tauriPermission);

    if (tauriPermission === "granted") {
      return true;
    }

    if (tauriPermission === "default" && !hasLoggedPendingPermission) {
      console.info(
        "[TAURI Notification] Permissão pendente. Solicite em Ajustes (ação do usuário)."
      );
      hasLoggedPendingPermission = true;
    }

    return false;
  }

  const browserPermission = readNotificationPermission();
  if (browserPermission === "granted") {
    tauriPermissionGrantedCache = true;
    return true;
  }

  if (browserPermission === "denied") {
    tauriPermissionGrantedCache = false;
    return false;
  }

  if (browserPermission === null) {
    return false;
  }

  return false;
};

const showBrowserNotification = async (
  title: string,
  options: NotificationOptions
) => {
  if (!isNotificationApiAvailable()) {
    return;
  }

  const NotificationApi = window.Notification;
  const currentPermission = NotificationApi.permission;

  if (currentPermission === "granted") {
    new NotificationApi(title, options);
  }
};

export const showDesktopNotification = async (
  title: string,
  options: NotificationOptions
) => {
  const hasPermission = await hasDesktopNotificationPermission();
  if (!hasPermission) {
    return;
  }

  if (getRuntimeKind() === "tauri") {
    await sendTauriNativeNotification(title, options);
    return;
  }

  await showBrowserNotification(title, options);
};
