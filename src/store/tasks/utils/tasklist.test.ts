import { describe, expect, it } from "vitest";

import type { Task, TaskList } from "../types";
import { addTaskToList } from "./tasklist";

describe("task list utilities", () => {
  it("adds a task without mutating the original list", () => {
    const task: Task = {
      _id: "task-id-1",
      text: "Review plan",
      description: "",
      done: false,
      prioritized: false,
      dayColor: null,
      dayColorDate: null,
    };
    const taskList: TaskList = {
      _id: "list-id-1",
      title: "FOCUS",
      cards: [],
      priority: true,
      dayColor: null,
      dayColorDate: null,
    };

    const result = addTaskToList(taskList, task);

    expect(result.cards).toEqual([task]);
    expect(taskList.cards).toEqual([]);
    expect(result).not.toBe(taskList);
  });
});
