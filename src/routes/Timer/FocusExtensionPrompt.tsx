import { CounterContext } from "contexts";
import { useAppSelector, useCompactAutoExpand } from "hooks";
import { COMPACT_EXPAND_FOCUS_EXTENSION } from "ipc";
import React, { useCallback, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  StyledFocusExtensionButton,
  StyledFocusExtensionPrompt,
  StyledFocusExtensionText,
} from "styles";

const FocusExtensionPrompt: React.FC = () => {
  const { t } = useTranslation();
  const compactModeEnabled = useAppSelector(
    (state) => state.settings.compactMode
  );
  const {
    shouldPromptFocusExtension,
    shortFocusExtension,
    longFocusExtension,
    extendFocusSession,
  } = useContext(CounterContext);
  const { maybeExpandCompact, collapseCompact } = useCompactAutoExpand({
    compactModeEnabled,
    expandChannel: COMPACT_EXPAND_FOCUS_EXTENSION,
    alwaysExpand: true,
  });

  useEffect(() => {
    if (shouldPromptFocusExtension) {
      maybeExpandCompact();
      return;
    }

    collapseCompact();
  }, [collapseCompact, maybeExpandCompact, shouldPromptFocusExtension]);

  const handleExtendFocusSession = useCallback(
    (minutes: number) => {
      collapseCompact();
      extendFocusSession?.(minutes);
    },
    [collapseCompact, extendFocusSession]
  );

  if (!shouldPromptFocusExtension || !extendFocusSession) {
    return null;
  }

  const getMinuteLabel = (duration: number) =>
    duration === 1
      ? t("timer.minuteSingular")
      : t("timer.minutePlural");

  const getActionLabel = (duration: number) =>
    t("timer.focusExtensionAction", {
      duration,
      minuteLabel: getMinuteLabel(duration),
    });

  return (
    <StyledFocusExtensionPrompt aria-live="polite">
      <StyledFocusExtensionText>
        {t("timer.focusExtensionPrompt")}
      </StyledFocusExtensionText>
      <StyledFocusExtensionButton
        type="button"
        onClick={() => handleExtendFocusSession(shortFocusExtension)}
      >
        {getActionLabel(shortFocusExtension)}
      </StyledFocusExtensionButton>
      <StyledFocusExtensionButton
        type="button"
        onClick={() => handleExtendFocusSession(longFocusExtension)}
      >
        {getActionLabel(longFocusExtension)}
      </StyledFocusExtensionButton>
    </StyledFocusExtensionPrompt>
  );
};

export default React.memo(FocusExtensionPrompt);
