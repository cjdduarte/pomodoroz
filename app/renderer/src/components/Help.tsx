import React, { useCallback } from "react";
import {
  StyledHelpWrapper,
  StyledHelpLabel,
  StyledHelpExternal,
} from "styles";
import { openExternalUrl } from "utils";
import SVG from "./SVG";

type Props = {
  label: string;
  link: string;
};

const Help: React.FC<Props> = ({ label, link }) => {
  const handleOpenLink = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      void openExternalUrl(link);
    },
    [link]
  );

  return (
    <StyledHelpWrapper
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleOpenLink}
    >
      <StyledHelpLabel>
        {label}
        <StyledHelpExternal>
          <SVG name="external" />
        </StyledHelpExternal>
      </StyledHelpLabel>
    </StyledHelpWrapper>
  );
};

export default React.memo(Help);
