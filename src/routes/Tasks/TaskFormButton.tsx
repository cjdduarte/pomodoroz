import React, { useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import TextareaAutosize from "react-textarea-autosize";
import {
  StyledTaskForm,
  StyledButtonPrimary,
  StyledButtonNormal,
  StyledTaskInput,
  StyledTaskTextArea,
  StyledTaskCardCancel,
  StyledButton,
} from "styles";
import { SVG } from "components";
import { useTargetOutside } from "hooks";

type Props = {
  forList?: boolean;
  onSubmit?: (value: string) => void;
};

const TaskFormButton: React.FC<Props> = ({ forList, onSubmit }) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [isOpen, setOpen] = useTargetOutside({ ref: formRef });

  const doSubmit = useCallback(
    (ref: HTMLInputElement | HTMLTextAreaElement, keepOpen = false) => {
      const { value } = ref;
      if (!value) return false;

      if (onSubmit) {
        onSubmit(value);
        ref.focus();

        if (formRef.current) {
          formRef.current.reset();
        }
      }
      if (!keepOpen) setOpen(false);

      return true;
    },
    [onSubmit, setOpen]
  );

  useEffect(() => {
    if (isOpen) {
      if (!forList && formRef.current) {
        formRef?.current?.scrollIntoView({ block: "center" });
      }
      if (forList) {
        if (inputRef.current) {
          inputRef.current.focus();

          inputRef.current.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && inputRef.current) {
              e.preventDefault();
              doSubmit(inputRef.current, e.ctrlKey);
            }
          };
        }
      } else {
        if (areaRef.current) {
          areaRef.current.focus();

          areaRef.current.onkeydown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && areaRef.current) {
              e.preventDefault();
              doSubmit(areaRef.current, e.ctrlKey);
            }
          };
        }
      }
    }
  }, [isOpen, forList, doSubmit]);

  const onSubmitAction = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (forList) {
        inputRef.current && doSubmit(inputRef.current, false);
      } else {
        areaRef.current && doSubmit(areaRef.current);
      }
    },
    [forList, doSubmit]
  );

  const showFormAction = () => setOpen && setOpen(true);

  const hideFormAction = () => setOpen && setOpen(false);

  const renderButton = () =>
    forList ? (
      <StyledButtonNormal
        type="button"
        style={{ justifyContent: "flex-start" }}
        onClick={showFormAction}
      >
        <SVG name="add" />
        {t("tasks.addAnotherList")}
      </StyledButtonNormal>
    ) : (
      <StyledButton
        type="button"
        style={{ justifyContent: "flex-start" }}
        onClick={showFormAction}
      >
        <SVG name="add" />
        {t("tasks.addAnotherCard")}
      </StyledButton>
    );

  const renderFormInput = () =>
    forList ? (
      <StyledTaskInput
        placeholder={t("tasks.enterListTitlePlaceholder")}
        ref={inputRef}
      />
    ) : (
      <StyledTaskTextArea
        as={TextareaAutosize}
        placeholder={t("tasks.enterCardTitlePlaceholder")}
        ref={areaRef}
      />
    );

  const renderCancelButton = () =>
    forList ? (
      <StyledButtonNormal type="button" onClick={hideFormAction}>
        {t("tasks.cancel")}
      </StyledButtonNormal>
    ) : (
      <StyledTaskCardCancel type="button" onClick={hideFormAction}>
        {t("tasks.cancel")}
      </StyledTaskCardCancel>
    );

  const renderForm = () => (
    <StyledTaskForm onSubmit={onSubmitAction} ref={formRef}>
      {renderFormInput()}
      <StyledButtonPrimary type="submit">
        {forList ? t("tasks.addList") : t("tasks.addCard")}
      </StyledButtonPrimary>
      {renderCancelButton()}
    </StyledTaskForm>
  );

  return isOpen ? renderForm() : renderButton();
};

export default React.memo(TaskFormButton);
