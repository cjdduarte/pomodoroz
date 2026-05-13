import { afterEach, describe, expect, it, vi } from "vitest";

import "../../extensions";

const storedTaskLists = [
  {
    _id: "list-id-1",
    title: "FOCUS",
    priority: true,
    dayColor: null,
    dayColorDate: null,
    cards: [
      {
        _id: "task-id-1",
        text: "Review plan",
        description: "",
        done: false,
        dayColor: null,
        dayColorDate: null,
      },
    ],
  },
];

const setupLocalStorage = () => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => {
      if (key !== "state") {
        return null;
      }

      return JSON.stringify({ tasks: storedTaskLists });
    }),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  });
};

describe("tasks reducer", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("normalizes stored cards without priority as non-priority cards", async () => {
    setupLocalStorage();

    const { default: reducer } = await import("./index");
    const state = reducer(undefined, { type: "@@INIT" });

    expect(state.present[0]?.cards[0]?.prioritized).toBe(false);
  });

  it("sets card priority and preserves it through undo and redo", async () => {
    setupLocalStorage();

    const {
      default: reducer,
      redoTasks,
      setTaskCardPriority,
      undoTasks,
    } = await import("./index");

    let state = reducer(undefined, { type: "@@INIT" });

    state = reducer(
      state,
      setTaskCardPriority({
        listId: "list-id-1",
        cardId: "task-id-1",
        prioritized: true,
      })
    );

    expect(state.present[0]?.cards[0]?.prioritized).toBe(true);

    state = reducer(state, undoTasks());
    expect(state.present[0]?.cards[0]?.prioritized).toBe(false);

    state = reducer(state, redoTasks());
    expect(state.present[0]?.cards[0]?.prioritized).toBe(true);
  });
});
