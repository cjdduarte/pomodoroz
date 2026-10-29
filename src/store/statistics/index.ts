import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { getFromStorage } from "utils";
import { StatisticsBucket } from "./types";
import type { StatisticsSessionRecord, StatisticsState } from "./types";

export const STATISTICS_STORAGE_KEY = "statistics";

const getStatisticsStateFromStorage = ():
  StatisticsState | undefined => {
  const dedicatedState = getFromStorage<StatisticsState>(
    STATISTICS_STORAGE_KEY
  );

  if (Array.isArray(dedicatedState?.sessions)) {
    return dedicatedState;
  }

  const legacyState = getFromStorage<{
    statistics?: StatisticsState;
  }>("state");

  if (Array.isArray(legacyState?.statistics?.sessions)) {
    return legacyState.statistics;
  }

  return undefined;
};

const isMergeableSession = (
  current: StatisticsSessionRecord,
  next: StatisticsSessionRecord
): boolean => {
  if (current.cycleCompleted && next.cycleCompleted) {
    return false;
  }

  return (
    current.bucket === next.bucket &&
    current.timerType === next.timerType &&
    current.date === next.date &&
    current.round === next.round &&
    current.totalRounds === next.totalRounds &&
    current.listId === next.listId &&
    current.listTitle === next.listTitle &&
    current.taskId === next.taskId &&
    current.taskText === next.taskText
  );
};

const storedState = getStatisticsStateFromStorage();

const initialState: StatisticsState = {
  sessions: Array.isArray(storedState?.sessions)
    ? storedState.sessions
    : [],
};

const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    addStatisticsSession(
      state,
      action: PayloadAction<StatisticsSessionRecord>
    ) {
      if (action.payload.durationSeconds <= 0) {
        return;
      }

      const lastSession = state.sessions.at(-1);

      if (
        lastSession &&
        isMergeableSession(lastSession, action.payload)
      ) {
        lastSession.durationSeconds = Number(
          (
            lastSession.durationSeconds + action.payload.durationSeconds
          ).toFixed(3)
        );
        lastSession.startedAt = Math.min(
          lastSession.startedAt,
          action.payload.startedAt
        );
        lastSession.completedAt = Math.max(
          lastSession.completedAt,
          action.payload.completedAt
        );
        lastSession.cycleCompleted =
          lastSession.cycleCompleted || action.payload.cycleCompleted;
        return;
      }

      state.sessions.push(action.payload);
    },

    setStatisticsSessions(
      state,
      action: PayloadAction<StatisticsState["sessions"]>
    ) {
      state.sessions = action.payload;
    },

    // Move os segundos de foco mais recentes do bloco atual para Ocioso
    // (reset com "Back may count as Idle"), inclusive os já gravados em chunks.
    reclassifyRecentFocusAsIdle(
      state,
      action: PayloadAction<{ seconds: number; since: number }>
    ) {
      let remaining = action.payload.seconds;

      for (
        let index = state.sessions.length - 1;
        index >= 0 && remaining > 0;
        index -= 1
      ) {
        const session = state.sessions[index];

        // Sessões ficam em ordem de conclusão; ciclo concluído encerra bloco anterior.
        if (
          session.completedAt < action.payload.since ||
          session.cycleCompleted
        ) {
          break;
        }

        if (session.bucket !== StatisticsBucket.FOCUS) {
          continue;
        }

        const movesWholeSession = remaining >= session.durationSeconds;
        const movedSeconds = movesWholeSession
          ? session.durationSeconds
          : remaining;
        remaining -= movedSeconds;

        const idlePortion: StatisticsSessionRecord = {
          ...session,
          bucket: StatisticsBucket.IDLE,
          timerType: "IDLE",
          durationSeconds: Number(movedSeconds.toFixed(3)),
          round: null,
          totalRounds: null,
          cycleCompleted: false,
          listId: null,
          listTitle: null,
          taskId: null,
          taskText: null,
        };

        if (movesWholeSession) {
          state.sessions[index] = idlePortion;
          continue;
        }

        session.durationSeconds = Number(
          (session.durationSeconds - movedSeconds).toFixed(3)
        );
        state.sessions.splice(index + 1, 0, {
          ...idlePortion,
          id: `${session.id}:idle:${action.payload.since}`,
        });
      }
    },

    clearStatistics(state) {
      state.sessions = [];
    },
  },
});

export const {
  addStatisticsSession,
  setStatisticsSessions,
  clearStatistics,
  reclassifyRecentFocusAsIdle,
} = statisticsSlice.actions;

export * from "./types";

export default statisticsSlice.reducer;
