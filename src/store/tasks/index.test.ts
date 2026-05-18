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

const setupLocalStorage = (taskLists: unknown = storedTaskLists) => {
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => {
      if (key !== "state") {
        return null;
      }

      return JSON.stringify({ tasks: taskLists });
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

  it("preserves card priority when dragging a card to another list", async () => {
    setupLocalStorage([
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
            prioritized: true,
            dayColor: null,
            dayColorDate: null,
          },
        ],
      },
      {
        _id: "list-id-2",
        title: "BACKLOG",
        priority: false,
        dayColor: null,
        dayColorDate: null,
        cards: [],
      },
    ]);

    const { default: reducer, dragList } = await import("./index");

    const state = reducer(
      reducer(undefined, { type: "@@INIT" }),
      dragList({
        sourceId: "list-id-1",
        destinationId: "list-id-2",
        sourceIndex: 0,
        destinationIndex: 0,
        draggableId: "task-id-1",
        type: "card",
      })
    );

    expect(state.present[0]?.cards).toEqual([]);
    expect(state.present[1]?.cards[0]?.prioritized).toBe(true);
  });

  it("reorders one list by starred task priority", async () => {
    setupLocalStorage([
      {
        _id: "list-id-1",
        title: "FOCUS",
        priority: true,
        dayColor: null,
        dayColorDate: null,
        cards: [
          {
            _id: "task-id-1",
            text: "First regular",
            description: "",
            done: false,
            prioritized: false,
            dayColor: null,
            dayColorDate: null,
          },
          {
            _id: "task-id-2",
            text: "First priority",
            description: "",
            done: false,
            prioritized: true,
            dayColor: null,
            dayColorDate: null,
          },
          {
            _id: "task-id-3",
            text: "Second regular",
            description: "",
            done: false,
            prioritized: false,
            dayColor: null,
            dayColorDate: null,
          },
          {
            _id: "task-id-4",
            text: "Second priority",
            description: "",
            done: false,
            prioritized: true,
            dayColor: null,
            dayColorDate: null,
          },
        ],
      },
      {
        _id: "list-id-2",
        title: "BACKLOG",
        priority: false,
        dayColor: null,
        dayColorDate: null,
        cards: [
          {
            _id: "task-id-5",
            text: "Other list",
            description: "",
            done: false,
            prioritized: false,
            dayColor: null,
            dayColorDate: null,
          },
        ],
      },
    ]);

    const { default: reducer, reorderTaskListByPriority } =
      await import("./index");

    const state = reducer(
      reducer(undefined, { type: "@@INIT" }),
      reorderTaskListByPriority({ listId: "list-id-1" })
    );

    expect(state.present[0]?.cards.map((card) => card._id)).toEqual([
      "task-id-2",
      "task-id-4",
      "task-id-1",
      "task-id-3",
    ]);
    expect(state.present[1]?.cards.map((card) => card._id)).toEqual([
      "task-id-5",
    ]);
  });

  it("keeps state unchanged when reordering a list without starred tasks", async () => {
    setupLocalStorage();

    const { default: reducer, reorderTaskListByPriority } =
      await import("./index");

    const state = reducer(undefined, { type: "@@INIT" });
    const nextState = reducer(
      state,
      reorderTaskListByPriority({ listId: "list-id-1" })
    );

    expect(nextState).toBe(state);
    expect(nextState.past).toEqual([]);
  });

  it("keeps state unchanged when marking not-done without a card id", async () => {
    setupLocalStorage();

    const { default: reducer, setTaskCardNotDone } =
      await import("./index");

    const state = reducer(undefined, { type: "@@INIT" });
    const nextState = reducer(
      state,
      setTaskCardNotDone({
        listId: "list-id-1",
      })
    );

    expect(nextState).toBe(state);
    expect(nextState.past).toEqual([]);
    expect(nextState.present[0]?.cards[0]?.done).toBe(false);
  });
});
