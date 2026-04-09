import React, {
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ConnectorContext } from "../ConnectorContext";
import { useAppSelector, useAppDispatch } from "hooks/storeHooks";
import { CounterContext } from "../CounterContext";
import {
  CLOSE_WINDOW,
  MINIMIZE_WINDOW,
  OPEN_RELEASE_PAGE,
  SET_ALWAYS_ON_TOP,
  SET_COMPACT_MODE,
  SET_FULLSCREEN_BREAK,
  SET_IN_APP_AUTO_UPDATE,
  SET_NATIVE_TITLEBAR,
  SET_OPEN_AT_LOGIN,
  SET_TRAY_BEHAVIOR,
  SET_UI_THEME,
  SHOW_WINDOW,
  TRAY_ICON_UPDATE,
  UPDATE_AVAILABLE,
  type ToMainChannel,
  type ToMainPayloadMap,
  type UpdateAvailablePayload,
} from "ipc";
import { useTrayIconUpdates } from "hooks/useTrayIconUpdates";
import { setUpdateBody, setUpdateVersion } from "store/update";
import { getFromStorage } from "utils";
import { isFreshInstallProfile } from "store";
import { TauriInvokeConnector } from "./TauriInvokeConnector";

const AUTO_UPDATE_POLICY_PROMPT_SEEN_KEY =
  "auto-update-policy-prompt-seen";
const AUTO_UPDATE_POLICY_PROMPT_PENDING_KEY =
  "auto-update-policy-prompt-pending-choice";

const IPC_ERROR_MESSAGE =
  "Falha ao comunicar com o runtime nativo (Tauri). Reinicie o app.";

export const TauriConnectorProvider = ({
  children,
}: PropsWithChildren) => {
  const dispatch = useAppDispatch();
  const timer = useAppSelector((state) => state.timer);
  const settings = useAppSelector((state) => state.settings);
  const ignoreUpdateRef = useRef(settings.ignoreUpdate);
  const [connectorError, setConnectorError] = useState<string | null>(
    null
  );
  const { shouldRequestFullscreen } = useContext(CounterContext);

  const clearConnectorError = useCallback(() => {
    setConnectorError(null);
  }, []);

  const setConnectorIpcError = useCallback((error: unknown) => {
    console.error("[TAURI IPC] Native communication error.", error);
    setConnectorError(IPC_ERROR_MESSAGE);
  }, []);

  const sendToMain = useCallback(
    <C extends ToMainChannel>(
      channel: C,
      ...payload: ToMainPayloadMap[C]
    ) => {
      try {
        TauriInvokeConnector.send(channel, ...payload);
        clearConnectorError();
      } catch (error) {
        setConnectorIpcError(error);
      }
    },
    [clearConnectorError, setConnectorIpcError]
  );

  useEffect(() => {
    ignoreUpdateRef.current = settings.ignoreUpdate;
  }, [settings.ignoreUpdate]);

  const onMinimizeCallback = useCallback(() => {
    sendToMain(MINIMIZE_WINDOW, {
      minimizeToTray: settings.minimizeToTray,
    });
  }, [sendToMain, settings.minimizeToTray]);

  const onExitCallback = useCallback(() => {
    sendToMain(CLOSE_WINDOW, {
      closeToTray: settings.closeToTray,
    });
  }, [sendToMain, settings.closeToTray]);

  const openExternalCallback = useCallback(() => {
    sendToMain(OPEN_RELEASE_PAGE);
  }, [sendToMain]);

  useEffect(() => {
    if (!settings.enableFullscreenBreak) {
      sendToMain(SHOW_WINDOW);
    }
  }, [sendToMain, timer.timerType, settings.enableFullscreenBreak]);

  useEffect(() => {
    if (!shouldRequestFullscreen) return;
    sendToMain(SHOW_WINDOW);
  }, [sendToMain, shouldRequestFullscreen]);

  useEffect(() => {
    sendToMain(SET_ALWAYS_ON_TOP, {
      alwaysOnTop: settings.alwaysOnTop,
    });
  }, [sendToMain, settings.alwaysOnTop]);

  useEffect(() => {
    sendToMain(SET_FULLSCREEN_BREAK, {
      shouldFullscreen: shouldRequestFullscreen,
      alwaysOnTop: settings.alwaysOnTop,
    });
  }, [sendToMain, settings.alwaysOnTop, shouldRequestFullscreen]);

  useEffect(() => {
    sendToMain(SET_TRAY_BEHAVIOR, {
      minimizeToTray: settings.minimizeToTray,
      closeToTray: settings.closeToTray,
    });
  }, [sendToMain, settings.closeToTray, settings.minimizeToTray]);

  useEffect(() => {
    sendToMain(SET_COMPACT_MODE, {
      compactMode: settings.compactMode,
    });
  }, [sendToMain, settings.compactMode]);

  useEffect(() => {
    sendToMain(SET_UI_THEME, {
      isDarkMode: settings.enableDarkTheme,
    });
  }, [sendToMain, settings.enableDarkTheme]);

  useEffect(() => {
    sendToMain(SET_NATIVE_TITLEBAR, {
      useNativeTitlebar: settings.useNativeTitlebar,
    });
  }, [sendToMain, settings.useNativeTitlebar]);

  useEffect(() => {
    sendToMain(SET_OPEN_AT_LOGIN, {
      openAtLogin: settings.openAtLogin,
    });
  }, [sendToMain, settings.openAtLogin]);

  useEffect(() => {
    const hasSeenPrompt =
      getFromStorage<boolean>(AUTO_UPDATE_POLICY_PROMPT_SEEN_KEY) ===
      true;
    const hasPendingChoice =
      getFromStorage<boolean>(AUTO_UPDATE_POLICY_PROMPT_PENDING_KEY) ===
      true;
    const shouldDeferPolicySync =
      hasPendingChoice || (isFreshInstallProfile && !hasSeenPrompt);

    if (shouldDeferPolicySync) {
      return;
    }

    sendToMain(SET_IN_APP_AUTO_UPDATE, {
      enableInAppAutoUpdate: settings.enableInAppAutoUpdate,
    });
  }, [sendToMain, settings.enableInAppAutoUpdate]);

  useEffect(() => {
    const cleanup = TauriInvokeConnector.receive(
      UPDATE_AVAILABLE,
      (payload: UpdateAvailablePayload) => {
        const version = payload.version;
        const updateBody = payload.updateBody;

        if (!version || version === ignoreUpdateRef.current) {
          return;
        }

        dispatch(setUpdateVersion(version));
        dispatch(setUpdateBody(updateBody));
      }
    );

    clearConnectorError();
    return cleanup;
  }, [clearConnectorError, dispatch]);

  useTrayIconUpdates((dataUrl) => {
    sendToMain(TRAY_ICON_UPDATE, dataUrl);
  });

  return (
    <ConnectorContext.Provider
      value={{
        onMinimizeCallback,
        onExitCallback,
        openExternalCallback,
        connectorError,
        dismissConnectorError: clearConnectorError,
      }}
    >
      {children}
    </ConnectorContext.Provider>
  );
};
