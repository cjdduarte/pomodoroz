import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import {
  clearTaskSelection,
  removeTaskCard,
  setTaskCardDone,
  setTaskListPriority,
  setTaskSelection,
  skipTaskCard,
} from "store";
import { SVG } from "components";
import { TimerStatus } from "store/timer/types";
import styled from "styled-components";
import { themes } from "styles/themes";
import type { TaskSelection } from "store";
import type { TaskList, Task } from "store/tasks/types";
import { resolveActiveTaskSelection } from "utils";
import TaskListGrid from "routes/Tasks/TaskListGrid";
import { COMPACT_COLLAPSE, COMPACT_EXPAND } from "ipc";
import { getInvokeConnector } from "contexts";

type TimerLocationState = {
  selectedTask?: TaskSelection;
};

const StyledCompactTask = styled.div`
  width: 100%;
  padding: 0.4rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.4rem;
  border-top: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-secondary);
  position: relative;
`;

const StyledCompactTaskBlock = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const COMPACT_GRID_PANEL_HEIGHT = 320;

const StyledCompactGridPanel = styled.div`
  width: 100%;
  height: ${COMPACT_GRID_PANEL_HEIGHT}px;
  display: flex;
  min-height: 0;
  border-top: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-primary);
  overflow: hidden;
  animation: fadeCompactGrid 160ms ease;

  & > div {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  @keyframes fadeCompactGrid {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }
`;

const StyledNormalGridOverlay = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 100%;
  height: ${COMPACT_GRID_PANEL_HEIGHT}px;
  display: flex;
  border: 1px solid var(--color-border-primary);
  border-bottom: none;
  background-color: var(--color-bg-primary);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
  z-index: 130;
  overflow: hidden;
  animation: fadeCompactGrid 160ms ease;

  & > div {
    width: 100%;
    height: 100%;
    min-height: 0;
  }

  @keyframes fadeCompactGrid {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }
`;

const StyledTaskClickable = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  text-align: left;

  &:hover > span:first-child {
    color: var(--color-primary);
  }

  &:hover > span:last-child {
    color: var(--color-primary);
  }
`;

const StyledTaskText = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-heading-text);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
  transition: ${themes.transition};
`;

const StyledTaskLabel = styled.span`
  font-size: 1rem;
  color: var(--color-body-text);
  white-space: nowrap;
  transition: ${themes.transition};
`;

const StyledTaskButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  min-height: 1.6rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background-color: transparent;
  color: var(--color-body-text);
  cursor: pointer;
  transition: ${themes.transition};

  &:hover {
    color: var(--color-primary);
  }

  & > svg {
    width: 1.2rem;
    height: 1.2rem;
    fill: currentColor;
  }
`;

const StyledTaskButtonGlyph = styled.span`
  width: 1.2rem;
  height: 1.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  line-height: 1;
`;

const StyledActionsTaskButton = styled(StyledTaskButton)`
  min-width: 1.8rem;
  min-height: 1.8rem;

  & > svg {
    width: 1.35rem;
    height: 1.35rem;
  }
`;

const StyledActionsMenu = styled.div<{ compact?: boolean }>`
  position: absolute;
  right: 0.8rem;
  bottom: calc(100% + 0.2rem);
  min-width: 12rem;
  max-height: min(24rem, calc(100vh - 4.8rem));
  overflow-y: auto;
  border: 1px solid var(--color-border-primary);
  border-radius: 3px;
  background-color: var(--color-bg-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 140;

  ${(p) =>
    p.compact &&
    `
      position: fixed;
      left: 0.8rem;
      right: 0.8rem;
      bottom: 3.2rem;
      min-width: 0;
      max-height: min(24rem, calc(100vh - 4rem));
      z-index: 180;
    `}
`;

const StyledActionsMenuHeader = styled.div`
  font-size: 1rem;
  color: var(--color-disabled-text);
  padding: 0.6rem 1rem 0.4rem;
  border-bottom: 1px solid var(--color-border-primary);
  text-transform: uppercase;
`;

