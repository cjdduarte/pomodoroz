import React, { useRef, useEffect } from "react";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { useTranslation } from "react-i18next";
import {
  StyledTaskHeader,
  StyledTaskHeaderDragHandle,
  StyledTaskHeaderOption,
  StyledTaskHeading,
  StyledTaskHeadeInput,
  StyledOptionList,
  StyledPopperContent,
  StyledPopperHeader,
  StyledOptionDelete,
  StyledOptionPriority,
} from "styles";
import { SVG } from "components";
import { useTargetOutside } from "hooks";

type Props = {
  title: string;

  onEditTitle?: (title: string) => void;
  onRemoveList?: () => void;
  onMakeListPriority?: () => void;
  canMakeListPriority?: boolean;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: DraggableSyntheticListeners;
  setDragHandleRef?: (node: HTMLElement | null) => void;
};

const TaskHeader: React.FC<Props> = ({
  title,
  onEditTitle,
  onRemoveList,
  onMakeListPriority,
  canMakeListPriority = true,
  dragHandleAttributes,
  dragHandleListeners,
  setDragHandleRef,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRef = useRef<HTMLDivElement>(null);

  const [editing, setEditing] = useTargetOutside({ ref: inputRef });

  const [showOptions, setShowOptions] = useTargetOutside({
    ref: optionRef,
  });

  useEffect(() => {
    if (editing) {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.value = title;

        inputRef.current.onblur = () => {
          if (inputRef.current) {
            if (onEditTitle && inputRef.current.value) {
              onEditTitle(inputRef.current.value);
            }
            setEditing(false);
          }
        };

        inputRef.current.onkeyup = (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            if (inputRef.current) {
              if (onEditTitle && inputRef.current.value) {
                onEditTitle(inputRef.current.value);
              }
              setEditing(false);
            }
          }
        };
      }
    }
  }, [editing, title, setEditing, onEditTitle]);

  const onEditTitleAction = () => setEditing(true);

  const renderListTitle = () =>
    editing ? (
      <StyledTaskHeadeInput ref={inputRef} />
    ) : (
      <StyledTaskHeading onClick={onEditTitleAction}>
        {title}
      </StyledTaskHeading>
    );

  return (
    <StyledTaskHeader>
      {renderListTitle()}
      <StyledTaskHeaderDragHandle
        type="button"
        title={t("tasks.dragList")}
        aria-label={t("tasks.dragList")}
        ref={setDragHandleRef}
        disabled={editing}
        {...(!editing ? dragHandleAttributes : {})}
        {...(!editing ? dragHandleListeners : {})}
      >
        <SVG name="grip" />
      </StyledTaskHeaderDragHandle>
      <StyledTaskHeaderOption onClick={() => setShowOptions(true)}>
        <SVG name="option-x" />
      </StyledTaskHeaderOption>

      {showOptions && (
        <StyledPopperContent
          style={{
            top: "0",
            right: "0",
          }}
          ref={optionRef}
        >
          <StyledPopperHeader>
            <h4>{t("tasks.actions")}</h4>
            <button onClick={() => setShowOptions(false)}>
              <SVG name="close" />
            </button>
          </StyledPopperHeader>

          <StyledOptionList>
            <StyledOptionPriority
              aria-disabled={!canMakeListPriority}
              title={
                canMakeListPriority
                  ? undefined
                  : t("tasks.noPendingTasks")
              }
              onClick={() => {
                if (!canMakeListPriority) return;
                if (onMakeListPriority) onMakeListPriority();
                setShowOptions(false);
              }}
            >
              {t("tasks.priorityList")}
            </StyledOptionPriority>

            <StyledOptionDelete
              onClick={() => {
                if (onRemoveList) onRemoveList();
                setShowOptions(false);
              }}
            >
              {t("tasks.delete")}
            </StyledOptionDelete>
          </StyledOptionList>
        </StyledPopperContent>
      )}
    </StyledTaskHeader>
  );
};

export default React.memo(TaskHeader);
