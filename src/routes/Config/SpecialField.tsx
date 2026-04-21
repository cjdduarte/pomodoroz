import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  StyledSpecialField,
  StyledSpecialClearButton,
  StyledSpecialBreakSetter,
  StyledDetailCloseButton,
  StyledSpecialBreakSetterSection,
  StyledSpecialBreakDuration,
  StyledSpecialBreakAction,
  StyledButtonNormal,
  StyledSpecialBreakDurationSpan,
} from "styles";
import { Time, SVG } from "components";
import { parseTime } from "utils";

type SpecialFieldProps = {
  fromTime?: string;
  toTime?: string;
  duration?: number;
};

type SpecialFieldValues = {
  fromTime: string;
  toTime: string;
  duration: number;
};

type Props = {
  onFieldSubmit?: (values: SpecialFieldValues) => void;
} & React.HTMLProps<HTMLInputElement> &
  SpecialFieldProps;

const SpecialField: React.FC<Props> = ({
  fromTime,
  toTime,
  duration,
  disabled,
  onFieldSubmit,
}) => {
  const { t } = useTranslation();
  const [showSetter, setShowSetter] = useState(false);

  const [values, setValues] = useState<SpecialFieldValues>({
    fromTime: fromTime ?? "",
    toTime: toTime ?? "",
    duration: duration ?? 0,
  });

  const [success, setSuccess] = useState(false);

  const [errors, setErrors] = useState({
    fromTime: false,
    toTime: false,
    duration: false,
  });

  const getValues = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setValues((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    []
  );

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!values.toTime) {
        setErrors((prevState) => ({
          ...prevState,
          toTime: true,
        }));
      } else {
        setErrors((prevState) => ({
          ...prevState,
          toTime: false,
        }));
      }

      if (!values.fromTime) {
        setErrors((prevState) => ({
          ...prevState,
          fromTime: true,
        }));
      } else {
        setErrors((prevState) => ({
          ...prevState,
          fromTime: false,
        }));
      }

      if (
        values.fromTime &&
        values.toTime &&
        values.duration &&
        values.duration >= 5 &&
        onFieldSubmit
      ) {
        setShowSetter(false);
        setSuccess(true);
        onFieldSubmit(values);

        setTimeout(() => setSuccess(false), 2000);
      }
    },
    [onFieldSubmit, values]
  );

  const onClear = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const newValues = {
        fromTime: "",
        toTime: "",
        duration: 0,
      };
      if (onFieldSubmit && !disabled) {
        setSuccess(true);
        setValues(newValues);
        onFieldSubmit(newValues);

        setTimeout(() => setSuccess(false), 2000);
      }
    },
    [onFieldSubmit, disabled]
  );

  useEffect(() => {
    if (values.fromTime && values.toTime) {
      const duration =
        parseTime(values.toTime) - parseTime(values.fromTime);

      setErrors({
        fromTime: false,
        toTime: false,
        duration: duration < 5 ? true : false,
      });
      setValues((prevState) => ({
        ...prevState,
        duration,
      }));
    }
  }, [values.fromTime, values.toTime]);

  useEffect(() => {
    if (!showSetter) {
      return;
    }

    function registerEscape(e: KeyboardEvent) {
      if (e.code === "Escape") {
        setShowSetter(false);
      }
    }

    document.addEventListener("keydown", registerEscape);
    return () =>
      document.removeEventListener("keydown", registerEscape);
  }, [showSetter]);

  return (
    <>
      <StyledSpecialField
        tabIndex={0}
        success={success}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setShowSetter(true);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setShowSetter(true);
          }
        }}
      >
        <input type="time" value={fromTime} disabled />
        <span />
        <input
          type="number"
          value={duration === 0 ? "" : duration}
          placeholder={t("units.min")}
          disabled
        />
        <StyledSpecialClearButton
          type="button"
          tabIndex={-1}
          success={success}
          onClick={onClear}
        >
          <SVG name="close" />
        </StyledSpecialClearButton>
      </StyledSpecialField>

      {showSetter && (
        <StyledSpecialBreakSetter onSubmit={onSubmit}>
          <StyledDetailCloseButton
            onClick={() => {
              setShowSetter(false);
            }}
          >
            <SVG name="close" />
          </StyledDetailCloseButton>

          <header>
            <h3>{t("config.specialBreakSetterTitle")}</h3>
            <p>{t("config.specialBreakSetterDescription")}</p>
          </header>

          <StyledSpecialBreakSetterSection>
            <Time
              label={t("config.specialBreakFromLabel")}
              name="fromTime"
              value={values.fromTime}
              onChange={getValues}
              error={errors.fromTime}
            />
            <Time
              label={t("config.specialBreakToLabel")}
              name="toTime"
              value={values.toTime}
              onChange={getValues}
              error={errors.toTime}
            />
            <StyledSpecialBreakDuration>
              {t("config.specialBreakDurationLabel")}
              :&nbsp;
              {!values.duration ? (
                ""
              ) : (values.duration || 0) < 5 && errors.duration ? (
                <StyledSpecialBreakDurationSpan error>
                  {values.duration}{" "}
                  {values.duration === 1
                    ? t("units.min")
                    : t("units.mins")}
                  &nbsp;
                  {t("config.specialBreakInvalidDuration")}
                </StyledSpecialBreakDurationSpan>
              ) : (
                <StyledSpecialBreakDurationSpan>
                  {values.duration >= 5 &&
                    `${values.duration} ${
                      values.duration === 1
                        ? t("units.min")
                        : t("units.mins")
                    }`}
                </StyledSpecialBreakDurationSpan>
              )}
            </StyledSpecialBreakDuration>
          </StyledSpecialBreakSetterSection>

          <StyledSpecialBreakAction>
            <StyledButtonNormal type="submit">
              {t("tasks.save")}
            </StyledButtonNormal>
          </StyledSpecialBreakAction>
        </StyledSpecialBreakSetter>
      )}
    </>
  );
};

export default React.memo(SpecialField);
