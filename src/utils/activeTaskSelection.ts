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

  const findOpenCard = (list: TaskList) =>
    list.cards.find(
      (card) => card._id === taskSelection.cardId && !card.done
    );

  const selectedList =
    taskLists.find(
      (list) => list._id === taskSelection.listId && findOpenCard(list)
    ) ??
    // Undo de drag devolve o card à lista de origem sem mover a seleção.
    taskLists.find(findOpenCard);
  const selectedCard = selectedList && findOpenCard(selectedList);

  if (!selectedList || !selectedCard) {
    return null;
  }

  return {
    listId: selectedList._id,
    cardId: selectedCard._id,
    listTitle: selectedList.title,
    taskText: selectedCard.text,
  };
};
