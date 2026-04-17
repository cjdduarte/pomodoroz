import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/macro";
import { getInvokeConnector } from "contexts";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import {
  appendTaskLists,
  clearTaskSelection,
  replaceTaskLists,
} from "store";
import {
  EXPORT_TASKS_DIALOG,
  IMPORT_TASKS_DIALOG,
  TASKS_EXPORT_RESULT,
  TASKS_IMPORT_RESULT,
} from "ipc";
import {
  StyledButtonDanger,
  StyledButtonPrimary,
  StyledButtonSecondary,
} from "styles";
import { buildTasksTransferFile, parseTasksTransferFile } from "utils";
import type { TaskList } from "store/tasks/types";

import SettingSection from "./SettingSection";

type NoticeTone = "info" | "success" | "error";

type Notice = {
  tone: NoticeTone;
  message: string;
};

type PendingImport = {
  version: number;
  filePath?: string;
  listCount: number;
  cardCount: number;
  lists: TaskList[];
};

const StyledTaskTransferDescription = styled.p`
  margin-top: 0.6rem;
  font-size: 1.1rem;
  color: var(--color-body-text);
`;

const StyledTaskTransferActions = styled.div`
  margin-top: 0.8rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const StyledTaskTransferButton = styled(StyledButtonSecondary)`
  width: auto;
  min-width: 14rem;
  padding-left: 1.2rem;
  padding-right: 1.2rem;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const StyledTaskTransferMergeButton = styled(StyledButtonPrimary)`
  width: 100%;
  min-width: 0;
  padding-left: 1.2rem;
  padding-right: 1.2rem;
`;

const StyledTaskTransferReplaceButton = styled(StyledButtonDanger)`
  width: 100%;
  min-width: 0;
  padding-left: 1.2rem;
  padding-right: 1.2rem;
`;

const StyledTaskTransferPending = styled.div`
  margin-top: 0.8rem;
  border: 1px solid var(--color-border-primary);
  border-radius: 3px;
  padding: 0.8rem;
  background-color: var(--color-bg-secondary);
`;

const StyledTaskTransferPendingText = styled.p`
  margin: 0;
  font-size: 1.1rem;
  color: var(--color-heading-text);
`;

const StyledTaskTransferPendingActions = styled.div`
  margin-top: 0.8rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
`;

const StyledTaskTransferStatus = styled.p<{
  $tone: NoticeTone;
}>`
  margin-top: 0.8rem;
  margin-bottom: 0;
  font-size: 1.1rem;
  color: ${(p) =>
    p.$tone === "error"
      ? "var(--color-pink)"
      : p.$tone === "success"
        ? "var(--color-green)"
        : "var(--color-body-text)"};
`;

const createSuggestedFileName = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `pomodoroz-tasks-${now.getFullYear()}-${month}-${day}.json`;
};

