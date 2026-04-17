import React, { useState, useEffect } from "react";
import { StyledRangeContainer } from "styles";
import { RangeSlider, RangeLabel } from "components";

export type ConfigSliderProps = {
  label?: string;
  valueType?: "mins" | "rounds";
  minValue: number;
  maxValue: number;
  value: number;
  handleConfigChange?: (value: number) => void;
};

const ConfigSlider: React.FC<ConfigSliderProps> = ({
  label = "Stay focused",
  valueType = "mins",
  minValue,
  maxValue,
  value,
  handleConfigChange,
}) => {
  const [rangeValue, setRangeValue] = useState(value);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number.parseInt(e.target.value, 10);
    setRangeValue(nextValue);
    handleConfigChange?.(nextValue);
  };

  useEffect(() => {
    setRangeValue(value);
  }, [value]);

  return (
    <StyledRangeContainer>
      <RangeLabel
        label={label}
        value={rangeValue}
        valueType={valueType}
      />
      <RangeSlider
        value={rangeValue}
        minValue={minValue}
        maxValue={maxValue}
        onChange={onChange}
      />
    </StyledRangeContainer>
  );
};

export default React.memo(ConfigSlider);
