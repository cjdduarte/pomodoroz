import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import SettingSection from "./SettingSection";
import { Shortcut } from "components";
import { useAppDispatch, useAppSelector } from "hooks/storeHooks";
import { setShortcut } from "store/settings";
import { RESERVED_SHORTCUTS } from "utils";

const ShortcutSection: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const shortcuts = useAppSelector((state) => state.settings.shortcuts);

  const onToggleThemeShortcutChange = useCallback(
    (shortcut: string) => {
      dispatch(
        setShortcut({
          shortcut: "toggleTheme",
          value: shortcut,
        })
      );
    },
    [dispatch]
  );

  return (
    <>
      <SettingSection heading={t("shortcuts.localHeading")}>
        <Shortcut
          name={t("shortcuts.escapeFormPopup")}
          shortcutKey={t("shortcuts.pressEsc")}
          id="escape-form-popup"
        />
        <Shortcut
          name={t("shortcuts.toggleTheme")}
          onShortcutChange={onToggleThemeShortcutChange}
          reservedShortcuts={RESERVED_SHORTCUTS}
          shortcutKey={shortcuts.toggleTheme}
          id="toggle-themes"
        />
        <Shortcut
          name={t("shortcuts.cutText")}
          shortcutKey="Cmd/Ctrl + X"
          id="cut-text"
        />
        <Shortcut
          name={t("shortcuts.copyText")}
          shortcutKey="Cmd/Ctrl + C"
          id="copy-text"
        />
        <Shortcut
          name={t("shortcuts.pasteText")}
          shortcutKey="Cmd/Ctrl + V"
          id="paste-text"
        />
        <Shortcut
          name={t("shortcuts.selectAllText")}
          shortcutKey="Cmd/Ctrl + A"
          id="select-all-text"
        />
        <Shortcut
          name={t("shortcuts.undoAction")}
          shortcutKey="Cmd/Ctrl + Z"
          id="undo-action"
        />
        <Shortcut
          name={t("shortcuts.redoAction")}
          shortcutKey="Cmd/Ctrl + Shift + Z"
          id="redo-action"
        />
      </SettingSection>
      <SettingSection heading={t("shortcuts.globalHeading")}>
        <Shortcut
          name={t("shortcuts.hideApp")}
          shortcutKey="Alt + Shift + H"
          id="hide-the-app"
        />
        <Shortcut
          name={t("shortcuts.showApp")}
          shortcutKey="Alt + Shift + S"
          id="show-the-app"
        />
      </SettingSection>
    </>
  );
};

export default ShortcutSection;
