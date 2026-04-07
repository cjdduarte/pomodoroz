import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "hooks/storeHooks";
import {
  setStayFocus,
  setSessionRounds,
  setShorBreak,
  setLongBreak,
} from "store";
import { StyledConfigSliderSection } from "styles";
import ConfigSlider, { ConfigSliderProps } from "./ConfigSlider";

type SliderConfigItem = ConfigSliderProps & {
  id: string;
};

const SliderSection: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const config = useAppSelector((state) => state.config);
  const { stayFocus, shortBreak, longBreak, sessionRounds } = config;

  const sliderRangeList: SliderConfigItem[] = [
    {
      id: "stay-focus",
      label: t("config.stayFocused"),
      valueType: "mins",
      minValue: 1,
      maxValue: 120,
      value: stayFocus,
      handleConfigChange: useCallback(
        (value) => dispatch(setStayFocus(value)),
        [dispatch]
      ),
    },
    {
      id: "short-break",
      label: t("config.shortBreak"),
      valueType: "mins",
      minValue: 0,
      maxValue: 60,
      value: shortBreak,
      handleConfigChange: useCallback(
        (value) => dispatch(setShorBreak(value)),
        [dispatch]
      ),
    },
    {
      id: "long-break",
      label: t("config.longBreak"),
      valueType: "mins",
      minValue: 0,
      maxValue: 60,
      value: longBreak,
      handleConfigChange: useCallback(
        (value) => dispatch(setLongBreak(value)),
        [dispatch]
      ),
    },
    {
      id: "session-rounds",
      label: t("config.sessionRounds"),
      valueType: "rounds",
      minValue: 1,
      maxValue: 10,
      value: sessionRounds,
      handleConfigChange: useCallback(
        (value) => dispatch(setSessionRounds(value)),
        [dispatch]
      ),
    },
  ];

  return (
    <StyledConfigSliderSection>
      {sliderRangeList.map(
        ({
          id,
          label,
          valueType,
          minValue,
          maxValue,
          value,
          handleConfigChange,
        }) => (
          <ConfigSlider
            label={label}
            value={value}
            minValue={minValue}
            valueType={valueType}
            maxValue={maxValue}
            handleConfigChange={handleConfigChange}
            key={id}
          />
        )
      )}
    </StyledConfigSliderSection>
  );
};

export default React.memo(SliderSection);
