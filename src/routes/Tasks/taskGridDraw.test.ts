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
  it("limits prioritized-only display mode to prioritized eligible cards", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityDisplayMode: "only",
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

  it("keeps prioritized-only display mode independent from the draw-only-prioritized setting", () => {
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
      priorityDisplayMode: "only",
      gridItems,
    });
    const withSettingDisabled = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: false,
      priorityDisplayMode: "only",
      gridItems,
    });

    expect(withSettingDisabled).toEqual(withSettingEnabled);
  });

  it("does not include normal cards in prioritized-only display mode", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityDisplayMode: "only",
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

  it("limits normal display mode to prioritized eligible cards when enabled", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityDisplayMode: "normal",
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

  it("uses the visible normal pool when no prioritized card is eligible", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityDisplayMode: "normal",
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

  it("keeps prioritized-first display mode in the same draw pool as normal mode", () => {
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

    expect(
      buildTaskGridDrawCandidates({
        drawOnlyPrioritizedTasks: false,
        priorityDisplayMode: "first",
        gridItems,
      })
    ).toEqual(
      buildTaskGridDrawCandidates({
        drawOnlyPrioritizedTasks: false,
        priorityDisplayMode: "normal",
        gridItems,
      })
    );
  });

  it("respects draw-only-prioritized in prioritized-first display mode", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: true,
      priorityDisplayMode: "first",
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

  it("ignores separators, placeholders, completed cards, and red cards", () => {
    const candidates = buildTaskGridDrawCandidates({
      drawOnlyPrioritizedTasks: false,
      priorityDisplayMode: "normal",
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
