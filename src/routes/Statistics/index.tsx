import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  clearStatistics,
  setStatisticsSessions,
  StatisticsBucket,
} from "store";
import type { StatisticsSessionRecord } from "store";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { Header } from "components";
import {
  StyledButtonDanger,
  StyledSelect,
  StyledSelectWrapper,
  StyledStatistics,
  StyledStatisticsActions,
  StyledStatisticsBar,
  StyledStatisticsBarFill,
  StyledStatisticsCard,
  StyledStatisticsCardLabel,
  StyledStatisticsCardValue,
  StyledStatisticsCycleBadge,
  StyledStatisticsEmpty,
  StyledStatisticsHeatmap,
  StyledStatisticsHeatmapCell,
  StyledStatisticsLegend,
  StyledStatisticsLegendItem,
  StyledStatisticsMilestone,
  StyledStatisticsMilestones,
  StyledStatisticsProgressHeader,
  StyledStatisticsProgressMetric,
  StyledStatisticsProgressMetrics,
  StyledStatisticsProgressPanel,
  StyledStatisticsProgressTrack,
  StyledStatisticsPeriodControl,
  StyledStatisticsRow,
  StyledStatisticsRowLabel,
  StyledStatisticsRowMeta,
  StyledStatisticsRows,
  StyledStatisticsRowValue,
  StyledStatisticsSection,
  StyledStatisticsSectionHeader,
  StyledStatisticsSectionHeading,
  StyledStatisticsStackedBar,
  StyledStatisticsSummary,
  StyledStatisticsToolbar,
  StyledStatisticsToolbarLabel,
  StyledStatisticsWeekBar,
  StyledStatisticsWeekBars,
} from "styles";

type PeriodFilter = "today" | "week" | "month" | "all";
type ClearRange = "olderWeek" | "olderMonth" | "all";

type DailyTotals = {
  date: string;
  label: string;
  focus: number;
  break: number;
  idle: number;
  total: number;
  cycles: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_DAYS = 30;
const WEEK_DAYS = 7;
const MONTH_DAYS = 30;
const TOP_FOCUS_LIMIT = 5;
const XP_PER_LEVEL = 500;

type MilestoneKey =
  | "firstFocus"
  | "steadyThree"
  | "fullWeek"
  | "immersion"
  | "deepFocus";

const toDateKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const getTodayStart = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

const getDateStartDaysAgo = (now: Date, daysAgo: number): number =>
  new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - daysAgo
  ).getTime();

const getPeriodStart = (period: PeriodFilter, now: Date): number => {
  switch (period) {
    case "today":
      return getTodayStart(now);
    case "week":
      return getDateStartDaysAgo(now, WEEK_DAYS - 1);
    case "month":
      return getDateStartDaysAgo(now, MONTH_DAYS - 1);
    default:
      return 0;
  }
};

