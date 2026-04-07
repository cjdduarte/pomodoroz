import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppDispatch } from "hooks";
import {
  addTaskCard,
  editTaskTitle,
  editTaskCardText,
  removeTaskList,
  setTaskListPriority,
  setTaskSelection,
  removeTaskCard,
} from "store";
import { StyledTaskSectionItem, StyledCardWrapper } from "styles";
import type { TaskList as TaskListType } from "store";
import TaskHeader from "./TaskHeader";
import TaskFormButton from "./TaskFormButton";
import TaskDetails from "./TaskDetails";
import TaskCard from "./TaskCard";

type Props = {
  priority: boolean;
  listId: string;
  title: string;
  cards: TaskListType["cards"];
  onCardContextMenu?: (listId: string, cardId: string) => void;
};

const TaskList: React.FC<Props> = ({
  priority,
  title,
  cards,
  listId,
  onCardContextMenu,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const [cardId, setCardId] = useState("");

  const dispatch = useAppDispatch();
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `list:${listId}`,
    data: { type: "list", listId },
  });
  const { setNodeRef: setCardContainerRef } = useDroppable({
    id: `card-container:${listId}`,
    data: { type: "card-container", listId },
  });
  const hasPendingCards = cards.some((card) => !card.done);

  const onCardAdd = (cardText: string) => {
    dispatch(addTaskCard({ listId, cardText }));
  };

  const onEditListTitle = (listTitle: string) => {
    dispatch(editTaskTitle({ listId, listTitle }));
  };

  const onRemoveListAction = () => {
    dispatch(removeTaskList(listId));
  };

  const onSetListPriorityAction = () => {
    if (!hasPendingCards) return;

    const firstPendingTask = cards.find((card) => !card.done) || null;

    if (!firstPendingTask) return;

    dispatch(setTaskListPriority(listId));
    dispatch(
      setTaskSelection({
        listId,
        cardId: firstPendingTask._id,
      })
    );
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          overflow: "hidden",
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        <StyledTaskSectionItem
          ref={setCardContainerRef}
          isDragging={isDragging}
          priority={priority}
        >
          <TaskHeader
            title={title}
            onEditTitle={onEditListTitle}
            onRemoveList={onRemoveListAction}
            onMakeListPriority={onSetListPriorityAction}
            canMakeListPriority={hasPendingCards}
            dragHandleAttributes={attributes}
            dragHandleListeners={listeners}
            setDragHandleRef={setActivatorNodeRef}
          />

          <StyledCardWrapper>
            <SortableContext
              items={cards.map((card) => `card:${card._id}`)}
              strategy={verticalListSortingStrategy}
            >
              {cards.map(({ _id, text, done }) => (
                <TaskCard
                  key={_id}
                  text={text}
                  id={_id}
                  listId={listId}
                  done={done}
                  onClick={() => {
                    setCardId(_id);
                    setShowDetails(true);
                  }}
                  onSaveCardText={(text) =>
                    dispatch(
                      editTaskCardText({
                        listId,
                        cardId: _id,
                        cardText: text,
                      })
                    )
                  }
                  onDeleteCard={() =>
                    dispatch(removeTaskCard({ listId, cardId: _id }))
                  }
                  onContextMenu={() => {
                    onCardContextMenu?.(listId, _id);
                  }}
                />
              ))}
            </SortableContext>
          </StyledCardWrapper>

          <TaskFormButton onSubmit={onCardAdd} />
        </StyledTaskSectionItem>
      </div>

      {showDetails && (
        <TaskDetails
          listId={listId}
          cardId={cardId}
          onExit={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export default React.memo(TaskList);
