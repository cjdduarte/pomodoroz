import React from "react";
import {
  StyledCheckbox,
  StyledCheckboxBox,
  StyledCheckboxLabel,
} from "styles";

export type CheckboxProps = {
  label?: string;
  asPrimary?: boolean;
  hidden?: boolean;
  ref?: React.Ref<HTMLInputElement>;
} & React.HTMLProps<HTMLInputElement>;

export const Checkbox = ({
  id,
  label,
  name,
  disabled,
  asPrimary,
  hidden,
  ref,
  ...props
}: CheckboxProps) => {
  return (
    <StyledCheckbox htmlFor={id} $asPrimary={asPrimary}>
      <input
        type="checkbox"
        name={name}
        id={id}
        ref={ref}
        disabled={disabled}
        {...props}
      />
      <StyledCheckboxBox hidden={hidden} />
      <StyledCheckboxLabel>{hidden ? "" : label}</StyledCheckboxLabel>
    </StyledCheckbox>
  );
};

export default React.memo(Checkbox);
