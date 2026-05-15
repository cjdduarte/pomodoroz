import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { useAppSelector } from "hooks/storeHooks";
import {
  StyledNav,
  StyledNavList,
  StyledNavListItem,
  StyledNavLink,
  StyledNavIconWrapper,
} from "styles";
import { NavNotify } from "components";
import { routes } from "config";
import SVG from "./SVG";
import { TimerStatus } from "store/timer/types";

type Props = {
  timerType?: TimerStatus;
};

type CompactStatisticsReturnState = {
  restoreCompactModeOnTimer?: boolean;
};

const Navigation: React.FC<Props> = ({ timerType }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const settings = useAppSelector((state) => state.settings);
  const updateVersion = useAppSelector(
    (state) => state.update.updateVersion
  );
  const hasUpdateNotification =
    !settings.enableInAppAutoUpdate && updateVersion;
  const locationState =
    location.state as CompactStatisticsReturnState | null;
  const shouldRestoreCompactModeOnTimer =
    locationState?.restoreCompactModeOnTimer === true;

  return (
    <StyledNav useNativeTitlebar={settings.useNativeTitlebar}>
      <StyledNavList>
        {routes(Boolean(hasUpdateNotification)).map(
          ({ name, icon, exact, path, notify }) => {
            const state =
              path === "/" && shouldRestoreCompactModeOnTimer
                ? { enableCompactMode: true }
                : undefined;

            return (
              <StyledNavListItem key={path}>
                <StyledNavLink
                  end={exact}
                  to={path}
                  state={state}
                  $timerType={timerType}
                  $isTimerRoute={path === "/"}
                  className={({ isActive }) =>
                    isActive ? "active" : ""
                  }
                  draggable="false"
                  replace
                >
                  <StyledNavIconWrapper>
                    <SVG name={icon} />
                    {notify && <NavNotify />}
                  </StyledNavIconWrapper>
                  {t(name)}
                </StyledNavLink>
              </StyledNavListItem>
            );
          }
        )}
      </StyledNavList>
    </StyledNav>
  );
};

export default React.memo(Navigation);
