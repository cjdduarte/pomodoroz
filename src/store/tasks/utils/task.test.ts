import { beforeEach, describe, expect, it, vi } from "vitest";

const uuidV4Mock = vi.hoisted(() => vi.fn());

vi.mock("uuid", () => ({
  v4: uuidV4Mock,
}));

import { createTask, editTask } from "./task";

describe("task utilities", () => {
  beforeEach(() => {
    uuidV4Mock.mockReset();
  });

  it("creates tasks with stable defaults", () => {
    uuidV4Mock.mockReturnValue("task-id-1");

    expect(createTask({ text: "Focus session" })).toEqual({
      _id: "task-id-1",
      text: "Focus session",
      description: "",
      done: false,
      prioritized: false,
      dayColor: null,
      dayColorDate: null,
    });
  });

  it("edits task fields without changing the task id", () => {
    const task = {
      _id: "task-id-1",
      text: "Focus session",
      description: "",
      done: false,
      prioritized: false,
      dayColor: null,
      dayColorDate: null,
    };

    expect(
      editTask(task, {
        text: "Review plan",
        description: "Check reducer coverage",
        done: true,
        prioritized: true,
      })
    ).toEqual({
      _id: "task-id-1",
      text: "Review plan",
      description: "Check reducer coverage",
      done: true,
      prioritized: true,
      dayColor: null,
      dayColorDate: null,
    });
  });
});
