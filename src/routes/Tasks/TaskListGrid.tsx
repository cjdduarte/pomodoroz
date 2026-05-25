import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ConfirmDialog } from "components";
import { useTranslation } from "react-i18next";
import {
  useAppDispatch,
  useAppSelector,
  useCompactAutoExpand,
} from "hooks";
import {
  resetAllDayColors,
  setTaskCardPriority,
  setTaskDayColor,
} from "store";
import type { DayColor } from "store/tasks/types";
import {
  getFromStorage,
  removeFromStorage,
  resolveActiveTaskSelection,
  saveToStorage,
} from "utils";
import {
  StyledGridWrapper,
  StyledGridToolbar,
  StyledGridToolbarButton,
  StyledGridContent,
  StyledGridCards,
  StyledGridCardShell,
  StyledGridSeparator,
  StyledGridDivider,
  StyledGridCard,
  StyledGridPriorityButton,
  StyledGridCardTitle,
  StyledGridCardTask,
  StyledGridFooter,
  StyledGridStats,
  StyledGridFooterControls,
  StyledGridColumns,
  StyledGridColumnsLabel,
  StyledGridColumnsSelect,
} from "./TaskListGrid.styles";
import { buildTaskGridDrawCandidates } from "./taskGridDraw";
import {
  getNextTaskGridPriorityDisplayMode,
  resolveInitialTaskGridPriorityDisplayMode,
  type TaskGridPriorityDisplayMode,
} from "./taskGridPriorityDisplay";

type Props = {
  onSelectList: (listId: string, cardId?: string) => void;
  compact?: boolean;
};

type GridItem = {
  key: string;
  listId: string;
  cardId: string | null;
  listTitle: string;
  taskText: string;
  isDone: boolean;
  isPrioritized: boolean;
  isPriorityItem: boolean;
  isPlaceholder: boolean;
  dayColor: DayColor;
  isSeparator: boolean;
  isDivider: boolean;
};

type GridColumnsMode = "auto" | "1" | "2" | "3" | "4";
type PriorityDisplayMode = TaskGridPriorityDisplayMode;

const GRID_COLUMNS_STORAGE_KEY = "tasks-grid-columns";
const GRID_GROUPED_STORAGE_KEY = "tasks-grid-grouped";
const GRID_PRIORITY_DISPLAY_STORAGE_KEY = "tasks-grid-priority-display";
const LEGACY_GRID_PRIORITY_FILTER_STORAGE_KEY =
  "tasks-grid-priority-filter";

const getTodayDateKey = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const getInitialColumnsMode = (): GridColumnsMode => {
  const storedValue = getFromStorage<string>(GRID_COLUMNS_STORAGE_KEY);
  return storedValue === "1" ||
    storedValue === "2" ||
    storedValue === "3" ||
    storedValue === "4" ||
    storedValue === "auto"
    ? storedValue
    : "auto";
};

const getInitialGrouped = (): boolean => {
  const storedValue = getFromStorage<boolean>(GRID_GROUPED_STORAGE_KEY);
  return storedValue === true;
};

const getInitialPriorityDisplayMode = (): PriorityDisplayMode => {
  const storedValue = getFromStorage<string>(
    GRID_PRIORITY_DISPLAY_STORAGE_KEY
  );
  const legacyStoredValue = getFromStorage<string>(
    LEGACY_GRID_PRIORITY_FILTER_STORAGE_KEY
  );

  return resolveInitialTaskGridPriorityDisplayMode(
    storedValue,
    legacyStoredValue
  );
};

