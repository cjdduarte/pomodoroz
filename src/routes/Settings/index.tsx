import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { getFromStorage, saveToStorage } from "utils";
import { StyledSettings } from "styles";
import { Alert } from "components";

import FeatureSection from "./FeatureSection";
import LanguageSection from "./LanguageSection";
import NotificationSoundSection from "./NotificationSoundSection";
import TaskTransferSection from "./TaskTransferSection";
import HelpSection from "./HelpSection";
import ShortcutSection from "./ShortcutSection";
import StickySection from "./StickySection";
import SettingHeader from "./SettingHeader";

export default function Settings() {
  const { t } = useTranslation();
  const alertState = getFromStorage<string>("alert") || null;

  const [alert, setAlert] = useState(alertState);

  return (
    <StyledSettings>
      <SettingHeader />
      {alert === null && (
        <Alert
          heading={t("settings.alertHeading")}
          body={t("settings.alertBody")}
          onClose={() => {
            saveToStorage("alert", "hide");
            setAlert("hide");
          }}
        />
      )}
      <LanguageSection />
      <FeatureSection />
      <NotificationSoundSection />
      <TaskTransferSection />
      <ShortcutSection />
      <HelpSection />
      <StickySection />
    </StyledSettings>
  );
}
