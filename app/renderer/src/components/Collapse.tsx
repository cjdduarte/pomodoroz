import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyledCollapse,
  StyledCollapseHeading,
  StyledCollapseContent,
} from "styles";
import { SVG } from "components";

type Props = {
  children?: React.ReactNode;
};

const Collapse: React.FC<Props> = ({ children }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const toggleCollapse = () => {
    setOpen((prevState) => !prevState);
  };

  return (
    <StyledCollapse>
      <StyledCollapseHeading
        as={"button"}
        open={open}
        onClick={toggleCollapse}
      >
        {t("settings.notificationTypes")}
        <SVG name="chevron-down" />
      </StyledCollapseHeading>
      {open && (
        <StyledCollapseContent>{children}</StyledCollapseContent>
      )}
    </StyledCollapse>
  );
};

export default React.memo(Collapse);
