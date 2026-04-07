import React from "react";
import { useTranslation } from "react-i18next";
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

const Navigation: React.FC<Props> = ({ timerType }) => {
  const { t } = useTranslation();
  const settings = useAppSelector((state) => state.settings);
  const hasUpdateNotification = useAppSelector(
    (state) => state.update.updateBody
  );

  return (
    <StyledNav useNativeTitlebar={settings.useNativeTitlebar}>
      <StyledNavList>
        {routes(hasUpdateNotification).map(
          ({ name, icon, exact, path, notify }) => {
            return (
              <StyledNavListItem key={path}>
                <StyledNavLink
                  end={exact}
                  to={path}
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