const TaskTransferSection: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const taskLists = useAppSelector((state) => state.tasks.present);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingImport, setPendingImport] =
    useState<PendingImport | null>(null);
  const invokeConnector = getInvokeConnector();

  const hasNativeIpc =
    typeof invokeConnector?.send === "function" &&
    typeof invokeConnector?.receive === "function";

  const pendingSummary = useMemo(() => {
    if (!pendingImport) return "";
    return t("settings.taskTransfer.pendingSummary", {
      version: pendingImport.version,
      lists: pendingImport.listCount,
      cards: pendingImport.cardCount,
      file:
        pendingImport.filePath ||
        t("settings.taskTransfer.unknownFile"),
    });
  }, [pendingImport, t]);

  const onExport = useCallback(() => {
    if (!hasNativeIpc) {
      setNotice({
        tone: "error",
        message: t("settings.taskTransfer.desktopOnly"),
      });
      return;
    }

    const transferFile = buildTasksTransferFile(taskLists);
    const content = JSON.stringify(transferFile, null, 2);

    setPendingImport(null);
    setNotice(null);
    setIsExporting(true);
    invokeConnector?.send(EXPORT_TASKS_DIALOG, {
      suggestedFileName: createSuggestedFileName(),
      content,
    });
  }, [hasNativeIpc, invokeConnector, t, taskLists]);

  const onImport = useCallback(() => {
    if (!hasNativeIpc) {
      setNotice({
        tone: "error",
        message: t("settings.taskTransfer.desktopOnly"),
      });
      return;
    }

    setNotice(null);
    setPendingImport(null);
    setIsImporting(true);
    invokeConnector?.send(IMPORT_TASKS_DIALOG);
  }, [hasNativeIpc, invokeConnector, t]);

  const applyImport = useCallback(
    (mode: "merge" | "replace") => {
      if (!pendingImport) {
        return;
      }

      if (mode === "replace") {
        dispatch(replaceTaskLists(pendingImport.lists));
      } else {
        dispatch(appendTaskLists(pendingImport.lists));
      }

      dispatch(clearTaskSelection());
      setPendingImport(null);
      setNotice({
        tone: "success",
        message:
          mode === "replace"
            ? t("settings.taskTransfer.replaceApplied", {
                lists: pendingImport.listCount,
                cards: pendingImport.cardCount,
              })
            : t("settings.taskTransfer.mergeApplied", {
                lists: pendingImport.listCount,
                cards: pendingImport.cardCount,
              }),
      });
    },
    [dispatch, pendingImport, t]
  );

  useEffect(() => {
    if (!hasNativeIpc) {
      return;
    }

    const cleanupExport =
      invokeConnector?.receive(TASKS_EXPORT_RESULT, (payload) => {
        setIsExporting(false);

        if (payload.canceled) {
          setNotice({
            tone: "info",
            message: t("settings.taskTransfer.exportCanceled"),
          });
          return;
        }

        if (!payload.ok) {
          setNotice({
            tone: "error",
            message:
              payload.error || t("settings.taskTransfer.exportFailed"),
          });
          return;
        }

        setNotice({
          tone: "success",
          message: payload.filePath
            ? t("settings.taskTransfer.exportSuccessWithPath", {
                path: payload.filePath,
              })
            : t("settings.taskTransfer.exportSuccess"),
        });
      }) ?? (() => undefined);

    const cleanupImport =
      invokeConnector?.receive(TASKS_IMPORT_RESULT, (payload) => {
        setIsImporting(false);

        if (payload.canceled) {
          setNotice({
            tone: "info",
            message: t("settings.taskTransfer.importCanceled"),
          });
          return;
        }

        if (!payload.ok || typeof payload.content !== "string") {
          setNotice({
            tone: "error",
            message:
              payload.error ||
              t("settings.taskTransfer.importReadFailed"),
          });
          return;
        }

        const parsed = parseTasksTransferFile(payload.content);
        if (!parsed.ok) {
          setNotice({
            tone: "error",
            message:
              parsed.reason === "invalid-json"
                ? t("settings.taskTransfer.invalidJson")
                : t("settings.taskTransfer.invalidSchema"),
          });
          return;
        }

        setPendingImport({
          version: parsed.data.version,
          filePath: payload.filePath,
          listCount: parsed.data.listCount,
          cardCount: parsed.data.cardCount,
          lists: parsed.data.lists,
        });

        setNotice({
          tone: "info",
          message: t("settings.taskTransfer.importReady"),
        });
      }) ?? (() => undefined);

    return () => {
      cleanupExport();
      cleanupImport();
    };
  }, [hasNativeIpc, invokeConnector, t]);

  return (
    <SettingSection heading={t("settings.taskTransfer.heading")}>
      <StyledTaskTransferDescription>
        {hasNativeIpc
          ? t("settings.taskTransfer.description")
          : t("settings.taskTransfer.desktopOnly")}
      </StyledTaskTransferDescription>

      <StyledTaskTransferActions>
        <StyledTaskTransferButton
          disabled={!hasNativeIpc || isExporting || isImporting}
          onClick={onExport}
        >
          {isExporting
            ? t("settings.taskTransfer.exporting")
            : t("settings.taskTransfer.export")}
        </StyledTaskTransferButton>
        <StyledTaskTransferButton
          disabled={!hasNativeIpc || isExporting || isImporting}
          onClick={onImport}
        >
          {isImporting
            ? t("settings.taskTransfer.importing")
            : t("settings.taskTransfer.import")}
        </StyledTaskTransferButton>
      </StyledTaskTransferActions>

      {pendingImport ? (
        <StyledTaskTransferPending>
          <StyledTaskTransferPendingText>
            {pendingSummary}
          </StyledTaskTransferPendingText>
          <StyledTaskTransferPendingActions>
            <StyledTaskTransferMergeButton
              onClick={() => applyImport("merge")}
              disabled={isExporting || isImporting}
            >
              {t("settings.taskTransfer.merge")}
            </StyledTaskTransferMergeButton>
            <StyledTaskTransferReplaceButton
              onClick={() => applyImport("replace")}
              disabled={isExporting || isImporting}
            >
              {t("settings.taskTransfer.replace")}
            </StyledTaskTransferReplaceButton>
          </StyledTaskTransferPendingActions>
        </StyledTaskTransferPending>
      ) : null}

      {notice ? (
        <StyledTaskTransferStatus $tone={notice.tone}>
          {notice.message}
        </StyledTaskTransferStatus>
      ) : null}
    </SettingSection>
  );
};

export default React.memo(TaskTransferSection);
