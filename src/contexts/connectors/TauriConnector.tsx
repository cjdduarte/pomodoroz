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
  detectSystemLanguage,
  normalizeLanguageCode,
} from "i18n/languages";
import type { LanguageCode } from "store/settings/types";
import { detectOS, getFromStorage } from "utils";
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
  START_WINDOW_DRAG,
  SET_TRAY_BEHAVIOR,
  SET_TRAY_COPY,
  SET_UI_THEME,
  SHOW_WINDOW,
  TRAY_ICON_UPDATE,
  UPDATE_AVAILABLE,
  WINDOW_RESTORED_EVENT,
  type ToMainChannel,
  type ToMainPayloadMap,
  type UpdateAvailablePayload,
} from "ipc";
import { listen } from "@tauri-apps/api/event";
import { useTrayIconUpdates } from "hooks/useTrayIconUpdates";
import { setUpdateBody, setUpdateVersion } from "store/update";
import { isFreshInstallProfile } from "store";
import { TauriInvokeConnector } from "./TauriInvokeConnector";

const IPC_ERROR_MESSAGE =
  "Falha ao comunicar com o runtime nativo (Tauri). Reinicie o app.";
const AUTO_UPDATE_POLICY_PROMPT_SEEN_KEY =
  "auto-update-policy-prompt-seen";
const AUTO_UPDATE_POLICY_PROMPT_PENDING_KEY =
  "auto-update-policy-prompt-pending-choice";

type TrayCopy = {
  restoreLabel: string;
  quitLabel: string;
  tooltip: string;
};

const TRAY_COPY_BY_LANGUAGE: Record<LanguageCode, TrayCopy> = {
  en: {
    restoreLabel: "Restore Pomodoroz",
    quitLabel: "Quit",
    tooltip: "Pomodoroz",
  },
  es: {
    restoreLabel: "Restaurar Pomodoroz",
    quitLabel: "Salir",
    tooltip: "Pomodoroz",
  },
  zh: {
    restoreLabel: "还原 Pomodoroz",
    quitLabel: "退出",
    tooltip: "Pomodoroz",
  },
  ja: {
    restoreLabel: "Pomodoroz を復元",
    quitLabel: "終了",
    tooltip: "Pomodoroz",
  },
  pt: {
    restoreLabel: "Restaurar Pomodoroz",
    quitLabel: "Sair",
    tooltip: "Pomodoroz",
  },
  de: {
    restoreLabel: "Pomodoroz wiederherstellen",
    quitLabel: "Beenden",
    tooltip: "Pomodoroz",
  },
  fr: {
    restoreLabel: "Restaurer Pomodoroz",
    quitLabel: "Quitter",
    tooltip: "Pomodoroz",
  },
};

const resolveTrayLanguage = (language: string): LanguageCode => {
  if (language === "auto") {
    return detectSystemLanguage();
  }
  return normalizeLanguageCode(language);
};

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

  const onTitlebarDragStart = useCallback(() => {
    sendToMain(START_WINDOW_DRAG);
  }, [sendToMain]);

  const openExternalCallback = useCallback(() => {
    sendToMain(OPEN_RELEASE_PAGE);
  }, [sendToMain]);

  useEffect(() => {
    sendToMain(SET_TRAY_BEHAVIOR, {
      minimizeToTray: settings.minimizeToTray,
      closeToTray: settings.closeToTray,
    });
  }, [sendToMain, settings.closeToTray, settings.minimizeToTray]);

  useEffect(() => {
    const language = resolveTrayLanguage(settings.language);
    sendToMain(SET_TRAY_COPY, TRAY_COPY_BY_LANGUAGE[language]);
  }, [sendToMain, settings.language]);

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
    if (detectOS() !== "Linux") {
      return undefined;
    }

    // Workaround do Linux/webkit2gtk:
    // quando o Rust restaura da bandeja, o toggle de resizable
    // usado para recuperar input grab pode deixar `:hover` preso.
    // Suprimimos hover no `<html>` até o próximo mousemove real.
    let unlisten: (() => void) | null = null;
    let clearTimer: number | null = null;
    let disposed = false;

    const clearSuppression = () => {
      document.documentElement.removeAttribute("data-suppress-hover");
      window.removeEventListener("mousemove", clearSuppression, true);
      if (clearTimer !== null) {
        window.clearTimeout(clearTimer);
        clearTimer = null;
      }
    };

    void listen(WINDOW_RESTORED_EVENT, () => {
      document.documentElement.setAttribute(
        "data-suppress-hover",
        "true"
      );
      window.addEventListener("mousemove", clearSuppression, true);
      if (clearTimer !== null) {
        window.clearTimeout(clearTimer);
      }
      // Fallback: se o cursor ficar parado fora da janela e não
      // vier mousemove, limpamos o estado após 2s.
      clearTimer = window.setTimeout(clearSuppression, 2000);
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
          "[TAURI IPC] Failed to subscribe to window-restored.",
          error
        );
      });

    return () => {
      disposed = true;
      clearSuppression();
      if (unlisten) {
        unlisten();
      }
    };
  }, []);

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
        onTitlebarDragStart,
        openExternalCallback,
        connectorError,
        dismissConnectorError: clearConnectorError,
      }}
    >
      {children}
    </ConnectorContext.Provider>
  );
};
