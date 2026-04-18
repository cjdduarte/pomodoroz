import React, {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  addStatisticsSession,
  setPlay,
  setRound,
  setTimerType,
  StatisticsBucket,
  type StatisticsSessionRecord,
} from "store";
import { useNotification, useWakeLock } from "hooks";
import {
  isEqualToOne,
  padNum,
  resolveActiveTaskSelection,
  type ResolvedActiveTaskSelection,
} from "utils";

import notificationIcon from "assets/logos/notification-dark.png";

import breakFinishedWav from "assets/audios/break-finished.wav";
import focusFinishedWav from "assets/audios/focus-finished.wav";
import sessionCompletedWav from "assets/audios/session-completed.wav";
import sixtySecondsLeftWav from "assets/audios/sixty-seconds-left.wav";
import specialBreakStartedWav from "assets/audios/special-break-started.wav";
import thirtySecondsLeftWav from "assets/audios/thirty-seconds-left.wav";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { TimerStatus } from "store/timer/types";
import { FULLSCREEN_BREAK_ENTERED, FULLSCREEN_BREAK_EXITED } from "ipc";
import { getRuntimeInvokeConnector } from "./connectors/runtimeInvokeConnector";

type CounterProps = {
  count: number;
  duration: number;
  timerType?: TimerStatus;
  resetTimerAction?: (options?: ResetTimerActionOptions) => void;
  shouldPromptFocusToIdleReset: boolean;
  shouldRequestFullscreen: boolean;
  shouldFullscreen: boolean;
};

const CounterContext = React.createContext<CounterProps>({
  count: 0,
  duration: 0,
  shouldPromptFocusToIdleReset: false,
  shouldRequestFullscreen: false,
  shouldFullscreen: false,
});

type ActiveTaskSnapshot = {
  listId: string | null;
  listTitle: string | null;
  taskId: string | null;
  taskText: string | null;
};

type TrackingSnapshot = ActiveTaskSnapshot & {
  bucket: StatisticsBucket;
  timerType: StatisticsSessionRecord["timerType"];
  round: number | null;
  totalRounds: number | null;
};

type TrackingSegment = TrackingSnapshot & {
  startedAt: number;
  lastTickAt: number;
  durationSeconds: number;
};

type ResetTimerActionOptions = {
  reclassifyFocusToIdle?: boolean;
};

const TRACKING_INTERVAL_MS = 1000;
const TRACKING_SLEEP_GAP_MS = 5000;
const TRACKING_PERSIST_CHUNK_SECONDS = 120;
const COUNTDOWN_INTERVAL_FALLBACK_MS = 1000;

const createStatisticsDateKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
};

const createTrackingSessionId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getStatisticsBucket = (
  timerType: TimerStatus,
  isPlaying: boolean
): StatisticsBucket => {
  if (!isPlaying) {
    return StatisticsBucket.IDLE;
  }

  if (timerType === TimerStatus.STAY_FOCUS) {
    return StatisticsBucket.FOCUS;
  }

  return StatisticsBucket.BREAK;
};

const buildTrackingSnapshot = ({
  timerType,
  isPlaying,
  round,
  totalRounds,
  activeTaskSelection,
}: {
  timerType: TimerStatus;
  isPlaying: boolean;
  round: number;
  totalRounds: number;
  activeTaskSelection: ResolvedActiveTaskSelection | null;
}): TrackingSnapshot => {
  const rawBucket = getStatisticsBucket(timerType, isPlaying);
  const bucket =
    rawBucket === StatisticsBucket.FOCUS && !activeTaskSelection
      ? StatisticsBucket.IDLE
      : rawBucket;
  const activeTask =
    bucket === StatisticsBucket.FOCUS && activeTaskSelection
      ? {
          listId: activeTaskSelection.listId,
          listTitle: activeTaskSelection.listTitle,
          taskId: activeTaskSelection.cardId,
          taskText: activeTaskSelection.taskText,
        }
      : {
          listId: null,
          listTitle: null,
          taskId: null,
          taskText: null,
        };

  return {
    ...activeTask,
    bucket,
    timerType: bucket === StatisticsBucket.IDLE ? "IDLE" : timerType,
    round: bucket === StatisticsBucket.IDLE ? null : round,
    totalRounds: bucket === StatisticsBucket.IDLE ? null : totalRounds,
  };
};

