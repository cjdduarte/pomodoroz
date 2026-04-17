import React from "react";
import {
  StyledCheckbox,
  StyledCheckboxBox,
  StyledCheckboxLabel,
} from "styles";
import type { CheckboxProps } from "./Checkbox";

export const Radio = ({
  id,
  label,
  name,
  disabled,
  asPrimary = true,
  ref,
  ...props
}: CheckboxProps) => {
  return (
    <StyledCheckbox htmlFor={id} tabIndex={0} $asPrimary={asPrimary}>
      <input
        type="radio"
        name={name}
        id={id}
        ref={ref}
        disabled={disabled}
        {...props}
      />
      <StyledCheckboxBox />
      <StyledCheckboxLabel>{label}</StyledCheckboxLabel>
    </StyledCheckbox>
  );
};

export default React.memo(Radio);
