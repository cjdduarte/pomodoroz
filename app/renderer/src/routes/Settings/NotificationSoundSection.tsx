import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { setNotificationSound } from "store";
import { notificationSoundOptions } from "store/settings/notificationSound";
import { NotificationSoundTypes } from "store/settings/types";
import { StyledSelect, StyledSelectWrapper } from "styles";

import SettingSection from "./SettingSection";

const NotificationSoundSection: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const notificationSound = useAppSelector(
    (state) => state.settings.notificationSound
  );

  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      dispatch(
        setNotificationSound(
          event.target.value as NotificationSoundTypes
        )
      );
    },
    [dispatch]
  );

  return (
    <SettingSection heading={t("settings.notificationSound")}>
      <StyledSelectWrapper>
        <StyledSelect value={notificationSound} onChange={onChange}>
          {notificationSoundOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </StyledSelect>
      </StyledSelectWrapper>
    </SettingSection>
  );
};

export default React.memo(NotificationSoundSection);
