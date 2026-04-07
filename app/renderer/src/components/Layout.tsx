import React, {
  useEffect,
  useContext,
  useCallback,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router";
import { StyledLayout } from "styles";

import Alert from "./Alert";
import Titlebar from "./Titlebar";
import Navigation from "./Navigation";
import {
  ThemeContext,
  ConnectorContext,
  CounterContext,
} from "contexts";
import { TimerStatus } from "store/timer/types";
import { useAppSelector } from "hooks/storeHooks";

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const timer = useAppSelector((state) => state.timer);

  const settings = useAppSelector((state) => state.settings);

  const { toggleThemeAction } = useContext(ThemeContext);
  const { connectorError, dismissConnectorError } =
    useContext(ConnectorContext);
  const { shouldFullscreen } = useContext(CounterContext);

  const [noTransition, setNoTransition] = useState(false);

  const registerKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === "KeyT") {
        if (toggleThemeAction) toggleThemeAction();
      }
    },
    [toggleThemeAction]
  );

  useEffect(() => {
    document.addEventListener("keydown", registerKey);
    return () => document.removeEventListener("keydown", registerKey);
  }, [registerKey]);

  useEffect(() => {
    const isBreakMode =
      timer.timerType === TimerStatus.SHORT_BREAK ||
      timer.timerType === TimerStatus.LONG_BREAK ||
      timer.timerType === TimerStatus.SPECIAL_BREAK;

    const shouldLockToTimer =
      settings.enableFullscreenBreak && isBreakMode && shouldFullscreen;

    if (!shouldLockToTimer) {
      setNoTransition(false);
      return;
    }

    if (location.pathname !== "/") {
      setNoTransition(true);
      navigate("/");
    }
  }, [
    timer.timerType,
    location.pathname,
    navigate,
    settings.enableFullscreenBreak,
    shouldFullscreen,
  ]);

  return (
    <StyledLayout noTransition={noTransition}>
      {!settings.useNativeTitlebar && (
        <Titlebar
          darkMode={settings.enableDarkTheme}
          timerType={timer.timerType}
        />
      )}
      {settings["compactMode"] ? null : (
        <Navigation timerType={timer.timerType} />
      )}
      {connectorError && (
        <Alert
          heading="Native integration warning"
          body={connectorError}
          onClose={dismissConnectorError}
        />
      )}
      {children}
    </StyledLayout>
  );
};

export default React.memo(Layout);
