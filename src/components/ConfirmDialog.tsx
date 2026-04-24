import React, { useEffect, useId, useRef } from "react";
import styled from "styled-components";
import { StyledButtonNormal, StyledButtonPrimary } from "styles";
import Portal from "./Portal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2100;
  padding: clamp(0.6rem, 3vh, 1.6rem);

  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;

  background-color: rgba(0, 0, 0, 0.28);

  @media (max-height: 360px) {
    align-items: flex-start;
  }
`;

const ConfirmDialogCard = styled.section`
  width: min(40rem, 100%);
  border-radius: 4px;
  border: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-primary);
  box-shadow: 0 12px 34px -10px var(--color-shadow-primary);
  padding: 1.6rem;

  display: grid;
  row-gap: 1.2rem;

  & > h3 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
    color: var(--color-title);
    text-align: center;
  }

  & > p {
    margin: 0;
    color: var(--color-body-text);
    line-height: 1.4;
    text-align: center;
  }

  @media (max-height: 360px) {
    padding: 1rem;
    row-gap: 0.8rem;

    & > h3 {
      font-size: 1.3rem;
    }

    & > p {
      font-size: 1.2rem;
      line-height: 1.3;
    }
  }
`;

const ConfirmDialogActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const ConfirmDialogCancelButton = styled(StyledButtonNormal)`
  min-width: 0;
  min-height: 3.4rem;
  height: auto;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.2;
  text-align: center;
  padding: 0.7rem 0.9rem;

  @media (max-height: 360px) {
    min-height: 2.8rem;
    padding: 0.5rem 0.7rem;
  }
`;

const ConfirmDialogConfirmButton = styled(StyledButtonPrimary)`
  min-width: 0;
  min-height: 3.4rem;
  height: auto;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.2;
  text-align: center;
  padding: 0.7rem 0.9rem;

  @media (max-height: 360px) {
    min-height: 2.8rem;
    padding: 0.5rem 0.7rem;
  }
`;

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const messageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (!open) {
      return;
    }

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusTargetRequest = window.requestAnimationFrame(() => {
      cancelButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableButtons = [
        cancelButtonRef.current,
        confirmButtonRef.current,
      ].filter(
        (element): element is HTMLButtonElement =>
          element !== null && !element.disabled
      );

      if (!focusableButtons.length) {
        event.preventDefault();
        return;
      }

      const activeElement = document.activeElement;
      const activeIndex = focusableButtons.findIndex(
        (element) => element === activeElement
      );

      let nextIndex = 0;
      if (event.shiftKey) {
        nextIndex =
          activeIndex <= 0
            ? focusableButtons.length - 1
            : activeIndex - 1;
      } else if (activeIndex >= 0) {
        nextIndex = (activeIndex + 1) % focusableButtons.length;
      }

      event.preventDefault();
      focusableButtons[nextIndex]?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTargetRequest);
      document.removeEventListener("keydown", onKeyDown);

      const previousFocusedElement = previousFocusedElementRef.current;
      previousFocusedElementRef.current = null;

      if (previousFocusedElement?.isConnected) {
        previousFocusedElement.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <Portal id="portal">
      <ConfirmDialogOverlay
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onCancel();
          }
        }}
      >
        <ConfirmDialogCard>
          <h3 id={titleId}>{title}</h3>
          <p id={messageId}>{message}</p>
          <ConfirmDialogActions>
            <ConfirmDialogCancelButton
              ref={cancelButtonRef}
              onClick={onCancel}
            >
              {cancelLabel}
            </ConfirmDialogCancelButton>
            <ConfirmDialogConfirmButton
              ref={confirmButtonRef}
              onClick={onConfirm}
            >
              {confirmLabel}
            </ConfirmDialogConfirmButton>
          </ConfirmDialogActions>
        </ConfirmDialogCard>
      </ConfirmDialogOverlay>
    </Portal>
  );
};

export default React.memo(ConfirmDialog);
