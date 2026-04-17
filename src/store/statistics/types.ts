import type { PayloadAction } from "@reduxjs/toolkit";
import { TimerStatus } from "store/timer/types";

export enum StatisticsBucket {
  FOCUS = "FOCUS",
  BREAK = "BREAK",
  IDLE = "IDLE",
}

export type StatisticsTimerType = TimerStatus | "IDLE";

export type StatisticsSessionRecord = {
  id: string;
  bucket: StatisticsBucket;
  timerType: StatisticsTimerType;
  durationSeconds: number;
  startedAt: number;
  completedAt: number;
  date: string;
  round: number | null;
  totalRounds: number | null;
  cycleCompleted: boolean;
  taskId: string | null;
  taskText: string | null;
  listId: string | null;
  listTitle: string | null;
};

export type StatisticsState = {
  sessions: StatisticsSessionRecord[];
};

export type StatisticsPayload<T extends keyof StatisticsState> =
  PayloadAction<StatisticsState[T]>;
