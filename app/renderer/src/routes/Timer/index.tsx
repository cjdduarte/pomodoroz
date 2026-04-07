import { CounterContext } from "contexts";
import React, { useCallback, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { setEnableCompactMode } from "store";
import { StyledTimer } from "styles";
import Control from "./Control";
import Counter from "./Counter";
import CompactTaskDisplay from "./CompactTaskDisplay";

type TimerLocationState = {
  enableCompactMode?: boolean;
};

export default function Timer() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const compactMode = useAppSelector(
    (state) => state.settings.compactMode
  );
  const { resetTimerAction, shouldPromptFocusToIdleReset } =
    useContext(CounterContext);

  useEffect(() => {
    const state = location.state as TimerLocationState | null;

    if (!state?.enableCompactMode || compactMode) {
      return;
    }

    dispatch(setEnableCompactMode(true));
    navigate(location.pathname, { replace: true, state: null });
  }, [
    compactMode,
    dispatch,
    location.pathname,
    location.state,
    navigate,
  ]);

  const onResetCallback = useCallback(
    (options?: { reclassifyFocusToIdle?: boolean }) => {
      if (resetTimerAction) resetTimerAction(options);
    },
    [resetTimerAction]
  );

  return (
    <StyledTimer className={compactMode ? "compact" : ""}>
      <Counter />
      <Control
        resetTimerAction={onResetCallback}
        shouldPromptFocusToIdleReset={shouldPromptFocusToIdleReset}
      />
      <CompactTaskDisplay />
    </StyledTimer>
  );
}