const StyledActionsMenuItem = styled.button<{
  variant: "done" | "skip" | "delete" | "neutral";
}>`
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0.6rem 1rem;
  color: var(--color-heading-text);
  cursor: pointer;
  transition: ${themes.transition};

  &:hover {
    background-color: var(--color-bg-secondary);
    color: ${(p) => {
      if (p.variant === "done") {
        return "var(--color-green)";
      }
      if (p.variant === "skip") {
        return "var(--color-yellow)";
      }
      if (p.variant === "delete") {
        return "var(--color-pink)";
      }
      return "var(--color-primary)";
    }};
  }
`;

const StyledDropdown = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  max-height: 20rem;
  overflow-y: auto;
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 3px;
  z-index: 100;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);

  &.upward {
    bottom: 100%;
  }

  &.downward {
    top: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  &.compact {
    position: fixed;
    top: 0.8rem;
    right: 0.8rem;
    bottom: 3.2rem;
    left: 0.8rem;
    max-height: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }
`;

const StyledDropdownGroup = styled.div`
  &:not(:first-child) {
    border-top: 1px solid var(--color-border-primary);
  }
`;

const StyledDropdownGroupTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-body-text);
  padding: 0.4rem 1.2rem;
  background-color: var(--color-bg-tertiary);
  text-transform: uppercase;
`;

const StyledDropdownGroupTitleButton = styled.button<{
  $active?: boolean;
}>`
  width: 100%;
  border: none;
  text-align: left;
  cursor: pointer;
  background-color: ${(p) =>
    p.$active
      ? "var(--color-bg-secondary)"
      : "var(--color-bg-tertiary)"};
  color: var(--color-heading-text);
  transition: ${themes.transition};

  &:hover {
    background-color: var(--color-bg-secondary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

const StyledDropdownItem = styled.button<{
  $active?: boolean;
}>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.2rem;
  border: none;
  background-color: ${(p) =>
    p.$active ? "var(--color-bg-secondary)" : "transparent"};
  color: var(--color-heading-text);
  font-size: 1.2rem;
  text-align: left;
  cursor: pointer;
  transition: ${themes.transition};

  &:hover {
    background-color: var(--color-bg-secondary);
  }
`;

const StyledDropdownEmpty = styled.div`
  width: 100%;
  padding: 0.6rem 1.2rem;
  color: var(--color-body-text);
  font-size: 1.1rem;
  font-style: italic;
`;

const StyledNoTask = styled.span`
  font-size: 1.1rem;
  color: var(--color-body-text);
  font-style: italic;
`;

const StyledPromptContainer = styled.div`
  width: 100%;
  padding: 0.4rem 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.4rem;
  border-top: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-tertiary);
`;

const StyledPromptText = styled.span`
  font-size: 1.1rem;
  color: var(--color-heading-text);
  flex: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const StyledPromptButton = styled.button`
  font-size: 1rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--color-border-primary);
  border-radius: 3px;
  background-color: var(--color-bg-secondary);
  color: var(--color-heading-text);
  cursor: pointer;
  white-space: nowrap;
  transition: ${themes.transition};

  &:hover {
    background-color: var(--color-primary);
    color: var(--color-bg-primary);
    border-color: var(--color-primary);
  }