const formatDuration = (
  totalSeconds: number,
  t: (key: string) => string
): string => {
  if (totalSeconds <= 0) {
    return `0${t("statistics.units.s")}`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}${t("statistics.units.h")} ${minutes}${t(
        "statistics.units.m"
      )}`;
    }
    return `${hours}${t("statistics.units.h")}`;
  }

  if (minutes > 0) {
    return `${minutes}${t("statistics.units.m")}`;
  }

  return `${seconds}${t("statistics.units.s")}`;
};

const createDayLabel = (dateKey: string, locale: string): string => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
  }).format(date);
};

const createEmptyDailyTotals = (
  dateKey: string,
  locale: string
): DailyTotals => ({
  date: dateKey,
  label: createDayLabel(dateKey, locale),
  focus: 0,
  break: 0,
  idle: 0,
  total: 0,
  cycles: 0,
});

const createDailyTotalsMap = (
  sourceSessions: StatisticsSessionRecord[]
) => {
  const sessionsByDate = new Map<
    string,
    Omit<DailyTotals, "date" | "label">
  >();

  sourceSessions.forEach((session) => {
    const dateKey = session.date || toDateKey(session.completedAt);
    const existing = sessionsByDate.get(dateKey) || {
      focus: 0,
      break: 0,
      idle: 0,
      total: 0,
      cycles: 0,
    };

    if (session.bucket === StatisticsBucket.FOCUS) {
      existing.focus += session.durationSeconds;
      existing.cycles += session.cycleCompleted ? 1 : 0;
    } else if (session.bucket === StatisticsBucket.BREAK) {
      existing.break += session.durationSeconds;
    } else {
      existing.idle += session.durationSeconds;
    }

    existing.total += session.durationSeconds;
    sessionsByDate.set(dateKey, existing);
  });

  return sessionsByDate;
};

const createDailyRows = (
  sourceSessions: StatisticsSessionRecord[],
  locale: string
): DailyTotals[] => {
  const sessionsByDate = createDailyTotalsMap(sourceSessions);

  return Array.from(sessionsByDate.entries())
    .map(([date, totals]) => ({
      date,
      label: createDayLabel(date, locale),
      ...totals,
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
};

const createNormalizedDailyRows = (
  sourceSessions: StatisticsSessionRecord[],
  days: number,
  now: Date,
  locale: string
): DailyTotals[] => {
  const sessionsByDate = createDailyTotalsMap(sourceSessions);
  const rows: DailyTotals[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - index
    );
    const key = toDateKey(date.getTime());
    const existing = sessionsByDate.get(key);

    rows.push(
      existing
        ? {
            date: key,
            label: createDayLabel(key, locale),
            ...existing,
          }
        : createEmptyDailyTotals(key, locale)
    );
  }

  return rows;
};

const parseDateKey = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const getPreviousDateKey = (dateKey: string): string => {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - 1);
  return toDateKey(date.getTime());
};

const getCurrentStreak = (
  activeDateKeys: Set<string>,
  now: Date
): number => {
  if (!activeDateKeys.size) {
    return 0;
  }

  const todayKey = toDateKey(now.getTime());
  const yesterdayKey = getPreviousDateKey(todayKey);
  let cursor = "";

  if (activeDateKeys.has(todayKey)) {
    cursor = todayKey;
  } else if (activeDateKeys.has(yesterdayKey)) {
    cursor = yesterdayKey;
  }

  if (!cursor) {
    return 0;
  }

  let streak = 0;

  while (activeDateKeys.has(cursor)) {
    streak += 1;
    cursor = getPreviousDateKey(cursor);
  }

  return streak;
};

export default function Statistics() {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const sessions = useAppSelector((state) => state.statistics.sessions);
  const sessionRounds = useAppSelector(
    (state) => state.config.sessionRounds
  );

  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [clearRange, setClearRange] = useState<ClearRange>("all");
  const [isClearArmed, setIsClearArmed] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const locale = i18n.language || "en";
  const now = useMemo(() => new Date(nowTimestamp), [nowTimestamp]);

  const allDailyRows = useMemo(
    () => createDailyRows(sessions, locale),
    [locale, sessions]
  );

  const heatmapRows = useMemo(
    () =>
      createNormalizedDailyRows(sessions, HEATMAP_DAYS, now, locale),
    [locale, now, sessions]
  );

  const weekRows = useMemo(
    () => createNormalizedDailyRows(sessions, WEEK_DAYS, now, locale),
    [locale, now, sessions]
  );

  const progressSummary = useMemo(() => {
    const activeDateKeys = new Set<string>();
    let completedCycles = 0;
    let focusSeconds = 0;

    sessions.forEach((session) => {
      if (session.bucket !== StatisticsBucket.FOCUS) {
        return;
      }

      focusSeconds += session.durationSeconds;

      if (!session.cycleCompleted) {
        return;
      }

      completedCycles += 1;
      activeDateKeys.add(
        session.date || toDateKey(session.completedAt)
      );
    });

    const streak = getCurrentStreak(activeDateKeys, now);
    const totalXp =
      completedCycles * 40 +
      Math.floor(focusSeconds / 300) * 5 +
      activeDateKeys.size * 20;
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const levelXp = totalXp % XP_PER_LEVEL;
    const todayKey = toDateKey(now.getTime());
    const today =
      allDailyRows.find((row) => row.date === todayKey) ||
      createEmptyDailyTotals(todayKey, locale);
    const targetCycles = Math.max(sessionRounds, 1);
    const targetProgress = Math.min(
      100,
      (today.cycles / targetCycles) * 100
    );
    const unlockedMilestones: MilestoneKey[] = [];

    if (completedCycles > 0) {
      unlockedMilestones.push("firstFocus");
    }

    if (streak >= 3) {
      unlockedMilestones.push("steadyThree");
    }

    if (streak >= 7) {
      unlockedMilestones.push("fullWeek");
    }

    if (allDailyRows.some((row) => row.focus >= 2 * 60 * 60)) {
      unlockedMilestones.push("immersion");
    }

    if (allDailyRows.some((row) => row.cycles >= 4)) {
      unlockedMilestones.push("deepFocus");
    }

    return {
      level,
      levelXp,
      streak,
      targetCycles,
      targetProgress,
      today,
      unlockedMilestones: unlockedMilestones.slice(-3),
    };
  }, [allDailyRows, locale, now, sessionRounds, sessions]);

  const filteredSessions = useMemo(() => {
    const fromTimestamp = getPeriodStart(period, now);
    return sessions.filter(
      (session) => session.completedAt >= fromTimestamp
    );
  }, [sessions, period, now]);

  const summary = useMemo(() => {
    return filteredSessions.reduce(
      (acc, session) => {
        if (session.bucket === StatisticsBucket.FOCUS) {
          acc.focusSeconds += session.durationSeconds;
          if (session.cycleCompleted) {
            acc.completedCycles += 1;
          }
          return acc;
        }

        if (session.bucket === StatisticsBucket.BREAK) {
          acc.breakSeconds += session.durationSeconds;
          return acc;
        }

        acc.idleSeconds += session.durationSeconds;
        return acc;
      },
      {
        focusSeconds: 0,
        breakSeconds: 0,
        idleSeconds: 0,
        completedCycles: 0,
      }
    );
  }, [filteredSessions]);

  const activityRows = useMemo(() => {
    const activityMap = new Map<
      string,
      {
        key: string;
        label: string;
        seconds: number;
        cycles: number;
      }
    >();

    filteredSessions.forEach((session) => {
      if (session.bucket !== StatisticsBucket.FOCUS) {
        return;
      }

      const key =
        session.listId && session.taskId
          ? `${session.listId}:${session.taskId}`
          : "__unassigned_focus__";

      const label =
        session.listTitle && session.taskText
          ? `${session.listTitle} / ${session.taskText}`
          : session.taskText ||
            session.listTitle ||
            t("statistics.unassignedFocus");

      const existing = activityMap.get(key);
      if (existing) {
        existing.seconds += session.durationSeconds;
        existing.cycles += session.cycleCompleted ? 1 : 0;
        return;
      }

      activityMap.set(key, {
        key,
        label,
        seconds: session.durationSeconds,
        cycles: session.cycleCompleted ? 1 : 0,
      });
    });

    return Array.from(activityMap.values()).sort(
      (first, second) => second.seconds - first.seconds
    );
  }, [filteredSessions, t]);

  const dailyRows = useMemo(() => {
    const rows = createDailyRows(filteredSessions, locale);

    if (period === "all") {
      return rows.sort((first, second) =>
        second.date.localeCompare(first.date)
      );
    }

    if (period === "today") {
      const todayKey = toDateKey(now.getTime());
      const today =
        rows.find((row) => row.date === todayKey) ||
        ({
          date: todayKey,
          label: t("statistics.today"),
          focus: 0,
          break: 0,
          idle: 0,
          total: 0,
          cycles: 0,
        } as DailyTotals);

      return [today];
    }

    const expectedDays = period === "week" ? WEEK_DAYS : MONTH_DAYS;
    return createNormalizedDailyRows(
      filteredSessions,
      expectedDays,
      now,
      locale
    );
  }, [filteredSessions, locale, now, period, t]);

  const clearableSessionsCount = useMemo(() => {
    if (!sessions.length) {
      return 0;
    }

    if (clearRange === "all") {
      return sessions.length;
    }

    const cutoffBase = nowTimestamp;
    const cutoff =
      clearRange === "olderWeek"
        ? cutoffBase - 7 * DAY_MS
        : cutoffBase - 30 * DAY_MS;

    return sessions.filter((session) => session.completedAt < cutoff)
      .length;
  }, [clearRange, nowTimestamp, sessions]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, []);

  const topActivityRows = useMemo(
    () => activityRows.slice(0, TOP_FOCUS_LIMIT),
    [activityRows]
  );

  const heatmapMaxFocus = useMemo(
    () => Math.max(...heatmapRows.map((row) => row.focus), 0),
    [heatmapRows]
  );

  const weekMaxFocus = useMemo(
    () => Math.max(...weekRows.map((row) => row.focus), 0),
    [weekRows]
  );

  useEffect(() => {
    setIsClearArmed(false);
  }, [clearRange, clearableSessionsCount]);

  useEffect(() => {
    if (!isClearArmed) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsClearArmed(false);
    }, 4500);

    return () => clearTimeout(timeout);
  }, [isClearArmed]);

  const onClearAction = useCallback(() => {
    if (!clearableSessionsCount) {
      return;
    }

    if (!isClearArmed) {
      setIsClearArmed(true);
      return;
    }

    if (clearRange === "all") {
      dispatch(clearStatistics());
      setIsClearArmed(false);
      return;
    }

    const now = Date.now();
    const cutoff =
      clearRange === "olderWeek" ? now - 7 * DAY_MS : now - 30 * DAY_MS;

    dispatch(
      setStatisticsSessions(
        sessions.filter((session) => session.completedAt >= cutoff)
      )
    );
    setIsClearArmed(false);
  }, [
    clearRange,
    clearableSessionsCount,
    dispatch,
    isClearArmed,
    sessions,
  ]);

  return (
    <StyledStatistics>
      <StyledStatisticsToolbar>
        <Header heading={t("statistics.title")} />
      </StyledStatisticsToolbar>

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeader>
          <StyledStatisticsSectionHeading>
            {t("statistics.periodReport")}
          </StyledStatisticsSectionHeading>
          <StyledStatisticsPeriodControl>
            <StyledStatisticsToolbarLabel htmlFor="statistics-period">
              {t("statistics.period")}
            </StyledStatisticsToolbarLabel>
            <StyledSelectWrapper>
              <StyledSelect
                id="statistics-period"
                value={period}
                onChange={(event) =>
                  setPeriod(event.target.value as PeriodFilter)
                }
              >
                <option value="today">
                  {t("statistics.periodToday")}
                </option>
                <option value="week">
                  {t("statistics.periodWeek")}
                </option>
                <option value="month">
                  {t("statistics.periodMonth")}
                </option>
                <option value="all">{t("statistics.periodAll")}</option>
              </StyledSelect>
            </StyledSelectWrapper>
          </StyledStatisticsPeriodControl>
        </StyledStatisticsSectionHeader>

        <StyledStatisticsSummary>
          <StyledStatisticsCard>
            <StyledStatisticsCardLabel>
              {t("statistics.focusTime")}
            </StyledStatisticsCardLabel>
            <StyledStatisticsCardValue>
              {formatDuration(summary.focusSeconds, t)}
            </StyledStatisticsCardValue>
          </StyledStatisticsCard>

          <StyledStatisticsCard>
            <StyledStatisticsCardLabel>
              {t("statistics.breakTime")}
            </StyledStatisticsCardLabel>
            <StyledStatisticsCardValue>
              {formatDuration(summary.breakSeconds, t)}
            </StyledStatisticsCardValue>
          </StyledStatisticsCard>

          <StyledStatisticsCard>
            <StyledStatisticsCardLabel>
              {t("statistics.idleTime")}
            </StyledStatisticsCardLabel>
            <StyledStatisticsCardValue>
              {formatDuration(summary.idleSeconds, t)}
            </StyledStatisticsCardValue>
          </StyledStatisticsCard>

          <StyledStatisticsCard>
            <StyledStatisticsCardLabel>
              {t("statistics.completedCycles")}
            </StyledStatisticsCardLabel>
            <StyledStatisticsCardValue>
              {summary.completedCycles}
            </StyledStatisticsCardValue>
          </StyledStatisticsCard>
        </StyledStatisticsSummary>
      </StyledStatisticsSection>

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeading>
          {t("statistics.topFocus")}
        </StyledStatisticsSectionHeading>
        {!topActivityRows.length ? (
          <StyledStatisticsEmpty>
            {t("statistics.noFocusData")}
          </StyledStatisticsEmpty>
        ) : (
          <StyledStatisticsRows>
            {topActivityRows.map((row) => {
              const width =
                summary.focusSeconds > 0
                  ? (row.seconds / summary.focusSeconds) * 100
                  : 0;
              return (
                <StyledStatisticsRow key={row.key}>
                  <StyledStatisticsRowMeta>
                    <StyledStatisticsRowLabel title={row.label}>
                      {row.label}
                    </StyledStatisticsRowLabel>
                    <StyledStatisticsRowValue>
                      {formatDuration(row.seconds, t)}
                    </StyledStatisticsRowValue>
                  </StyledStatisticsRowMeta>
                  <StyledStatisticsBar>
                    <StyledStatisticsBarFill
                      $variant="focus"
                      style={{ width: `${width}%` }}
                    />
                  </StyledStatisticsBar>
                  <StyledStatisticsCycleBadge>
                    {row.cycles}
                  </StyledStatisticsCycleBadge>
                </StyledStatisticsRow>
              );
            })}
          </StyledStatisticsRows>
        )}
      </StyledStatisticsSection>

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeading>
          {t("statistics.dailyFlow")}
        </StyledStatisticsSectionHeading>

        <StyledStatisticsLegend>
          <StyledStatisticsLegendItem $variant="focus">
            {t("statistics.focusTime")}
          </StyledStatisticsLegendItem>
          <StyledStatisticsLegendItem $variant="break">
            {t("statistics.breakTime")}
          </StyledStatisticsLegendItem>
          <StyledStatisticsLegendItem $variant="idle">
            {t("statistics.idleTime")}
          </StyledStatisticsLegendItem>
        </StyledStatisticsLegend>

        <StyledStatisticsRows>
          {dailyRows.map((day) => {
            const focusWidth =
              day.total > 0 ? (day.focus / day.total) * 100 : 0;
            const breakWidth =
              day.total > 0 ? (day.break / day.total) * 100 : 0;
            const idleWidth =
              day.total > 0 ? (day.idle / day.total) * 100 : 0;

            return (
              <StyledStatisticsRow key={day.date}>
                <StyledStatisticsRowMeta>
                  <StyledStatisticsRowLabel>
                    {day.label}
                  </StyledStatisticsRowLabel>
                  <StyledStatisticsRowValue>
                    {formatDuration(day.total, t)}
                  </StyledStatisticsRowValue>
                </StyledStatisticsRowMeta>
                <StyledStatisticsStackedBar>
                  <StyledStatisticsBarFill
                    $variant="focus"
                    style={{ width: `${focusWidth}%` }}
                  />
                  <StyledStatisticsBarFill
                    $variant="break"
                    style={{ width: `${breakWidth}%` }}
                  />
                  <StyledStatisticsBarFill
                    $variant="idle"
                    style={{ width: `${idleWidth}%` }}
                  />
                </StyledStatisticsStackedBar>
              </StyledStatisticsRow>
            );
          })}
        </StyledStatisticsRows>
      </StyledStatisticsSection>

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeading>
          {t("statistics.progressOverview")}
        </StyledStatisticsSectionHeading>
        <StyledStatisticsProgressPanel>
          <StyledStatisticsProgressHeader>
            <div>
              <StyledStatisticsCardLabel>
                {t("statistics.streak")}
              </StyledStatisticsCardLabel>
              <StyledStatisticsCardValue>
                {progressSummary.streak}{" "}
                <small>
                  {progressSummary.streak === 1
                    ? t("statistics.daySingular")
                    : t("statistics.dayPlural")}
                </small>
              </StyledStatisticsCardValue>
            </div>
            <div>
              <StyledStatisticsCardLabel>
                {t("statistics.level")}
              </StyledStatisticsCardLabel>
              <StyledStatisticsCardValue>
                {progressSummary.level}
              </StyledStatisticsCardValue>
            </div>
          </StyledStatisticsProgressHeader>

          <StyledStatisticsProgressTrack>
            <StyledStatisticsRowMeta>
              <StyledStatisticsRowLabel>
                {t("statistics.xp")}
              </StyledStatisticsRowLabel>
              <StyledStatisticsRowValue>
                {progressSummary.levelXp}/{XP_PER_LEVEL}
              </StyledStatisticsRowValue>
            </StyledStatisticsRowMeta>
            <StyledStatisticsBar>
              <StyledStatisticsBarFill
                $variant="focus"
                style={{
                  width: `${(progressSummary.levelXp / XP_PER_LEVEL) * 100}%`,
                }}
              />
            </StyledStatisticsBar>
          </StyledStatisticsProgressTrack>

          <StyledStatisticsProgressMetrics>
            <StyledStatisticsProgressMetric>
              <span>{t("statistics.today")}</span>
              <strong>
                {progressSummary.today.cycles}{" "}
                {progressSummary.today.cycles === 1
                  ? t("units.round")
                  : t("units.rounds")}{" "}
                - {formatDuration(progressSummary.today.focus, t)}
              </strong>
            </StyledStatisticsProgressMetric>

            <StyledStatisticsProgressMetric>
              <span>{t("statistics.dailyTarget")}</span>
              <strong>
                {progressSummary.today.cycles}/
                {progressSummary.targetCycles}
              </strong>
              <StyledStatisticsBar>
                <StyledStatisticsBarFill
                  $variant="focus"
                  style={{
                    width: `${progressSummary.targetProgress}%`,
                  }}
                />
              </StyledStatisticsBar>
            </StyledStatisticsProgressMetric>
          </StyledStatisticsProgressMetrics>

          <StyledStatisticsMilestones>
            {progressSummary.unlockedMilestones.length ? (
              progressSummary.unlockedMilestones.map((milestone) => (
                <StyledStatisticsMilestone key={milestone}>
                  {t(`statistics.milestones.${milestone}`)}
                </StyledStatisticsMilestone>
              ))
            ) : (
              <StyledStatisticsEmpty>
                {t("statistics.noMilestones")}
              </StyledStatisticsEmpty>
            )}
          </StyledStatisticsMilestones>
        </StyledStatisticsProgressPanel>
      </StyledStatisticsSection>

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeading>
          {t("statistics.last30Days")}
        </StyledStatisticsSectionHeading>
        <StyledStatisticsHeatmap>
          {heatmapRows.map((day) => {
            const intensity =
              heatmapMaxFocus > 0 && day.focus > 0
                ? Math.max(
                    1,
                    Math.ceil((day.focus / heatmapMaxFocus) * 5)
                  )
                : 0;

            return (
              <StyledStatisticsHeatmapCell
                key={day.date}
                $intensity={intensity}
                aria-label={`${day.label}: ${formatDuration(day.focus, t)}`}
                title={`${day.label}: ${formatDuration(day.focus, t)}`}
              />
            );
          })}
        </StyledStatisticsHeatmap>
      </StyledStatisticsSection>

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeading>
          {t("statistics.week")}
        </StyledStatisticsSectionHeading>
        <StyledStatisticsWeekBars>
          {weekRows.map((day) => {
            const height =
              weekMaxFocus > 0 && day.focus > 0
                ? Math.max(10, (day.focus / weekMaxFocus) * 100)
                : 0;

            return (
              <StyledStatisticsWeekBar
                key={day.date}
                title={`${day.label}: ${formatDuration(day.focus, t)}`}
              >
                <span style={{ height: `${height}%` }} />
                <small>{day.label}</small>
              </StyledStatisticsWeekBar>
            );
          })}
        </StyledStatisticsWeekBars>
      </StyledStatisticsSection>

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeading>
          {t("statistics.manageHistory")}
        </StyledStatisticsSectionHeading>
        <StyledStatisticsActions>
          <StyledSelectWrapper>
            <StyledSelect
              value={clearRange}
              onChange={(event) =>
                setClearRange(event.target.value as ClearRange)
              }
            >
              <option value="olderWeek">
                {t("statistics.clearOlderWeek")}
              </option>
              <option value="olderMonth">
                {t("statistics.clearOlderMonth")}
              </option>
              <option value="all">{t("statistics.clearAll")}</option>
            </StyledSelect>
          </StyledSelectWrapper>
          <StyledButtonDanger
            onClick={onClearAction}
            disabled={!clearableSessionsCount}
          >
            {isClearArmed
              ? t("statistics.clearActionConfirm")
              : t("statistics.clearAction")}
          </StyledButtonDanger>
        </StyledStatisticsActions>
      </StyledStatisticsSection>
    </StyledStatistics>
  );
}
