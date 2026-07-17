import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { TaskList } from "../tasks/types";
import { resolveActiveTaskSelection } from "../../utils/activeTaskSelection";

vi.mock("utils", () => ({
  getFromStorage: () => ({
    taskSelection: {
      listId: "list-id-1",
      cardId: "task-id-1",
    },
  }),
}));

const selectedTask = {
  _id: "task-id-1",
  text: "Review plan",
  description: "",
  done: false,
  prioritized: false,
  dayColor: null,
  dayColorDate: null,
};

const taskLists: TaskList[] = [
  {
    _id: "list-id-1",
    title: "FOCUS",
    priority: true,
    dayColor: null,
    dayColorDate: null,
    cards: [selectedTask],
  },
  {
    _id: "list-id-2",
    title: "BACKLOG",
    priority: false,
    dayColor: null,
    dayColorDate: null,
    cards: [
      {
        _id: "task-id-2",
        text: "Other task",
        description: "",
        done: false,
        prioritized: false,
        dayColor: null,
        dayColorDate: null,
      },
    ],
  },
];

describe("task selection reducer", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it("follows the selected card across lists and keeps it resolvable", async () => {
    const { default: selectionReducer } = await import("./index");
    const { default: tasksReducer, dragList } =
      await import("../tasks");
    const action = dragList({
      sourceId: "list-id-1",
      destinationId: "list-id-2",
      sourceIndex: 0,
      destinationIndex: 1,
      draggableId: "task-id-1",
      type: "card",
    });

    const selection = selectionReducer(undefined, action);
    const tasks = tasksReducer(
      { past: [], present: taskLists, future: [] },
      action
    );

    expect(selection).toEqual({
      listId: "list-id-2",
      cardId: "task-id-1",
    });
    expect(
      resolveActiveTaskSelection({
        taskLists: tasks.present,
        taskSelection: selection,
      })
    ).toMatchObject({
      listId: "list-id-2",
      cardId: "task-id-1",
    });
  });

  it("keeps selection during same-list, unrelated-card, and list drags", async () => {
    const { default: selectionReducer } = await import("./index");
    const { dragList } = await import("../tasks");
    const selection = selectionReducer(undefined, { type: "@@INIT" });

    for (const action of [
      dragList({
        sourceId: "list-id-1",
        destinationId: "list-id-1",
        sourceIndex: 0,
        destinationIndex: 0,
        draggableId: "task-id-1",
        type: "card",
      }),
      dragList({
        sourceId: "list-id-1",
        destinationId: "list-id-2",
        sourceIndex: 0,
        destinationIndex: 0,
        draggableId: "task-id-2",
        type: "card",
      }),
      dragList({
        sourceId: "list-id-1",
        destinationId: "list-id-2",
        sourceIndex: 0,
        destinationIndex: 1,
        draggableId: "list-id-1",
        type: "list",
      }),
    ]) {
      expect(selectionReducer(selection, action)).toEqual(selection);
    }
  });
});