const TaskListGrid: React.FC<Props> = ({ onSelectList, compact }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.present);
  const selectedTask = useAppSelector((state) => state.taskSelection);
  const showGridRandomButton = useAppSelector(
    (state) => state.settings.showGridRandomButton
  );
  const drawOnlyPrioritizedTasks = useAppSelector(
    (state) => state.settings.drawOnlyPrioritizedTasks
  );
  const compactModeEnabled = useAppSelector(
    (state) => state.settings.compactMode
  );
  const enableGridColorLoop = useAppSelector(
    (state) => state.settings.enableGridColorLoop
  );
  const [columnsMode, setColumnsMode] = useState<GridColumnsMode>(
    getInitialColumnsMode
  );
  const [grouped, setGrouped] = useState<boolean>(getInitialGrouped);
  const [priorityDisplayMode, setPriorityDisplayMode] =
    useState<PriorityDisplayMode>(getInitialPriorityDisplayMode);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { maybeExpandCompact, collapseCompact } = useCompactAutoExpand({
    compactModeEnabled,
  });

  const activeTaskSelection = useMemo(
    () =>
      resolveActiveTaskSelection({
        taskLists: tasks,
        taskSelection: selectedTask,
      }),
    [selectedTask, tasks]
  );

  useEffect(() => {
    const today = getTodayDateKey();
    const hasStale = tasks.some(
      (list) =>
        (list.dayColorDate && list.dayColorDate !== today) ||
        list.cards.some(
          (card) => card.dayColorDate && card.dayColorDate !== today
        )
    );

    if (hasStale) {
      dispatch(resetAllDayColors());
    }
  }, [dispatch, tasks]);

  useEffect(() => {
    saveToStorage(GRID_COLUMNS_STORAGE_KEY, columnsMode);
  }, [columnsMode]);

  useEffect(() => {
    saveToStorage(GRID_GROUPED_STORAGE_KEY, grouped);
  }, [grouped]);

  useEffect(() => {
    saveToStorage(
      GRID_PRIORITY_DISPLAY_STORAGE_KEY,
      priorityDisplayMode
    );
  }, [priorityDisplayMode]);

  useEffect(() => {
    removeFromStorage(LEGACY_GRID_PRIORITY_FILTER_STORAGE_KEY);
  }, []);

  const gridItems = useMemo<GridItem[]>(() => {
    const prioritySeparatorItem: GridItem = {
      key: "sep:priorities",
      listId: "priorities",
      cardId: null,
      listTitle: t("grid.priorities"),
      taskText: "",
      isDone: false,
      isPrioritized: false,
      isPriorityItem: false,
      isPlaceholder: false,
      dayColor: null,
      isSeparator: true,
      isDivider: false,
    };

    const priorityDividerItem: GridItem = {
      key: "sep:after-priorities",
      listId: "priorities",
      cardId: null,
      listTitle: "",
      taskText: "",
      isDone: false,
      isPrioritized: false,
      isPriorityItem: false,
      isPlaceholder: false,
      dayColor: null,
      isSeparator: true,
      isDivider: true,
    };

    const createSeparatorItem = (
      list: (typeof tasks)[number]
    ): GridItem => ({
      key: `sep:${list._id}`,
      listId: list._id,
      cardId: null,
      listTitle: list.title,
      taskText: "",
      isDone: false,
      isPrioritized: false,
      isPriorityItem: false,
      isPlaceholder: false,
      dayColor: null,
      isSeparator: true,
      isDivider: false,
    });

    const createCardItem = (
      list: (typeof tasks)[number],
      card: (typeof list.cards)[number],
      isPriorityItem = false
    ): GridItem => ({
      key: `${isPriorityItem ? "priority" : "card"}:${list._id}:${
        card._id
      }`,
      listId: list._id,
      cardId: card._id,
      listTitle: list.title,
      taskText: card.text,
      isDone: card.done,
      isPrioritized: card.prioritized,
      isPriorityItem,
      isPlaceholder: false,
      dayColor: card.dayColor ?? null,
      isSeparator: false,
      isDivider: false,
    });

    const createEmptyItem = (
      list: (typeof tasks)[number]
    ): GridItem => ({
      key: `${list._id}:empty`,
      listId: list._id,
      cardId: null,
      listTitle: list.title,
      taskText: t("tasks.noTasks"),
      isDone: false,
      isPrioritized: false,
      isPriorityItem: false,
      isPlaceholder: true,
      dayColor: null,
      isSeparator: false,
      isDivider: false,
    });

    const createListItems = (
      list: (typeof tasks)[number],
      cards: (typeof list.cards)[number][],
      includeEmptyPlaceholder: boolean
    ): GridItem[] => {
      if (!cards.length) {
        if (!includeEmptyPlaceholder) {
          return [];
        }

        const emptyItem = createEmptyItem(list);

        if (grouped) {
          return [createSeparatorItem(list), emptyItem];
        }

        return [emptyItem];
      }

      const cardItems = cards.map((card) => createCardItem(list, card));

      if (grouped) {
        return [createSeparatorItem(list), ...cardItems];
      }

      return cardItems;
    };

    const priorityItems = tasks.flatMap((list): GridItem[] =>
      list.cards
        .filter((card) => card.prioritized && !card.done)
        .map((card) => createCardItem(list, card, true))
    );

    if (priorityDisplayMode === "normal") {
      return tasks.flatMap((list): GridItem[] =>
        createListItems(list, list.cards, list.cards.length === 0)
      );
    }

    if (priorityDisplayMode === "only") {
      return priorityItems.length
        ? [prioritySeparatorItem, ...priorityItems]
        : [];
    }

    const remainingItems = tasks.flatMap((list): GridItem[] => {
      const remainingCards = list.cards.filter(
        (card) => !(card.prioritized && !card.done)
      );

      return createListItems(
        list,
        remainingCards,
        list.cards.length === 0
      );
    });

    if (priorityItems.length) {
      return [
        prioritySeparatorItem,
        ...priorityItems,
        ...(!grouped && remainingItems.length
          ? [priorityDividerItem]
          : []),
        ...remainingItems,
      ];
    }

    return remainingItems;
  }, [grouped, priorityDisplayMode, tasks, t]);

  const handleCardClick = useCallback(
    (listId: string, cardId: string | null, currentColor: DayColor) => {
      if (!cardId) return;

      const nextColor =
        currentColor === null
          ? "green"
          : currentColor === "green"
            ? "red"
            : enableGridColorLoop
              ? null
              : "red";

      if (nextColor === currentColor) {
        return;
      }

      dispatch(
        setTaskDayColor({
          listId,
          cardId,
          color: nextColor,
        })
      );
    },
    [dispatch, enableGridColorLoop]
  );

  const handlePriorityToggle = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      listId: string,
      cardId: string | null,
      isPrioritized: boolean
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (!cardId) {
        return;
      }

      dispatch(
        setTaskCardPriority({
          listId,
          cardId,
          prioritized: !isPrioritized,
        })
      );
    },
    [dispatch]
  );

  const handlePriorityDisplayModeToggle = useCallback(() => {
    setPriorityDisplayMode((current) =>
      getNextTaskGridPriorityDisplayMode(current)
    );
  }, []);

  const handleCardContextMenu = useCallback(
    (
      event: React.MouseEvent<HTMLButtonElement>,
      listId: string,
      cardId: string | null,
      isDone: boolean
    ) => {
      event.preventDefault();
      if (!cardId || isDone) {
        return;
      }
      onSelectList(listId, cardId ?? undefined);
    },
    [onSelectList]
  );

  const handleReset = useCallback(() => {
    maybeExpandCompact();
    setShowResetDialog(true);
  }, [maybeExpandCompact]);

  const onCancelReset = useCallback(() => {
    collapseCompact();
    setShowResetDialog(false);
  }, [collapseCompact]);

  const onConfirmReset = useCallback(() => {
    collapseCompact();
    setShowResetDialog(false);
    dispatch(resetAllDayColors());
  }, [collapseCompact, dispatch]);

  const randomCandidates = useMemo(
    () =>
      buildTaskGridDrawCandidates({
        drawOnlyPrioritizedTasks,
        gridItems,
        priorityDisplayMode,
      }),
    [drawOnlyPrioritizedTasks, gridItems, priorityDisplayMode]
  );

  const randomWhiteCandidates = useMemo(() => {
    return randomCandidates.filter((item) => item.dayColor === null);
  }, [randomCandidates]);

  const randomGreenCandidates = useMemo(() => {
    return randomCandidates.filter((item) => item.dayColor === "green");
  }, [randomCandidates]);

  const canRandomDraw =
    randomWhiteCandidates.length > 0 ||
    randomGreenCandidates.length > 0;

  const handleRandomSelect = useCallback(() => {
    const pool = randomWhiteCandidates.length
      ? randomWhiteCandidates
      : randomGreenCandidates;

    if (!pool.length) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];

    dispatch(
      setTaskDayColor({
        listId: selected.listId,
        cardId: selected.cardId,
        color: selected.dayColor === null ? "green" : "red",
      })
    );
  }, [dispatch, randomGreenCandidates, randomWhiteCandidates]);

  const handleColumnsChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (
        value === "auto" ||
        value === "1" ||
        value === "2" ||
        value === "3" ||
        value === "4"
      ) {
        setColumnsMode(value);
      }
    },
    []
  );

  const stats = useMemo(() => {
    const visibleCards = gridItems.filter(
      (item) =>
        !item.isSeparator && !item.isPlaceholder && item.cardId !== null
    );
    const total = visibleCards.length;
    const visited = visibleCards.filter(
      (item) => (item.dayColor ?? null) !== null
    ).length;
    const remaining = total - visited;
    return { total, visited, remaining };
  }, [gridItems]);

  const getColorVariant = (
    color: DayColor
  ): "green" | "red" | "neutral" => {
    if (!color) return "neutral";
    return color;
  };

  const columns = useMemo(() => {
    if (columnsMode === "auto") return undefined;
    return Number(columnsMode);
  }, [columnsMode]);

  const resetLabel = t("grid.reset");
  const randomLabel = t("grid.random");
  const randomTooltip = canRandomDraw
    ? randomLabel
    : t("grid.randomDisabled");
  const groupToggleLabel = grouped
    ? t("grid.ungroupLabel")
    : t("grid.groupLabel");
  const priorityDisplayLabel =
    priorityDisplayMode === "normal"
      ? t("grid.priorityModeNormal")
      : priorityDisplayMode === "first"
        ? t("grid.priorityModeFirst")
        : t("grid.priorityModeOnly");
  const markPriorityLabel = t("grid.markPriority");
  const unmarkPriorityLabel = t("grid.unmarkPriority");

  return (
    <StyledGridWrapper>
      <StyledGridToolbar $compact={compact}>
        {showGridRandomButton ? (
          <StyledGridToolbarButton
            $iconOnly
            onClick={handleRandomSelect}
            disabled={!canRandomDraw}
            title={randomTooltip}
            aria-label={randomTooltip}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
              <circle
                cx="5.2"
                cy="5.2"
                r="0.8"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="10.8"
                cy="10.8"
                r="0.8"
                fill="currentColor"
                stroke="none"
              />
              <circle
                cx="8"
                cy="8"
                r="0.8"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </StyledGridToolbarButton>
        ) : null}
        <StyledGridToolbarButton
          $iconOnly
          onClick={() => setGrouped((previous) => !previous)}
          title={groupToggleLabel}
          aria-label={groupToggleLabel}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M3 3h10" />
            <path d="M5.5 8h7.5" />
            <path d="M8 13h5" />
            <path d="M2.5 3v10" />
          </svg>
        </StyledGridToolbarButton>
        <StyledGridToolbarButton
          $iconOnly
          onClick={handleReset}
          title={resetLabel}
          aria-label={resetLabel}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M13 8A5 5 0 1 1 8 3" />
            <path d="M13 3v3h-3" />
          </svg>
        </StyledGridToolbarButton>
        <StyledGridToolbarButton
          $iconOnly
          $active={priorityDisplayMode !== "normal"}
          onClick={handlePriorityDisplayModeToggle}
          title={priorityDisplayLabel}
          aria-label={priorityDisplayLabel}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill={
                priorityDisplayMode === "only" ? "currentColor" : "none"
              }
              d="M8 2.4 9.7 5.8l3.8.6-2.8 2.7.7 3.8L8 11.1l-3.4 1.8.7-3.8-2.8-2.7 3.8-.6L8 2.4Z"
            />
            {priorityDisplayMode === "first" ? (
              <>
                <path d="M12.5 13.1V9.6" />
                <path d="m11.2 10.9 1.3-1.3 1.3 1.3" />
              </>
            ) : null}
          </svg>
        </StyledGridToolbarButton>
        <StyledGridFooterControls>
          <StyledGridColumns>
            <StyledGridColumnsLabel htmlFor="task-grid-columns">
              {t("grid.columns")}:
            </StyledGridColumnsLabel>
            <StyledGridColumnsSelect
              id="task-grid-columns"
              value={columnsMode}
              onChange={handleColumnsChange}
            >
              <option value="auto">{t("grid.auto")}</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </StyledGridColumnsSelect>
          </StyledGridColumns>
        </StyledGridFooterControls>
      </StyledGridToolbar>

      <StyledGridContent $compact={compact}>
        <StyledGridCards $columns={columns} $compact={compact}>
          {gridItems.map((item) => {
            if (item.isSeparator) {
              if (item.isDivider) {
                return (
                  <StyledGridDivider
                    key={item.key}
                    aria-hidden="true"
                  />
                );
              }

              return (
                <StyledGridSeparator key={item.key}>
                  {item.listTitle}
                </StyledGridSeparator>
              );
            }

            const isCurrentTask =
              item.cardId !== null &&
              activeTaskSelection?.listId === item.listId &&
              activeTaskSelection.cardId === item.cardId;
            const priorityLabel = item.isPrioritized
              ? unmarkPriorityLabel
              : markPriorityLabel;
            const useGroupedCardLayout =
              grouped && !item.isPriorityItem;
            const cardTitle = item.isPlaceholder
              ? item.taskText
              : `${item.listTitle}: ${item.taskText}`;

            return (
              <StyledGridCardShell key={item.key}>
                <StyledGridCard
                  $color={getColorVariant(item.dayColor)}
                  $compact={compact}
                  $active={isCurrentTask}
                  $grouped={useGroupedCardLayout}
                  $withPriorityAction={!item.isPlaceholder}
                  onClick={() =>
                    handleCardClick(
                      item.listId,
                      item.cardId,
                      item.dayColor
                    )
                  }
                  onContextMenu={(event) =>
                    handleCardContextMenu(
                      event,
                      item.listId,
                      item.cardId,
                      item.isDone
                    )
                  }
                  title={cardTitle}
                  aria-current={isCurrentTask ? "true" : undefined}
                >
                  {!useGroupedCardLayout ? (
                    <StyledGridCardTitle>
                      {item.listTitle}
                    </StyledGridCardTitle>
                  ) : null}
                  <StyledGridCardTask
                    $done={item.isDone}
                    $placeholder={item.isPlaceholder}
                  >
                    {item.taskText}
                  </StyledGridCardTask>
                </StyledGridCard>
                {!item.isPlaceholder && item.cardId ? (
                  <StyledGridPriorityButton
                    $active={item.isPrioritized}
                    $compact={compact}
                    onClick={(event) =>
                      handlePriorityToggle(
                        event,
                        item.listId,
                        item.cardId,
                        item.isPrioritized
                      )
                    }
                    title={priorityLabel}
                    aria-label={priorityLabel}
                    aria-pressed={item.isPrioritized}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M8 2.4 9.7 5.8l3.8.6-2.8 2.7.7 3.8L8 11.1l-3.4 1.8.7-3.8-2.8-2.7 3.8-.6L8 2.4Z" />
                    </svg>
                  </StyledGridPriorityButton>
                ) : null}
              </StyledGridCardShell>
            );
          })}
        </StyledGridCards>
      </StyledGridContent>

      <StyledGridFooter $compact={compact}>
        <StyledGridStats $compact={compact}>
          {t("grid.total")}: {stats.total}
          {"  "}
          {t("grid.visited")}: {stats.visited}
          {"  "}
          {t("grid.remaining")}: {stats.remaining}
        </StyledGridStats>
      </StyledGridFooter>
      <ConfirmDialog
        open={showResetDialog}
        title={t("dialogs.warningTitle")}
        message={t("grid.resetConfirm")}
        cancelLabel={t("dialogs.noLabel")}
        confirmLabel={t("dialogs.yesLabel")}
        onCancel={onCancelReset}
        onConfirm={onConfirmReset}
      />
    </StyledGridWrapper>
  );
};

export default React.memo(TaskListGrid);
