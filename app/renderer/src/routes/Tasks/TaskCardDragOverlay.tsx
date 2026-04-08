import React from "react";
import {
  StyledCard,
  StyledCardActionWrapper,
  StyledCardDeleteButton,
  StyledCardDragHandle,
  StyledCardEditButton,
  StyledCardMain,
  StyledCardText,
} from "styles";
import { SVG } from "components";

type Props = {
  text: string;
  done: boolean;
  width?: number;
};

const TaskCardDragOverlay: React.FC<Props> = ({
  text,
  done,
  width,
}) => {
  return (
    <div style={{ pointerEvents: "none" }}>
      <StyledCard
        style={{
          width: width ? `${width}px` : undefined,
          marginBottom: 0,
          boxShadow: "0 6px 18px -8px var(--color-shadow-primary)",
        }}
      >
        <StyledCardMain>
          <StyledCardDragHandle type="button" disabled tabIndex={-1}>
            <SVG name="option-y" />
          </StyledCardDragHandle>
          <StyledCardText done={done}>{text}</StyledCardText>
        </StyledCardMain>
        <StyledCardActionWrapper>
          <StyledCardEditButton type="button" tabIndex={-1}>
            <SVG name="pencil" />
          </StyledCardEditButton>
          <StyledCardDeleteButton type="button" tabIndex={-1}>
            <SVG name="trash" />
          </StyledCardDeleteButton>
        </StyledCardActionWrapper>
      </StyledCard>
    </div>
  );
};

export default React.memo(TaskCardDragOverlay);
