import { v4 as uuid } from "uuid";
import type { TaskList } from "store/tasks/types";

export const TASKS_TRANSFER_VERSION = 1;

type TransferTaskCard = {
  text: string;
  description: string;
  done: boolean;
};

type TransferTaskList = {
  title: string;
  priority: boolean;
  cards: TransferTaskCard[];
};

export type TasksTransferFile = {
  version: typeof TASKS_TRANSFER_VERSION;
  lists: TransferTaskList[];
};

export type TasksTransferParseResult =
  | {
      ok: true;
      data: {
        version: number;
        lists: TaskList[];
        listCount: number;
        cardCount: number;
      };
    }
  | {
      ok: false;
      reason: "invalid-json" | "invalid-schema";
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizePriority = (lists: TaskList[]): TaskList[] => {
  if (!lists.length) {
    return lists;
  }

  const firstPrioritizedIndex = lists.findIndex(
    (list) => list.priority
  );
  const targetPriorityIndex =
    firstPrioritizedIndex >= 0 ? firstPrioritizedIndex : 0;

  return lists.map((list, index) => ({
    ...list,
    priority: index === targetPriorityIndex,
  }));
};

const parseTransferCard = (value: unknown) => {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.text !== "string") {
    return null;
  }

  const text = value.text.trim();
  if (!text) {
    return null;
  }

  const description =
    typeof value.description === "string" ? value.description : "";
  const done = typeof value.done === "boolean" ? value.done : false;

  return {
    _id: uuid(),
    text,
    description,
    done,
    dayColor: null,
    dayColorDate: null,
  } as TaskList["cards"][number];
};

const parseTransferList = (value: unknown) => {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.title !== "string" || !Array.isArray(value.cards)) {
    return null;
  }

  const title = value.title.trim();
  if (!title) {
    return null;
  }

  const cards = value.cards
    .map(parseTransferCard)
    .filter((card): card is TaskList["cards"][number] => card !== null);

  if (cards.length !== value.cards.length) {
    return null;
  }

  return {
    _id: uuid(),
    title,
    cards,
    priority:
      typeof value.priority === "boolean" ? value.priority : false,
    dayColor: null,
    dayColorDate: null,
  } as TaskList;
};

export const buildTasksTransferFile = (
  taskLists: TaskList[]
): TasksTransferFile => {
  return {
    version: TASKS_TRANSFER_VERSION,
    lists: taskLists.map((list) => ({
      title: list.title,
      priority: list.priority,
      cards: list.cards.map((card) => ({
        text: card.text,
        description: card.description ?? "",
        done: card.done,
      })),
    })),
  };
};

export const parseTasksTransferFile = (
  content: string
): TasksTransferParseResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.lists)) {
    return { ok: false, reason: "invalid-schema" };
  }

  const version =
    typeof parsed.version === "number" ? parsed.version : NaN;
  if (!Number.isFinite(version) || version < 1) {
    return { ok: false, reason: "invalid-schema" };
  }

  const lists = parsed.lists
    .map(parseTransferList)
    .filter((list): list is TaskList => list !== null);

  if (lists.length !== parsed.lists.length) {
    return { ok: false, reason: "invalid-schema" };
  }

  const normalizedLists = normalizePriority(lists);
  const cardCount = normalizedLists.reduce(
    (total, list) => total + list.cards.length,
    0
  );

  return {
    ok: true,
    data: {
      version,
      lists: normalizedLists,
      listCount: normalizedLists.length,
      cardCount,
    },
  };
};
