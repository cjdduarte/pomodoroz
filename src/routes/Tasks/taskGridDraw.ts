import type { DayColor } from "store/tasks/types";
import type { TaskGridPriorityDisplayMode } from "./taskGridPriorityDisplay";

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

type BuildTaskGridDrawCandidatesParams = {
  drawOnlyPrioritizedTasks: boolean;
  gridItems: TaskGridDrawItem[];
  priorityDisplayMode: TaskGridPriorityDisplayMode;
};

export const buildTaskGridDrawCandidates = ({
  drawOnlyPrioritizedTasks,
  gridItems,
  priorityDisplayMode,
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

  if (priorityDisplayMode === "only") {
    // The visual prioritized-only filter must only use prioritized cards.
    return prioritizedCards;
  }

  if (drawOnlyPrioritizedTasks && prioritizedCards.length > 0) {
    return prioritizedCards;
  }

  return eligibleCards;
};
