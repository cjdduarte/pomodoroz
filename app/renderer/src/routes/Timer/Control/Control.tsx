import WarningBell from "assets/audios/warning-bell.wav";
import {
  CONFIRM_RESET_FOCUS_TO_IDLE,
  type ResetFocusToIdleDialogResult,
} from "ipc";
import { SVG } from "components";
import { getInvokeConnector } from "contexts";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { TimerStatus } from "store/timer/types";
import { resolveActiveTaskSelection } from "utils";
import {
  setEnableCompactMode,
  setPlay,
  setRound,
  setTimerType,
  skipTimer,
  toggleNotificationSound,
} from "store";
import {
  StyledControl,
  StyledControlMain,
  StyledStrictIndicator,
  StyledStrictSnackbar,
  StyledControlSpacer,
  StyledCompactStrictOverlay,
} from "styles";
import CompactModeButton from "./CompactModeButton";
import PlayButton from "./PlayButton";
import ResetButton from "./ResetButton";
import Sessions from "./Sessions";
import SkipButton from "./SkipButton";
import StatisticsButton from "./StatisticsButton";
import VolumeButton from "./VolumeButton";

type Props = {
  resetTimerAction: (options?: {
    reclassifyFocusToIdle?: boolean;
  }) => void;
  shouldPromptFocusToIdleReset: boolean;
};

