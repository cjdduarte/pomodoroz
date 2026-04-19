import React from "react";
import Header from "./Header";
import styled from "styled-components";
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
import { INSTALL_UPDATE, OPEN_RELEASE_PAGE } from "ipc";
import {
  openExternalUrl,
  sanitizeMarkdownLinkUri,
  showDesktopNotification,
} from "utils";

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

const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;
const HTML_ENTITY_REGEX = /&(?:[a-zA-Z]+|#\d+|#x[0-9A-Fa-f]+);/;

const decodeHtmlEntities = (value: string): string => {
  if (typeof window === "undefined" || !HTML_ENTITY_REGEX.test(value)) {
    return value;
  }

  const textarea = window.document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const getReadableUpdateBody = (rawBody: string): string => {
  const normalizedBody = decodeHtmlEntities(rawBody);

  if (
    !HTML_TAG_REGEX.test(normalizedBody) ||
    typeof window === "undefined"
  ) {
    return normalizedBody;
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(normalizedBody, "text/html");

  doc.querySelectorAll("br").forEach((element) => {
    element.replaceWith(doc.createTextNode("\n"));
  });

  doc.querySelectorAll("li").forEach((element) => {
    element.insertBefore(doc.createTextNode("- "), element.firstChild);
    element.appendChild(doc.createTextNode("\n"));
  });

  [
    "p",
    "div",
    "section",
    "article",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
    "blockquote",
  ].forEach((tag) => {
    doc.querySelectorAll(tag).forEach((element) => {
      element.appendChild(doc.createTextNode("\n\n"));
    });
  });

  const textContent = doc.body.textContent ?? "";
  return textContent.replace(/\n{3,}/g, "\n\n").trim();
};

const Updater: React.FC = () => {
  const update = useAppSelector((state) => state.update);
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const updateBody = React.useMemo(() => {
    const rawBody = update.updateBody?.trim();
    if (!rawBody) {
      return t("updater.noUpdateBody");
    }
    return getReadableUpdateBody(rawBody);
  }, [t, update.updateBody]);
  const openReleasePage = React.useCallback(() => {
    const invokeConnector = getInvokeConnector();
    void showDesktopNotification(t("updater.openingReleaseTitle"), {
      body: t("updater.openingReleaseBody"),
    });
    invokeConnector?.send(OPEN_RELEASE_PAGE);
    dispatch(setUpdateVersion(""));
    dispatch(setUpdateBody(""));
  }, [dispatch, t]);

  const installUpdateAndRestart = React.useCallback(() => {
    const invokeConnector = getInvokeConnector();
    void showDesktopNotification(t("updater.installingTitle"), {
      body: t("updater.installingBody"),
    });
    invokeConnector.send(INSTALL_UPDATE);
  }, [t]);

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
            a: ({ href, ...props }) => (
              <a
                {...props}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => {
                  if (!href) {
                    return;
                  }
                  event.preventDefault();
                  void openExternalUrl(href);
                }}
              />
            ),
          }}
        >
          {updateBody}
        </ReactMarkdown>
      </UpdateDescriptionPreviewer>

      <ActionButtons>
        <StyledTaskForm>
          <StyledButtonPrimary onClick={installUpdateAndRestart}>
            {t("updater.installAndRestart")}
          </StyledButtonPrimary>
          <StyledButtonNormal onClick={openReleasePage}>
            {t("updater.openReleasePage")}
          </StyledButtonNormal>
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