const areTrackingSnapshotsEqual = (
  current: TrackingSnapshot,
  next: TrackingSnapshot
): boolean =>
  current.bucket === next.bucket &&
  current.timerType === next.timerType &&
  current.round === next.round &&
  current.totalRounds === next.totalRounds &&
  current.listId === next.listId &&
  current.listTitle === next.listTitle &&
  current.taskId === next.taskId &&
  current.taskText === next.taskText;

const CounterProvider = ({ children }: PropsWithChildren) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const timer = useAppSelector((state) => state.timer);
  const config = useAppSelector((state) => state.config);
  const settings = useAppSelector((state) => state.settings);
  const tasks = useAppSelector((state) => state.tasks.present);
  const selectedTask = useAppSelector((state) => state.taskSelection);

  const { preventSleeping, allowSleeping } = useWakeLock();

  const notification = useNotification(
    {
      icon: notificationIcon,
      mute: !settings.notificationSoundOn,
      notificationSound: settings.notificationSound,
    },
    settings.notificationType !== "none"
  );

  const [shouldRequestFullscreen, setShouldRequestFullscreen] =
    useState(false);
  const [shouldFullscreen, setShouldFullscreen] = useState(false);
  const [fullscreenDismissed, setFullscreenDismissed] = useState(false);

  const [count, setCount] = useState(config.stayFocus * 60);
  const [lastCountTime, setLastCountTime] = useState(Date.now());
  const [hasNotified30Seconds, setHasNotified30Seconds] =
    useState(false);
  const [hasNotified60Seconds, setHasNotified60Seconds] =
    useState(false);
  const [hasNotifiedBreak, setHasNotifiedBreak] = useState(false);

  const [duration, setDuration] = useState(config.stayFocus * 60);
  const previousTimerTypeRef = useRef(timer.timerType);
  const trackingSegmentRef = useRef<TrackingSegment | null>(null);
  const pendingCycleCompletionRef = useRef(false);

  const setTimerDuration = useCallback((time: number) => {
    setDuration(time * 60);
    setCount(time * 60);
    setLastCountTime(Date.now());
    setHasNotified30Seconds(false);
    if (time > 1) {
      setHasNotified60Seconds(false);
    }
    setHasNotifiedBreak(false);
  }, []);

  const getMinuteLabel = useCallback(
    (value: number) =>
      isEqualToOne(value)
        ? t("timer.minuteSingular")
        : t("timer.minutePlural"),
    [t]
  );

  const activeTaskSelection = useMemo(
    () =>
      resolveActiveTaskSelection({
        taskLists: tasks,
        taskSelection: selectedTask,
      }),
    [selectedTask, tasks]
  );

  const trackingSnapshot = useMemo(
    () =>
      buildTrackingSnapshot({
        timerType: timer.timerType,
        isPlaying: timer.playing,
        round: timer.round,
        totalRounds: config.sessionRounds,
        activeTaskSelection,
      }),
    [
      activeTaskSelection,
      config.sessionRounds,
      timer.playing,
      timer.round,
      timer.timerType,
    ]
  );

  const commitTrackingSegment = useCallback(
    (
      segment: TrackingSegment,
      completedAt: number,
      cycleCompleted: boolean
    ) => {
      const durationSeconds = Number(
        Math.max(0, segment.durationSeconds).toFixed(3)
      );

      if (durationSeconds <= 0) {
        return;
      }

      dispatch(
        addStatisticsSession({
          id: createTrackingSessionId(),
          bucket: segment.bucket,
          timerType: segment.timerType,
          durationSeconds,
          startedAt: segment.startedAt,
          completedAt,
          date: createStatisticsDateKey(completedAt),
          round: segment.round,
          totalRounds: segment.totalRounds,
          cycleCompleted,
          listId: segment.listId,
          listTitle: segment.listTitle,
          taskId: segment.taskId,
          taskText: segment.taskText,
        })
      );
    },
    [dispatch]
  );

  const resetTimerAction = useCallback(
    (options?: ResetTimerActionOptions) => {
      const canReclassifyCurrentFocusSegment =
        trackingSegmentRef.current?.bucket === StatisticsBucket.FOCUS;

      const shouldReclassifyFocusToIdle =
        options?.reclassifyFocusToIdle === true;

      if (
        shouldReclassifyFocusToIdle &&
        timer.timerType === TimerStatus.STAY_FOCUS &&
        canReclassifyCurrentFocusSegment
      ) {
        const now = Date.now();
        const currentSegment = trackingSegmentRef.current;

        if (currentSegment?.bucket === StatisticsBucket.FOCUS) {
          const elapsedMs = now - currentSegment.lastTickAt;
          currentSegment.lastTickAt = now;

          if (elapsedMs > 0 && elapsedMs <= TRACKING_SLEEP_GAP_MS) {
            currentSegment.durationSeconds += elapsedMs / 1000;
          }

          commitTrackingSegment(
            {
              ...currentSegment,
              bucket: StatisticsBucket.IDLE,
              timerType: "IDLE",
              round: null,
              totalRounds: null,
              listId: null,
              listTitle: null,
              taskId: null,
              taskText: null,
            },
            now,
            false
          );

          pendingCycleCompletionRef.current = false;
          trackingSegmentRef.current = {
            ...trackingSnapshot,
            startedAt: now,
            lastTickAt: now,
            durationSeconds: 0,
          };
        }
      }

      switch (timer.timerType) {
        case TimerStatus.STAY_FOCUS:
          setTimerDuration(config.stayFocus);
          break;
        case TimerStatus.SHORT_BREAK:
          setTimerDuration(config.shortBreak);
          break;
        case TimerStatus.LONG_BREAK:
          setTimerDuration(config.longBreak);
          break;
        case TimerStatus.SPECIAL_BREAK:
          setTimerDuration(duration / 60);
          break;
      }
    },
    [
      timer.timerType,
      duration,
      commitTrackingSegment,
      trackingSnapshot,
      config.longBreak,
      config.stayFocus,
      config.shortBreak,
      setTimerDuration,
    ]
  );

  useEffect(() => {
    const consumeElapsed = (now: number) => {
      const currentSegment = trackingSegmentRef.current;

      if (!currentSegment) {
        return;
      }

      const elapsedMs = now - currentSegment.lastTickAt;
      currentSegment.lastTickAt = now;

      if (elapsedMs <= 0 || elapsedMs > TRACKING_SLEEP_GAP_MS) {
        return;
      }

      currentSegment.durationSeconds += elapsedMs / 1000;
    };

    const startSegment = (snapshot: TrackingSnapshot, now: number) => {
      trackingSegmentRef.current = {
        ...snapshot,
        startedAt: now,
        lastTickAt: now,
        durationSeconds: 0,
      };
    };

    const closeSegment = (now: number) => {
      const currentSegment = trackingSegmentRef.current;

      if (!currentSegment) {
        return;
      }

      const cycleCompleted =
        currentSegment.bucket === StatisticsBucket.FOCUS &&
        pendingCycleCompletionRef.current;

      commitTrackingSegment(currentSegment, now, cycleCompleted);

      if (currentSegment.bucket === StatisticsBucket.FOCUS) {
        pendingCycleCompletionRef.current = false;
      }

      trackingSegmentRef.current = null;
    };

    const syncTracking = (now: number) => {
      consumeElapsed(now);

      const currentSegment = trackingSegmentRef.current;

      if (!currentSegment) {
        startSegment(trackingSnapshot, now);
        return;
      }

      const shouldSplitSegment = !areTrackingSnapshotsEqual(
        currentSegment,
        trackingSnapshot
      );

      if (shouldSplitSegment) {
        closeSegment(now);
        startSegment(trackingSnapshot, now);
        return;
      }

      if (
        currentSegment.durationSeconds >= TRACKING_PERSIST_CHUNK_SECONDS
      ) {
        closeSegment(now);
        startSegment(trackingSnapshot, now);
      }
    };

    syncTracking(Date.now());

    const trackingInterval = setInterval(() => {
      syncTracking(Date.now());
    }, TRACKING_INTERVAL_MS);

    return () => {
      clearInterval(trackingInterval);

      const now = Date.now();
      consumeElapsed(now);
      closeSegment(now);
    };
  }, [trackingSnapshot, commitTrackingSegment]);

  useEffect(() => {
    if (
      timer.playing &&
      timer.timerType === TimerStatus.STAY_FOCUS &&
      !activeTaskSelection
    ) {
      dispatch(setPlay(false));
    }
  }, [activeTaskSelection, dispatch, timer.playing, timer.timerType]);

  useEffect(() => {
    if (timer.playing) {
      setLastCountTime(Date.now());
    }
  }, [timer.playing]);

  useEffect(() => {
    if (timer.playing && timer.timerType !== TimerStatus.STAY_FOCUS) {
      preventSleeping();
    } else {
      allowSleeping();
    }
  }, [timer.playing, timer.timerType, preventSleeping, allowSleeping]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const { firstBreak, secondBreak, thirdBreak, fourthBreak } =
      config.specialBreaks;

    if (timer.playing) {
      interval = setInterval(() => {
        const date = new Date();
        const currentTime =
          padNum(date.getHours()) + ":" + padNum(date.getMinutes());

        if (timer.timerType !== TimerStatus.SPECIAL_BREAK) {
          if (firstBreak && currentTime === firstBreak.fromTime) {
            dispatch(setTimerType(TimerStatus.SPECIAL_BREAK));
            setTimerDuration(firstBreak.duration);
            notification(
              t("timer.notifSpecialBreakStartedTitle"),
              {
                body: t("timer.notifEnjoySpecialBreakBody", {
                  duration: firstBreak.duration,
                  minuteLabel: getMinuteLabel(firstBreak.duration),
                }),
              },
              specialBreakStartedWav
            );
            return;
          }

          if (secondBreak && currentTime === secondBreak.fromTime) {
            dispatch(setTimerType(TimerStatus.SPECIAL_BREAK));
            setTimerDuration(secondBreak.duration);
            notification(
              t("timer.notifSpecialBreakStartedTitle"),
              {
                body: t("timer.notifEnjoySpecialBreakBody", {
                  duration: secondBreak.duration,
                  minuteLabel: getMinuteLabel(secondBreak.duration),
                }),
              },
              specialBreakStartedWav
            );
            return;
          }

          if (thirdBreak && currentTime === thirdBreak.fromTime) {
            dispatch(setTimerType(TimerStatus.SPECIAL_BREAK));
            setTimerDuration(thirdBreak.duration);
            notification(
              t("timer.notifSpecialBreakStartedTitle"),
              {
                body: t("timer.notifEnjoySpecialBreakBody", {
                  duration: thirdBreak.duration,
                  minuteLabel: getMinuteLabel(thirdBreak.duration),
                }),
              },
              specialBreakStartedWav
            );
            return;
          }

          if (fourthBreak && currentTime === fourthBreak.fromTime) {
            dispatch(setTimerType(TimerStatus.SPECIAL_BREAK));
            setTimerDuration(fourthBreak.duration);
            notification(
              t("timer.notifSpecialBreakStartedTitle"),
              {
                body: t("timer.notifEnjoySpecialBreakBody", {
                  duration: fourthBreak.duration,
                  minuteLabel: getMinuteLabel(fourthBreak.duration),
                }),
              },
              specialBreakStartedWav
            );
            return;
          }
        } else {
          return clearInterval(interval);
        }
      }, 500);
    }

    return () => clearInterval(interval);
  }, [
    config.specialBreaks,
    timer.timerType,
    timer.playing,
    dispatch,
    notification,
    getMinuteLabel,
    t,
    setTimerDuration,
  ]);

  useEffect(() => {
    switch (timer.timerType) {
      case TimerStatus.STAY_FOCUS:
        setTimerDuration(config.stayFocus);
        break;
      case TimerStatus.SHORT_BREAK:
        setTimerDuration(config.shortBreak);
        break;
      case TimerStatus.LONG_BREAK:
        setTimerDuration(config.longBreak);
        break;
    }
  }, [
    setTimerDuration,
    timer.timerType,
    config.stayFocus,
    config.shortBreak,
    config.longBreak,
  ]);

  useEffect(() => {
    let timerInterval: ReturnType<typeof setInterval>;

    // calculate how far off a full second the countdown timer is and adjust the countdown timer accordingly
    const offset = count % 1;
    const countdownIntervalMs =
      offset > 0 ? offset * 1000 : COUNTDOWN_INTERVAL_FALLBACK_MS;
    if (timer.playing) {
      timerInterval = setInterval(() => {
        setCount((prevState) => {
          // Calculate time passed since last count
          const now = Date.now();
          const timePassed = now - lastCountTime;

          setLastCountTime(Date.now());
          return prevState - timePassed / 1000;
        });
      }, countdownIntervalMs);
    }

    return () => clearInterval(timerInterval);
  }, [timer.playing, lastCountTime, count]);

  useEffect(() => {
    if (settings.notificationType === "extra") {
      if (count <= 60 && count > 0 && !hasNotified60Seconds) {
        setHasNotified60Seconds(true);
        if (timer.timerType === TimerStatus.SHORT_BREAK) {
          notification(
            t("timer.notif60SecondsLeftTitle"),
            { body: t("timer.notifPrepareFocusBody") },
            settings.enableVoiceAssistance && sixtySecondsLeftWav
          );
        } else if (timer.timerType === TimerStatus.LONG_BREAK) {
          notification(
            t("timer.notif60SecondsLeftTitle"),
            { body: t("timer.notifPrepareFocusBody") },
            settings.enableVoiceAssistance && sixtySecondsLeftWav
          );
        } else if (timer.timerType === TimerStatus.SPECIAL_BREAK) {
          notification(
            t("timer.notif60SecondsLeftTitle"),
            { body: t("timer.notifPrepareFocusBody") },
            settings.enableVoiceAssistance && sixtySecondsLeftWav
          );
        }
      } else if (
        count <= 30 &&
        count > 0 &&
        timer.timerType === TimerStatus.STAY_FOCUS &&
        !hasNotified30Seconds
      ) {
        setHasNotified30Seconds(true);
        notification(
          t("timer.notif30SecondsLeftTitle"),
          { body: t("timer.notifPauseMediaBody") },
          settings.enableVoiceAssistance && thirtySecondsLeftWav
        );
      }
    }

    if (count <= 0 && !hasNotifiedBreak) {
      setHasNotifiedBreak(true);
      switch (timer.timerType) {
        case TimerStatus.STAY_FOCUS: {
          pendingCycleCompletionRef.current = true;
          const isLastRound = timer.round >= config.sessionRounds;
          const nextBreakDuration = isLastRound
            ? config.longBreak
            : config.shortBreak;
          const nextBreakTimerType = isLastRound
            ? TimerStatus.LONG_BREAK
            : TimerStatus.SHORT_BREAK;

          setTimeout(
            () => {
              const breakNotificationBody =
                nextBreakDuration <= 0
                  ? settings.autoStartWorkTime
                    ? t("timer.notifBreakZeroAutoBody")
                    : t("timer.notifBreakZeroManualBody")
                  : isLastRound
                    ? t("timer.notifEnjoyLongBreakBody", {
                        duration: config.longBreak,
                        minuteLabel: getMinuteLabel(config.longBreak),
                      })
                    : t("timer.notifEnjoyShortBreakBody", {
                        duration: config.shortBreak,
                        minuteLabel: getMinuteLabel(config.shortBreak),
                      });

              notification(
                isLastRound
                  ? t("timer.notifSessionCompletedTitle")
                  : t("timer.notifFocusFinishedTitle"),
                {
                  body: breakNotificationBody,
                },
                settings.enableVoiceAssistance &&
                  (isLastRound ? sessionCompletedWav : focusFinishedWav)
              );

              if (nextBreakDuration <= 0) {
                setTimerDuration(config.stayFocus);
                dispatch(setRound(isLastRound ? 1 : timer.round + 1));

                if (!settings.autoStartWorkTime) {
                  dispatch(setPlay(false));
                }
                return;
              }

              dispatch(setTimerType(nextBreakTimerType));
            },
            nextBreakDuration <= 0 ? 0 : 1000
          );

          break;
        }

        case TimerStatus.SHORT_BREAK:
          setTimeout(
            () => {
              notification(
                t("timer.notifBreakFinishedTitle"),
                {
                  body: t("timer.notifStayFocusedBody", {
                    duration: config.stayFocus,
                    minuteLabel: getMinuteLabel(config.stayFocus),
                  }),
                },
                settings.enableVoiceAssistance && breakFinishedWav
              );

              dispatch(setTimerType(TimerStatus.STAY_FOCUS));
              dispatch(setRound(timer.round + 1));

              if (!settings.autoStartWorkTime) {
                dispatch(setPlay(false));
              }
            },
            config.shortBreak <= 0 ? 0 : 1000
          );
          break;

        case TimerStatus.LONG_BREAK:
          setTimeout(
            () => {
              notification(
                t("timer.notifBreakFinishedTitle"),
                {
                  body: t("timer.notifStayFocusedBody", {
                    duration: config.stayFocus,
                    minuteLabel: getMinuteLabel(config.stayFocus),
                  }),
                },
                settings.enableVoiceAssistance && breakFinishedWav
              );

              dispatch(setTimerType(TimerStatus.STAY_FOCUS));
              dispatch(setRound(1));

              if (!settings.autoStartWorkTime) {
                dispatch(setPlay(false));
              }
            },
            config.longBreak <= 0 ? 0 : 1000
          );
          break;

        case TimerStatus.SPECIAL_BREAK:
          setTimeout(() => {
            notification(
              t("timer.notifBreakFinishedTitle"),
              {
                body: t("timer.notifStayFocusedBody", {
                  duration: config.stayFocus,
                  minuteLabel: getMinuteLabel(config.stayFocus),
                }),
              },
              settings.enableVoiceAssistance && breakFinishedWav
            );

            dispatch(setTimerType(TimerStatus.STAY_FOCUS));

            if (!settings.autoStartWorkTime) {
              dispatch(setPlay(false));
            }
          }, 1000);
          break;
      }
    }
  }, [
    count,
    timer.round,
    timer.playing,
    timer.timerType,
    dispatch,
    notification,
    config.stayFocus,
    config.shortBreak,
    config.longBreak,
    config.sessionRounds,
    getMinuteLabel,
    settings.notificationType,
    settings.autoStartWorkTime,
    settings.enableVoiceAssistance,
    setTimerDuration,
    hasNotified30Seconds,
    hasNotified60Seconds,
    hasNotifiedBreak,
    setHasNotified30Seconds,
    setHasNotified60Seconds,
    setHasNotifiedBreak,
    t,
  ]);

  useEffect(() => {
    if (previousTimerTypeRef.current !== timer.timerType) {
      setFullscreenDismissed(false);
      previousTimerTypeRef.current = timer.timerType;
    }
  }, [timer.timerType]);

  useEffect(() => {
    if (!settings.enableFullscreenBreak) {
      setShouldRequestFullscreen(false);
      setShouldFullscreen(false);
      setFullscreenDismissed(false);
      return;
    }

    if (timer.timerType === TimerStatus.STAY_FOCUS) {
      setShouldRequestFullscreen(false);
      setShouldFullscreen(false);
      setFullscreenDismissed(false);
      return;
    }

    if (!fullscreenDismissed) {
      setShouldRequestFullscreen(true);
    }
  }, [
    settings.enableFullscreenBreak,
    timer.timerType,
    fullscreenDismissed,
  ]);

  useEffect(() => {
    const invokeConnector = getRuntimeInvokeConnector();
    if (!invokeConnector) return;

    const cleanupEntered = invokeConnector.receive(
      FULLSCREEN_BREAK_ENTERED,
      () => {
        setShouldFullscreen(true);
      }
    );

    const cleanupExited = invokeConnector.receive(
      FULLSCREEN_BREAK_EXITED,
      () => {
        setShouldRequestFullscreen(false);
        setShouldFullscreen(false);
        setFullscreenDismissed(true);
      }
    );

    return () => {
      cleanupEntered();
      cleanupExited();
    };
  }, []);

  useEffect(() => {
    if (shouldRequestFullscreen) return;

    setShouldFullscreen(false);
  }, [shouldRequestFullscreen]);

  useEffect(() => {
    if (!settings.enableFullscreenBreak || !shouldFullscreen) {
      return;
    }

    const dismissFullscreenOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.code !== "Escape") {
        return;
      }

      setShouldRequestFullscreen(false);
      setShouldFullscreen(false);
      setFullscreenDismissed(true);
    };

    window.addEventListener("keydown", dismissFullscreenOnEscape);

    return () => {
      window.removeEventListener("keydown", dismissFullscreenOnEscape);
    };
  }, [settings.enableFullscreenBreak, shouldFullscreen]);

  const shouldPromptFocusToIdleReset =
    settings.resetFocusToIdleEnabled &&
    timer.timerType === TimerStatus.STAY_FOCUS &&
    duration - count > 0 &&
    trackingSegmentRef.current?.bucket === StatisticsBucket.FOCUS;

  return (
    <CounterContext.Provider
      value={{
        count: Math.ceil(count),
        duration,
        resetTimerAction,
        shouldPromptFocusToIdleReset,
        shouldRequestFullscreen,
        shouldFullscreen,
        timerType: timer.timerType,
      }}
    >
      {children}
    </CounterContext.Provider>
  );
};

export { CounterContext, CounterProvider };