const Control: React.FC<Props> = ({
  resetTimerAction,
  shouldPromptFocusToIdleReset,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const timer = useAppSelector((state) => state.timer);
  const config = useAppSelector((state) => state.config);
  const tasks = useAppSelector((state) => state.tasks.present);
  const selectedTask = useAppSelector((state) => state.taskSelection);

  const settings = useAppSelector((state) => state.settings);

  const dispatch = useAppDispatch();

  const [warn, setWarn] = useState(false);

  const activateWarning = useCallback(() => {
    const warnSound = new Audio(WarningBell);

    setWarn(true);
    warnSound.play().catch((e) => {
      console.warn("There was a problem playing sound", e);
    });
  }, []);

  const hasActiveTaskSelection = useMemo(
    () =>
      resolveActiveTaskSelection({
        taskLists: tasks,
        taskSelection: selectedTask,
      }) !== null,
    [selectedTask, tasks]
  );
  const strictModeLabel = t("settings.strictMode");
  const strictModeNotice = t("timer.strictModeNotice", {
    mode: strictModeLabel,
  });
  const strictModeNoticeParts = useMemo(() => {
    const modeIndex = strictModeNotice.indexOf(strictModeLabel);

    if (modeIndex === -1) {
      return null;
    }

    return {
      before: strictModeNotice.slice(0, modeIndex),
      after: strictModeNotice.slice(modeIndex + strictModeLabel.length),
    };
  }, [strictModeLabel, strictModeNotice]);

  const onResetCallback = useCallback(() => {
    if (timer.playing && settings.enableStrictMode) {
      activateWarning();
      return;
    }

    if (!shouldPromptFocusToIdleReset) {
      resetTimerAction();
      return;
    }

    const askAndReset = async () => {
      let decision: ResetFocusToIdleDialogResult = "no";

      try {
        const invokeConnector = getInvokeConnector();
        if (invokeConnector) {
          decision = await invokeConnector.invoke(
            CONFIRM_RESET_FOCUS_TO_IDLE
          );
        }
      } catch (error) {
        console.warn(
          "There was a problem showing the native reset confirmation",
          error
        );
      }

      if (decision === "cancel") {
        return;
      }

      resetTimerAction({
        reclassifyFocusToIdle: decision === "yes",
      });
    };

    void askAndReset();
  }, [
    resetTimerAction,
    activateWarning,
    timer.playing,
    settings.enableStrictMode,
    shouldPromptFocusToIdleReset,
  ]);

  const onPlayCallback = useCallback(() => {
    if (timer.playing && settings.enableStrictMode) {
      activateWarning();
      return;
    }

    if (
      !timer.playing &&
      timer.timerType === TimerStatus.STAY_FOCUS &&
      !hasActiveTaskSelection
    ) {
      activateWarning();
      return;
    }

    dispatch(setPlay(!timer.playing));
  }, [
    dispatch,
    activateWarning,
    hasActiveTaskSelection,
    timer.playing,
    timer.timerType,
    settings.enableStrictMode,
  ]);

  const onNotifacationSoundCallback = useCallback(() => {
    dispatch(toggleNotificationSound());
  }, [dispatch]);

  const onToggleCompactCallback = useCallback(() => {
    dispatch(setEnableCompactMode(!settings.compactMode));
  }, [dispatch, settings.compactMode]);

  const onOpenStatisticsCallback = useCallback(() => {
    navigate("/statistics");
  }, [navigate]);

  const onSkipAction = useCallback(() => {
    if (timer.playing && settings.enableStrictMode) {
      activateWarning();
      return;
    }

    switch (timer.timerType) {
      case TimerStatus.STAY_FOCUS:
        {
          const isLastRound = timer.round >= config.sessionRounds;
          const nextBreakDuration = isLastRound
            ? config.longBreak
            : config.shortBreak;

          if (nextBreakDuration <= 0) {
            resetTimerAction();
            dispatch(setRound(isLastRound ? 1 : timer.round + 1));

            if (!settings.autoStartWorkTime) {
              dispatch(setPlay(false));
            } else if (!timer.playing) {
              dispatch(setPlay(true));
            }
            break;
          }
        }

        if (timer.round < config.sessionRounds) {
          dispatch(skipTimer(TimerStatus.SHORT_BREAK));
        } else {
          dispatch(skipTimer(TimerStatus.LONG_BREAK));
        }
        if (!timer.playing) dispatch(setPlay(!timer.playing));
        break;

      case TimerStatus.SHORT_BREAK:
        dispatch(skipTimer(TimerStatus.STAY_FOCUS));
        dispatch(setRound(timer.round + 1));
        if (!timer.playing) dispatch(setPlay(!timer.playing));
        break;

      case TimerStatus.LONG_BREAK:
        dispatch(skipTimer(TimerStatus.STAY_FOCUS));
        dispatch(setRound(1));
        if (!timer.playing) dispatch(setPlay(!timer.playing));
        break;

      case TimerStatus.SPECIAL_BREAK:
        dispatch(skipTimer(TimerStatus.STAY_FOCUS));
        if (!timer.playing) dispatch(setPlay(!timer.playing));
        break;
    }
  }, [
    dispatch,
    timer.round,
    timer.playing,
    timer.timerType,
    settings.enableStrictMode,
    settings.autoStartWorkTime,
    config.sessionRounds,
    config.shortBreak,
    config.longBreak,
    activateWarning,
    resetTimerAction,
  ]);

  const onResetSessionCallback = useCallback(() => {
    dispatch(setTimerType(TimerStatus.STAY_FOCUS));
    dispatch(setRound(1));
  }, [dispatch]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (warn) {
      timeout = setTimeout(() => {
        setWarn(false);
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [warn]);

  if (settings.compactMode) {
    return (
      <StyledControl className="compact" type={timer.timerType}>
        <Sessions
          timerType={timer.timerType}
          round={timer.round}
          sessionRounds={config.sessionRounds}
          onClick={onResetSessionCallback}
        />
        <StyledControlSpacer className="test" />
        <StyledControlMain compact={settings.compactMode}>
          <ResetButton className="compact" onClick={onResetCallback} />
          <PlayButton
            compact
            playing={timer.playing}
            onClick={onPlayCallback}
          />
          <SkipButton className="compact" onClick={onSkipAction} />
        </StyledControlMain>
        <StyledControlSpacer className="test" />
        <StyledControlMain compact={settings.compactMode}>
          <StatisticsButton
            className="compact"
            onClick={onOpenStatisticsCallback}
            title={t("nav.statistics")}
            aria-label={t("nav.statistics")}
          />
          <CompactModeButton onClick={onToggleCompactCallback} />
        </StyledControlMain>
        {settings.enableStrictMode && warn && (
          <StyledCompactStrictOverlay>
            <StyledStrictIndicator warn={warn}>
              <SVG name="alert" />

              <StyledStrictSnackbar warn={warn}>
                {strictModeNoticeParts ? (
                  <>
                    {strictModeNoticeParts.before}
                    <span>{strictModeLabel}</span>
                    {strictModeNoticeParts.after}
                  </>
                ) : (
                  strictModeNotice
                )}
              </StyledStrictSnackbar>
            </StyledStrictIndicator>
          </StyledCompactStrictOverlay>
        )}
      </StyledControl>
    );
  }

  return (
    <StyledControl type={timer.timerType}>
      <Sessions
        timerType={timer.timerType}
        round={timer.round}
        sessionRounds={config.sessionRounds}
        onClick={onResetSessionCallback}
      />

      <StyledControlSpacer />
      <StyledControlMain>
        <ResetButton onClick={onResetCallback} />
        <PlayButton playing={timer.playing} onClick={onPlayCallback} />
        <SkipButton onClick={onSkipAction} />
        <VolumeButton
          soundOn={settings.notificationSoundOn}
          onClick={onNotifacationSoundCallback}
        />
      </StyledControlMain>

      <StyledControlSpacer />
      <StyledControlMain>
        <CompactModeButton flipped onClick={onToggleCompactCallback} />
        {settings.enableStrictMode && (
          <StyledStrictIndicator warn={warn}>
            <SVG name="alert" />

            <StyledStrictSnackbar warn={warn}>
              {strictModeNoticeParts ? (
                <>
                  {strictModeNoticeParts.before}
                  <span>{strictModeLabel}</span>
                  {strictModeNoticeParts.after}
                </>
              ) : (
                strictModeNotice
              )}
            </StyledStrictSnackbar>
          </StyledStrictIndicator>
        )}
      </StyledControlMain>
    </StyledControl>
  );
};

export default React.memo(Control);
