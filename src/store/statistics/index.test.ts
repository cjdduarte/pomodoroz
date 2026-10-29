import { describe, expect, it, vi } from "vitest";

import { TimerStatus } from "../timer/types";
import reducer, {
  reclassifyRecentFocusAsIdle,
  StatisticsBucket,
  type StatisticsSessionRecord,
} from "./index";

vi.mock("utils", () => ({
  getFromStorage: () => undefined,
}));

const BLOCK_STARTED_AT = 1_000_000;

const record = (
  id: string,
  completedAt: number,
  durationSeconds: number,
  overrides: Partial<StatisticsSessionRecord> = {}
): StatisticsSessionRecord => ({
  id,
  bucket: StatisticsBucket.FOCUS,
  timerType: TimerStatus.STAY_FOCUS,
  durationSeconds,
  startedAt: completedAt - durationSeconds * 1000,
  completedAt,
  date: "2026-07-02",
  round: 1,
  totalRounds: 4,
  cycleCompleted: false,
  taskId: "task-id-1",
  taskText: "Review plan",
  listId: "list-id-1",
  listTitle: "FOCUS",
  ...overrides,
});

const totalSeconds = (sessions: StatisticsSessionRecord[]) =>
  sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0
  );

describe("reclassifyRecentFocusAsIdle", () => {
  it("moves committed focus chunks of the current block to idle", () => {
    const sessions = [
      record("before-block", BLOCK_STARTED_AT - 1, 120),
      record("chunk-1", BLOCK_STARTED_AT + 120_000, 120),
      record("chunk-2", BLOCK_STARTED_AT + 240_000, 120),
    ];

    const state = reducer(
      { sessions },
      reclassifyRecentFocusAsIdle({
        seconds: 200,
        since: BLOCK_STARTED_AT,
      })
    );

    expect(
      state.sessions.map(({ id, bucket, durationSeconds, taskId }) => ({
        id,
        bucket,
        durationSeconds,
        taskId,
      }))
    ).toEqual([
      {
        id: "before-block",
        bucket: StatisticsBucket.FOCUS,
        durationSeconds: 120,
        taskId: "task-id-1",
      },
      {
        id: "chunk-1",
        bucket: StatisticsBucket.FOCUS,
        durationSeconds: 40,
        taskId: "task-id-1",
      },
      {
        id: `chunk-1:idle:${BLOCK_STARTED_AT}`,
        bucket: StatisticsBucket.IDLE,
        durationSeconds: 80,
        taskId: null,
      },
      {
        id: "chunk-2",
        bucket: StatisticsBucket.IDLE,
        durationSeconds: 120,
        taskId: null,
      },
    ]);
    expect(totalSeconds(state.sessions)).toBe(totalSeconds(sessions));
  });

  it("skips idle records and never crosses a completed cycle", () => {
    const sessions = [
      record("previous-cycle-tail", BLOCK_STARTED_AT + 1, 30, {
        cycleCompleted: true,
      }),
      record("chunk-1", BLOCK_STARTED_AT + 120_000, 120),
      record("paused", BLOCK_STARTED_AT + 180_000, 60, {
        bucket: StatisticsBucket.IDLE,
        timerType: "IDLE",
        taskId: null,
      }),
    ];

    const state = reducer(
      { sessions },
      reclassifyRecentFocusAsIdle({
        seconds: 500,
        since: BLOCK_STARTED_AT,
      })
    );

    expect(
      state.sessions.map(({ id, bucket, durationSeconds }) => ({
        id,
        bucket,
        durationSeconds,
      }))
    ).toEqual([
      {
        id: "previous-cycle-tail",
        bucket: StatisticsBucket.FOCUS,
        durationSeconds: 30,
      },
      {
        id: "chunk-1",
        bucket: StatisticsBucket.IDLE,
        durationSeconds: 120,
      },
      {
        id: "paused",
        bucket: StatisticsBucket.IDLE,
        durationSeconds: 60,
      },
    ]);
  });
});
