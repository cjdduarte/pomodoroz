import React from "react";
import Header from "./Header";
import styled from "styled-components/macro";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { setIgnoreUpdate } from "../store";
import { setUpdateBody, setUpdateVersion } from "../store/update";
import {
  StyledButtonNormal,
  StyledButtonPrimary,
  StyledDescriptionPreviewer,
  StyledTaskForm,
} from "../styles";
import { getInvokeConnector } from "../contexts";
import { OPEN_RELEASE_PAGE } from "@pomodoroz/shareables";
import { sanitizeMarkdownLinkUri } from "utils";

const UpdateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  padding-left: 2rem;
  padding-right: 1.4rem;
`;

// Extend StyledDescriptionPreviewer to make it taller
const UpdateDescriptionPreviewer = styled(StyledDescriptionPreviewer)`
  flex: 1 1 0; // Flex properties to allow growth and shrinkage
  overflow-y: auto; // Enable vertical scrolling
  height: 100%; // Set a fixed height
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: none;
`;

const ActionButtons = styled.div`
  padding: 1rem 0;
`;
const IgnoreVersion = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 10px;
  cursor: pointer;
`;

const Updater: React.FC = () => {
  const update = useAppSelector((state) => state.update);
  const { t } = useTranslation();

  const dispatch = useAppDispatch();

  return (
    <UpdateWrapper>
      <Header heading={t("updater.heading")} />
      <UpdateDescriptionPreviewer
        className="md-previewer"
        $hasValue={true}
      >
        <ReactMarkdown
          urlTransform={sanitizeMarkdownLinkUri}
          components={{
            a: ({ ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {update.updateBody || t("updater.noUpdateBody")}
        </ReactMarkdown>
      </UpdateDescriptionPreviewer>

      <ActionButtons>
        <StyledTaskForm>
          <StyledButtonPrimary
            onClick={() => {
              const invokeConnector = getInvokeConnector();
              new window.Notification(
                t("updater.openingReleaseTitle"),
                {
                  body: t("updater.openingReleaseBody"),
                }
              );
              invokeConnector?.send(OPEN_RELEASE_PAGE);
              dispatch(setUpdateVersion(""));
              dispatch(setUpdateBody(""));
            }}
          >
            {t("updater.openReleasePage")}
          </StyledButtonPrimary>
          <StyledButtonNormal
            onClick={() => {
              dispatch(setUpdateVersion(""));
              dispatch(setUpdateBody(""));
            }}
          >
            {t("updater.remindMeLater")}
          </StyledButtonNormal>
        </StyledTaskForm>
        <IgnoreVersion
          onClick={() => {
            dispatch(setIgnoreUpdate(update.updateVersion));
            dispatch(setUpdateBody(""));
          }}
        >
          {t("updater.ignoreThisVersion")}
        </IgnoreVersion>
      </ActionButtons>
    </UpdateWrapper>
  );
};

export default React.memo(Updater);
