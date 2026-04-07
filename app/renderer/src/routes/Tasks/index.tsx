import React, { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "hooks";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  StyledTaskContainer,
  StyledTaskStickySection,
  StyledTaskWrapper,
  StyledTaskMain,
} from "styles";
import {
  addTaskList,
  dragList,
  redoTasks,
  setTaskListPriority,
  setTaskSelection,
  undoTasks,
} from "store";
import { getFromStorage, saveToStorage } from "utils";
import {
  StyledViewToggle,
  StyledViewToggleButton,
} from "./TaskListGrid.styles";

import TaskFormButton from "./TaskFormButton";
import TaskInnerList from "./TaskInnerList";
import TaskListGrid from "./TaskListGrid";

type ViewMode = "list" | "grid";
const TASKS_VIEW_MODE_STORAGE_KEY = "tasks-view-mode";
type TimerNavigationState = {
  selectedTask?: {
    listId: string;
    cardId: string;
  };
};

const getInitialViewMode = (): ViewMode => {
  const savedViewMode = getFromStorage<string>(
    TASKS_VIEW_MODE_STORAGE_KEY
  );
  return savedViewMode === "grid" || savedViewMode === "list"
    ? savedViewMode
    : "list";
};

export default function Tasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const tasks = useAppSelector((state) => state.tasks);

  const dispatch = useAppDispatch();
  const [viewMode, setViewMode] =
    useState<ViewMode>(getInitialViewMode);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const onListAdd = (value: string) => dispatch(addTaskList(value));

  const handleGridSelect = useCallback(
    (listId: string, cardId?: string) => {
      if (!cardId) {
        return;
      }

      const selectedList = tasks.present.find(
        (taskList) => taskList._id === listId
      );
      const selectedCard = selectedList?.cards.find(
        (card) => card._id === cardId && !card.done
      );

      if (!selectedList || !selectedCard) {
        return;
      }

      dispatch(setTaskListPriority(listId));
      dispatch(setTaskSelection({ listId, cardId }));
      const state: TimerNavigationState = {
        selectedTask: {
          listId,
          cardId,
        },
      };
      navigate("/", { state });
    },
    [dispatch, navigate, tasks.present]
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return;
    }

    const activeData = active.data.current as
      | {
          type: "list";
          listId: string;
        }
      | {
          type: "card";
          listId: string;
          cardId: string;
        }
      | undefined;

    const overData = over.data.current as
      | {
          type: "list";
          listId: string;
        }
      | {
          type: "card";
          listId: string;
          cardId: string;
        }
      | {
          type: "card-container";
          listId: string;
        }
      | undefined;

    if (!activeData || !overData) {
      return;
    }

    if (activeData.type === "list" && overData.type === "list") {
      const sourceIndex = tasks.present.findIndex(
        (list) => list._id === activeData.listId
      );
      const destinationIndex = tasks.present.findIndex(
        (list) => list._id === overData.listId
      );

      if (
        sourceIndex < 0 ||
        destinationIndex < 0 ||
        sourceIndex === destinationIndex
      ) {
        return;
      }

      dispatch(
        dragList({
          sourceId: "task-list",
          destinationId: "task-list",
          sourceIndex,
          destinationIndex,
          draggableId: activeData.listId,
          type: "list",
        })
      );

      return;
    }

    if (activeData.type !== "card") {
      return;
    }

    const sourceListId = activeData.listId;
    const sourceList = tasks.present.find(
      (list) => list._id === sourceListId
    );
    const sourceIndex =
      sourceList?.cards.findIndex(
        (card) => card._id === activeData.cardId
      ) ?? -1;

    if (!sourceList || sourceIndex < 0) {
      return;
    }

    let destinationListId = sourceListId;
    let destinationIndex = sourceList.cards.length;

    if (overData.type === "card") {
      destinationListId = overData.listId;
      const destinationList = tasks.present.find(
        (list) => list._id === destinationListId
      );

      if (!destinationList) {
        return;
      }

      destinationIndex = destinationList.cards.findIndex(
        (card) => card._id === overData.cardId
      );

      if (destinationIndex < 0) {
        destinationIndex = destinationList.cards.length;
      }
    } else if (
      overData.type === "card-container" ||
      overData.type === "list"
    ) {
      destinationListId = overData.listId;
      const destinationList = tasks.present.find(
        (list) => list._id === destinationListId
      );

      if (!destinationList) {
        return;
      }

      destinationIndex = destinationList.cards.length;
    }

    if (
      sourceListId === destinationListId &&
      sourceIndex === destinationIndex
    ) {
      return;
    }

    dispatch(
      dragList({
        sourceId: sourceListId,
        destinationId: destinationListId,
        sourceIndex,
        destinationIndex,
        draggableId: activeData.cardId,
        type: "card",
      })
    );
  };

  useEffect(() => {
    saveToStorage(TASKS_VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    function registerUndoRedoKeys(e: KeyboardEvent) {
      const activeElement = document.activeElement?.tagName;

      if (activeElement !== "INPUT" && activeElement !== "TEXTAREA") {
        if (e.ctrlKey && e.code === "KeyZ") {
          if (tasks.past.length > 0) {
            dispatch(undoTasks());
          }
        }

        if (e.ctrlKey && e.shiftKey && e.code === "KeyZ") {
          if (tasks.future.length > 0) {
            dispatch(redoTasks());
          }
        }
      }
    }

    document.addEventListener("keydown", registerUndoRedoKeys);
    return () =>
      document.removeEventListener("keydown", registerUndoRedoKeys);
  }, [dispatch, tasks.past.length, tasks.future.length]);

  if (viewMode === "grid") {
    return (
      <StyledTaskMain>
        <StyledViewToggle>
          <StyledViewToggleButton
            $active={false}
            onClick={() => setViewMode("list")}
          >
            {"☰ "}
            {t("tasks.viewList")}
          </StyledViewToggleButton>
          <StyledViewToggleButton $active>
            {"▦ "}
            {t("tasks.viewGrid")}
          </StyledViewToggleButton>
        </StyledViewToggle>
        <TaskListGrid onSelectList={handleGridSelect} />
      </StyledTaskMain>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <StyledTaskMain>
        <StyledViewToggle>
          <StyledViewToggleButton $active>
            {"☰ "}
            {t("tasks.viewList")}
          </StyledViewToggleButton>
          <StyledViewToggleButton
            $active={false}
            onClick={() => setViewMode("grid")}
          >
            {"▦ "}
            {t("tasks.viewGrid")}
          </StyledViewToggleButton>
        </StyledViewToggle>
        <StyledTaskContainer>
          <SortableContext
            items={tasks.present.map((task) => `list:${task._id}`)}
            strategy={verticalListSortingStrategy}
          >
            <StyledTaskWrapper>
              <TaskInnerList
                tasks={tasks.present}
                onCardContextMenu={(listId, cardId) =>
                  handleGridSelect(listId, cardId)
                }
              />

              <StyledTaskStickySection>
                <TaskFormButton forList onSubmit={onListAdd} />
              </StyledTaskStickySection>
            </StyledTaskWrapper>
          </SortableContext>
        </StyledTaskContainer>
      </StyledTaskMain>
    </DndContext>
  );
}