`;

const CompactTaskDisplay: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const tasks = useAppSelector((state) => state.tasks.present);
  const timer = useAppSelector((state) => state.timer);
  const compactMode = useAppSelector(
    (state) => state.settings.compactMode
  );
  const selected = useAppSelector((state) => state.taskSelection);
  const dispatch = useAppDispatch();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [dropdownDirection, setDropdownDirection] = useState<
    "upward" | "downward"
  >("upward");
  const [prevTimerType, setPrevTimerType] = useState(timer.timerType);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const consumedSelectionNavigationKeyRef = useRef<string | null>(null);

  const activeTaskSelection = useMemo(
    () =>
      resolveActiveTaskSelection({
        taskLists: tasks,
        taskSelection: selected,
      }),
    [selected, tasks]
  );

  const displayList = useMemo(
    () =>
      activeTaskSelection
        ? tasks.find(
            (list) => list._id === activeTaskSelection.listId
          ) || null
        : null,
    [activeTaskSelection, tasks]
  );

  const currentTask = useMemo(
    () =>
      displayList && activeTaskSelection
        ? displayList.cards.find(
            (card) =>
              card._id === activeTaskSelection.cardId && !card.done
          ) || null
        : null,
    [activeTaskSelection, displayList]
  );

  // Keep persisted selection valid against task changes.
  useEffect(() => {
    if (!selected) {
      return;
    }

    if (activeTaskSelection) {
      return;
    }

    dispatch(clearTaskSelection());
  }, [activeTaskSelection, dispatch, selected]);

  const sendCompactResizeEvent = useCallback(
    (channel: typeof COMPACT_EXPAND | typeof COMPACT_COLLAPSE) => {
      const invokeConnector = getInvokeConnector();
      if (!invokeConnector) {
        return;
      }

      try {
        invokeConnector.send(channel);
      } catch (error) {
        console.error(
          "[CompactGrid] Failed to send resize event.",
          error
        );
      }
    },
    []
  );

  const collapseCompactGrid = useCallback(() => {
    if (!showGrid) return;
    setShowGrid(false);
    sendCompactResizeEvent(COMPACT_COLLAPSE);
  }, [sendCompactResizeEvent, showGrid]);

  const closeGrid = useCallback(() => {
    if (!showGrid) return;
    if (compactMode) {
      collapseCompactGrid();
    } else {
      setShowGrid(false);
    }
  }, [compactMode, collapseCompactGrid, showGrid]);

  // Consume selection sent by grid navigation (Tasks -> Timer) exactly once per location key.
  useEffect(() => {
    if (consumedSelectionNavigationKeyRef.current === location.key) {
      return;
    }

    const state = location.state as TimerLocationState | null;
    const selectedTaskFromGrid = state?.selectedTask;

    if (!selectedTaskFromGrid) {
      return;
    }

    consumedSelectionNavigationKeyRef.current = location.key;

    const list = tasks.find(
      (taskList) => taskList._id === selectedTaskFromGrid.listId
    );

    if (!list) {
      dispatch(clearTaskSelection());
      return;
    }

    const selectedCard = list.cards.find(
      (card) => card._id === selectedTaskFromGrid.cardId && !card.done
    );

    if (!selectedCard) {
      dispatch(clearTaskSelection());
      return;
    }

    dispatch(setTaskListPriority(list._id));
    dispatch(
      setTaskSelection({
        listId: list._id,
        cardId: selectedCard._id,
      })
    );
  }, [dispatch, location.key, location.state, tasks]);

  // Detect session transition to show prompt
  useEffect(() => {
    if (timer.timerType !== prevTimerType) {
      if (
        timer.timerType === TimerStatus.STAY_FOCUS &&
        prevTimerType !== TimerStatus.STAY_FOCUS &&
        currentTask
      ) {
        setShowPrompt(true);
      }
      setPrevTimerType(timer.timerType);
    }
  }, [timer.timerType, prevTimerType, currentTask]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const clickedOutsideContainer =
        !containerRef.current || !containerRef.current.contains(target);

      if (!clickedOutsideContainer) {
        return;
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }

      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(target)
      ) {
        setShowActions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keep dropdown visible in non-compact mode by flipping if needed.
  useEffect(() => {
    if (!showDropdown || compactMode) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceAbove < 180 && spaceBelow > spaceAbove) {
      setDropdownDirection("downward");
      return;
    }

    setDropdownDirection("upward");
  }, [showDropdown, compactMode]);

  // Close grid on mode transition (compact <-> normal)
  useEffect(() => {
    setShowGrid(false);
  }, [compactMode]);

  // Close grid when prompt appears or tasks become empty
  useEffect(() => {
    if ((showPrompt || tasks.length === 0) && showGrid) {
      closeGrid();
    }
  }, [closeGrid, showGrid, showPrompt, tasks.length]);

  // On unmount, collapse compact window if grid was open
  useEffect(() => {
    return () => {
      if (showGrid && compactMode) {
        sendCompactResizeEvent(COMPACT_COLLAPSE);
      }
    };
  }, [sendCompactResizeEvent, showGrid, compactMode]);

  const handleDone = () => {
    if (!currentTask || !displayList) {
      setShowActions(false);
      return;
    }

    dispatch(
      setTaskCardDone({
        listId: displayList._id,
        cardId: currentTask._id,
      })
    );

    const nextPendingTask = displayList.cards.find(
      (card) => card._id !== currentTask._id && !card.done
    );

    if (nextPendingTask) {
      dispatch(
        setTaskSelection({
          listId: displayList._id,
          cardId: nextPendingTask._id,
        })
      );
    } else {
      dispatch(clearTaskSelection());
    }

    setShowActions(false);
  };

  const handleSkip = () => {
    if (!currentTask || !displayList) {
      setShowActions(false);
      return;
    }

    dispatch(
      skipTaskCard({
        listId: displayList._id,
        cardId: currentTask._id,
      })
    );

    const nextPendingTask = displayList.cards.find(
      (card) => card._id !== currentTask._id && !card.done
    );

    if (nextPendingTask) {
      dispatch(
        setTaskSelection({
          listId: displayList._id,
          cardId: nextPendingTask._id,
        })
      );
    } else {
      dispatch(clearTaskSelection());
    }

    setShowActions(false);
  };

  const handleDelete = () => {
    if (!currentTask || !displayList) {
      setShowActions(false);
      return;
    }

    dispatch(
      removeTaskCard({
        listId: displayList._id,
        cardId: currentTask._id,
      })
    );

    const nextPendingTask = displayList.cards.find(
      (card) => card._id !== currentTask._id && !card.done
    );

    if (nextPendingTask) {
      dispatch(
        setTaskSelection({
          listId: displayList._id,
          cardId: nextPendingTask._id,
        })
      );
    } else {
      dispatch(clearTaskSelection());
    }

    setShowActions(false);
  };

  const handleSelect = (list: TaskList, card: Task) => {
    dispatch(setTaskListPriority(list._id));
    dispatch(setTaskSelection({ listId: list._id, cardId: card._id }));
    setShowDropdown(false);
    setShowActions(false);
  };

  const handleSelectList = (list: TaskList) => {
    const firstPendingTask =
      list.cards.find((card) => !card.done) || null;

    if (!firstPendingTask) {
      return;
    }

    dispatch(setTaskListPriority(list._id));
    dispatch(
      setTaskSelection({
        listId: list._id,
        cardId: firstPendingTask._id,
      })
    );
    setShowDropdown(false);
    setShowActions(false);
  };

  const handleContinue = () => {
    setShowPrompt(false);
  };

  const handleSwitch = () => {
    setShowPrompt(false);
    if (!showGrid) {
      handleToggleGrid();
    }
  };

  const handleOpenPriorityList = () => {
    closeGrid();
    setShowActions(false);
    setShowDropdown(true);
  };

  const handleToggleGrid = () => {
    setShowDropdown(false);
    setShowActions(false);

    if (showGrid) {
      closeGrid();
      return;
    }

    setShowGrid(true);
    if (compactMode) {
      sendCompactResizeEvent(COMPACT_EXPAND);
    }
  };

  const handleActionsButtonClick = () => {
    closeGrid();
    if (!currentTask) {
      setShowActions(false);
      setShowDropdown(true);
      return;
    }
    setShowDropdown(false);
    setShowActions((prev) => !prev);
  };

  const handleGridSelect = (listId: string, cardId?: string) => {
    const selectedListFromGrid = tasks.find(
      (taskList) => taskList._id === listId
    );
    const selectedCardFromGrid =
      cardId && selectedListFromGrid
        ? selectedListFromGrid.cards.find(
            (card) => card._id === cardId && !card.done
          )
        : undefined;

    if (!selectedListFromGrid || !selectedCardFromGrid) {
      dispatch(clearTaskSelection());

      setShowDropdown(false);
      setShowActions(false);
      closeGrid();
      return;
    }

    dispatch(setTaskListPriority(listId));
    dispatch(
      setTaskSelection({
        listId: selectedListFromGrid._id,
        cardId: selectedCardFromGrid._id,
      })
    );

    setShowDropdown(false);
    setShowActions(false);
    closeGrid();
  };

  if (showPrompt && currentTask) {
    return (
      <StyledPromptContainer>
        <StyledPromptText>
          {t("tasks.continueTaskPrompt", {
            task: currentTask.text,
          })}
        </StyledPromptText>
        <StyledPromptButton onClick={handleContinue}>
          {t("tasks.continue")}
        </StyledPromptButton>
        <StyledPromptButton onClick={handleSwitch}>
          {t("tasks.switch")}
        </StyledPromptButton>
      </StyledPromptContainer>
    );
  }

  if (!tasks.length) {
    return (
      <StyledCompactTask>
        <StyledNoTask>{t("tasks.noTasks")}</StyledNoTask>
      </StyledCompactTask>
    );
  }

  return (
    <StyledCompactTaskBlock ref={containerRef}>
      <StyledCompactTask>
        {showActions ? (
          <StyledActionsMenu ref={actionMenuRef} compact={compactMode}>
            <StyledActionsMenuHeader>
              {t("tasks.actions")}
            </StyledActionsMenuHeader>
            <StyledActionsMenuItem
              variant="neutral"
              onClick={handleOpenPriorityList}
            >
              {t("tasks.priorityList")}
            </StyledActionsMenuItem>
            {currentTask ? (
              <>
                <StyledActionsMenuItem
                  variant="done"
                  onClick={handleDone}
                >
                  {t("tasks.done")}
                </StyledActionsMenuItem>
                <StyledActionsMenuItem
                  variant="skip"
                  onClick={handleSkip}
                >
                  {t("tasks.skip")}
                </StyledActionsMenuItem>
                <StyledActionsMenuItem
                  variant="delete"
                  onClick={handleDelete}
                >
                  {t("tasks.delete")}
                </StyledActionsMenuItem>
              </>
            ) : null}
          </StyledActionsMenu>
        ) : null}

        {showDropdown && (
          <StyledDropdown
            className={`${dropdownDirection} ${
              compactMode ? "compact" : ""
            }`}
            ref={dropdownRef}
          >
            {tasks.map((list) => {
              const notDoneCards = list.cards.filter((c) => !c.done);
              const hasPendingTask = notDoneCards.length > 0;

              return (
                <StyledDropdownGroup key={list._id}>
                  <StyledDropdownGroupTitleButton
                    $active={displayList?._id === list._id}
                    disabled={!hasPendingTask}
                    onClick={() => handleSelectList(list)}
                    title={
                      hasPendingTask
                        ? undefined
                        : t("tasks.noPendingTasks")
                    }
                  >
                    <StyledDropdownGroupTitle>
                      {list.title}
                    </StyledDropdownGroupTitle>
                  </StyledDropdownGroupTitleButton>

                  {notDoneCards.length ? (
                    notDoneCards.map((card) => (
                      <StyledDropdownItem
                        key={card._id}
                        $active={
                          currentTask?._id === card._id &&
                          displayList?._id === list._id
                        }
                        onClick={() => handleSelect(list, card)}
                      >
                        {card.text}
                      </StyledDropdownItem>
                    ))
                  ) : (
                    <StyledDropdownEmpty>
                      {t("tasks.noPendingTasks")}
                    </StyledDropdownEmpty>
                  )}
                </StyledDropdownGroup>
              );
            })}
          </StyledDropdown>
        )}

        <StyledTaskClickable
          onClick={() => {
            closeGrid();
            setShowActions(false);
            setShowDropdown(!showDropdown);
          }}
        >
          {currentTask ? (
            <>
              <StyledTaskLabel>{displayList?.title}:</StyledTaskLabel>
              <StyledTaskText>{currentTask.text}</StyledTaskText>
            </>
          ) : (
            <StyledNoTask>
              {t("tasks.noActiveTaskSelected")}
            </StyledNoTask>
          )}
        </StyledTaskClickable>

        <StyledTaskButton
          onClick={handleToggleGrid}
          title={t("grid.title")}
        >
          <StyledTaskButtonGlyph>{"▦"}</StyledTaskButtonGlyph>
        </StyledTaskButton>

        <StyledActionsTaskButton
          onClick={handleActionsButtonClick}
          title={t("tasks.actions")}
        >
          <SVG name="option-x" />
        </StyledActionsTaskButton>

        {!compactMode && showGrid ? (
          <StyledNormalGridOverlay>
            <TaskListGrid onSelectList={handleGridSelect} />
          </StyledNormalGridOverlay>
        ) : null}
      </StyledCompactTask>

      {compactMode && showGrid ? (
        <StyledCompactGridPanel>
          <TaskListGrid compact onSelectList={handleGridSelect} />
        </StyledCompactGridPanel>
      ) : null}
    </StyledCompactTaskBlock>
  );
};

export default React.memo(CompactTaskDisplay);
