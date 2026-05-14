import type { DayColor } from "store/tasks/types";

export type TaskGridDrawItem = {
  listId: string;
  cardId: string | null;
  isDone: boolean;
  isPrioritized: boolean;
  isPlaceholder: boolean;
  isSeparator: boolean;
  dayColor: DayColor;
};

export type TaskGridDrawCandidate = {
  listId: string;
  cardId: string;
  dayColor: DayColor;
  isPrioritized: boolean;
};

export type TaskGridPriorityFilterMode = "all" | "prioritized";

type BuildTaskGridDrawCandidatesParams = {
  drawOnlyPrioritizedTasks: boolean;
  gridItems: TaskGridDrawItem[];
  priorityFilterMode: TaskGridPriorityFilterMode;
};

export const buildTaskGridDrawCandidates = ({
  drawOnlyPrioritizedTasks,
  gridItems,
  priorityFilterMode,
}: BuildTaskGridDrawCandidatesParams): TaskGridDrawCandidate[] => {
  const eligibleCards = gridItems.flatMap((item) => {
    if (
      item.isSeparator ||
      item.isPlaceholder ||
      item.isDone ||
      item.dayColor === "red" ||
      item.cardId === null
    ) {
      return [];
    }

    return [
      {
        listId: item.listId,
        cardId: item.cardId,
        dayColor: item.dayColor,
        isPrioritized: item.isPrioritized,
      },
    ];
  });

  const prioritizedCards = eligibleCards.filter(
    (card) => card.isPrioritized
  );

  if (priorityFilterMode === "prioritized") {
    // The visual prioritized-only filter must never fall back to normal cards.
    return prioritizedCards;
  }

  if (drawOnlyPrioritizedTasks && prioritizedCards.length > 0) {
    return prioritizedCards;
  }

  return eligibleCards;
};
