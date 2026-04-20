import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ask as askDialog } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { resetAllDayColors, setTaskDayColor } from "store";
import type { DayColor } from "store/tasks/types";
import {
  getFromStorage,
  resolveActiveTaskSelection,
  saveToStorage,
} from "utils";
import {
  StyledGridWrapper,
  StyledGridToolbar,
  StyledGridToolbarButton,
  StyledGridContent,
  StyledGridCards,
  StyledGridSeparator,
  StyledGridCard,
  StyledGridCardTitle,
  StyledGridCardTask,
  StyledGridFooter,
  StyledGridStats,
  StyledGridFooterControls,
  StyledGridColumns,
  StyledGridColumnsLabel,
  StyledGridColumnsSelect,
} from "./TaskListGrid.styles";

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
  isPlaceholder: boolean;
  dayColor: DayColor;
  isSeparator: boolean;
};

type GridColumnsMode = "auto" | "1" | "2" | "3";

const GRID_COLUMNS_STORAGE_KEY = "tasks-grid-columns";
const GRID_GROUPED_STORAGE_KEY = "tasks-grid-grouped";

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
    storedValue === "auto"
    ? storedValue
    : "auto";
};

const getInitialGrouped = (): boolean => {
  const storedValue = getFromStorage<boolean>(GRID_GROUPED_STORAGE_KEY);
  return storedValue === true;
};

const TaskListGrid: React.FC<Props> = ({ onSelectList, compact }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.present);
  const selectedTask = useAppSelector((state) => state.taskSelection);
  const showGridRandomButton = useAppSelector(
    (state) => state.settings.showGridRandomButton
  );
  const enableGridColorLoop = useAppSelector(
    (state) => state.settings.enableGridColorLoop
  );
  const [columnsMode, setColumnsMode] = useState<GridColumnsMode>(
    getInitialColumnsMode
  );
  const [grouped, setGrouped] = useState<boolean>(getInitialGrouped);

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

  const gridItems = useMemo<GridItem[]>(() => {
    return tasks.flatMap((list): GridItem[] => {
      const separatorItem: GridItem = {
        key: `sep:${list._id}`,
        listId: list._id,
        cardId: null,
        listTitle: list.title,
        taskText: "",
        isDone: false,
        isPlaceholder: false,
        dayColor: null,
        isSeparator: true,
      };

      if (!list.cards.length) {
        const emptyItem: GridItem = {
          key: `${list._id}:empty`,
          listId: list._id,
          cardId: null,
          listTitle: list.title,
          taskText: t("tasks.noTasks"),
          isDone: false,
          isPlaceholder: true,
          dayColor: null,
          isSeparator: false,
        };

        if (grouped) {
          return [separatorItem, emptyItem];
        }

        return [emptyItem];
      }

      const cardItems = list.cards.map((card) => ({
        key: `${list._id}:${card._id}`,
        listId: list._id,
        cardId: card._id,
        listTitle: list.title,
        taskText: card.text,
        isDone: card.done,
        isPlaceholder: false,
        dayColor: card.dayColor ?? null,
        isSeparator: false,
      }));

      if (grouped) {
        return [separatorItem, ...cardItems];
      }

      return cardItems;
    });
  }, [grouped, tasks, t]);

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

  const handleReset = useCallback(async () => {
    const hasConfirmed = await askDialog(t("grid.resetConfirm"), {
      title: t("dialogs.warningTitle"),
      kind: "warning",
    });

    if (!hasConfirmed) {
      return;
    }

    dispatch(resetAllDayColors());
  }, [dispatch, t]);

  const randomWhiteCandidates = useMemo(() => {
    return gridItems.filter(
      (item) =>
        !item.isSeparator &&
        !item.isPlaceholder &&
        !item.isDone &&
        item.dayColor === null &&
        item.cardId !== null
    );
  }, [gridItems]);

  const randomGreenCandidates = useMemo(() => {
    return gridItems.filter(
      (item) =>
        !item.isSeparator &&
        !item.isPlaceholder &&
        !item.isDone &&
        item.dayColor === "green" &&
        item.cardId !== null
    );
  }, [gridItems]);

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

    if (!selected.cardId) {
      return;
    }

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
        value === "3"
      ) {
        setColumnsMode(value);
      }
    },
    []
  );

  const stats = useMemo(() => {
    const total = tasks.reduce(
      (count, list) => count + list.cards.length,
      0
    );
    const visited = tasks.reduce(
      (count, list) =>
        count +
        list.cards.filter((card) => (card.dayColor ?? null) !== null)
          .length,
      0
    );
    const remaining = total - visited;
    return { total, visited, remaining };
  }, [tasks]);

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

  const selectHint = compact
    ? t("grid.selectHintCompact")
    : t("grid.selectHint");
  const resetLabel = t("grid.reset");
  const randomLabel = t("grid.random");
  const randomTooltip = canRandomDraw
    ? randomLabel
    : t("grid.randomDisabled");
  const groupToggleLabel = grouped
    ? t("grid.ungroupLabel")
    : t("grid.groupLabel");

  return (
    <StyledGridWrapper>
      <StyledGridToolbar $compact={compact}>
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
            </StyledGridColumnsSelect>
          </StyledGridColumns>
        </StyledGridFooterControls>
      </StyledGridToolbar>

      <StyledGridContent $compact={compact}>
        <StyledGridCards $columns={columns} $compact={compact}>
          {gridItems.map((item) => {
            if (item.isSeparator) {
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

            return (
              <StyledGridCard
                key={item.key}
                $color={getColorVariant(item.dayColor)}
                $compact={compact}
                $active={isCurrentTask}
                $grouped={grouped}
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
                title={selectHint}
                aria-current={isCurrentTask ? "true" : undefined}
              >
                {!grouped ? (
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
    </StyledGridWrapper>
  );
};

export default React.memo(TaskListGrid);
