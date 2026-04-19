import { invoke } from "@tauri-apps/api/core";

let tauriPermissionGrantedCache: boolean | null = null;
let hasLoggedPendingPermission = false;

const normalizeTauriPermissionState = (
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
    const currentPermission = await readTauriNotificationPermission();
    if (currentPermission !== "default") {
      updatePermissionCache(currentPermission);
      return currentPermission;
    }

    const requestedPermission =
      await requestTauriNotificationPermission();
    updatePermissionCache(requestedPermission);
    return requestedPermission;
  };

const hasDesktopNotificationPermission = async (): Promise<boolean> => {
  if (tauriPermissionGrantedCache === true) {
    return true;
  }

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
};

export const showDesktopNotification = async (
  title: string,
  options: NotificationOptions
) => {
  const hasPermission = await hasDesktopNotificationPermission();
  if (!hasPermission) {
    return;
  }

  await sendTauriNativeNotification(title, options);
};
