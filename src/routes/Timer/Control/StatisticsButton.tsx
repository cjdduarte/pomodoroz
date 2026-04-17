import React, { useRef, useCallback } from "react";
import { StyledResetButton } from "styles";
import { useRippleEffect } from "hooks";
import { SVG } from "components";

type Props = {} & React.HTMLProps<HTMLButtonElement>;

const StatisticsButton: React.FC<Props> = ({
  onClick,
  className,
  title,
  "aria-label": ariaLabel,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const buttonClickAction = useRippleEffect();

  const onStatisticsAction = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) =>
      buttonClickAction(e, buttonRef, () => {
        if (onClick) {
          onClick(e);
        }
      }),
    [buttonClickAction, onClick]
  );

  return (
    <StyledResetButton
      className={className}
      ref={buttonRef}
      onClick={onStatisticsAction}
      title={title}
      aria-label={ariaLabel}
    >
      <SVG name="statistics" />
    </StyledResetButton>
  );
};

export default React.memo(StatisticsButton);
