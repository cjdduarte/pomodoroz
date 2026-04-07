import React from "react";
import { useTranslation } from "react-i18next";
import { StyledSectionSticky, StyledStarButton } from "styles";

const StickySection: React.FC = () => {
  const { t } = useTranslation();

  return (
    <StyledSectionSticky>
      <StyledStarButton
        as="a"
        href="https://github.com/cjdduarte/pomodoroz"
        target="_blank"
      >
        {t("sticky.starGithub")}
      </StyledStarButton>
    </StyledSectionSticky>
  );
};

export default StickySection;
