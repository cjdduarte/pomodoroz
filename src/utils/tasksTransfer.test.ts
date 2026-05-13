import { beforeEach, describe, expect, it, vi } from "vitest";

const uuidV4Mock = vi.hoisted(() => vi.fn());

vi.mock("uuid", () => ({
  v4: uuidV4Mock,
}));

import type { TaskList } from "store/tasks/types";
import {
  buildTasksTransferFile,
  parseTasksTransferFile,
  TASKS_TRANSFER_VERSION,
} from "./tasksTransfer";

describe("tasks transfer utilities", () => {
  beforeEach(() => {
    uuidV4Mock.mockReset();
  });

  it("exports prioritized cards in the task transfer file", () => {
    const taskLists: TaskList[] = [
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
            description: "Check B1 scope",
            done: false,
            prioritized: true,
            dayColor: null,
            dayColorDate: null,
          },
        ],
      },
    ];

    expect(buildTasksTransferFile(taskLists)).toEqual({
      version: TASKS_TRANSFER_VERSION,
      lists: [
        {
          title: "FOCUS",
          priority: true,
          cards: [
            {
              text: "Review plan",
              description: "Check B1 scope",
              done: false,
              prioritized: true,
            },
          ],
        },
      ],
    });
  });

  it("imports older task files without priority fields as non-priority cards", () => {
    uuidV4Mock
      .mockReturnValueOnce("task-id-1")
      .mockReturnValueOnce("list-id-1");

    const result = parseTasksTransferFile(
      JSON.stringify({
        version: 1,
        lists: [
          {
            title: "FOCUS",
            priority: true,
            cards: [
              {
                text: "Review plan",
                description: "",
                done: false,
              },
            ],
          },
        ],
      })
    );

    expect(result).toEqual({
      ok: true,
      data: {
        version: 1,
        listCount: 1,
        cardCount: 1,
        lists: [
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
                prioritized: false,
                dayColor: null,
                dayColorDate: null,
              },
            ],
          },
        ],
      },
    });
  });
});
