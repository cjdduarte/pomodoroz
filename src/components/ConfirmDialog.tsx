import React, { useEffect, useId } from "react";
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
`;

const ConfirmDialogCancelButton = styled(StyledButtonNormal)`
  min-width: 0;
  min-height: 3.4rem;
  height: auto;
  white-space: nowrap;
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
  white-space: nowrap;
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <Portal id="portal">
      <ConfirmDialogOverlay
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onCancel();
          }
        }}
      >
        <ConfirmDialogCard>
          <h3 id={titleId}>{title}</h3>
          <p>{message}</p>
          <ConfirmDialogActions>
            <ConfirmDialogCancelButton onClick={onCancel}>
              {cancelLabel}
            </ConfirmDialogCancelButton>
            <ConfirmDialogConfirmButton onClick={onConfirm}>
              {confirmLabel}
            </ConfirmDialogConfirmButton>
          </ConfirmDialogActions>
        </ConfirmDialogCard>
      </ConfirmDialogOverlay>
    </Portal>
  );
};

export default React.memo(ConfirmDialog);
