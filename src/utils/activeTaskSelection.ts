import type { TaskSelection } from "store/taskSelection/types";
import type { TaskList } from "store/tasks/types";

export type ResolvedActiveTaskSelection = {
  listId: string;
  cardId: string;
  listTitle: string;
  taskText: string;
};

type ResolveActiveTaskSelectionPayload = {
  taskLists: TaskList[];
  taskSelection: TaskSelection | null | undefined;
};

export const resolveActiveTaskSelection = ({
  taskLists,
  taskSelection,
}: ResolveActiveTaskSelectionPayload): ResolvedActiveTaskSelection | null => {
  if (!taskSelection) {
    return null;
  }

  const selectedList =
    taskLists.find((list) => list._id === taskSelection.listId) || null;

  if (!selectedList) {
    return null;
  }

  const selectedCard =
    selectedList.cards.find(
      (card) => card._id === taskSelection.cardId && !card.done
    ) || null;

  if (!selectedCard) {
    return null;
  }

  return {
    listId: selectedList._id,
    cardId: selectedCard._id,
    listTitle: selectedList.title,
    taskText: selectedCard.text,
  };
};
