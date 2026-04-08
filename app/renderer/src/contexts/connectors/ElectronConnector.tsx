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
  SET_ALWAYS_ON_TOP,
  CLOSE_WINDOW,
  SET_COMPACT_MODE,
  SET_FULLSCREEN_BREAK,
  SET_TRAY_BEHAVIOR,
  MINIMIZE_WINDOW,
  SET_NATIVE_TITLEBAR,
  SHOW_WINDOW,
  SET_UI_THEME,
  SET_IN_APP_AUTO_UPDATE,
  TRAY_ICON_UPDATE,
  SET_OPEN_AT_LOGIN,
  UPDATE_AVAILABLE,
  type UpdateAvailablePayload,
  type ToMainChannel,
  type ToMainPayloadMap,
} from "@pomodoroz/shareables";
import { InvokeConnector } from "../InvokeConnector";
import { useTrayIconUpdates } from "hooks/useTrayIconUpdates";
import { setUpdateBody, setUpdateVersion } from "store/update";
import { getFromStorage } from "utils";
import { isFreshInstallProfile } from "store";

const AUTO_UPDATE_POLICY_PROMPT_SEEN_KEY =
  "auto-update-policy-prompt-seen";
const AUTO_UPDATE_POLICY_PROMPT_PENDING_KEY =
  "auto-update-policy-prompt-pending-choice";

const IPC_ERROR_MESSAGE =
  "Falha ao comunicar com o processo nativo. Reinicie o app.";

export const ElectronInvokeConnector: InvokeConnector = {
  send: <C extends ToMainChannel>(
    event: C,
    ...payload: ToMainPayloadMap[C]
  ) => {
    const { electron } = window;
    if (!electron?.send) {
      console.error("[IPC] Native send API is unavailable.");
      return;
    }

    try {
      electron.send(event, ...payload);
    } catch (error) {
      console.error("[IPC] Failed to send message to main.", error);
    }
  },
};

export const ElectronConnectorProvider = ({
  children,
}: PropsWithChildren) => {
  const { electron } = window;
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
    console.error("[IPC] Native communication error.", error);
    setConnectorError(IPC_ERROR_MESSAGE);
  }, []);

  const sendToMain = useCallback(
    <C extends ToMainChannel>(
      channel: C,
      ...payload: ToMainPayloadMap[C]
    ) => {
      try {
        electron.send(channel, ...payload);
        clearConnectorError();
      } catch (error) {
        setConnectorIpcError(error);
      }
    },
    [clearConnectorError, electron, setConnectorIpcError]
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

  const openExternalCallback = useCallback(() => undefined, []);

  useEffect(() => {
    if (!settings.enableFullscreenBreak) {
      sendToMain(SHOW_WINDOW);
    }
  }, [sendToMain, timer.timerType, settings.enableFullscreenBreak]);

  useEffect(() => {
    if (!shouldRequestFullscreen) return;

    // Ensure tray-hidden windows are visible before fullscreen is requested.
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
    let cleanup = () => {};
    try {
      cleanup = electron.receive(
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
    } catch (error) {
      setConnectorIpcError(error);
    }

    return cleanup;
  }, [clearConnectorError, dispatch, electron, setConnectorIpcError]);

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
