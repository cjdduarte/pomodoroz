import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  StyledSectionSticky,
  StyledStarButton,
  StyledSupportButtonLabel,
  StyledCoffeeEmoji,
} from "styles";
import { openExternalUrl } from "utils";
import { SUPPORT_CONFIG, getStripeSupportUrl } from "config";

const StickySection: React.FC = () => {
  const { t } = useTranslation();
  const stripeSupportUrl = getStripeSupportUrl();

  const handleOpenExternal = useCallback(
    (url: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      void openExternalUrl(url);
    },
    []
  );

  return (
    <StyledSectionSticky>
      <StyledStarButton
        as="a"
        href={SUPPORT_CONFIG.githubRepoUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpenExternal(SUPPORT_CONFIG.githubRepoUrl)}
      >
        {t("sticky.starGithub")}
      </StyledStarButton>
      <StyledStarButton
        as="a"
        href={stripeSupportUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpenExternal(stripeSupportUrl)}
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
