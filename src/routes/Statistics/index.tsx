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
  StyledStatisticsLegend,
  StyledStatisticsLegendItem,
  StyledStatisticsRow,
  StyledStatisticsRowLabel,
  StyledStatisticsRowMeta,
  StyledStatisticsRows,
  StyledStatisticsRowValue,
  StyledStatisticsSection,
  StyledStatisticsSectionHeading,
  StyledStatisticsStackedBar,
  StyledStatisticsSummary,
  StyledStatisticsToolbar,
  StyledStatisticsToolbarLabel,
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
};

const DAY_MS = 24 * 60 * 60 * 1000;

const toDateKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const getTodayStart = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

const getPeriodStart = (period: PeriodFilter, now: Date): number => {
  switch (period) {
    case "today":
      return getTodayStart(now);
    case "week":
      return now.getTime() - 7 * DAY_MS;
    case "month":
      return now.getTime() - 30 * DAY_MS;
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

export default function Statistics() {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const sessions = useAppSelector((state) => state.statistics.sessions);

  const [period, setPeriod] = useState<PeriodFilter>("today");
  const [clearRange, setClearRange] = useState<ClearRange>("all");
  const [isClearArmed, setIsClearArmed] = useState(false);

  const filteredSessions = useMemo(() => {
    const now = new Date();
    const fromTimestamp = getPeriodStart(period, now);
    return sessions.filter(
      (session) => session.completedAt >= fromTimestamp
    );
  }, [sessions, period]);

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
    const now = new Date();
    const locale = i18n.language || "en";
    const sessionsByDate = new Map<
      string,
      Pick<DailyTotals, "focus" | "break" | "idle" | "total">
    >();

    filteredSessions.forEach((session) => {
      const dateKey = session.date || toDateKey(session.completedAt);
      const existing = sessionsByDate.get(dateKey) || {
        focus: 0,
        break: 0,
        idle: 0,
        total: 0,
      };

      if (session.bucket === StatisticsBucket.FOCUS) {
        existing.focus += session.durationSeconds;
      } else if (session.bucket === StatisticsBucket.BREAK) {
        existing.break += session.durationSeconds;
      } else {
        existing.idle += session.durationSeconds;
      }

      existing.total += session.durationSeconds;
      sessionsByDate.set(dateKey, existing);
    });

    const dates = Array.from(sessionsByDate.keys()).sort();
    const rows: DailyTotals[] = dates.map((date) => ({
      date,
      label: createDayLabel(date, locale),
      ...sessionsByDate.get(date)!,
    }));

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
        } as DailyTotals);

      return [today];
    }

    const expectedDays = period === "week" ? 7 : 30;
    const normalized: DailyTotals[] = [];

    for (let index = 0; index < expectedDays; index += 1) {
      const date = new Date(now.getTime() - index * DAY_MS);
      const key = toDateKey(date.getTime());
      const existing = rows.find((row) => row.date === key);

      normalized.push(
        existing || {
          date: key,
          label: createDayLabel(key, locale),
          focus: 0,
          break: 0,
          idle: 0,
          total: 0,
        }
      );
    }

    return normalized;
  }, [filteredSessions, i18n.language, period, t]);

  const clearableSessionsCount = useMemo(() => {
    if (!sessions.length) {
      return 0;
    }

    if (clearRange === "all") {
      return sessions.length;
    }

    const now = Date.now();
    const cutoff =
      clearRange === "olderWeek" ? now - 7 * DAY_MS : now - 30 * DAY_MS;

    return sessions.filter((session) => session.completedAt < cutoff)
      .length;
  }, [clearRange, sessions]);

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
        <div>
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
              <option value="week">{t("statistics.periodWeek")}</option>
              <option value="month">
                {t("statistics.periodMonth")}
              </option>
              <option value="all">{t("statistics.periodAll")}</option>
            </StyledSelect>
          </StyledSelectWrapper>
        </div>
      </StyledStatisticsToolbar>

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

      <StyledStatisticsSection>
        <StyledStatisticsSectionHeading>
          {t("statistics.byTaskList")}
        </StyledStatisticsSectionHeading>
        {!activityRows.length ? (
          <StyledStatisticsEmpty>
            {t("statistics.noFocusData")}
          </StyledStatisticsEmpty>
        ) : (
          <StyledStatisticsRows>
            {activityRows.map((row) => {
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
