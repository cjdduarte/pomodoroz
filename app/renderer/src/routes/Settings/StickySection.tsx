import React from "react";
import { useTranslation } from "react-i18next";
import {
  StyledSectionSticky,
  StyledStarButton,
  StyledSupportButtonLabel,
  StyledCoffeeEmoji,
} from "styles";
import { SUPPORT_CONFIG, getStripeSupportUrl } from "config";

const StickySection: React.FC = () => {
  const { t } = useTranslation();
  const stripeSupportUrl = getStripeSupportUrl();

  return (
    <StyledSectionSticky>
      <StyledStarButton
        as="a"
        href={SUPPORT_CONFIG.githubRepoUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("sticky.starGithub")}
      </StyledStarButton>
      <StyledStarButton
        as="a"
        href={stripeSupportUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <StyledSupportButtonLabel>
          {t("sticky.supportStripePix")}
          <StyledCoffeeEmoji aria-hidden="true">☕</StyledCoffeeEmoji>
        </StyledSupportButtonLabel>
      </StyledStarButton>
    </StyledSectionSticky>
  );
};

export default StickySection;
