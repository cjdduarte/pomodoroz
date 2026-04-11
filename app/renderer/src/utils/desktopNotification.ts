import {
  isPermissionGranted as isTauriPermissionGranted,
  requestPermission as requestTauriPermission,
  sendNotification as sendTauriNotification,
} from "@tauri-apps/plugin-notification";
import { getRuntimeKind } from "contexts/connectors/runtimeInvokeConnector";

let tauriPermissionGrantedCache: boolean | null = null;
let tauriPermissionInFlight: Promise<boolean> | null = null;

const isGrantedPermissionState = (state: unknown): boolean =>
  state === true || state === "granted";

const ensureTauriNotificationPermission =
  async (): Promise<boolean> => {
    if (tauriPermissionGrantedCache !== null) {
      return tauriPermissionGrantedCache;
    }

    if (tauriPermissionInFlight) {
      return tauriPermissionInFlight;
    }

    tauriPermissionInFlight = (async () => {
      const granted = await isTauriPermissionGranted().catch(
        (error: unknown) => {
          console.warn(
            "[TAURI Notification] Falha ao consultar permissão:",
            error
          );
          return false;
        }
      );

      if (granted) {
        tauriPermissionGrantedCache = true;
        return true;
      }

      const permissionState = await requestTauriPermission().catch(
        (error: unknown) => {
          console.warn(
            "[TAURI Notification] Falha ao solicitar permissão:",
            error
          );
          return "denied";
        }
      );

      const permissionGranted =
        isGrantedPermissionState(permissionState);
      tauriPermissionGrantedCache = permissionGranted;
      return permissionGranted;
    })();

    const result = await tauriPermissionInFlight;
    tauriPermissionInFlight = null;
    return result;
  };

const showBrowserNotification = async (
  title: string,
  options: NotificationOptions
) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  const NotificationApi = window.Notification;
  const currentPermission = NotificationApi.permission;

  if (currentPermission === "granted") {
    new NotificationApi(title, options);
    return;
  }

  if (currentPermission === "default") {
    const permission = await NotificationApi.requestPermission().catch(
      () => "denied" as NotificationPermission
    );
    if (permission === "granted") {
      new NotificationApi(title, options);
    }
  }
};

export const showDesktopNotification = async (
  title: string,
  options: NotificationOptions
) => {
  if (getRuntimeKind() === "tauri") {
    const granted = await ensureTauriNotificationPermission();
    if (!granted) return;

    await Promise.resolve(
      sendTauriNotification({
        title,
        body: options.body,
        icon: options.icon,
      })
    ).catch((error: unknown) => {
      console.warn(
        "[TAURI Notification] Falha ao enviar notificação:",
        error
      );
    });
    return;
  }

  await showBrowserNotification(title, options);
};
