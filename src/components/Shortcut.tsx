import React, { type KeyboardEvent } from "react";
import {
  StyledShortcutWrapper,
  StyledShortcutName,
  StyledShortcutKey,
} from "styles";
import {
  formatShortcut,
  getShortcutFromEvent,
  isReservedShortcut,
} from "utils";

type Props = {
  id: string;
  name: string;
  onShortcutChange?: (shortcut: string) => void;
  reservedShortcuts?: readonly string[];
  shortcutKey: string;
};

const Shortcut: React.FC<Props> = ({
  id,
  name,
  onShortcutChange,
  reservedShortcuts,
  shortcutKey,
}) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!onShortcutChange) {
      return;
    }

    e.stopPropagation();
    const shortcut = getShortcutFromEvent(e);

    if (shortcut) {
      if (isReservedShortcut(shortcut, reservedShortcuts)) {
        return;
      }

      onShortcutChange(shortcut);
    }
  };

  return (
    <StyledShortcutWrapper>
      <StyledShortcutName htmlFor={id}>{name}</StyledShortcutName>
      <StyledShortcutKey
        type="text"
        value={formatShortcut(shortcutKey)}
        id={id}
        onKeyDown={handleKeyDown}
        readOnly
      />
    </StyledShortcutWrapper>
  );
};

export default React.memo(Shortcut);
