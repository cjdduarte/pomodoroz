import React from "react";
import { useTranslation } from "react-i18next";
import SettingSection from "./SettingSection";
import { Help } from "components";

const HelpSection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <SettingSection heading={t("help.heading")}>
      <Help
        label={t("help.officialWebsite")}
        link="https://github.com/cjdduarte/pomodoroz"
      />
      <Help
        label={t("help.openIssue")}
        link="https://github.com/cjdduarte/pomodoroz/issues"
      />
      <Help
        label={t("help.releaseNotes")}
        link="https://github.com/cjdduarte/pomodoroz/releases/latest"
      />
    </SettingSection>
  );
};

export default HelpSection;
