import { describe, expect, it } from "vitest";

import {
  buildTaskGridDrawCandidates,
  type TaskGridDrawItem,
} from "./taskGridDraw";

const createItem = (
  overrides: Partial<TaskGridDrawItem> = {}
): TaskGridDrawItem => ({
  listId: "list-1",
  cardId: "card-1",
  isDone: false,
  isPrioritized: false,
  isPlaceholder: false,
  isSeparator: false,
  dayColor: null,
  ...overrides,
});

describe("task grid draw candidates", () => {
  it("limits prioritized visual mode to prioritized eligible cards", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityFilterMode: "prioritized",
      gridItems: [
        createItem({
          listId: "priority-list",
          cardId: "priority-card",
          isPrioritized: true,
        }),
        createItem({
          listId: "normal-list",
          cardId: "normal-card",
          dayColor: "green",
        }),
      ],
    });

    expect(candidates).toEqual([
      {
        listId: "priority-list",
        cardId: "priority-card",
        dayColor: null,
        isPrioritized: true,
      },
    ]);
  });

  it("keeps prioritized visual mode independent from the draw-only-prioritized setting", () => {
    const gridItems = [
      createItem({
        listId: "priority-list",
        cardId: "priority-card",
        isPrioritized: true,
      }),
      createItem({
        listId: "normal-list",
        cardId: "normal-card",
        dayColor: "green",
      }),
    ];
    const withSettingEnabled = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityFilterMode: "prioritized",
      gridItems,
    });
    const withSettingDisabled = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: false,
      priorityFilterMode: "prioritized",
      gridItems,
    });

    expect(withSettingDisabled).toEqual(withSettingEnabled);
  });

  it("does not fall back to normal cards in prioritized visual mode", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityFilterMode: "prioritized",
      gridItems: [
        createItem({
          listId: "priority-list",
          cardId: "priority-card",
          isPrioritized: true,
          dayColor: "red",
        }),
        createItem({
          listId: "normal-list",
          cardId: "normal-card",
          dayColor: "green",
        }),
      ],
    });

    expect(candidates).toEqual([]);
  });

  it("limits all-task mode to prioritized eligible cards when enabled", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityFilterMode: "all",
      gridItems: [
        createItem({
          listId: "priority-list",
          cardId: "priority-card",
          isPrioritized: true,
        }),
        createItem({
          listId: "normal-list",
          cardId: "normal-card",
        }),
      ],
    });

    expect(candidates).toEqual([
      {
        listId: "priority-list",
        cardId: "priority-card",
        dayColor: null,
        isPrioritized: true,
      },
    ]);
  });

  it("falls back to the visible all-task pool when no prioritized card is eligible", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityFilterMode: "all",
      gridItems: [
        createItem({
          listId: "priority-list",
          cardId: "priority-card",
          isPrioritized: true,
          dayColor: "red",
        }),
        createItem({
          listId: "normal-list",
          cardId: "normal-card",
          dayColor: "green",
        }),
      ],
    });

    expect(candidates).toEqual([
      {
        listId: "normal-list",
        cardId: "normal-card",
        dayColor: "green",
        isPrioritized: false,
      },
    ]);
  });

  it("ignores separators, placeholders, completed cards, and red cards", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: false,
      priorityFilterMode: "all",
      gridItems: [
        createItem({ isSeparator: true, cardId: null }),
        createItem({ isPlaceholder: true, cardId: null }),
        createItem({ isDone: true }),
        createItem({ dayColor: "red" }),
        createItem({
          listId: "eligible-list",
          cardId: "eligible-card",
        }),
      ],
    });

    expect(candidates).toEqual([
      {
        listId: "eligible-list",
        cardId: "eligible-card",
        dayColor: null,
        isPrioritized: false,
      },
    ]);
  });
});
