import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "hooks";
import TextareaAutosize from "react-textarea-autosize";
import {
  editTaskCard,
  editTaskCardText,
  removeTaskCard,
  setTaskCardDone,
  setTaskCardNotDone,
} from "store";

import {
  StyledDetailContainer,
  StyledDescriptionForm,
  StyledDescriptionWrappper,
  StyledDescriptionFormatHelp,
  StyledDetailHeader,
  StyledDetailCloseButton,
  StyledButtonNormal,
  StyledButtonPrimary,
  StyledDeleteButton,
  StyledDescriptionArea,
  StyledDescriptionHeading,
} from "styles";
import { Checkbox, SVG } from "components";
import MDPreviewer from "./MDPreviewer";
import { useTranslation } from "react-i18next";

type Props = {
  listId: string;
  cardId: string;
  onExit?: () => void;
  ref?: React.Ref<HTMLDivElement>;
};

const TaskDetails = ({ listId, cardId, onExit, ref }: Props) => {
  const { t } = useTranslation();
  const cardTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionAreaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionFormRef = useRef<HTMLFormElement>(null);

  const dispatch = useAppDispatch();

  const tasks = useAppSelector((state) => state.tasks.present);

  const card = tasks
    .find((list) => list._id === listId)
    ?.cards.find((card) => card._id === cardId);

  const [editingDescription, setEditingDescription] = useState(false);

  const [description, setDescription] = useState(card?.description);

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (cardTextAreaRef.current) {
      if (card?.text) {
        cardTextAreaRef.current.value = card?.text;
      }
    }
  }, [card]);

  useEffect(() => {
    if (editingDescription) {
      if (descriptionAreaRef.current) {
        descriptionAreaRef.current.focus();
      }
    }
  }, [editingDescription, showPreview]);

  const onEditCardText = useCallback(() => {
    if (cardTextAreaRef.current && cardTextAreaRef.current.value) {
      dispatch(
        editTaskCardText({
          listId,
          cardId,
          cardText: cardTextAreaRef.current.value,
        })
      );
    }
  }, [dispatch, cardId, listId]);

  const onSubmitAction = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      dispatch(editTaskCard({ listId, cardId, description }));
      setEditingDescription(false);
    },
    [dispatch, cardId, description, listId]
  );

  const onCardDeleteAction = useCallback(() => {
    dispatch(removeTaskCard({ listId, cardId }));

    if (onExit) {
      onExit();
    }
  }, [cardId, dispatch, listId, onExit]);

  const showPreviewCallback = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setShowPreview(e.currentTarget.checked),
    []
  );

  const setTaskCardDoneCallback = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.currentTarget.checked) {
        dispatch(setTaskCardDone({ listId, cardId: card?._id }));
      } else {
        dispatch(setTaskCardNotDone({ listId, cardId: card?._id }));
      }
    },
    [dispatch, listId, card]
  );

  const editDescriptionCallback = useCallback(
    () => setEditingDescription(true),
    []
  );

  const dontEditDescriptionCallback = useCallback(
    () => setEditingDescription(false),
    []
  );

  const setDescriptionCallback = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      setDescription(e.target.value),
    []
  );

  useEffect(() => {
    function registerEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (onExit) {
          onExit();
        }
      }
    }

    document.addEventListener("keydown", registerEscape);
    return () =>
      document.removeEventListener("keydown", registerEscape);
  }, [onExit]);

  return (
    <StyledDetailContainer ref={ref}>
      <StyledDetailHeader
        as={TextareaAutosize}
        ref={cardTextAreaRef}
        onBlur={onEditCardText}
      />

      <StyledDetailCloseButton onClick={onExit}>
        <SVG name="close" />
      </StyledDetailCloseButton>

      <StyledDescriptionWrappper>
        <StyledDescriptionHeading>
          {t("tasks.description")}
          <Checkbox
            label={t("tasks.preview")}
            hidden={!editingDescription}
            onChange={showPreviewCallback}
            asPrimary
          />
        </StyledDescriptionHeading>

        {editingDescription ? (
          <StyledDescriptionForm
            onSubmit={onSubmitAction}
            ref={descriptionFormRef}
          >
            {showPreview ? (
              <MDPreviewer description={description} />
            ) : (
              <>
                <StyledDescriptionArea
                  as={TextareaAutosize}
                  placeholder={t(
                    "tasks.detailedDescriptionPlaceholder"
                  )}
                  value={description}
                  onChange={setDescriptionCallback}
                  ref={descriptionAreaRef}
                />
                <StyledButtonPrimary type="submit">
                  {t("tasks.save")}
                </StyledButtonPrimary>

                <StyledButtonNormal
                  type="reset"
                  onClick={dontEditDescriptionCallback}
                >
                  {t("tasks.cancel")}
                </StyledButtonNormal>

                <StyledDescriptionFormatHelp
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet"
                >
                  {t("tasks.formattingHelp")}
                </StyledDescriptionFormatHelp>
              </>
            )}
          </StyledDescriptionForm>
        ) : (
          <MDPreviewer
            description={description}
            onClick={editDescriptionCallback}
          />
        )}
        <Checkbox
          label={t("tasks.done")}
          checked={card?.done}
          onChange={setTaskCardDoneCallback}
        />
      </StyledDescriptionWrappper>

      <StyledDeleteButton onClick={onCardDeleteAction}>
        <SVG name="trash" /> {t("tasks.deleteCard")}
      </StyledDeleteButton>
    </StyledDetailContainer>
  );
};

export default TaskDetails;
